import { ApiError } from "../../common/api-error";
import { isValidIsoDate } from "../../common/validation";
import {
    getLocationGroupAreaKey,
    isValidLocationGroup,
} from "../../common/vung-tau-location-groups";
import { logger } from "../../config/logger";
import { generateEmbedding } from "./embedding.service";
import { searchListingVectors } from "./qdrant-vector.service";
import { buildSemanticQuery, parseSearchQuery } from "./semantic-search.parser";
import {
    findAvailableListingItems,
    keywordSearchFallback,
    listSemanticSynonymRows,
    recordSemanticSearchLog,
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
    normalizeVietnameseText,
    shouldForceVungTauOnly,
    uniqueNumbers,
    uniqueStrings,
} from "./semantic-search.utils";

const maxQueryLength = 500;
const maxLimit = 30;

type SemanticSearchContext = {
    userId?: number | null;
};

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

const queryTokens = (query: string) =>
    uniqueStrings(normalizeVietnameseText(query).split(" ").filter((token) => token.length >= 2));

const calculateKeywordScore = (item: SemanticSearchItem, filters: SemanticSearchFilters) => {
    const normalizedQuery = normalizeVietnameseText(filters.query);
    const searchable = normalizeVietnameseText(
        [
            item.title,
            item.description,
            item.addressLine,
            item.ward,
            item.district,
            item.city,
            item.propertyType,
            item.roomType,
            item.vungTauAreas.join(" "),
        ].join(" "),
    );

    if (!normalizedQuery) {
        return 0;
    }

    if (searchable.includes(normalizedQuery)) {
        return 1;
    }

    const tokens = queryTokens(filters.query);
    if (tokens.length === 0) {
        return 0;
    }

    const matchedTokenCount = tokens.filter((token) => searchable.includes(token)).length;
    const amenityBoost = filters.amenityIds.length > 0 ? 0.15 : 0;

    return clamp01(matchedTokenCount / tokens.length + amenityBoost);
};

const calculateLocationScore = (item: SemanticSearchItem, filters: SemanticSearchFilters) => {
    if (filters.vungTauAreaKeys.length > 0) {
        return filters.vungTauAreaKeys.some((areaKey) => item.vungTauAreaKeys.includes(areaKey)) ? 1 : 0;
    }

    if (filters.districtKey && normalizeKey(item.district) === filters.districtKey) {
        return 1;
    }

    if (normalizeKey(item.city) === filters.cityKey) {
        return item.vungTauAreaKeys.length > 0 ? 0.85 : 0.65;
    }

    return item.vungTauAreaKeys.length > 0 ? 0.6 : 0.35;
};

const calculatePopularityScore = (item: SemanticSearchItem) => {
    const ratingComponent = clamp01(item.ratingAvg / 5) * 0.7;
    const reviewComponent = clamp01(Math.log10(item.reviewCount + 1) / 2) * 0.3;

    return clamp01(ratingComponent + reviewComponent);
};

const buildScoreBreakdown = (item: SemanticSearchItem, filters: SemanticSearchFilters) => {
    const semanticScore = clamp01(item.semanticScore);
    const keywordScore = calculateKeywordScore(item, filters);
    const locationScore = calculateLocationScore(item, filters);
    const availabilityScore = item.isAvailable ? 1 : 0;
    const popularityScore = calculatePopularityScore(item);

    return {
        semanticScore,
        keywordScore,
        locationScore,
        availabilityScore,
        popularityScore,
    };
};

const calculateFinalScore = (item: SemanticSearchItem, filters: SemanticSearchFilters) => {
    const scoreBreakdown = buildScoreBreakdown(item, filters);
    const finalScore =
        scoreBreakdown.semanticScore * 0.5 +
        scoreBreakdown.keywordScore * 0.2 +
        scoreBreakdown.locationScore * 0.15 +
        scoreBreakdown.availabilityScore * 0.1 +
        scoreBreakdown.popularityScore * 0.05;

    return {
        scoreBreakdown,
        finalScore: Number(finalScore.toFixed(4)),
    };
};

