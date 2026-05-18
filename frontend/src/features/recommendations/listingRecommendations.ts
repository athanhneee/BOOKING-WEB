import type { PopularDestination } from "../../models/entities/Listing";
import { readRecentlyViewedListings } from "../recentlyViewed/recentlyViewedStorage";
import { readSearchHistoryItems } from "../searchHistory/searchHistoryStorage";
import {
    getGuestCount,
    normalizeSearchText,
    type BookingSearchState,
} from "../../views/components/search/searchState";

export type ListingRecommendation = {
    listing: PopularDestination;
    score: number;
    reason: string;
};

const RECOMMENDATION_LIMIT = 8;

const ignoredAddressTokens = new Set([
    "duong",
    "hem",
    "phuong",
    "quan",
    "thanh",
    "pho",
    "vung",
    "tau",
]);

const getAddressTokens = (address: string) =>
    normalizeSearchText(address)
        .replace(/\d+[a-z]*/g, " ")
        .split(/[\s,./-]+/)
        .map((token) => token.trim())
        .filter((token) => token.length > 2 && !ignoredAddressTokens.has(token));

const countIntersection = (firstValues: string[], secondValues: string[]) => {
    const secondSet = new Set(secondValues);
    return firstValues.reduce((count, value) => count + (secondSet.has(value) ? 1 : 0), 0);
};

const getAddressScore = (currentListing: PopularDestination, candidate: PopularDestination) => {
    const currentTokens = getAddressTokens(currentListing.address);
    const candidateTokens = getAddressTokens(candidate.address);
    const overlap = countIntersection(currentTokens, candidateTokens);

    if (overlap >= 2) {
        return 34;
    }

    if (overlap === 1) {
        return 18;
    }

    return 0;
};

const matchesSearchLocation = (listing: PopularDestination, location: string) => {
    const normalizedLocation = normalizeSearchText(location);
    if (!normalizedLocation) {
        return false;
    }

    return [listing.name, listing.address, listing.category, listing.description]
        .map(normalizeSearchText)
        .some((fieldValue) => fieldValue.includes(normalizedLocation));
};

const getSearchAffinityScore = (candidate: PopularDestination, searches: BookingSearchState[]) =>
    searches.reduce((score, search, index) => {
        const recencyWeight = Math.max(0.45, 1 - index * 0.12);
        const guestCount = getGuestCount(search.guests);
        let nextScore = score;

        if (matchesSearchLocation(candidate, search.location)) {
            nextScore += 24 * recencyWeight;
        }

        if (candidate.guests >= guestCount) {
            nextScore += 7 * recencyWeight;
        }

        if (search.guests.pets > 0 && candidate.amenities.includes("Cho mang thú cưng")) {
            nextScore += 8 * recencyWeight;
        }

        return nextScore;
    }, 0);

const getRecentlyViewedAffinityScore = (candidate: PopularDestination, recentlyViewed: PopularDestination[]) => {
    const recentWithoutCandidate = recentlyViewed.filter((listing) => listing.id !== candidate.id);

    return recentWithoutCandidate.reduce((score, recentListing, index) => {
        const recencyWeight = Math.max(0.5, 1 - index * 0.1);
        const sharedAmenities = countIntersection(candidate.amenities, recentListing.amenities);
        const sharedQuickChoices = countIntersection(candidate.quickChoices, recentListing.quickChoices);
        let nextScore = score;

        if (candidate.category === recentListing.category) {
            nextScore += 8 * recencyWeight;
        }

        nextScore += Math.min(8, sharedAmenities * 2) * recencyWeight;
        nextScore += Math.min(6, sharedQuickChoices * 3) * recencyWeight;

        return nextScore;
    }, 0);
};

const getPriceAffinityScore = (currentListing: PopularDestination, candidate: PopularDestination) => {
    if (currentListing.pricePerNight <= 0) {
        return 0;
    }

    const priceDifferenceRatio = Math.abs(candidate.pricePerNight - currentListing.pricePerNight) / currentListing.pricePerNight;

    if (priceDifferenceRatio <= 0.15) {
        return 12;
    }

    if (priceDifferenceRatio <= 0.3) {
        return 7;
    }

    return 0;
};

const getReason = (
    currentListing: PopularDestination,
    candidate: PopularDestination,
    searches: BookingSearchState[],
    recentlyViewed: PopularDestination[],
) => {
    const addressScore = getAddressScore(currentListing, candidate);

    if (addressScore >= 18) {
        return "Gần khu căn đang xem";
    }

    if (searches.some((search) => matchesSearchLocation(candidate, search.location))) {
        return "Hợp lịch sử tìm kiếm";
    }

    if (recentlyViewed.some((listing) => listing.category === candidate.category || countIntersection(listing.amenities, candidate.amenities) >= 3)) {
        return "Tương tự căn đã xem";
    }

    if (candidate.rating >= 4.8) {
        return "Đánh giá cao gần đây";
    }

    return "Gợi ý từ dữ liệu thật";
};

export const getAiNearbyRecommendations = (
    currentListing: PopularDestination,
    currentSearchState: BookingSearchState,
    candidates: PopularDestination[],
): ListingRecommendation[] => {
    const searchHistory = readSearchHistoryItems().map((item) => item.state);
    const searches = [currentSearchState, ...searchHistory];
    const recentlyViewed = readRecentlyViewedListings();

    return candidates
        .filter((candidate) => candidate.id !== currentListing.id)
        .map((candidate, index) => {
            const score =
                getAddressScore(currentListing, candidate) +
                getSearchAffinityScore(candidate, searches) +
                getRecentlyViewedAffinityScore(candidate, recentlyViewed) +
                getPriceAffinityScore(currentListing, candidate) +
                (candidate.category === currentListing.category ? 14 : 0) +
                countIntersection(candidate.quickChoices, currentListing.quickChoices) * 5 +
                countIntersection(candidate.amenities, currentListing.amenities) * 1.5 +
                candidate.rating * 2 -
                index * 0.05;

            return {
                listing: candidate,
                score,
                reason: getReason(currentListing, candidate, searches, recentlyViewed),
            };
        })
        .sort((first, second) => second.score - first.score)
        .slice(0, RECOMMENDATION_LIMIT);
};