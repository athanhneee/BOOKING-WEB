import { QueryTypes } from "sequelize";

import { ApiError } from "../../common/api-error";
import sequelize from "../../config/database";
import Conversation from "../../models/conversation";
import ConversationParticipant from "../../models/conversation-participant";
import Message, { MessageAttachment, MessageType } from "../../models/message";
import type { AuthenticatedUser } from "../auth/auth.service";
import { sanitizeAndModerateText, sanitizeUserText } from "../../services/trust-safety-service";
import { assertBasicUserExists } from "../../services/user-access-service";

export type ConversationQuery = {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
};

export type CreateConversationInput = {
    listingId?: number;
    bookingId?: number;
    participantId: number;
    firstMessage: string;
};

export type ConversationMessagesQuery = {
    page?: number;
    limit?: number;
};

export type SendMessageInput = {
    content?: string;
    messageType?: MessageType;
    attachments?: MessageAttachment[];
};

type ConversationListRow = {
    conversationId: number;
    listingId: number | null;
    bookingOrderId: number | null;
    lastMessage: string | null;
    lastMessageAt: Date | null;
    unreadCount: number;
};

type ConversationAccessRow = {
    bookingOrderId: number;
    listingId: number;
    guestUserId: number;
    hostUserId: number;
};

type ListingAccessRow = {
    listingId: number;
    hostId: number;
};

const hasOwn = <T extends object>(value: T, key: keyof T) =>
    Object.prototype.hasOwnProperty.call(value, key);

const getCurrentUserId = (user: AuthenticatedUser) => Number(user.id);

const toPagination = (page?: number, limit?: number) => ({
    page: page ?? 1,
    limit: limit ?? 10,
});

const normalizeMessage = (value: string, field: string, allowEmpty = false) =>
    sanitizeAndModerateText(value, {
        field,
        allowEmpty,
    });

const attachmentTypePattern = /^[a-z0-9][a-z0-9.+-]*\/[a-z0-9][a-z0-9.+-]*$/i;

const throwAttachmentValidationError = (path: string, msg: string): never => {
    throw new ApiError(422, "Validation error", [
        {
            path,
            msg,
        },
    ]);
};

const parseAttachmentUrl = (value: string, path: string): URL => {
    try {
        return new URL(value);
    } catch {
        return throwAttachmentValidationError(path, "attachments.url must be a valid URL");
    }
};

const normalizeAttachments = (attachments: MessageAttachment[], messageType: MessageType) =>
    attachments.map((attachment, index) => {
        const url = parseAttachmentUrl(attachment.url, `attachments.${index}.url`);

        if (!["http:", "https:"].includes(url.protocol)) {
            throwAttachmentValidationError(`attachments.${index}.url`, "attachments.url must use http or https");
        }

        const type = attachment.type ? sanitizeUserText(attachment.type, "singleLine").toLowerCase() : null;

        if (type && !attachmentTypePattern.test(type)) {
            throwAttachmentValidationError(`attachments.${index}.type`, "attachments.type must be a valid media type");
        }

        if (messageType === "image" && type && !type.startsWith("image/")) {
            throwAttachmentValidationError(`attachments.${index}.type`, "image messages require image attachments");
        }

        return {
            url: url.toString(),
            type,
            name: attachment.name ? sanitizeUserText(attachment.name, "singleLine") : null,
        };
    });

const assertListingConversationIsAllowed = (
    currentUserId: number,
    participantId: number,
    listing: ListingAccessRow | null,
    bookingAccess: ConversationAccessRow | null,
) => {
    if (!listing) {
        return;
    }

    if (bookingAccess && bookingAccess.listingId !== listing.listingId) {
        throw new ApiError(422, "Validation error", [
            {
                path: "listingId",
                msg: "listingId must match the booking",
            },
        ]);
    }

    if (!bookingAccess && participantId !== listing.hostId) {
        throw new ApiError(422, "Validation error", [
            {
                path: "participantId",
                msg: "participantId must be the listing host",
            },
        ]);
    }

    if (!bookingAccess && currentUserId === listing.hostId) {
        throw new ApiError(422, "Validation error", [
            {
                path: "participantId",
                msg: "Hosts need a booking to start guest conversations",
            },
        ]);
    }
};

const assertListingExists = async (listingId: number) => {
    const rows = await sequelize.query<ListingAccessRow>(
        `
        SELECT listing_id AS listingId, host_id AS hostId
        FROM listings
        WHERE listing_id = ?
          AND deleted_at IS NULL
        LIMIT 1
        `,
        {
            replacements: [listingId],
            type: QueryTypes.SELECT,
        },
    );

    if (!rows[0]) {
        throw new ApiError(404, "Listing not found");
    }

    return rows[0];
};

