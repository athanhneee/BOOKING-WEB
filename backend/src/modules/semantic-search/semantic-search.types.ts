import type { PropertyType, RoomType } from "../../models/listing";
import type { LocationGroupName } from "../../common/vung-tau-location-groups";

export const semanticPublicListingStatuses = ["active", "approved", "published"] as const;
export type SemanticPublicListingStatus = (typeof semanticPublicListingStatuses)[number];

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
    locationGroup?: LocationGroupName | string;
    propertyType?: PropertyType;
    roomType?: RoomType;
    page?: number;
    limit?: number;
};

export type AiListingSearchRequest = {
    query: string;
    limit?: number;
    filters?: {
        city?: string;
        minPrice?: number;
        maxPrice?: number;
        guests?: number;
        checkIn?: string;
        checkOut?: string;
        amenities?: Array<string | number>;
        locationGroup?: LocationGroupName | string;
        propertyType?: PropertyType;
        roomType?: RoomType;
    };
};

export type ParsedQueryFilters = {
    city?: string;
    district?: string;
    minPrice?: number;
    maxPrice?: number;
    guests?: number;
    capacity?: number;
    propertyType?: PropertyType;
    proximity: string[];
    amenityCodes: string[];
    locationIntent?: {
        city?: string;
        locationGroups: string[];
        areaKeys: string[];
    };
    dateIntent?: {
        label: string;
        checkIn?: string;
        checkOut?: string;
    };
};

export type SemanticSearchFilters = {
    query: string;
    semanticQuery: string;

    checkIn?: string;
    checkOut?: string;

    guests: number;

    city: string;
    cityKey: string;
    district?: string;
    districtKey?: string;

    minPrice?: number;
    maxPrice?: number;

    amenityIds: number[];
    amenityCodes: string[];

    locationGroup?: string;
    explicitLocationAreaKeys: string[];

    propertyType?: PropertyType;
    roomType?: RoomType;

    page: number;
    limit: number;

    forceVungTauOnly: boolean;
    vungTauAreaKeys: string[];
    parsedFilters: ParsedQueryFilters;
};

export type ListingVectorPayload = {
    listing_id: number;
    title: string;

    city: string;
    city_key: string;
    district: string;
    district_key: string;
    ward: string;
    ward_key: string;

    location_keys: string[];
    vung_tau_area_keys: string[];
    vung_tau_area_names: string[];

    base_price: number;
    max_guests: number;

    amenity_ids: number[];
    amenity_names: string[];

    property_type: PropertyType;
    room_type: RoomType;

    status: SemanticPublicListingStatus;
};

export type VectorSearchHit = {
    id: number | string;
    score: number;
    payload: ListingVectorPayload;
};

export type SemanticSearchItem = {
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

    vungTauAreas: string[];
    vungTauAreaKeys: string[];

    propertyType: PropertyType;
    roomType: RoomType;

    maxGuests: number;
    bedrooms: number;
    beds: number;
    bathrooms: number;

    imageUrl: string | null;

    semanticScore: number;
    keywordScore: number;
    locationScore: number;
    availabilityScore: number;
    popularityScore: number;
    finalScore: number;
    scoreBreakdown: {
        semanticScore: number;
        keywordScore: number;
        locationScore: number;
        availabilityScore: number;
        popularityScore: number;
    };
    matchedReasons: string[];
};

export type SemanticSearchResponse = {
    query: string;
    mode: "semantic" | "keyword_fallback";
    items: SemanticSearchItem[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
    fallback: boolean;
    searchMeta: {
        query: string;
        semanticQuery: string;
        usedVectorSearch: boolean;
        candidateCount: number;
        forceVungTauOnly: boolean;
        filters: {
            city: string;
            district?: string;
            minPrice?: number;
            maxPrice?: number;
            guests: number;
            amenityIds: number[];
            amenityCodes: string[];
            locationGroup?: string;
            vungTauAreaKeys: string[];
            proximity: string[];
            propertyType?: PropertyType;
            roomType?: RoomType;
        };
        parsedFilters: ParsedQueryFilters;
    };
};

export type AiListingSearchResponse = {
    query: string;
    mode: "semantic" | "keyword_fallback";
    items: SemanticSearchItem[];
    pagination: SemanticSearchResponse["pagination"];
    fallback: boolean;
    searchMeta: SemanticSearchResponse["searchMeta"];
};
