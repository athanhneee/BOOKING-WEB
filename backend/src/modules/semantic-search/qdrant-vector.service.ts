import { ApiError } from "../../common/api-error";
import { getEmbeddingDimension } from "./embedding.service";
import {
    ListingVectorPayload,
    SemanticSearchFilters,
    VectorSearchHit,
} from "./semantic-search.types";

const getQdrantBaseUrl = () => (process.env.QDRANT_URL ?? "http://127.0.0.1:6333").replace(/\/$/, "");

export const getQdrantCollectionName = () =>
    process.env.QDRANT_COLLECTION_LISTINGS ?? "booking_vung_tau_listings";

const buildHeaders = () => {
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
    };

    if (process.env.QDRANT_API_KEY) {
        headers["api-key"] = process.env.QDRANT_API_KEY;
    }

    return headers;
};

const parseJson = (text: string): unknown => {
    if (!text) return null;

    try {
        return JSON.parse(text) as unknown;
    } catch {
        return text;
    }
};

const requestQdrant = async <T>(path: string, init: RequestInit): Promise<T> => {
    const response = await fetch(`${getQdrantBaseUrl()}${path}`, {
        ...init,
        headers: {
            ...buildHeaders(),
            ...(init.headers ?? {}),
        },
    });

    const text = await response.text();
    const payload = parseJson(text);

    if (!response.ok) {
        throw new ApiError(503, `Qdrant returned ${response.status}: ${JSON.stringify(payload)}`);
    }

    return payload as T;
};

type QdrantCollectionResponse = {
    result?: {
        config?: {
            params?: {
                vectors?: {
                    size?: number;
                    distance?: string;
                };
            };
        };
    };
};

type QdrantSearchResponse = {
    result: Array<{
        id: string | number;
        score: number;
        payload: ListingVectorPayload;
    }>;
};

const getExistingCollection = async () => {
    const collectionName = getQdrantCollectionName();
    const response = await fetch(`${getQdrantBaseUrl()}/collections/${encodeURIComponent(collectionName)}`, {
        method: "GET",
        headers: buildHeaders(),
    });

    if (response.status === 404) {
        return null;
    }

    const text = await response.text();
    const payload = parseJson(text) as QdrantCollectionResponse;

    if (!response.ok) {
        throw new ApiError(503, `Cannot read Qdrant collection: ${response.status}`);
    }

    return payload;
};

export const ensureListingVectorCollection = async () => {
    const collectionName = getQdrantCollectionName();
    const dimensions = getEmbeddingDimension();

    const existingCollection = await getExistingCollection();

    if (existingCollection) {
        const existingSize =
            existingCollection.result?.config?.params?.vectors?.size;

        if (existingSize && existingSize !== dimensions) {
            throw new ApiError(
                503,
                `Qdrant collection "${collectionName}" vector size is ${existingSize}, but EMBEDDING_DIMENSIONS is ${dimensions}. Create a new collection or re-create the old one.`,
            );
        }

        return;
    }

    await requestQdrant(`/collections/${encodeURIComponent(collectionName)}`, {
        method: "PUT",
        body: JSON.stringify({
            vectors: {
                size: dimensions,
                distance: "Cosine",
            },
        }),
    });
};

export const upsertListingVectors = async (
    points: Array<{
        id: number;
        vector: number[];
        payload: ListingVectorPayload;
    }>,
) => {
    if (points.length === 0) return;

    const collectionName = getQdrantCollectionName();

    await requestQdrant(`/collections/${encodeURIComponent(collectionName)}/points?wait=true`, {
        method: "PUT",
        body: JSON.stringify({
            points,
        }),
    });
};

export const deleteListingVector = async (listingId: number) => {
    const collectionName = getQdrantCollectionName();

    await requestQdrant(`/collections/${encodeURIComponent(collectionName)}/points/delete?wait=true`, {
        method: "POST",
        body: JSON.stringify({
            points: [listingId],
        }),
    });
};

const buildQdrantFilter = (filters: SemanticSearchFilters) => {
    const must: unknown[] = [
        {
            key: "status",
            match: {
                value: "active",
            },
        },
    ];

    if (filters.forceVungTauOnly) {
        must.push({
            key: "location_keys",
            match: {
                value: "vung_tau",
            },
        });
    } else if (filters.cityKey) {
        must.push({
            key: "city_key",
            match: {
                value: filters.cityKey,
            },
        });
    }

    if (filters.vungTauAreaKeys.length > 0) {
        must.push({
            key: "vung_tau_area_keys",
            match: {
                any: filters.vungTauAreaKeys,
            },
        });
    }

    if (filters.districtKey) {
        must.push({
            key: "district_key",
            match: {
                value: filters.districtKey,
            },
        });
    }

    if (filters.guests) {
        must.push({
            key: "max_guests",
            range: {
                gte: filters.guests,
            },
        });
    }

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
        must.push({
            key: "base_price",
            range: {
                ...(filters.minPrice !== undefined ? { gte: filters.minPrice } : {}),
                ...(filters.maxPrice !== undefined ? { lte: filters.maxPrice } : {}),
            },
        });
    }

    if (filters.propertyType) {
        must.push({
            key: "property_type",
            match: {
                value: filters.propertyType,
            },
        });
    }

    if (filters.roomType) {
        must.push({
            key: "room_type",
            match: {
                value: filters.roomType,
            },
        });
    }

    for (const amenityId of filters.amenityIds) {
        must.push({
            key: "amenity_ids",
            match: {
                value: amenityId,
            },
        });
    }

    return { must };
};

export const searchListingVectors = async (
    vector: number[],
    filters: SemanticSearchFilters,
    limit = 250,
): Promise<VectorSearchHit[]> => {
    const collectionName = getQdrantCollectionName();

    const response = await requestQdrant<QdrantSearchResponse>(
        `/collections/${encodeURIComponent(collectionName)}/points/search`,
        {
            method: "POST",
            body: JSON.stringify({
                vector,
                limit,
                with_payload: true,
                with_vector: false,
                filter: buildQdrantFilter(filters),
            }),
        },
    );

    return response.result.map((hit) => ({
        id: hit.id,
        score: Number(hit.score),
        payload: hit.payload,
    }));
};