import { apiClient } from "./apiClient";

export type ConversationUser = {
    userId: number;
    fullName: string;
    avatarUrl: string | null;
};

export type ConversationListing = {
    listingId: number;
    title: string;
    coverImageUrl: string | null;
};

export type Conversation = {
    id: number;
    conversationId: number;
    createdByUserId: number | null;
    listingId: number | null;
    guestUserId?: number | null;
    hostUserId?: number | null;
    bookingId: number | null;
    lastMessage: string | null;
    lastMessageAt: string | null;
    unreadCount: number;
    createdAt: string;
    updatedAt: string;
    listing: ConversationListing | null;
    otherParticipant: ConversationUser | null;
};

export type MessageType = "text" | "image" | "system" | "file";

export type MessageAttachment = {
    url: string;
    type?: string | null;
    name?: string | null;
};

export type ConversationMessage = {
    id: number;
    messageId: number;
    conversationId: number;
    senderUserId: number;
    senderId: number;
    content: string;
    body: string;
    messageType: MessageType;
    attachments: MessageAttachment[];
    createdAt: string;
    updatedAt: string | null;
};

export type Pagination = {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
};

export type ConversationListResponse = {
    items: Conversation[];
    conversations?: Conversation[];
    pagination: Pagination;
};

export type CreateConversationResponse = {
    conversation: Conversation;
    created: boolean;
};

export type ConversationMessagesResponse = {
    items: ConversationMessage[];
    messages?: ConversationMessage[];
    pagination: Pagination;
};

export type SendMessagePayload = {
    content: string;
    messageType?: MessageType;
    attachments?: MessageAttachment[];
};

export type SendMessageResponse = {
    message: ConversationMessage;
    conversation: Conversation;
};

export const getConversations = (query?: { page?: number; limit?: number; unreadOnly?: boolean; scope?: "guest" | "host" }) =>
    apiClient.get<ConversationListResponse>("/api/conversations", { query });

export const createOrGetConversation = (listingId: string | number) =>
    apiClient.post<CreateConversationResponse>("/api/conversations", {
        listingId: Number(listingId),
    });

export const createOrGetDirectConversation = (participantId: string | number) =>
    apiClient.post<CreateConversationResponse>("/api/conversations", {
        participantId: Number(participantId),
    });

export const getConversationMessages = (
    conversationId: string | number,
    params?: { page?: number; limit?: number },
) =>
    apiClient.get<ConversationMessagesResponse>(`/api/conversations/${conversationId}/messages`, {
        query: params,
    });

export const sendMessage = (conversationId: string | number, payload: SendMessagePayload) =>
    apiClient.post<SendMessageResponse>(`/api/conversations/${conversationId}/messages`, payload);

export const markConversationRead = (conversationId: string | number) =>
    apiClient.patch<{ conversationId: number; lastReadAt: string }>(
        `/api/conversations/${conversationId}/read`,
    );
