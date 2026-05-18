import type { PopularDestination } from "../../models/entities/Listing";

export const RECENTLY_VIEWED_STORAGE_KEY = "recently_viewed_listings";
export const RECENTLY_VIEWED_LIMIT = 8;

const canUseSessionStorage = () => typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";

const isValidListing = (value: Partial<PopularDestination> | null | undefined): value is PopularDestination =>
    Boolean(value?.id && value.name && value.address && typeof value.rating === "number" && typeof value.pricePerNight === "number");

export const readRecentlyViewedListings = (): PopularDestination[] => {
    if (!canUseSessionStorage()) {
        return [];
    }

    const rawValue = window.sessionStorage.getItem(RECENTLY_VIEWED_STORAGE_KEY);
    if (!rawValue) {
        return [];
    }

    try {
        const parsed = JSON.parse(rawValue) as Array<Partial<PopularDestination>>;
        if (!Array.isArray(parsed)) {
            return [];
        }

        return parsed.filter(isValidListing).slice(0, RECENTLY_VIEWED_LIMIT);
    } catch {
        return [];
    }
};

export const writeRecentlyViewedListings = (items: PopularDestination[]) => {
    if (!canUseSessionStorage()) {
        return;
    }

    window.sessionStorage.setItem(RECENTLY_VIEWED_STORAGE_KEY, JSON.stringify(items.slice(0, RECENTLY_VIEWED_LIMIT)));
};

export const addRecentlyViewedListing = (listing: PopularDestination) => {
    const currentItems = readRecentlyViewedListings();
    const nextItems = [
        listing,
        ...currentItems.filter((item) => item.id !== listing.id),
    ].slice(0, RECENTLY_VIEWED_LIMIT);

    writeRecentlyViewedListings(nextItems);
    return nextItems;
};