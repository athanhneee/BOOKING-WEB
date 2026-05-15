import { apiClient } from "./api/apiClient";

export const createReview = (payload: { bookingId: number; rating: number; comment?: string }) =>
    apiClient.post<{ reviewId: number }>("/api/reviews", payload);

export const updateReview = (reviewId: string | number, payload: { rating?: number; comment?: string | null }) =>
    apiClient.patch<{ reviewId: number }>(`/api/reviews/${reviewId}`, payload);

export const deleteReview = (reviewId: string | number) =>
    apiClient.delete(`/api/reviews/${reviewId}`);

export const replyToReview = (reviewId: string | number, reply: string) =>
    apiClient.post<{ reviewId: number }>(`/api/reviews/${reviewId}/reply`, { reply });