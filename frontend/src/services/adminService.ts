import { apiClient } from "./api/apiClient";
import type { PaginatedListings } from "../models/entities/Listing";
import type { ApiUserRole, ApiUserStatus, PaginatedUsers } from "../models/entities/User";
import type { AdminVerificationsResult, VerificationStatus, VerificationType } from "./verificationService";

export type AdminAnalyticsGroup = "day" | "month" | "year";

export type AdminRevenueReport = {
    range: { from: string; to: string };
    group: AdminAnalyticsGroup;
    totals: {
        grossRevenue: number;
        platformRevenue: number;
        hostRevenue: number;
        bookingCount: number;
        paymentCount: number;
    };
    series: Array<{
        period: string;
        grossRevenue: number;
        platformRevenue: number;
        hostRevenue: number;
        bookingCount: number;
        paymentCount: number;
    }>;
};

export type AdminBookingsReport = {
    range: { from: string; to: string };
    group: AdminAnalyticsGroup;
    totals: {
        totalBookings: number;
        pendingBookings: number;
        paidBookings: number;
        completedBookings: number;
        cancelledBookings: number;
        expiredBookings: number;
        totalAmount: number;
    };
    series: Array<{
        period: string;
        totalBookings: number;
        pendingBookings: number;
        paidBookings: number;
        completedBookings: number;
        cancelledBookings: number;
        expiredBookings: number;
        totalAmount: number;
    }>;
};

export type AdminListingsReport = {
    range: { from: string; to: string };
    group: AdminAnalyticsGroup;
    totals: {
        listingsCreated: number;
        activeListings: number;
        inactiveListings: number;
    };
    series: Array<{
        period: string;
        listingsCreated: number;
        activeListings: number;
        inactiveListings: number;
    }>;
};

export type AdminHostsReport = {
    range: { from: string; to: string };
    group: AdminAnalyticsGroup;
    totals: {
        totalHosts: number;
        approvedHosts: number;
        pendingHosts: number;
        rejectedHosts: number;
    };
    series: Array<{
        period: string;
        totalHosts: number;
        approvedHosts: number;
        pendingHosts: number;
        rejectedHosts: number;
    }>;
};

export const ADMIN_LISTINGS_MAX_PAGE_LIMIT = 50;

export const getPendingListings = (query: { page?: number; limit?: number } = {}) =>
    apiClient.get<PaginatedListings>("/api/admin/listings/pending", {
        query: {
            ...query,
            limit: query.limit ? Math.min(query.limit, ADMIN_LISTINGS_MAX_PAGE_LIMIT) : undefined,
        },
    });

export const getAdminListingDetail = (listingId: number | string) =>
    apiClient.get(`/api/admin/listings/${listingId}`);

export const approveListing = (listingId: string | number) =>
    apiClient.patch<{ listingId: number; status: string }>(`/api/admin/listings/${listingId}/approve`);

export const rejectListing = (listingId: string | number, reason: string) =>
    apiClient.patch<{ listingId: number; status: string }>(`/api/admin/listings/${listingId}/reject`, { reason });

export const getAdminUsers = (
    query: {
        page?: number;
        limit?: number;
        search?: string;
        role?: ApiUserRole | "all";
        status?: ApiUserStatus | "all";
    } = {},
) =>
    apiClient.get<PaginatedUsers>("/api/users", {
        query: {
            ...query,
            role: query.role === "all" ? undefined : query.role,
            status: query.status === "all" ? undefined : query.status,
        },
    });

export const updateAdminUser = (
    userId: string | number,
    payload: Partial<{
        username: string | null;
        fullName: string;
        firstName: string;
        lastName: string;
        phone: string | null;
        status: ApiUserStatus;
        role: ApiUserRole;
        roles: ApiUserRole[];
    }>,
) => apiClient.patch(`/api/users/${userId}`, payload);

export const updateAdminUserStatus = (userId: string | number, status: ApiUserStatus) =>
    apiClient.patch(`/api/users/${userId}/status`, { status });

export const updateAdminUserAvatar = (userId: string | number, payload: { url: string; key?: string | null }) =>
    apiClient.patch(`/api/admin/users/${userId}/avatar`, payload);

export const getAdminRevenueReport = (
    query: {
        from?: string;
        to?: string;
        group?: AdminAnalyticsGroup;
    } = {},
) => apiClient.get<AdminRevenueReport>("/api/admin/reports/revenue", { query });

export const getAdminBookingsReport = (
    query: {
        from?: string;
        to?: string;
        group?: AdminAnalyticsGroup;
    } = {},
) => apiClient.get<AdminBookingsReport>("/api/admin/reports/bookings", { query });

export const getAdminListingsReport = (
    query: {
        from?: string;
        to?: string;
        group?: AdminAnalyticsGroup;
    } = {},
) => apiClient.get<AdminListingsReport>("/api/admin/reports/listings", { query });

export const getAdminHostsReport = (
    query: {
        from?: string;
        to?: string;
        group?: AdminAnalyticsGroup;
    } = {},
) => apiClient.get<AdminHostsReport>("/api/admin/reports/hosts", { query });

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
