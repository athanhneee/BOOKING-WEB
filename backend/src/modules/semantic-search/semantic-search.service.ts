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
    SearchRejectionReason,
    SemanticSearchFilters,
    SemanticSearchItem,
    SemanticSearchRequest,
    SemanticSearchResponse,
    isSupportedCity,
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

/**
 * Minimum cosine-similarity score from Qdrant below which a result is
 * discarded.  Prevents irrelevant listings from surfacing for vague or
 * unrelated queries like "Hello" or "abc".
 */
const MIN_SEMANTIC_SCORE = 0.35;

type SemanticSearchContext = {
    userId?: number | null;
};

const isDevMode = () => process.env.NODE_ENV !== "production";

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

const queryTokens = (query: string) =>
    uniqueStrings(normalizeVietnameseText(query).split(" ").filter((token) => token.length >= 2));

// ─── Vietnam timezone helper ──────────────────────────────────────────────────

const getVietnamDateString = (now = new Date()) =>
    new Date(now.getTime() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);

// ─── Intent detection ─────────────────────────────────────────────────────────

/**
 * Determines whether a query has a valid villa-search intent.
 *
 * A query is considered valid if it contains at least ONE of:
 *   – an accommodation keyword (villa, homestay, căn hộ, etc.)
 *   – a recognized location (city alias or Vũng Tàu area)
 *   – a recognized amenity keyword
 *   – explicit UI-provided filters (dates, guests, price, amenities, etc.)
 */
const ACCOMMODATION_KEYWORDS = [
    "villa", "biet thu", "homestay", "home stay", "can ho", "chung cu",
    "phong", "resort", "nha nghi", "cho o", "khach san", "hotel",
    "nha", "apartment", "studio", "nha rieng", "nguyen can",
];

const AMENITY_KEYWORDS = [
    "ho boi", "be boi", "pool", "karaoke", "bida", "bi a", "bbq", "nuong",
    "gan bien", "view bien", "san vuon", "thang may", "may giat",
    "bep", "wifi", "dieu hoa", "may lanh", "bon tam", "jacuzzi",
    "ban cong", "parking", "bai xe", "pet", "thu cung",
    "gym", "sang trong", "gia re", "yen tinh",
    "loa keo", "phong hat", "hat ho", "ban bida",
    "tiec nuong", "san nuong", "elevator", "lift",
];

const LOCATION_KEYWORDS = [
    "vung tau", "bai sau", "bai truoc", "long cung", "chi linh",
    "thuy tien", "trung tam", "tran phu", "thuy van",

];

type IntentResult = {
    valid: boolean;
    reason?: SearchRejectionReason;
    message?: string;
};

const detectSearchIntent = (
    query: string,
    input: SemanticSearchRequest,
    parsedHasRelevantFilters: boolean,
): IntentResult => {
    // If UI explicitly provides filters (dates, guests, price, amenities, etc.)
    // we treat the search as intentional even if the text query is vague.
    if (parsedHasRelevantFilters) {
        return { valid: true };
    }

    const normalized = normalizeVietnameseText(query);

    // Query too short and no keywords → invalid
    if (normalized.length < 2) {
        return {
            valid: false,
            reason: "INVALID_SEARCH_INTENT",
            message: "Vui lòng nhập nhu cầu tìm villa, khu vực, ngày ở hoặc tiện ích mong muốn.",
        };
    }

    const hasAccommodation = ACCOMMODATION_KEYWORDS.some((kw) => normalized.includes(kw));
    const hasAmenity = AMENITY_KEYWORDS.some((kw) => normalized.includes(kw));
    const hasLocation = LOCATION_KEYWORDS.some((kw) => normalized.includes(kw));

    // "cuoi tuan", "hom nay", "ngay mai" are date-related → valid intent
    const hasDateKeyword =
        normalized.includes("cuoi tuan") ||
        normalized.includes("hom nay") ||
        normalized.includes("ngay mai") ||
        normalized.includes("tuan toi") ||
        normalized.includes("tuan sau") ||
        normalized.includes("thang sau") ||
        /thang\s+\d/.test(normalized) ||
        /\d{1,2}[\/-]\d{1,2}/.test(normalized) ||
        /thu\s+[2-7]/.test(normalized) ||
        normalized.includes("thu hai") ||
        normalized.includes("thu ba") ||
        normalized.includes("thu tu") ||
        normalized.includes("thu nam") ||
        normalized.includes("thu sau") ||
        normalized.includes("thu bay") ||
        normalized.includes("chu nhat");

    // Guest-related keywords
    const hasGuestKeyword =
        /\d+\s*(?:nguoi|khach|guest|pax)/.test(normalized) ||
        normalized.includes("nhom lon") ||
        normalized.includes("nhom dong") ||
        normalized.includes("doan dong") ||
        normalized.includes("doan") ||
        normalized.includes("ca nha") ||
        normalized.includes("cap doi") ||
        normalized.includes("gia dinh");

    // Price-related keywords — "4tr", "dưới 4m", etc.
    const hasPriceKeyword =
        /\d+\s*(?:tr(?:ieu)?|m(?:il)?|cu|chai|k)\b/.test(normalized) ||
        /(?:duoi|tren|tu|khoang|tam|toi da|budget)\s+\d/.test(normalized) ||
        /\d{6,}/.test(normalized) ||  // bare VND like 4000000
        /\d{1,3}(?:\.\d{3})+/.test(normalized);  // 4.000.000

    // Room-related keywords — "4pn", "8 phòng ngủ", etc.
    const hasRoomKeyword =
        /\d+\s*(?:pn|phong\s*ngu|phong\s*tam|giuong|wc|toilet|bedroom|bathroom|bed)/.test(normalized) ||
        normalized.includes("nhieu phong");

    if (hasAccommodation || hasAmenity || hasLocation || hasDateKeyword || hasGuestKeyword || hasPriceKeyword || hasRoomKeyword) {
        return { valid: true };
    }

    return {
        valid: false,
        reason: "INVALID_SEARCH_INTENT",
        message: "Vui lòng nhập nhu cầu tìm villa, khu vực, ngày ở hoặc tiện ích mong muốn.",
    };
};

