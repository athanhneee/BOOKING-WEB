import { apiClient } from "./api/apiClient";

export type PaymentMethod = "vnpay" | "cod" | "bank_transfer";
export type PaymentStatus = "pending" | "paid" | "failed" | "cancelled" | "expired" | "refunded";

export type Payment = {
    paymentId: number;
    bookingId: number;
    method: PaymentMethod;
    paymentStatus: PaymentStatus;
    amount: number;
    currency: string;
    paymentUrl: string | null;
    paidAt: string | null;
    createdAt: string;
    updatedAt: string;
};

export type PaginatedPayments = {
    items: Payment[];
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
};

export const createPayment = (payload: { bookingId: number; method: PaymentMethod }) =>
    apiClient.post<Payment>("/api/payments", payload);

export const getPaymentDetail = (paymentId: string | number) =>
    apiClient.get<Payment>(`/api/payments/${paymentId}`);

export const getMyPayments = (query: { status?: PaymentStatus | "all"; page?: number; limit?: number } = {}) =>
    apiClient.get<PaginatedPayments>("/api/payments/my", {
        query: {
            ...query,
            status: query.status === "all" ? undefined : query.status,
        },
    });

export const getVnpayReturn = (query: Record<string, string>) =>
    apiClient.get<Payment>("/api/payments/vnpay/return", { query });