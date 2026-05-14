import { ApiError } from "../../common/api-error";
import { isValidIsoDate } from "../../common/validation";
import { logger } from "../../config/logger";
import { generateEmbedding } from "./embedding.service";
import { searchListingVectors } from "./qdrant-vector.service";
import { buildSemanticQuery, parseSearchQuery } from "./semantic-search.parser";
import {
    findAvailableListingItems,
    keywordSearchFallback,
    resolveAmenityIds,
} from "./semantic-search.repository";
import {
    SemanticSearchFilters,
    SemanticSearchItem,
    SemanticSearchRequest,
    SemanticSearchResponse,
} from "./semantic-search.types";
import {
    getSemanticDefaultCity,
    getVungTauAreaDisplayName,
    inferVungTauAreaKeys,
    normalizeKey,
    shouldForceVungTauOnly,
    uniqueStrings,
} from "./semantic-search.utils";

const maxQueryLength = 300;
const maxLimit = 50;

const calculatePriceScore = (price: number, minPrice?: number, maxPrice?: number) => {
    if (maxPrice === undefined && minPrice === undefined) return 0.7;
    if (maxPrice !== undefined && price > maxPrice) return 0;
    if (minPrice !== undefined && price < minPrice) return 0;
    if (maxPrice === undefined) return 0.7;

    return Math.max(0, Math.min(1, 1 - price / Math.max(maxPrice, 1)));
};

const calculateVungTauAreaScore = (item: SemanticSearchItem, filters: SemanticSearchFilters) => {
    if (filters.vungTauAreaKeys.length === 0) {
        return item.vungTauAreaKeys.length > 0 ? 0.8 : 0.5;
    }

    return filters.vungTauAreaKeys.some((areaKey) => item.vungTauAreaKeys.includes(areaKey))
        ? 1
        : 0;
};

const calculateBusinessScore = (item: SemanticSearchItem) => {
    if (item.ratingAvg >= 4.7 && item.reviewCount >= 5) return 1;
    if (item.ratingAvg >= 4.4) return 0.8;
    if (item.reviewCount > 0) return 0.6;
    return 0.5;
};

const calculateFinalScore = (item: SemanticSearchItem, filters: SemanticSearchFilters) => {
    const semanticScore = Math.max(0, Math.min(1, item.semanticScore));
    const ratingScore = Math.max(0, Math.min(1, item.ratingAvg / 5));
    const priceScore = calculatePriceScore(item.basePrice, filters.minPrice, filters.maxPrice);
    const availabilityScore = item.isAvailable ? 1 : 0;
    const vungTauAreaScore = calculateVungTauAreaScore(item, filters);
    const businessScore = calculateBusinessScore(item);

    return Number(
        (
            semanticScore * 0.45 +
            ratingScore * 0.15 +
            priceScore * 0.1 +
            availabilityScore * 0.15 +
            vungTauAreaScore * 0.1 +
            businessScore * 0.05
        ).toFixed(4),
    );
};

const buildMatchedReasons = (item: SemanticSearchItem, filters: SemanticSearchFilters) => {
    const reasons: string[] = [];

    if (filters.forceVungTauOnly) {
        reasons.push("Thuộc phạm vi tìm kiếm Vũng Tàu");
    }

    if (item.vungTauAreas.length > 0) {
        reasons.push(`Khu vực phù hợp: ${item.vungTauAreas.join(", ")}`);
    }

    if (filters.vungTauAreaKeys.length > 0) {
        const matchedAreaNames = filters.vungTauAreaKeys
            .filter((areaKey) => item.vungTauAreaKeys.includes(areaKey))
            .map(getVungTauAreaDisplayName);

        if (matchedAreaNames.length > 0) {
            reasons.push(`Khớp khu vực người dùng hỏi: ${matchedAreaNames.join(", ")}`);
        }
    }

    if (filters.district && normalizeKey(item.district) === filters.districtKey) {
        reasons.push(`Đúng khu vực ${item.district}`);
    }

    if (item.maxGuests >= filters.guests) {
        reasons.push(`Phù hợp ${filters.guests} khách`);
    }

    if (filters.maxPrice !== undefined && item.basePrice <= filters.maxPrice) {
        reasons.push(`Giá không vượt ${filters.maxPrice.toLocaleString("vi-VN")} VND`);
    }

    if (filters.minPrice !== undefined && item.basePrice >= filters.minPrice) {
        reasons.push(`Giá từ ${filters.minPrice.toLocaleString("vi-VN")} VND`);
    }

    if (filters.amenityIds.length > 0) {
        reasons.push("Khớp tiện nghi có trong database");
    }

    if (filters.amenityCodes.length > filters.amenityIds.length) {
        reasons.push("Một số tiện nghi được dùng để boost semantic thay vì hard filter");
    }

    if (item.semanticScore > 0) {
        reasons.push(`Gần nghĩa với câu tìm kiếm, semanticScore=${item.semanticScore.toFixed(3)}`);
    }

    if (item.isAvailable) {
        reasons.push("Còn khả dụng theo ngày đã chọn hoặc chưa yêu cầu ngày");
    }

    return reasons;
};