// ─── Scoring ──────────────────────────────────────────────────────────────────

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
        reasons.push("Khop tien nghi");
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

// ─── Date validation ──────────────────────────────────────────────────────────

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

/**
 * Checks whether explicitly-provided check-in/check-out dates are in the past.
 * Returns a rejection reason or null if dates are OK (or not provided).
 */
const checkPastDates = (checkIn?: string, checkOut?: string): IntentResult | null => {
    if (!checkIn || !checkOut) {
        return null;
    }

    const todayVN = getVietnamDateString();

    if (checkIn < todayVN) {
        return {
            valid: false,
            reason: "PAST_DATE_NOT_ALLOWED",
            message: "Không thể tìm phòng cho ngày trong quá khứ.",
        };
    }

    return null;
};

/**
 * Checks whether a date intent parsed from the query text is in the past.
 * If so we discard the date intent rather than rejecting the whole search.
 */
const isParsedDateInPast = (checkIn?: string): boolean => {
    if (!checkIn) return false;
    return checkIn < getVietnamDateString();
};

// ─── Filter building ──────────────────────────────────────────────────────────

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

    // ── Date handling ─────────────────────────────────────────────────────────
    // If user provided explicit dates via UI, use those.
    // Otherwise try parsed dateIntent from query text — but only if not in past.
    let checkIn = input.checkIn;
    let checkOut = input.checkOut;

    if (!checkIn && !checkOut && parsed.dateIntent?.checkIn && parsed.dateIntent?.checkOut) {
        if (!isParsedDateInPast(parsed.dateIntent.checkIn)) {
            checkIn = parsed.dateIntent.checkIn;
            checkOut = parsed.dateIntent.checkOut;
        }
        // If parsed date is in the past, we silently discard it — the search
        // proceeds without date filter rather than failing hard.
    }

    // ── City / location handling ──────────────────────────────────────────────
    // Detect the user's intended city from the query text or explicit input.
    // Even when forceVungTauOnly is true, we MUST respect the parsed city to
    // return UNSUPPORTED_LOCATION instead of showing Vũng Tàu listings for
    // queries like "villa Nha Trang".
    const forceVungTauOnly = shouldForceVungTauOnly();
    const parsedCity = input.city ?? parsed.city;
    const city = parsedCity ?? getSemanticDefaultCity();

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

        bedrooms: parsed.bedrooms,
        beds: parsed.beds,
        bathrooms: parsed.bathrooms,

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

// ─── Ranking & pagination ─────────────────────────────────────────────────────

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
    extra?: {
        reason?: SearchRejectionReason;
        message?: string;
        availabilityNotice?: string;
    },
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
        reason: extra?.reason,
        message: extra?.message,
        availabilityNotice: extra?.availabilityNotice,
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
                bedrooms: filters.bedrooms,
                beds: filters.beds,
                bathrooms: filters.bathrooms,
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

// ─── Empty-result helpers ─────────────────────────────────────────────────────

const buildEmptyResponse = (
    filters: SemanticSearchFilters,
    reason: SearchRejectionReason,
    message: string,
): SemanticSearchResponse =>
    paginate([], filters, false, false, 0, { reason, message });

// ─── Logging ──────────────────────────────────────────────────────────────────

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

const debugLog = (label: string, data: Record<string, unknown>) => {
    if (isDevMode()) {
        logger.info(`[SemanticSearch] ${label}`, data);
    }
};

// ─── Main search entry point ──────────────────────────────────────────────────

