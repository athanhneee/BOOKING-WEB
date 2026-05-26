import { io, type Socket } from "socket.io-client";

import { API_BASE_URL } from "../api/apiClient";
import type { ConversationMessage } from "../api/conversationsApi";

export type MessageNewEvent = {
    conversationId: number;
    message: ConversationMessage;
    conversation: {
        id: number;
        conversationId: number;
        lastMessage: string | null;
        lastMessageAt: string | null;
        guestUserId: number;
        hostUserId: number;
    };
};

let socket: Socket | null = null;
let activeToken: string | null = null;

const getSocketUrl = () => API_BASE_URL || window.location.origin;

export const connectSocket = (accessToken: string | null | undefined) => {
    if (!accessToken) {
        disconnectSocket();
        return null;
    }

    if (socket && activeToken === accessToken) {
        if (!socket.connected) {
            socket.connect();
        }

        return socket;
    }

    if (socket) {
        socket.disconnect();
    }

    activeToken = accessToken;
    socket = io(getSocketUrl(), {
        auth: {
            token: accessToken,
        },
        withCredentials: true,
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 800,
        reconnectionDelayMax: 5000,
    });

    return socket;
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }

    activeToken = null;
};

export const joinConversation = (conversationId: string | number | null | undefined) => {
    if (!socket || !conversationId) {
        return;
    }

    socket.emit("conversation:join", {
        conversationId: Number(conversationId),
    });
};

export const leaveConversation = (conversationId: string | number | null | undefined) => {
    if (!socket || !conversationId) {
        return;
    }

    socket.emit("conversation:leave", {
        conversationId: Number(conversationId),
    });
};

export const onNewMessage = (callback: (payload: MessageNewEvent) => void) => {
    socket?.on("message:new", callback);
};

export const offNewMessage = (callback: (payload: MessageNewEvent) => void) => {
    socket?.off("message:new", callback);
};