const validateDateRange = (input: SemanticSearchRequest) => {
    if ((input.checkIn && !input.checkOut) || (!input.checkIn && input.checkOut)) {
        throw new ApiError(422, "checkIn and checkOut must be provided together");
    }

    if (!input.checkIn || !input.checkOut) {
        return;
    }

    if (!isValidIsoDate(input.checkIn) || !isValidIsoDate(input.checkOut)) {
        throw new ApiError(422, "checkIn and checkOut must use YYYY-MM-DD format");
    }

    if (input.checkOut <= input.checkIn) {
        throw new ApiError(422, "checkOut must be after checkIn");
    }
};

const buildFilters = async (input: SemanticSearchRequest): Promise<SemanticSearchFilters> => {
    const rawQuery = input.query;

    if (typeof rawQuery !== "string") {
        throw new ApiError(422, "query must be a string");
    }

    const query = rawQuery.trim();

    if (!query) {
        throw new ApiError(422, "query is required");
    }

    if (query.length > maxQueryLength) {
        throw new ApiError(422, `query must be at most ${maxQueryLength} characters`);
    }

    validateDateRange(input);

    if (input.minPrice !== undefined && input.maxPrice !== undefined && input.minPrice > input.maxPrice) {
        throw new ApiError(422, "maxPrice must be greater than or equal to minPrice");
    }

    const parsed = parseSearchQuery(query);
    const forceVungTauOnly = shouldForceVungTauOnly();

    const city = forceVungTauOnly
        ? getSemanticDefaultCity()
        : input.city ?? parsed.city ?? getSemanticDefaultCity();

    const semanticQuery = buildSemanticQuery(
        {
            ...input,
            city,
        },
        parsed,
    );

    const requestAmenities = Array.isArray(input.amenities)
        ? input.amenities
        : [];

    const amenityCodes = uniqueStrings([
        ...(parsed.amenityCodes ?? []),
        ...requestAmenities.map(String),
    ]);

    const amenityIds = await resolveAmenityIds(amenityCodes);

    const district = input.district ?? parsed.district;
    const page = Math.max(1, Math.floor(input.page ?? 1));
    const limit = Math.min(maxLimit, Math.max(1, Math.floor(input.limit ?? 10)));

    const vungTauAreaKeys = inferVungTauAreaKeys(`${query} ${semanticQuery}`);

    return {
        query,
        semanticQuery,

        checkIn: input.checkIn,
        checkOut: input.checkOut,

        guests: Math.max(1, Math.floor(input.guests ?? parsed.guests ?? 1)),

        city,
        cityKey: normalizeKey(city),
        district,
        districtKey: district ? normalizeKey(district) : undefined,

        minPrice: input.minPrice ?? parsed.minPrice,
        maxPrice: input.maxPrice ?? parsed.maxPrice,

        amenityIds,
        amenityCodes,

        propertyType: input.propertyType,
        roomType: input.roomType,

        page,
        limit,

        forceVungTauOnly,
        vungTauAreaKeys,
    };
};

const rankItems = (items: SemanticSearchItem[], filters: SemanticSearchFilters) =>
    items
        .map((item) => {
            const finalScore = calculateFinalScore(item, filters);

            return {
                ...item,
                finalScore,
                matchedReasons: buildMatchedReasons(item, filters),
            };
        })
        .sort((left, right) => right.finalScore - left.finalScore || right.listingId - left.listingId);

const paginate = (
    items: SemanticSearchItem[],
    filters: SemanticSearchFilters,
    fallback: boolean,
    usedVectorSearch: boolean,
    candidateCount: number,
): SemanticSearchResponse => {
    const totalItems = items.length;
    const start = (filters.page - 1) * filters.limit;
    const paginatedItems = items.slice(start, start + filters.limit);

    return {
        items: paginatedItems,
        pagination: {
            page: filters.page,
            limit: filters.limit,
            totalItems,
            totalPages: Math.max(1, Math.ceil(totalItems / filters.limit)),
        },
        fallback,
        searchMeta: {
            query: filters.query,
            semanticQuery: filters.semanticQuery,
            usedVectorSearch,
            candidateCount,
            forceVungTauOnly: filters.forceVungTauOnly,
            filters: {
                city: filters.city,
                district: filters.district,
                minPrice: filters.minPrice,
                maxPrice: filters.maxPrice,
                guests: filters.guests,
                amenityIds: filters.amenityIds,
                amenityCodes: filters.amenityCodes,
                vungTauAreaKeys: filters.vungTauAreaKeys,
                propertyType: filters.propertyType,
                roomType: filters.roomType,
            },
        },
    };
};

export const semanticSearchListings = async (
    input: SemanticSearchRequest,
): Promise<SemanticSearchResponse> => {
    const filters = await buildFilters(input);

    try {
        const vector = await generateEmbedding(filters.semanticQuery);
        const vectorHits = await searchListingVectors(vector, filters, 250);

        const listingIds = vectorHits.map((hit) => hit.payload.listing_id);

        const semanticScoreMap = new Map(
            vectorHits.map((hit) => [hit.payload.listing_id, hit.score]),
        );

        const availableItems = await findAvailableListingItems(
            listingIds,
            filters,
            semanticScoreMap,
        );

        const rankedItems = rankItems(availableItems, filters);

        return paginate(rankedItems, filters, false, true, vectorHits.length);
    } catch (error) {
        logger.warn("Semantic vector search failed. Falling back to keyword search", {
            errorMessage: error instanceof Error ? error.message : String(error),
        });

        const fallbackItems = await keywordSearchFallback(filters);
        const rankedItems = rankItems(fallbackItems, filters);

        return paginate(rankedItems, filters, true, false, fallbackItems.length);
    }
};