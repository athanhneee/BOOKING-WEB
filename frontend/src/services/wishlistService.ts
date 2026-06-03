import { apiClient } from "./api/apiClient";
import type { ApiListingSummary } from "../models/entities/Listing";

export type WishlistItem = {
    id: number;
    wishlistId: number;
    userId: number;
    listingId: number;
    createdAt: string;
    listing: ApiListingSummary | null;
};

export type WishlistResponse = {
    listingIds: number[];
    items: WishlistItem[];
};

export const getWishlist = () => apiClient.get<WishlistResponse>("/api/wishlist");

export const addWishlistListing = (listingId: string | number) =>
    apiClient.post<WishlistItem>(`/api/wishlist/${listingId}`);

export const removeWishlistListing = (listingId: string | number) =>
    apiClient.delete<{
        listingId: number;
        removed: boolean;
    }>(`/api/wishlist/${listingId}`);

export const migrateWishlistListingIds = async (listingIds: string[]) => {
    const uniqueIds = Array.from(new Set(listingIds)).filter(Boolean);

    await Promise.allSettled(uniqueIds.map((listingId) => addWishlistListing(listingId)));
};
