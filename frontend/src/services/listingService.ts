import { popularDestinations } from "../config/popularDestinations";

export const getPopularDestinations = () => popularDestinations;

export const getListingById = (listingId?: string) =>
    popularDestinations.find((listing) => listing.id === listingId) ?? null;
