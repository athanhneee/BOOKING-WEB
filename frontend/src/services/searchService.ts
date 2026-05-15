import { apiClient } from "./api/apiClient";
import {
    mapListingSummaryToDestination,
    type ApiListingSummary,
    type ApiPropertyType,
    type ApiRoomType,
    type PaginatedListings,
} from "../models/entities/Listing";

export type SemanticSearchRequest = {
    query: string;
    checkIn?: string;
    checkOut?: string;
    guests?: number;
    city?: string;
    district?: string;
    minPrice?: number;
    maxPrice?: number;
    amenities?: Array<string | number>;
    propertyType?: ApiPropertyType;
    roomType?: ApiRoomType;
    page?: number;
    limit?: number;
};

export type SemanticSearchResponse = {
    items: ApiListingSummary[];
    pagination: PaginatedListings["pagination"];
    fallback: boolean;
    searchMeta: unknown;
};

export const semanticSearchListingsRaw = (payload: SemanticSearchRequest) =>
    apiClient.post<SemanticSearchResponse>("/api/search/semantic", payload);

export const searchListings = async (payload: SemanticSearchRequest) => {
    const result = await semanticSearchListingsRaw(payload);

    return {
        ...result,
        items: result.items.map(mapListingSummaryToDestination),
        rawItems: result.items,
    };
};