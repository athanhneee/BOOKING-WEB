import {
    stayAmenityOptions,
    stayCategoryOptions,
    stayHighlightOptions,
    stayPolicyOptions,
    stayQuickChoiceOptions,
    staySortOptions,
} from "./filterOptions";
import { normalizePriceRangeSelection } from "./stayFilterUtils";
import type { PriceBounds, StayFilterState } from "./types";

const FILTER_PARAM_KEYS = [
    "categories",
    "priceMin",
    "priceMax",
    "guests",
    "bedrooms",
    "beds",
    "bathrooms",
    "amenities",
    "highlights",
    "policies",
    "quickChoices",
    "sortBy",
] as const;

const staySortValues = new Set(staySortOptions.map((option) => option.value));

const parseList = <T extends string>(value: string | null, allowedValues: readonly T[]) => {
    if (!value) {
        return [] as T[];
    }

    const allowedSet = new Set(allowedValues);

    return value
        .split(",")
        .map((item) => item.trim())
        .filter((item): item is T => allowedSet.has(item as T));
};

const parsePositiveNumber = (value: string | null, fallback: number) => {
    const parsed = Number(value);

    if (!Number.isFinite(parsed) || parsed < 0) {
        return fallback;
    }

    return parsed;
};

const parseNullablePositiveNumber = (value: string | null) => {
    if (value === null || value === "") {
        return null;
    }

    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) {
        return null;
    }

    return parsed;
};

const setListParam = (params: URLSearchParams, key: string, values: string[]) => {
    if (values.length === 0) {
        params.delete(key);
        return;
    }

    params.set(key, values.join(","));
};

const setNullableNumberParam = (params: URLSearchParams, key: string, value: number | null) => {
    if (value === null) {
        params.delete(key);
        return;
    }

    params.set(key, String(value));
};

const setNumberParam = (params: URLSearchParams, key: string, value: number, fallback: number) => {
    if (value === fallback) {
        params.delete(key);
        return;
    }

    params.set(key, String(value));
};

const setStringParam = (params: URLSearchParams, key: string, value: string | null) => {
    if (!value) {
        params.delete(key);
        return;
    }

    params.set(key, value);
};

export const parseStayFiltersFromSearchParams = (
    paramsLike: URLSearchParams | string,
    defaults: StayFilterState,
    bounds: PriceBounds,
): StayFilterState => {
    const params = typeof paramsLike === "string" ? new URLSearchParams(paramsLike) : paramsLike;

    const normalizedPriceRange = normalizePriceRangeSelection(
        bounds,
        {
            min: parseNullablePositiveNumber(params.get("priceMin")),
            max: parseNullablePositiveNumber(params.get("priceMax")),
        },
    );
    const nextSortBy = params.get("sortBy");

    return {
        categories: parseList(params.get("categories"), stayCategoryOptions),
        priceMin: normalizedPriceRange.priceMin,
        priceMax: normalizedPriceRange.priceMax,
        guests: parsePositiveNumber(params.get("guests"), defaults.guests),
        bedrooms: parsePositiveNumber(params.get("bedrooms"), defaults.bedrooms),
        beds: parsePositiveNumber(params.get("beds"), defaults.beds),
        bathrooms: parsePositiveNumber(params.get("bathrooms"), defaults.bathrooms),
        amenities: parseList(params.get("amenities"), stayAmenityOptions),
        highlights: parseList(params.get("highlights"), stayHighlightOptions),
        policies: parseList(params.get("policies"), stayPolicyOptions),
        quickChoices: parseList(params.get("quickChoices"), stayQuickChoiceOptions),
        sortBy: staySortValues.has(nextSortBy as StayFilterState["sortBy"]) ? (nextSortBy as StayFilterState["sortBy"]) : defaults.sortBy,
    };
};

export const applyStayFiltersToSearchParams = (
    baseParams: URLSearchParams,
    filters: StayFilterState,
    defaults: StayFilterState,
) => {
    const nextParams = new URLSearchParams(baseParams);

    FILTER_PARAM_KEYS.forEach((key) => nextParams.delete(key));

    setListParam(nextParams, "categories", filters.categories);
    setNullableNumberParam(nextParams, "priceMin", filters.priceMin);
    setNullableNumberParam(nextParams, "priceMax", filters.priceMax);
    setNumberParam(nextParams, "guests", filters.guests, defaults.guests);
    setNumberParam(nextParams, "bedrooms", filters.bedrooms, defaults.bedrooms);
    setNumberParam(nextParams, "beds", filters.beds, defaults.beds);
    setNumberParam(nextParams, "bathrooms", filters.bathrooms, defaults.bathrooms);
    setListParam(nextParams, "amenities", filters.amenities);
    setListParam(nextParams, "highlights", filters.highlights);
    setListParam(nextParams, "policies", filters.policies);
    setListParam(nextParams, "quickChoices", filters.quickChoices);
    setStringParam(nextParams, "sortBy", filters.sortBy);

    return nextParams;
};
