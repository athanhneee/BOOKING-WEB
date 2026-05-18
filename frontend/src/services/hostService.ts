import { apiClient } from "./api/apiClient";
import type {
    ApiListingDetail,
    ApiListingSummary,
    ApiPropertyType,
    ApiRoomType,
    PaginatedListings,
} from "../models/entities/Listing";
import type { ApiBooking, PaginatedBookings } from "../models/entities/Booking";

export type HostListingStatus = "draft" | "pending_approval" | "published" | "hidden";

export type HostListingSummary = ApiListingSummary & {
    status?: HostListingStatus;
};

export type HostListingDetail = ApiListingDetail & {
    status?: HostListingStatus;
    hostId?: string | number;
    addressLine?: string;
    ward?: string;
    district?: string;
    city?: string;
    stateRegion?: string | null;
    country?: string;
    postalCode?: string | null;
    latitude?: number;
    longitude?: number;
    amenityIds?: number[];
    smokingAllowed?: boolean;
    petsAllowed?: boolean;
    partyAllowed?: boolean;
    quietHours?: string | null;
    createdAt?: string;
    updatedAt?: string;
};

export type PaginatedHostListings = Omit<PaginatedListings, "items"> & {
    items: HostListingSummary[];
};

export type CreateHostListingPayload = {
    title: string;
    description: string;
    addressLine: string;
    ward: string;
    district: string;
    city: string;
    stateRegion?: string | null;
    country: "VN";
    postalCode?: string | null;
    latitude: number;
    longitude: number;
    propertyType: ApiPropertyType;
    roomType: ApiRoomType;
    maxGuests: number;
    bedrooms: number;
    beds: number;
    bathrooms: number;
    basePrice: number;
    weekendPrice?: number | null;
    cleaningFee?: number | null;
    serviceFeePct?: number | null;
    currency: "VND";
    minNights: number;
    maxNights?: number | null;
    checkInFrom: string;
    checkOutBefore: string;
    cancellationPolicy: "flexible" | "moderate" | "strict";
    instantBookEnabled: boolean;
    amenityIds?: number[];
    status?: "draft" | "pending_approval";
};

export type UpdateHostListingPayload = Partial<
    Omit<CreateHostListingPayload, "country" | "currency" | "amenityIds" | "status">
> & {
    country?: "VN";
    currency?: "VND";
    status?: HostListingStatus;
};

export type HostCalendarDay = {
    date: string;
    isAvailable: boolean;
    isBlockedByHost: boolean;
    price: number;
    priceOverride?: number | null;
    minNights: number;
    minNightsOverride?: number | null;
    notes?: string | null;
};

export type HostCalendarResult = {
    listingId: number;
    month: number;
    year: number;
    days: HostCalendarDay[];
};

export type BulkUpdateHostCalendarPayload = {
    dates: string[];
    isAvailable?: boolean;
    isBlockedByHost?: boolean;
    priceOverride?: number | null;
    minNightsOverride?: number | null;
    notes?: string | null;
};

export type HostApplicationStatus = "pending" | "approved" | "rejected" | null;

export type HostApplication = {
    applicationId?: number;
    status?: HostApplicationStatus;
    hostApplicationStatus?: HostApplicationStatus;
    contactName?: string | null;
    contactEmail?: string | null;
    contactPhone?: string | null;
    businessAddress?: string | null;
    entityType?: "individual" | "business";
    notes?: string | null;
    rejectionReason?: string | null;
    createdAt?: string;
    updatedAt?: string;
};

export type HostApplicationMeResult = {
    status: HostApplicationStatus;
    hostApplicationStatus: HostApplicationStatus;
    application: HostApplication | null;
};

