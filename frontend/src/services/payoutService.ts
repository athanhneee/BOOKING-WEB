import { apiClient } from "./api/apiClient";

export type PayoutStatus = "pending" | "processing" | "paid" | "failed" | "cancelled";

export type PayoutAccount = {
    payoutAccountId: number;
    bankName: string;
    bankCode: string | null;
    accountName: string;
    accountNumberMasked: string;
    isDefault: boolean;
    createdAt: string;
    updatedAt: string;
};

export type HostPayout = {
    payoutId: number;
    hostId: number;
    payoutAccountId: number;
    amount: number;
    currency: string;
    status: PayoutStatus;
    notes: string | null;
    paidAt: string | null;
    transferReference: string | null;
    bookingIds: number[];
    listingTitles: string[];
    createdAt: string;
};

export type PaginatedPayouts = {
    items: HostPayout[];
    pagination: {
        page: number;
        limit: number;
        totalItems: number;
        totalPages: number;
    };
};

export const getPayoutAccounts = () =>
    apiClient.get<{ items: PayoutAccount[] }>("/api/host/payout-accounts");

export const createPayoutAccount = (payload: {
    bankName: string;
    bankCode?: string;
    accountName: string;
    accountNumber: string;
    isDefault?: boolean;
}) => apiClient.post<PayoutAccount>("/api/host/payout-accounts", payload);

export const updatePayoutAccount = (
    payoutAccountId: string | number,
    payload: Partial<{
        bankName: string;
        bankCode: string | null;
        accountName: string;
        accountNumber: string;
        isDefault: boolean;
    }>,
) => apiClient.patch<PayoutAccount>(`/api/host/payout-accounts/${payoutAccountId}`, payload);

export const deletePayoutAccount = (payoutAccountId: string | number) =>
    apiClient.delete(`/api/host/payout-accounts/${payoutAccountId}`);

export const getHostPayouts = (query: { status?: PayoutStatus | "all"; from?: string; to?: string; page?: number; limit?: number } = {}) =>
    apiClient.get<PaginatedPayouts>("/api/host/payouts", {
        query: {
            ...query,
            status: query.status === "all" ? undefined : query.status,
        },
    });

export const getAdminHostPayouts = (
    query: { status?: PayoutStatus | "all"; hostId?: number; page?: number; limit?: number } = {},
) =>
    apiClient.get<PaginatedPayouts>("/api/admin/host-payouts", {
        query: {
            ...query,
            status: query.status === "all" ? undefined : query.status,
        },
    });

export const createHostPayout = (payload: {
    hostId: number;
    bookingIds: number[];
    payoutAccountId: number;
    amount: number;
    currency: "VND";
    notes?: string | null;
}) => apiClient.post<{ payoutId: number; status: PayoutStatus }>("/api/admin/host-payouts", payload);

export const markHostPayoutPaid = (
    payoutId: string | number,
    payload: { paidAt?: string; reference?: string | null } = {},
) =>
    apiClient.patch<{ payoutId: number; status: PayoutStatus }>(
        `/api/admin/host-payouts/${payoutId}/paid`,
        payload,
    );