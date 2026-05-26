import type { ApiPropertyType, ApiRoomType } from "../../models/entities/Listing";
import { apiClient } from "./apiClient";

export type AiSearchMode = "semantic" | "keyword_fallback";

export type AiListingSearchPayload = {
    query: string;
    limit?: number;
    filters?: {
        city?: string;
        minPrice?: number;
        maxPrice?: number;
        guests?: number;
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
    finalScore?: number;
    matchedReasons?: string[];
};

export type AiListingSearchResponse = {
    query: string;
    mode: AiSearchMode;
    items: AiListingSearchItem[];
};

export const searchAiListings = (payload: AiListingSearchPayload) =>
    apiClient.post<AiListingSearchResponse>("/api/ai/listings/search", payload);
