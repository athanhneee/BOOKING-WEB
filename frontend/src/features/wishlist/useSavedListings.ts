import { useCallback, useEffect, useMemo, useState } from "react";

import {
    addWishlistListing,
    getWishlist,
    migrateWishlistListingIds,
    removeWishlistListing,
} from "../../services/wishlistService";
import { getAccessToken, getCurrentUser } from "../../store/authStore";

export const SAVED_LISTINGS_STORAGE_KEY = "saved_listing_ids";

const canUseSessionStorage = () => typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";

const normalizeListingIds = (listingIds: string[]) =>
    Array.from(new Set(listingIds.map(String).map((value) => value.trim()).filter(Boolean)));

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

        return normalizeListingIds(parsed.filter((value): value is string => typeof value === "string"));
    } catch {
        return [];
    }
};

const writeSavedListingIds = (listingIds: string[]) => {
    if (!canUseSessionStorage()) {
        return;
    }

    window.sessionStorage.setItem(SAVED_LISTINGS_STORAGE_KEY, JSON.stringify(normalizeListingIds(listingIds)));
};

export const useSavedListings = () => {
    const currentUser = getCurrentUser();
    const currentUserId = currentUser?.id ?? null;
    const [savedIds, setSavedIds] = useState<string[]>(() => readSavedListingIds());
    const [isLoading, setIsLoading] = useState(Boolean(currentUserId && getAccessToken()));
    const [error, setError] = useState<string | null>(null);
    const savedIdSet = useMemo(() => new Set(savedIds), [savedIds]);

    const persistSavedIds = useCallback((listingIds: string[]) => {
        const normalizedIds = normalizeListingIds(listingIds);
        writeSavedListingIds(normalizedIds);
        setSavedIds(normalizedIds);
    }, []);

    useEffect(() => {
        if (!currentUserId || !getAccessToken()) {
            setIsLoading(false);
            setError(null);
            persistSavedIds(readSavedListingIds());
            return;
        }

        let cancelled = false;

        const syncWishlist = async () => {
            const localIds = readSavedListingIds();
            setIsLoading(true);
            setError(null);

            try {
                if (localIds.length > 0) {
                    await migrateWishlistListingIds(localIds);
                }

                const result = await getWishlist();
                const backendIds = result.listingIds.map(String);
                const invalidIds = new Set(result.invalidListingIds.map(String));
                const mergedIds = normalizeListingIds([...backendIds, ...localIds]).filter((id) => !invalidIds.has(id));

                if (!cancelled) {
                    persistSavedIds(mergedIds);
                }
            } catch {
                if (!cancelled) {
                    persistSavedIds(localIds);
                    setError("Không đồng bộ được wishlist. Dữ liệu lưu cục bộ vẫn được giữ.");
                }
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        };

        void syncWishlist();

        return () => {
            cancelled = true;
        };
    }, [currentUserId, persistSavedIds]);

    const isSaved = useCallback((listingId: string) => savedIdSet.has(String(listingId)), [savedIdSet]);

    const toggleSaved = useCallback(async (listingId: string) => {
        const normalizedListingId = String(listingId);
        const nextSaved = !savedIdSet.has(normalizedListingId);
        const previousIds = savedIds;
        const nextIds = nextSaved
            ? [normalizedListingId, ...savedIds]
            : savedIds.filter((currentId) => currentId !== normalizedListingId);

        persistSavedIds(nextIds);
        setError(null);

        if (currentUserId && getAccessToken()) {
            try {
                if (nextSaved) {
                    await addWishlistListing(normalizedListingId);
                } else {
                    await removeWishlistListing(normalizedListingId);
                }
            } catch {
                persistSavedIds(previousIds);
                setError("Không cập nhật được wishlist trên máy chủ. Vui lòng thử lại.");
                throw new Error("Unable to update wishlist");
            }
        }

        return nextSaved;
    }, [currentUserId, persistSavedIds, savedIdSet, savedIds]);

    return {
        savedIds,
        isSaved,
        toggleSaved,
        isLoading,
        error,
    };
};
