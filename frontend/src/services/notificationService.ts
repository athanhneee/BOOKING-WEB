import { apiClient, type PaginationMeta } from "./api/apiClient";

export type NotificationItem = {
    id: number;
    notificationLogId: number;
    eventType: string;
    targetType: string;
    targetId: string;
    title: string | null;
    body: string | null;
    actionUrl: string | null;
    payload: Record<string, unknown> | null;
    isRead: boolean;
    readAt: string | null;
    createdAt: string;
    updatedAt?: string;
};

export type NotificationListResponse = {
    items: NotificationItem[];
    unreadCount: number;
    pagination: PaginationMeta;
};

export const getNotifications = (query?: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
}) =>
    apiClient.get<NotificationListResponse>("/api/notifications", {
        query,
    });

export const markNotificationRead = (notificationId: number) =>
    apiClient.patch<NotificationItem>(`/api/notifications/${notificationId}/read`);

export const markAllNotificationsRead = () =>
    apiClient.patch<{
        updatedCount: number;
        readAt: string;
    }>("/api/notifications/read-all");
