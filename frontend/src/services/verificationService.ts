import { apiClient, type PaginationMeta } from "./api/apiClient";

export type VerificationType = "identity" | "business" | "bank";
export type VerificationStatus = "pending" | "approved" | "rejected";

export type HostVerification = {
    verificationId: number;
    hostId: number;
    verificationType: VerificationType;
    fullName: string;
    idNumber: string | null;
    documentUrls: string[];
    notes: string | null;
    status: VerificationStatus;
    reviewedByUserId: number | null;
    reviewedAt: string | null;
    reviewNotes: string | null;
    rejectionReason: string | null;
    createdAt: string;
    updatedAt: string;
};

export type MyVerificationsResult = {
    items: HostVerification[];
    latestOnly: boolean;
    latestPolicy?: string;
};

export type AdminVerificationsResult = {
    items: HostVerification[];
    pagination: PaginationMeta;
};

export const submitHostVerification = (payload: {
    verificationType: VerificationType;
    fullName: string;
    idNumber?: string;
    documentUrls: string[];
    notes?: string;
}) =>
    apiClient.post<{ verificationId: number; status: VerificationStatus }>(
        "/api/host/verifications",
        payload,
    );

export const getMyHostVerifications = (latestOnly = false) =>
    apiClient.get<MyVerificationsResult>("/api/host/verifications/me", { query: { latestOnly } });

export const getAdminVerifications = (
    query: { status?: VerificationStatus | "all"; verificationType?: VerificationType | "all"; page?: number; limit?: number } = {},
) =>
    apiClient.get<AdminVerificationsResult>("/api/admin/verifications", {
        query: {
            ...query,
            status: query.status === "all" ? undefined : query.status,
            verificationType: query.verificationType === "all" ? undefined : query.verificationType,
        },
    });

export const approveHostVerification = (verificationId: string | number, notes?: string) =>
    apiClient.patch<{ verificationId: number; status: VerificationStatus }>(
        `/api/admin/verifications/${verificationId}/approve`,
        { notes },
    );

export const rejectHostVerification = (verificationId: string | number, reason: string) =>
    apiClient.patch<{ verificationId: number; status: VerificationStatus }>(
        `/api/admin/verifications/${verificationId}/reject`,
        { reason },
    );
