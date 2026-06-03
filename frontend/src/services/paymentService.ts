import { apiClient, type PaginatedResponse } from "./api/apiClient";

export type PaymentMethod = "vnpay" | "momo";
export type PaymentStatus = "pending" | "paid" | "failed" | "cancelled" | "expired" | "refunded";
export type PaymentResultStatus = PaymentStatus | "refund_pending";
export type Payment = {
    paymentId: number;
    bookingId: number;
    userId: number;
    amount: number;
    currency: string;
    method: PaymentMethod;
    paymentStatus: PaymentStatus;
    paymentResultStatus?: PaymentResultStatus;
    status?: PaymentStatus;
    provider?: string | null;
    providerTxnRef?: string | null;
    providerTransactionNo?: string | null;
    providerTransactionId?: string | null;
    providerResponseCode?: string | null;
    requiresRefund?: boolean;
    refundStatus?: "pending" | "processing" | "succeeded" | "failed" | "cancelled" | null;
    latePaymentReason?: string | null;
    paidAt?: string | null;
    failedAt?: string | null;
    createdAt?: string;
    updatedAt?: string;
    paymentUrl?: string | null;
};

export type CreatePaymentInput = {
    bookingId: number;
    method: PaymentMethod;
};

export type PaymentListResponse = PaginatedResponse<Payment>;

export type PaymentMethodAvailability = {
    method: PaymentMethod;
    label: string;
    available: boolean;
    unavailableReason?: string;
    missingConfigKeys?: string[];
};

export type PaymentMethodsResponse = {
    items: PaymentMethodAvailability[];
};

export const createPayment = (payload: CreatePaymentInput) =>
    apiClient.post<Payment>("/api/payments", payload);

export const getPaymentMethods = () =>
    apiClient.get<PaymentMethodsResponse>("/api/payments/methods", { skipAuthRefresh: true });

export const getMyPayments = (query?: { status?: PaymentStatus; page?: number; limit?: number }) =>
    apiClient.get<PaymentListResponse>("/api/payments/my", { query });

export const getPaymentById = (paymentId: number | string) =>
    apiClient.get<Payment>(`/api/payments/${paymentId}`);

export const getPaymentDetail = getPaymentById;

export const getVnpayReturn = (query: Record<string, string>) =>
    apiClient.get<Payment>("/api/payments/vnpay/return", { query });

export const getMomoReturn = (query: Record<string, string>) =>
    apiClient.get<Payment>("/api/payments/momo/return", { query });