const getBookingAccess = async (bookingId: number) => {
    const rows = await sequelize.query<ConversationAccessRow>(
        `
        SELECT
            b.booking_id AS bookingOrderId,
            b.listing_id AS listingId,
            b.guest_user_id AS guestUserId,
            b.host_user_id AS hostUserId
        FROM bookings b
        WHERE b.booking_id = ?
        LIMIT 1
        `,
        {
            replacements: [bookingId],
            type: QueryTypes.SELECT,
        },
    );

    if (!rows[0]) {
        throw new ApiError(404, "Booking not found");
    }

    return rows[0];
};

const buildPairDedupeKey = (leftUserId: number, rightUserId: number, listingId?: number) => {
    const [firstUserId, secondUserId] = [leftUserId, rightUserId].sort((left, right) => left - right);
    return listingId
        ? `listing:${listingId}:${firstUserId}:${secondUserId}`
        : `direct:${firstUserId}:${secondUserId}`;
};

export const getConversations = async (user: AuthenticatedUser, query: ConversationQuery) => {
    const userId = getCurrentUserId(user);
    const { page, limit } = toPagination(query.page, query.limit);
    const offset = (page - 1) * limit;
    const unreadOnlyClause =
        query.unreadOnly === true
            ? "WHERE conversation_rows.unreadCount > 0"
            : "";

    const baseSql = `
        SELECT *
        FROM (
            SELECT
                c.conversation_id AS conversationId,
                c.listing_id AS listingId,
                c.booking_order_id AS bookingOrderId,
                latest_message.content AS lastMessage,
                latest_message.created_at AS lastMessageAt,
                COUNT(unread_message.message_id) AS unreadCount,
                COALESCE(c.last_message_at, latest_message.created_at, c.updated_at) AS sortAt
            FROM conversation c
            INNER JOIN conversation_participant cp
                ON cp.conversation_id = c.conversation_id
               AND cp.user_id = :userId
            LEFT JOIN message latest_message
                ON latest_message.message_id = (
                    SELECT m2.message_id
                    FROM message m2
                    WHERE m2.conversation_id = c.conversation_id
                    ORDER BY m2.created_at DESC, m2.message_id DESC
                    LIMIT 1
                )
            LEFT JOIN message unread_message
                ON unread_message.conversation_id = c.conversation_id
               AND unread_message.sender_id <> :userId
               AND (cp.last_read_at IS NULL OR unread_message.created_at > cp.last_read_at)
            GROUP BY
                c.conversation_id,
                c.listing_id,
                c.booking_order_id,
                latest_message.content,
                latest_message.created_at,
                c.last_message_at,
                c.updated_at
        ) conversation_rows
        ${unreadOnlyClause}
    `;

    const [items, countRows] = await Promise.all([
        sequelize.query<ConversationListRow>(
            `
            ${baseSql}
            ORDER BY sortAt DESC
            LIMIT :limit OFFSET :offset
            `,
            {
                replacements: { userId, limit, offset },
                type: QueryTypes.SELECT,
            },
        ),
        sequelize.query<{ totalItems: number }>(
            `
            SELECT COUNT(*) AS totalItems
            FROM (${baseSql}) counted_rows
            `,
            {
                replacements: { userId },
                type: QueryTypes.SELECT,
            },
        ),
    ]);

    const totalItems = Number(countRows[0]?.totalItems ?? 0);

    return {
        items: items.map((item) => ({
            conversationId: item.conversationId,
            listingId: item.listingId,
            bookingId: item.bookingOrderId,
            lastMessage: item.lastMessage,
            lastMessageAt: item.lastMessageAt,
            unreadCount: Number(item.unreadCount),
        })),
        pagination: {
            page,
            limit,
            totalItems,
            totalPages: Math.max(1, Math.ceil(totalItems / limit)),
        },
    };
};