const buildMatchedReasons = (
    item: SemanticSearchItem,
    filters: SemanticSearchFilters,
    scoreBreakdown: SemanticSearchItem["scoreBreakdown"],
) => {
    const reasons: string[] = [];

    if (filters.forceVungTauOnly) {
        reasons.push("Nam trong pham vi tim kiem Vung Tau");
    }

    if (item.vungTauAreas.length > 0) {
        reasons.push(`Khu vuc phu hop: ${item.vungTauAreas.join(", ")}`);
    }

    if (filters.vungTauAreaKeys.length > 0) {
        const matchedAreaNames = filters.vungTauAreaKeys
            .filter((areaKey) => item.vungTauAreaKeys.includes(areaKey))
            .map(getVungTauAreaDisplayName);

        if (matchedAreaNames.length > 0) {
            reasons.push(`Khop locationGroup: ${matchedAreaNames.join(", ")}`);
        }
    }

    if (filters.district && normalizeKey(item.district) === filters.districtKey) {
        reasons.push(`Dung khu vuc ${item.district}`);
    }

    if (item.maxGuests >= filters.guests) {
        reasons.push(`Phu hop ${filters.guests} khach`);
    }

    if (filters.maxPrice !== undefined && item.basePrice <= filters.maxPrice) {
        reasons.push(`Gia khong vuot ${filters.maxPrice.toLocaleString("vi-VN")} VND`);
    }

    if (filters.minPrice !== undefined && item.basePrice >= filters.minPrice) {
        reasons.push(`Gia tu ${filters.minPrice.toLocaleString("vi-VN")} VND`);
    }

    if (filters.amenityIds.length > 0) {
        reasons.push("Khop tien nghi co trong database");
    }

    if (item.semanticScore > 0) {
        reasons.push(`Semantic score ${scoreBreakdown.semanticScore.toFixed(3)}`);
    }

    if (scoreBreakdown.keywordScore > 0) {
        reasons.push(`Keyword score ${scoreBreakdown.keywordScore.toFixed(3)}`);
    }

    if (item.isAvailable) {
        reasons.push("Con kha dung theo ngay da chon hoac chua yeu cau ngay");
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

const getExplicitLocationAreaKeys = (locationGroup?: string) => {
    if (!locationGroup) {
        return [];
    }

    if (isValidLocationGroup(locationGroup)) {
        return [getLocationGroupAreaKey(locationGroup)];
    }

    return inferVungTauAreaKeys(locationGroup);
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

    const synonymRows = await listSemanticSynonymRows();
    const parsed = parseSearchQuery(query, synonymRows);
    const checkIn = input.checkIn ?? parsed.dateIntent?.checkIn;
    const checkOut = input.checkOut ?? parsed.dateIntent?.checkOut;
    const forceVungTauOnly = shouldForceVungTauOnly();
    const city = forceVungTauOnly
        ? getSemanticDefaultCity()
        : input.city ?? parsed.city ?? getSemanticDefaultCity();

    const semanticQuery = buildSemanticQuery(
        {
            ...input,
            city,
            checkIn,
            checkOut,
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
    const limit = Math.min(maxLimit, Math.max(1, Math.floor(input.limit ?? 12)));
    const explicitLocationAreaKeys = getExplicitLocationAreaKeys(input.locationGroup);
    const inferredAreaKeys = inferVungTauAreaKeys(`${query} ${semanticQuery}`);
    const vungTauAreaKeys = uniqueStrings([
        ...explicitLocationAreaKeys,
        ...(parsed.locationIntent?.areaKeys ?? []),
        ...inferredAreaKeys,
    ]);

    return {
        query,
        semanticQuery,

        checkIn,
        checkOut,

        guests: Math.max(1, Math.floor(input.guests ?? parsed.guests ?? 1)),

        city,
        cityKey: normalizeKey(city),
        district,
        districtKey: district ? normalizeKey(district) : undefined,

        minPrice: input.minPrice ?? parsed.minPrice,
        maxPrice: input.maxPrice ?? parsed.maxPrice,

        amenityIds,
        amenityCodes,

        locationGroup: input.locationGroup,
        explicitLocationAreaKeys,

        propertyType: input.propertyType ?? parsed.propertyType,
        roomType: input.roomType,

        page,
        limit,

        forceVungTauOnly,
        vungTauAreaKeys,
        parsedFilters: parsed,
    };
};

const rankItems = (items: SemanticSearchItem[], filters: SemanticSearchFilters) =>
    items
        .map((item) => {
            const { finalScore, scoreBreakdown } = calculateFinalScore(item, filters);

            return {
                ...item,
                ...scoreBreakdown,
                finalScore,
                scoreBreakdown,
                matchedReasons: buildMatchedReasons(item, filters, scoreBreakdown),
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
        query: filters.query,
        mode: fallback ? "keyword_fallback" : "semantic",
        items: paginatedItems,
        pagination: {
            page: filters.page,
            limit: filters.limit,
            total: totalItems,
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
                locationGroup: filters.locationGroup,
                vungTauAreaKeys: filters.vungTauAreaKeys,
                proximity: filters.parsedFilters.proximity,
                propertyType: filters.propertyType,
                roomType: filters.roomType,
            },
            parsedFilters: filters.parsedFilters,
        },
    };
};

const logSearch = async (
    response: SemanticSearchResponse,
    filters: SemanticSearchFilters,
    context: SemanticSearchContext,
) => {
    await recordSemanticSearchLog({
        userId: context.userId ?? null,
        query: filters.query,
        parsedFilters: filters.parsedFilters as unknown as Record<string, unknown>,
        resultListingIds: response.items.map((item) => item.listingId),
    });
};

export const semanticSearchListings = async (
    input: SemanticSearchRequest,
    context: SemanticSearchContext = {},
): Promise<SemanticSearchResponse> => {
    const filters = await buildFilters(input);

    try {
        const vector = await generateEmbedding(filters.semanticQuery);
        const vectorHits = await searchListingVectors(vector, filters, 250);
        const listingIds = uniqueNumbers(vectorHits.map((hit) => hit.payload.listing_id));
        const semanticScoreMap = new Map(
            vectorHits.map((hit) => [hit.payload.listing_id, clamp01(hit.score)]),
        );
        const availableItems = await findAvailableListingItems(
            listingIds,
            filters,
            semanticScoreMap,
        );
        const response = paginate(rankItems(availableItems, filters), filters, false, true, vectorHits.length);

        await logSearch(response, filters, context);
        return response;
    } catch (error) {
        logger.warn("Semantic vector search failed. Falling back to keyword search", {
            errorMessage: error instanceof Error ? error.message : String(error),
        });

        const fallbackItems = await keywordSearchFallback(filters);
        const response = paginate(rankItems(fallbackItems, filters), filters, true, false, fallbackItems.length);

        await logSearch(response, filters, context);
        return response;
    }
};
