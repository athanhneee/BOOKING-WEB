import { apiClient, type PaginationMeta } from "./apiClient";

export type HostApplicationStatus = "pending" | "approved" | "rejected" | null;
export type HostApplicationProfileType = "individual" | "business";
export type HostIdentityDocumentType = "cccd" | "cmnd" | "passport" | "driver_license" | "business_license" | "other";
export type HostIdentityDocumentSide = "front" | "back" | "single" | "business_license";

export type HostApplicationDocumentSummary = {
    id: number;
    documentType: HostIdentityDocumentType;
    side: HostIdentityDocumentSide;
    status: Exclude<HostApplicationStatus, null>;
    originalFilename?: string | null;
    createdAt?: string;
};

export type MyHostApplication = {
    id?: number;
    applicationId?: number;
    status?: HostApplicationStatus;
    hostApplicationStatus?: HostApplicationStatus;
    contactName?: string | null;
    contactEmail?: string | null;
    phone?: string | null;
    contactPhone?: string | null;
    profileType?: HostApplicationProfileType;
    entityType?: HostApplicationProfileType;
    businessAddress?: string | null;
    note?: string | null;
    notes?: string | null;
    rejectReason?: string | null;
    rejectionReason?: string | null;
    reviewedAt?: string | null;
    createdAt?: string;
    updatedAt?: string;
    documents?: HostApplicationDocumentSummary[];
};

export type MyHostApplicationResult = {
    status: HostApplicationStatus;
    hostApplicationStatus: HostApplicationStatus;
    application: MyHostApplication | null;
};

export type AdminHostApplicationListItem = {
    id: number;
    applicationId: number;
    userId: number;
    contactName?: string | null;
    contactEmail?: string | null;
    phone?: string | null;
    profileType: HostApplicationProfileType;
    businessAddress?: string | null;
    status: Exclude<HostApplicationStatus, null>;
    rejectReason?: string | null;
    reviewedBy?: number | null;
    reviewedAt?: string | null;
    createdAt?: string;
    updatedAt?: string;
    documentCount: number;
    user?: {
        id: number;
        name?: string | null;
        email?: string | null;
        phone?: string | null;
    } | null;
};

export type AdminHostApplicationsResult = {
    items: AdminHostApplicationListItem[];
    pagination?: PaginationMeta;
};

export type AdminHostApplicationDocument = HostApplicationDocumentSummary & {
    mimeType: string;
    fileSize: number;
    signedUrl: string;
    signedUrlExpiresAt: string;
    updatedAt?: string;
};

export type AdminHostApplicationDetail = Omit<AdminHostApplicationListItem, "documentCount"> & {
    note?: string | null;
    documents: AdminHostApplicationDocument[];
};

export const submitHostApplication = (formData: FormData) =>
    apiClient.post<{ id: number; applicationId: number; status: Exclude<HostApplicationStatus, null> }>(
        "/api/host/applications",
        formData,
    );

export const getMyHostApplication = () =>
    apiClient.get<MyHostApplicationResult>("/api/host/applications/me");

export const getAdminHostApplications = (
    status?: Exclude<HostApplicationStatus, null> | "all",
    query: { page?: number; limit?: number } = {},
) =>
    apiClient.get<AdminHostApplicationsResult>("/api/admin/host-applications", {
        query: {
            ...query,
            status: status === "all" ? undefined : status,
        },
    });

export const getAdminHostApplicationDetail = (applicationId: string | number) =>
    apiClient.get<AdminHostApplicationDetail>(`/api/admin/host-applications/${applicationId}`);

export const approveHostApplication = (applicationId: string | number) =>
    apiClient.patch(`/api/admin/host-applications/${applicationId}/approve`);

export const rejectHostApplication = (applicationId: string | number, reason: string) =>
    apiClient.patch(`/api/admin/host-applications/${applicationId}/reject`, { reason });