export const createConversation = async (user: AuthenticatedUser, input: CreateConversationInput) => {
    const currentUserId = getCurrentUserId(user);
    const participantId = input.participantId;

    if (currentUserId === participantId) {
        throw new ApiError(422, "Validation error", [
            {
                path: "participantId",
                msg: "Cannot create a conversation with yourself",
            },
        ]);
    }

    if (!hasOwn(input, "listingId") && !hasOwn(input, "bookingId")) {
        throw new ApiError(422, "Validation error", [
            {
                path: "listingId",
                msg: "listingId or bookingId is required",
            },
        ]);
    }

    const [participant, listing, bookingAccess] = await Promise.all([
        assertBasicUserExists(participantId),
        input.listingId ? assertListingExists(input.listingId) : Promise.resolve(null),
        input.bookingId ? getBookingAccess(input.bookingId) : Promise.resolve(null),
    ]);

    void participant;
    assertListingConversationIsAllowed(currentUserId, participantId, listing, bookingAccess);

    if (bookingAccess) {
        const relatedUserIds = new Set([bookingAccess.guestUserId, bookingAccess.hostUserId]);

        if (!relatedUserIds.has(currentUserId)) {
            throw new ApiError(403, "Forbidden");
        }

        if (!relatedUserIds.has(participantId)) {
            throw new ApiError(422, "Validation error", [
                {
                    path: "participantId",
                    msg: "participantId must be related to the booking",
                },
            ]);
        }
    }

    const firstMessage = normalizeMessage(input.firstMessage, "firstMessage");

    const dedupeKey = input.bookingId
        ? `booking:${input.bookingId}`
        : buildPairDedupeKey(currentUserId, participantId, input.listingId);
    const existingConversation = await Conversation.findOne({ dedupeKey });

    if (existingConversation) {
        throw new ApiError(409, "Conversation already exists", [
            {
                path: "conversationId",
                msg: String(existingConversation.conversationId),
            },
        ]);
    }

    return sequelize.transaction(async (transaction) => {
        const now = new Date();
        const conversation = await Conversation.create(
            {
                createdByUserId: currentUserId,
                listingId: input.listingId ?? bookingAccess?.listingId ?? null,
                bookingOrderId: input.bookingId ?? null,
                dedupeKey,
                lastMessageAt: now,
            },
            { transaction },
        );

        await ConversationParticipant.bulkCreate(
            [
                {
                    conversationId: conversation.conversationId,
                    userId: currentUserId,
                    joinedAt: now,
                    lastReadAt: now,
                },
                {
                    conversationId: conversation.conversationId,
                    userId: participantId,
                    joinedAt: now,
                    lastReadAt: null,
                },
            ],
            { transaction },
        );

        const message = await Message.create(
            {
                conversationId: conversation.conversationId,
                senderId: currentUserId,
                content: firstMessage,
                messageType: "text",
                attachments: [],
                createdAt: now,
            },
            { transaction },
        );

        return {
            conversationId: conversation.conversationId,
            messageId: message.messageId,
        };
    });
};

export const assertConversationParticipant = async (conversationId: number, userId: number) => {
    const participant = await ConversationParticipant.findOne({
        conversationId,
        userId,
    });

    if (!participant) {
        const conversation = await Conversation.findOne({ conversationId });

        if (!conversation) {
            throw new ApiError(404, "Conversation not found");
        }

        throw new ApiError(403, "Forbidden");
    }

    return participant;
};

export const getConversationMessages = async (
    conversationId: number,
    user: AuthenticatedUser,
    query: ConversationMessagesQuery,
) => {
    const userId = getCurrentUserId(user);
    const { page, limit } = toPagination(query.page, query.limit);
    const participant = await assertConversationParticipant(conversationId, userId);
    const [items, totalItems] = await Promise.all([
        Message.find({ conversationId })
            .sort({ createdAt: 1, messageId: 1 })
            .skip((page - 1) * limit)
            .limit(limit),
        Message.countDocuments({ conversationId }),
    ]);

    participant.lastReadAt = new Date();
    await participant.save();

    return {
        items: items.map((message) => ({
            messageId: message.messageId,
            conversationId: message.conversationId,
            senderId: message.senderId,
            content: message.content,
            messageType: message.messageType,
            attachments: message.attachments,
            createdAt: message.createdAt,
        })),
        pagination: {
            page,
            limit,
            totalItems,
            totalPages: Math.max(1, Math.ceil(totalItems / limit)),
        },
    };
};

export const sendConversationMessage = async (
    conversationId: number,
    user: AuthenticatedUser,
    input: SendMessageInput,
) => {
    const userId = getCurrentUserId(user);
    const messageType = input.messageType ?? "text";
    const content = normalizeMessage(input.content ?? "", "content", true);
    const attachments = normalizeAttachments(input.attachments ?? [], messageType);

    if (messageType === "text" && !content) {
        throw new ApiError(422, "Validation error", [
            {
                path: "content",
                msg: "content is required for text messages",
            },
        ]);
    }

    if (attachments.length === 0 && !content) {
        throw new ApiError(422, "Validation error", [
            {
                path: "content",
                msg: "content or attachments is required",
            },
        ]);
    }

    return sequelize.transaction(async (transaction) => {
        const participant = await ConversationParticipant.findOne({
            where: {
                conversationId,
                userId,
            },
            transaction,
        });

        if (!participant) {
            throw new ApiError(403, "Forbidden");
        }

        const now = new Date();
        const message = await Message.create(
            {
                conversationId,
                senderId: userId,
                content: content || (messageType === "image" ? "[image]" : ""),
                messageType,
                attachments,
                createdAt: now,
            },
            { transaction },
        );

        await Conversation.update(
            {
                lastMessageAt: now,
            },
            {
                where: {
                    conversationId,
                },
                transaction,
            },
        );

        await ConversationParticipant.update(
            {
                lastReadAt: now,
            },
            {
                where: {
                    conversationId,
                    userId,
                },
                transaction,
            },
        );

        return {
            messageId: message.messageId,
        };
    });
};
