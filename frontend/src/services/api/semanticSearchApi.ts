import type { ApiPropertyType, ApiRoomType } from "../../models/entities/Listing";
import { apiClient } from "./apiClient";

export type AiSearchMode = "semantic" | "keyword_fallback";

export type AiListingSearchPayload = {
    query: string;
    limit?: number;
    page?: number;
    checkIn?: string;
    checkOut?: string;
    guests?: number;
    city?: string;
    district?: string;
    minPrice?: number;
    maxPrice?: number;
    amenities?: Array<string | number>;
    locationGroup?: string;
    propertyType?: ApiPropertyType;
    roomType?: ApiRoomType;
    filters?: {
        city?: string;
        minPrice?: number;
        maxPrice?: number;
        guests?: number;
        checkIn?: string;
        checkOut?: string;
        amenities?: Array<string | number>;
        locationGroup?: string;
        propertyType?: ApiPropertyType;
        roomType?: ApiRoomType;
    };
};

export type AiListingSearchItem = {
    listingId: number;
    title: string;
    description: string;
    basePrice: number;
    weekendPrice: number | null;
    currency: string;
    ratingAvg: number;
    reviewCount: number;
    isAvailable: boolean;
    addressLine: string;
    ward: string;
    district: string;
    city: string;
    propertyType: ApiPropertyType;
    roomType: ApiRoomType;
    maxGuests: number;
    bedrooms: number;
    beds: number;
    bathrooms: number;
    imageUrl: string | null;
    semanticScore?: number;
    keywordScore?: number;
    locationScore?: number;
    availabilityScore?: number;
    popularityScore?: number;
    finalScore?: number;
    scoreBreakdown?: {
        semanticScore: number;
        keywordScore: number;
        locationScore: number;
        availabilityScore: number;
        popularityScore: number;
    };
    matchedReasons?: string[];
};

export type AiListingSearchResponse = {
    query: string;
    mode: AiSearchMode;
    items: AiListingSearchItem[];
    pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
    fallback?: boolean;
    searchMeta?: {
        query: string;
        semanticQuery: string;
        usedVectorSearch: boolean;
        candidateCount: number;
        forceVungTauOnly: boolean;
        filters: Record<string, unknown>;
        parsedFilters?: {
            dateIntent?: {
                label: string;
                checkIn?: string;
                checkOut?: string;
            };
            guests?: number;
            minPrice?: number;
            maxPrice?: number;
            propertyType?: string;
            proximity?: string[];
            amenityCodes?: string[];
            [key: string]: unknown;
        };
    };
};

export const searchAiListings = (payload: AiListingSearchPayload) => {
    const { filters, ...directPayload } = payload;

    return apiClient.post<AiListingSearchResponse>("/api/search/semantic", {
        ...directPayload,
        ...(filters ?? {}),
    });
};
