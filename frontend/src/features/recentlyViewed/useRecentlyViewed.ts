import { useCallback, useState } from "react";
import type { PopularDestination } from "../../config/popularDestinations";
import {
    addRecentlyViewedListing,
    readRecentlyViewedListings,
} from "./recentlyViewedStorage";

export const useRecentlyViewed = () => {
    const [items, setItems] = useState<PopularDestination[]>(() => readRecentlyViewedListings());

    const addListing = useCallback((listing: PopularDestination) => {
        setItems(addRecentlyViewedListing(listing));
    }, []);

    const refresh = useCallback(() => {
        setItems(readRecentlyViewedListings());
    }, []);

    return {
        items,
        addListing,
        refresh,
    };
};
