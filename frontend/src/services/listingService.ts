import { apiClient } from "./api/apiClient";
import {
    mapListingDetailToDestination,
    mapListingSummaryToDestination,
    type ApiListingDetail,
    type ApiPropertyType,
    type ApiRoomType,
    type PaginatedListings,
} from "../models/entities/Listing";
import type { PaginatedReviews } from "../models/entities/Review";

export type ListingQuery = {
    city?: string;
    district?: string;
    checkIn?: string;
    checkOut?: string;
    guests?: number;
    propertyType?: ApiPropertyType;
    roomType?: ApiRoomType;
    minPrice?: number;
    maxPrice?: number;
    amenities?: string | string[];
    sort?: "price_asc" | "price_desc" | "rating_desc" | "newest";
    page?: number;
    limit?: number;
};

export const getListings = async (query: ListingQuery = {}) => {
    const result = await apiClient.get<PaginatedListings>("/api/listings", { query });

    return {
        ...result,
        items: result.items.map(mapListingSummaryToDestination),
        rawItems: result.items,
    };
};

export const getPopularDestinations = () =>
    getListings({
        city: "Vũng Tàu",
        limit: 12,
        sort: "rating_desc",
    }).then((result) => result.items);

export const getListingById = async (listingId?: string | number) => {
    if (!listingId) return null;

    const detail = await apiClient.get<ApiListingDetail>(`/api/listings/${listingId}`);

    return {
        raw: detail,
        destination: mapListingDetailToDestination(detail),
    };
};

export const getListingAvailability = (listingId: string | number, query?: { month?: number; year?: number }) =>
    apiClient.get<{
        listingId: number;
        month: number;
        year: number;
        days: Array<{
            date: string;
            isAvailable: boolean;
            price: number;
            minNights: number;
        }>;
    }>(`/api/listings/${listingId}/availability`, { query });

export const getListingReviews = (
    listingId: string | number,
    query?: {
        page?: number;
        limit?: number;
        rating?: number;
    },
) =>
    apiClient.get<PaginatedReviews>(`/api/listings/${listingId}/reviews`, {
        query: {
            ...query,
            limit: query?.limit === undefined ? undefined : Math.min(query.limit, 50),
        },
    });

export const getListingRules = (listingId: string | number) =>
    apiClient.get<{
        checkInFrom: string;
        checkOutBefore: string;
        smokingAllowed: boolean;
        petsAllowed: boolean;
        partyAllowed: boolean;
        quietHours: string | null;
    }>(`/api/listings/${listingId}/rules`);
