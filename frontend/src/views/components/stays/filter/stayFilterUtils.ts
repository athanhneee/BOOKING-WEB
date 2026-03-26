import type {
    PopularDestination,
    StayQuickChoice,
} from "../../../../config/popularDestinations";
import type { PriceBounds, StayFilterState } from "./types";

export const getStayPriceBounds = (stays: PopularDestination[]): PriceBounds => {
    if (stays.length === 0) {
        return { min: 0, max: 0 };
    }

    const prices = stays.map((stay) => stay.pricePerNight);
    return {
        min: Math.min(...prices),
        max: Math.max(...prices),
    };
};

export const createDefaultStayFilters = (bounds: PriceBounds): StayFilterState => ({
    categories: [],
    priceMin: null,
    priceMax: null,
    guests: 0,
    bedrooms: 0,
    beds: 0,
    bathrooms: 0,
    amenities: [],
    highlights: [],
    policies: [],
    quickChoices: [],
    sortBy: null,
});

export const normalizePriceRangeSelection = (
    bounds: PriceBounds,
    selection: { min: number | null; max: number | null },
) => {
    const normalizedMin =
        selection.min === null || selection.min <= bounds.min ? null : Math.min(selection.min, bounds.max);
    const normalizedMax =
        selection.max === null || selection.max >= bounds.max ? null : Math.max(selection.max, bounds.min);

    if (normalizedMin !== null && normalizedMax !== null && normalizedMin > normalizedMax) {
        return {
            priceMin: normalizedMax,
            priceMax: normalizedMax,
        };
    }

    return {
        priceMin: normalizedMin,
        priceMax: normalizedMax,
    };
};

const hasEverySelectedValue = <T,>(selectedValues: T[], stayValues: T[]) => {
    if (selectedValues.length === 0) {
        return true;
    }

    return selectedValues.every((value) => stayValues.includes(value));
};

const matchesQuickChoices = (selectedQuickChoices: StayQuickChoice[], stay: PopularDestination) => {
    if (selectedQuickChoices.length === 0) {
        return true;
    }

    return selectedQuickChoices.every((choice) => stay.quickChoices.includes(choice));
};

export const filterAndSortStays = (stays: PopularDestination[], filters: StayFilterState): PopularDestination[] => {
    const filtered = stays.filter((stay) => {
        const effectivePriceMin = filters.priceMin ?? Number.NEGATIVE_INFINITY;
        const effectivePriceMax = filters.priceMax ?? Number.POSITIVE_INFINITY;
        const matchesCategory = filters.categories.length === 0 || filters.categories.includes(stay.category);
        const matchesPrice = stay.pricePerNight >= effectivePriceMin && stay.pricePerNight <= effectivePriceMax;
        const matchesGuests = filters.guests === 0 || stay.guests >= filters.guests;
        const matchesBedrooms = filters.bedrooms === 0 || stay.bedrooms >= filters.bedrooms;
        const matchesBeds = filters.beds === 0 || stay.beds >= filters.beds;
        const matchesBathrooms = filters.bathrooms === 0 || stay.bathrooms >= filters.bathrooms;
        const matchesAmenities = hasEverySelectedValue(filters.amenities, stay.amenities);
        const matchesHighlights = hasEverySelectedValue(filters.highlights, stay.highlights);
        const matchesPolicies = hasEverySelectedValue(filters.policies, stay.policies);
        const matchesQuick = matchesQuickChoices(filters.quickChoices, stay);

        return (
            matchesCategory &&
            matchesPrice &&
            matchesGuests &&
            matchesBedrooms &&
            matchesBeds &&
            matchesBathrooms &&
            matchesAmenities &&
            matchesHighlights &&
            matchesPolicies &&
            matchesQuick
        );
    });

    const sorted = [...filtered];

    switch (filters.sortBy) {
        case "gia-thap-den-cao":
            sorted.sort((a, b) => a.pricePerNight - b.pricePerNight);
            break;
        case "danh-gia-cao-nhat":
            sorted.sort((a, b) => b.rating - a.rating || a.pricePerNight - b.pricePerNight);
            break;
        case "gan-trung-tam":
            sorted.sort((a, b) => Number(b.quickChoices.includes("Gần trung tâm")) - Number(a.quickChoices.includes("Gần trung tâm")));
            break;
        case "phu-hop-gia-dinh":
            sorted.sort((a, b) => Number(b.quickChoices.includes("Phù hợp gia đình")) - Number(a.quickChoices.includes("Phù hợp gia đình")));
            break;
        case "phu-hop-nhom-dong":
            sorted.sort((a, b) => Number(b.quickChoices.includes("Phù hợp nhóm đông")) - Number(a.quickChoices.includes("Phù hợp nhóm đông")));
            break;
        default:
            sorted.sort((a, b) => {
                const badgePriorityA = Number(Boolean(a.badge));
                const badgePriorityB = Number(Boolean(b.badge));
                return badgePriorityB - badgePriorityA || b.rating - a.rating;
            });
            break;
    }

    return sorted;
};

export const countActiveFilters = (filters: StayFilterState, defaults: StayFilterState) => {
    let count = 0;

    if (filters.categories.length > 0) {
        count += filters.categories.length;
    }

    if (filters.priceMin !== defaults.priceMin || filters.priceMax !== defaults.priceMax) {
        count += 1;
    }

    if (filters.guests > 0) {
        count += 1;
    }

    if (filters.bedrooms > 0) {
        count += 1;
    }

    if (filters.beds > 0) {
        count += 1;
    }

    if (filters.bathrooms > 0) {
        count += 1;
    }

    count += filters.amenities.length;
    count += filters.highlights.length;
    count += filters.policies.length;
    count += filters.quickChoices.length;

    if (filters.sortBy !== defaults.sortBy) {
        count += 1;
    }

    return count;
};