export const semanticSearchListings = async (
    input: SemanticSearchRequest,
    context: SemanticSearchContext = {},
): Promise<SemanticSearchResponse> => {
    const filters = await buildFilters(input);

    // ── Step 1: Check for past dates (explicit from UI) ───────────────────────
    const pastDateCheck = checkPastDates(filters.checkIn, filters.checkOut);
    if (pastDateCheck && !pastDateCheck.valid) {
        const response = buildEmptyResponse(
            filters,
            pastDateCheck.reason!,
            pastDateCheck.message!,
        );
        await logSearch(response, filters, context);
        return response;
    }

    // ── Step 2: Intent detection — reject garbage queries ─────────────────────
    const hasExplicitFilters =
        Boolean(input.checkIn) ||
        Boolean(input.checkOut) ||
        Boolean(input.guests && input.guests > 1) ||
        Boolean(input.minPrice) ||
        Boolean(input.maxPrice) ||
        Boolean(input.amenities && input.amenities.length > 0) ||
        Boolean(input.locationGroup) ||
        Boolean(input.propertyType) ||
        Boolean(input.roomType) ||
        Boolean(input.city) ||
        Boolean(input.district);

    const intent = detectSearchIntent(filters.query, input, hasExplicitFilters);

    debugLog("Intent detection", {
        query: filters.query,
        valid: intent.valid,
        reason: intent.reason,
        hasExplicitFilters,
    });

    if (!intent.valid) {
        const response = buildEmptyResponse(
            filters,
            intent.reason!,
            intent.message!,
        );
        await logSearch(response, filters, context);
        return response;
    }

    // ── Step 3: Location validation — reject unsupported cities ───────────────
    // If the user searched for a specific city that is NOT Vũng Tàu (or its
    // known aliases/areas), and forceVungTauOnly is on, return empty.
    const cityKey = normalizeKey(filters.city);
    const cityIsVungTau = isSupportedCity(normalizeVietnameseText(filters.city));

    if (filters.forceVungTauOnly && !cityIsVungTau && filters.parsedFilters.city) {
        debugLog("Unsupported location", {
            query: filters.query,
            detectedCity: filters.city,
            cityKey,
        });

        const response = buildEmptyResponse(
            filters,
            "UNSUPPORTED_LOCATION",
            `Hiện chưa có villa phù hợp tại ${filters.city}.`,
        );
        await logSearch(response, filters, context);
        return response;
    }

    // ── Step 4: Availability notice (no dates) ────────────────────────────────
    const availabilityNotice = (!filters.checkIn || !filters.checkOut)
        ? "Chọn ngày để kiểm tra tình trạng còn trống."
        : undefined;

    // ── Step 5: Semantic vector search ────────────────────────────────────────
    try {
        const vector = await generateEmbedding(filters.semanticQuery);
        const vectorHits = await searchListingVectors(vector, filters, 250);

        debugLog("Qdrant results", {
            query: filters.query,
            totalHits: vectorHits.length,
            topScore: vectorHits[0]?.score ?? 0,
            bottomScore: vectorHits[vectorHits.length - 1]?.score ?? 0,
        });

        // ── Apply semantic score threshold ────────────────────────────────────
        const qualifiedHits = vectorHits.filter((hit) => hit.score >= MIN_SEMANTIC_SCORE);

        debugLog("After score threshold", {
            before: vectorHits.length,
            after: qualifiedHits.length,
            threshold: MIN_SEMANTIC_SCORE,
        });

        if (qualifiedHits.length === 0) {
            const response = paginate([], filters, false, true, vectorHits.length, {
                reason: "LOW_RELEVANCE",
                message: "Không tìm thấy chỗ nghỉ phù hợp với yêu cầu của bạn.",
                availabilityNotice,
            });
            await logSearch(response, filters, context);
            return response;
        }

        const listingIds = uniqueNumbers(qualifiedHits.map((hit) => hit.payload.listing_id));
        const semanticScoreMap = new Map(
            qualifiedHits.map((hit) => [hit.payload.listing_id, clamp01(hit.score)]),
        );
        const availableItems = await findAvailableListingItems(
            listingIds,
            filters,
            semanticScoreMap,
        );

        debugLog("After DB filters", {
            vectorCandidates: listingIds.length,
            availableItems: availableItems.length,
            checkIn: filters.checkIn,
            checkOut: filters.checkOut,
        });

        const rankedItems = rankItems(availableItems, filters);
        const response = paginate(
            rankedItems,
            filters,
            false,
            true,
            qualifiedHits.length,
            {
                reason: rankedItems.length === 0 ? "NO_RESULTS" : undefined,
                message: rankedItems.length === 0
                    ? "Không tìm thấy chỗ nghỉ phù hợp với yêu cầu của bạn."
                    : undefined,
                availabilityNotice,
            },
        );

        await logSearch(response, filters, context);
        return response;
    } catch (error) {
        logger.warn("Semantic vector search failed. Falling back to keyword search", {
            errorMessage: error instanceof Error ? error.message : String(error),
        });

        const fallbackItems = await keywordSearchFallback(filters);
        const rankedFallback = rankItems(fallbackItems, filters);
        const response = paginate(
            rankedFallback,
            filters,
            true,
            false,
            fallbackItems.length,
            {
                reason: rankedFallback.length === 0 ? "NO_RESULTS" : undefined,
                message: rankedFallback.length === 0
                    ? "Không tìm thấy chỗ nghỉ phù hợp với yêu cầu của bạn."
                    : undefined,
                availabilityNotice,
            },
        );

        await logSearch(response, filters, context);
        return response;
    }
};
