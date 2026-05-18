import type { RequestHandler } from "express";

import { asyncHandler } from "../../common/async-handler";
import { sendSuccess } from "../../common/http";
import {
    assertValidRequest,
    getValidatedBody,
    getValidatedParams,
    getValidatedQuery,
} from "../../common/validation";
import {
    createConversation,
    CreateConversationInput,
    ConversationMessagesQuery,
    ConversationQuery,
    getConversationMessages,
    getConversations,
    sendConversationMessage,
    SendMessageInput,
} from "./conversations.service";

export const listConversations: RequestHandler = asyncHandler(async (req, res) => {
    assertValidRequest(req);

    const queryParams = getValidatedQuery<ConversationQuery>(req);
    const result = await getConversations(req.user!, queryParams);

    return sendSuccess(res, {
        data: result,
    });
});

export const createNewConversation: RequestHandler = asyncHandler(async (req, res) => {
    assertValidRequest(req);

    const payload = getValidatedBody<CreateConversationInput>(req);
    const result = await createConversation(req.user!, payload);

    return sendSuccess(res, {
        statusCode: 201,
        message: "Conversation created",
        data: result,
    });
});

export const listConversationMessages: RequestHandler = asyncHandler(async (req, res) => {
    assertValidRequest(req);

    const params = getValidatedParams<{ conversationId: number }>(req);
    const queryParams = getValidatedQuery<ConversationMessagesQuery>(req);
    const result = await getConversationMessages(params.conversationId, req.user!, queryParams);

    return sendSuccess(res, {
        data: result,
    });
});

export const sendMessage: RequestHandler = asyncHandler(async (req, res) => {
    assertValidRequest(req);

    const params = getValidatedParams<{ conversationId: number }>(req);
    const payload = getValidatedBody<SendMessageInput>(req);
    const result = await sendConversationMessage(params.conversationId, req.user!, payload);

    return sendSuccess(res, {
        statusCode: 201,
        message: "Message sent",
        data: result,
    });
});
