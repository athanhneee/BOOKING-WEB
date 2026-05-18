import type { PropertyType, RoomType } from "../../models/listing";

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
    propertyType?: PropertyType;
    roomType?: RoomType;
    page?: number;
    limit?: number;
};

export type ParsedQueryFilters = {
    city?: string;
    district?: string;
    minPrice?: number;
    maxPrice?: number;
    guests?: number;
    amenityCodes: string[];
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

    propertyType?: PropertyType;
    roomType?: RoomType;

    page: number;
    limit: number;

    forceVungTauOnly: boolean;
    vungTauAreaKeys: string[];
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

    status: "active";
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
    finalScore: number;
    matchedReasons: string[];
};

export type SemanticSearchResponse = {
    items: SemanticSearchItem[];
    pagination: {
        page: number;
        limit: number;
        totalItems: number;
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
            vungTauAreaKeys: string[];
            propertyType?: PropertyType;
            roomType?: RoomType;
        };
    };
};