export type HostRevenueReport = {
    range: { from: string; to: string };
    group: "day" | "month" | "year";
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

export const getMyHostListings = (query: { status?: HostListingStatus | "all"; page?: number; limit?: number } = {}) =>
    apiClient.get<PaginatedHostListings>("/api/host/listings/mine", {
        query: {
            ...query,
            status: query.status === "all" ? undefined : query.status,
            limit: query.limit === undefined ? undefined : Math.min(query.limit, 50),
        },
    });

export const getHostListingDetail = (listingId: string | number) =>
    apiClient.get<HostListingDetail>(`/api/host/listings/${listingId}`);

export const createHostListing = (payload: CreateHostListingPayload) =>
    apiClient.post<HostListingDetail>("/api/host/listings", payload);

export const updateHostListing = (listingId: string | number, payload: UpdateHostListingPayload) =>
    apiClient.patch<HostListingDetail>(`/api/host/listings/${listingId}`, payload);

export const deleteHostListing = (listingId: string | number) =>
    apiClient.delete<{ listingId: number }>(`/api/host/listings/${listingId}`);

export const submitHostListingForApproval = (listingId: string | number) =>
    updateHostListing(listingId, { status: "pending_approval" });

export const hideHostListing = (listingId: string | number) =>
    updateHostListing(listingId, { status: "hidden" });

export const publishHostListing = (listingId: string | number) =>
    updateHostListing(listingId, { status: "published" });

export const addHostListingImages = (
    listingId: string | number,
    images: Array<{
        url: string;
        caption?: string | null;
        sortOrder?: number;
        isCover?: boolean;
    }>,
) => apiClient.post(`/api/host/listings/${listingId}/images`, { images });

export const deleteHostListingImage = (listingId: string | number, imageId: string | number) =>
    apiClient.delete(`/api/host/listings/${listingId}/images/${imageId}`);

export const replaceHostListingAmenities = (listingId: string | number, amenityIds: number[]) =>
    apiClient.put(`/api/host/listings/${listingId}/amenities`, { amenityIds });

export const updateHostListingRules = (
    listingId: string | number,
    payload: Partial<{
        checkInFrom: string;
        checkOutBefore: string;
        smokingAllowed: boolean;
        petsAllowed: boolean;
        partyAllowed: boolean;
        quietHours: string | null;
    }>,
) => apiClient.patch(`/api/host/listings/${listingId}/rules`, payload);

export const getHostListingCalendar = (listingId: string | number, query?: { month?: number; year?: number }) =>
    apiClient.get<HostCalendarResult>(`/api/host/listings/${listingId}/calendar`, { query });

export const bulkUpdateHostListingCalendar = (listingId: string | number, payload: BulkUpdateHostCalendarPayload) =>
    apiClient.patch<HostCalendarResult>(`/api/host/listings/${listingId}/calendar/bulk`, payload);

export const getHostBookings = (query: { status?: string | "all"; page?: number; limit?: number } = {}) =>
    apiClient.get<PaginatedBookings>("/api/host/bookings", {
        query: {
            ...query,
            status: query.status === "all" ? undefined : query.status,
        },
    });

export const getHostBookingDetail = (bookingId: string | number) =>
    apiClient.get<ApiBooking>(`/api/host/bookings/${bookingId}`);

export const confirmHostBooking = (bookingId: string | number) =>
    apiClient.patch<ApiBooking>(`/api/host/bookings/${bookingId}/confirm`);

export const checkInHostBooking = (bookingId: string | number) =>
    apiClient.patch<ApiBooking>(`/api/host/bookings/${bookingId}/check-in`);

export const checkOutHostBooking = (bookingId: string | number) =>
    apiClient.patch<ApiBooking>(`/api/host/bookings/${bookingId}/check-out`);

export const cancelHostBooking = (bookingId: string | number, reason?: string) =>
    apiClient.patch<ApiBooking>(`/api/host/bookings/${bookingId}/cancel`, { reason });

export const getHostApplicationMe = () =>
    apiClient.get<HostApplicationMeResult>("/api/host/application/me");

export const getHostRegisterStatus = () =>
    apiClient.get<HostApplicationMeResult>("/api/host/register/status");

export const registerHostApplication = (payload: {
    contactName?: string | null;
    contactEmail?: string | null;
    contactPhone: string;
    businessAddress: string;
    entityType: "individual" | "business";
    notes?: string | null;
}) => apiClient.post<HostApplicationMeResult>("/api/host/register", payload);

export const getHostRevenueReport = (
    query: {
        from?: string;
        to?: string;
        group?: "day" | "month" | "year";
    } = {},
) => apiClient.get<HostRevenueReport>("/api/host/reports/revenue", { query });
