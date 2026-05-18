import { useCallback, useMemo, useState } from "react";

export const SAVED_LISTINGS_STORAGE_KEY = "saved_listing_ids";

const canUseSessionStorage = () => typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";

const readSavedListingIds = (): string[] => {
    if (!canUseSessionStorage()) {
        return [];
    }

    const rawValue = window.sessionStorage.getItem(SAVED_LISTINGS_STORAGE_KEY);
    if (!rawValue) {
        return [];
    }

    try {
        const parsed = JSON.parse(rawValue) as unknown;
        if (!Array.isArray(parsed)) {
            return [];
        }

        return parsed.filter((value): value is string => typeof value === "string");
    } catch {
        return [];
    }
};

const writeSavedListingIds = (listingIds: string[]) => {
    if (!canUseSessionStorage()) {
        return;
    }

    window.sessionStorage.setItem(SAVED_LISTINGS_STORAGE_KEY, JSON.stringify(Array.from(new Set(listingIds))));
};

export const useSavedListings = () => {
    const [savedIds, setSavedIds] = useState<string[]>(() => readSavedListingIds());
    const savedIdSet = useMemo(() => new Set(savedIds), [savedIds]);

    const isSaved = useCallback((listingId: string) => savedIdSet.has(listingId), [savedIdSet]);

    const toggleSaved = useCallback((listingId: string) => {
        const nextSaved = !savedIdSet.has(listingId);
        const nextIds = nextSaved
            ? [listingId, ...savedIds]
            : savedIds.filter((currentId) => currentId !== listingId);

        writeSavedListingIds(nextIds);
        setSavedIds(nextIds);

        return nextSaved;
    }, [savedIdSet, savedIds]);

    return {
        savedIds,
        isSaved,
        toggleSaved,
    };
};