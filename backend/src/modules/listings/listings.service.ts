import { Op } from "sequelize";

import { ApiError } from "../../common/api-error";
import { buildActiveBookingStatusWhere } from "../../common/booking-availability";
import {
    getAvailabilityCalendarForListing,
    getAvailabilityCalendarMap,
    getListingAmenityIdsForListing,
    getListingAmenityIdsMap,
    getListingImagesForListing,
    getListingImagesMap,
    getListingRulesForListing,
} from "../../common/listing-relations";
import { getCoverImage, getDefaultDailyPrice, serializeListingImage } from "../../common/listing-mappers";
import { sanitizeSingleLineText, sanitizeText } from "../../common/sanitization";
import {
    getDistanceMeters,
    isCoordinateInVungTauBounds,
    isAddressInLocationGroup,
    isValidLatitude,
    isValidLocationGroup,
    isValidLongitude,
    type LocationGroupName,
} from "../../common/vung-tau-location-groups";
import Amenity from "../../models/amenity";
import Booking from "../../models/booking";
import Listing, {
    ListingAvailabilityDayRecord,
    ListingDocument,
    PropertyType,
    RoomType,
} from "../../models/listing";
import Review from "../../models/review";
import User from "../../models/user";

export const publicListingSortValues = ["price_asc", "price_desc", "rating_desc", "newest"] as const;
export type PublicListingSort = (typeof publicListingSortValues)[number];
export const publicListingsMaxPageLimit = 50;
const defaultBusinessCity = "Vung Tau";

export type PublicListingsQuery = {
    city?: string;
    district?: string;
    checkIn?: string;
    checkOut?: string;
    guests?: number;
    propertyType?: PropertyType;
    roomType?: RoomType;
    minPrice?: number;
    maxPrice?: number;
    amenities?: string;
    locationGroup?: LocationGroupName;
    lat?: number;
    lng?: number;
    radius?: number;
    sort?: PublicListingSort;
    page?: number;
    limit?: number;
};

export type PublicListingAvailabilityQuery = {
    month?: number;
    year?: number;
};

export type PublicListingReviewsQuery = {
    page?: number;
    limit?: number;
    rating?: number;
};

type ReviewSummary = {
    avgRating: number;
    reviewCount: number;
};

type ReviewSummaryMap = Map<number, ReviewSummary>;

type PublicListingSearchItem = {
    listingId: number;
    title: string;
    description: string;
    basePrice: number;
    ratingAvg: number;
    reviewCount: number;
    isAvailable: boolean;
    addressLine: string;
    ward: string;
    city: string;
    district: string;
    propertyType: PropertyType;
    roomType: RoomType;
    maxGuests: number;
    bedrooms: number;
    beds: number;
    bathrooms: number;
    currency: string;
    imageUrl: string | null;
    coverImage: ReturnType<typeof serializeListingImage> | null;
    images: ReturnType<typeof serializeListingImage>[];
    distanceMeters?: number;
};

const normalizeComparableText = (value: string) =>
    value
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, " ")
        .replace(/\s+/g, " ");

const normalizeAmenityToken = (value: string) =>
    value
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "");

const compareStrings = (left: string, right: string) => normalizeComparableText(left) === normalizeComparableText(right);

const parsePagination = (page?: number, limit?: number) => ({
    page: Math.max(1, page ?? 1),
    limit: Math.min(publicListingsMaxPageLimit, Math.max(1, limit ?? 10)),
});

const defaultMapSearchRadiusMeters = 800;
const maxMapSearchRadiusMeters = 10000;

const buildSearchableListingAddress = (listing: ListingDocument) =>
    [
        listing.addressLine,
        listing.ward,
        listing.district,
        listing.city,
        listing.stateRegion ?? "",
    ]
        .filter(Boolean)
        .join(" ");

const hasValidListingCoordinates = (listing: ListingDocument) =>
    isValidLatitude(Number(listing.latitude)) && isValidLongitude(Number(listing.longitude));

const resolveMapSearchInput = (query: PublicListingsQuery) => {
    if (query.lat === undefined && query.lng === undefined) {
        return null;
    }

    if (query.lat === undefined || query.lng === undefined) {
        return null;
    }

    if (!isValidLatitude(query.lat) || !isValidLongitude(query.lng)) {
        throw new ApiError(422, "Validation error", [
            {
                path: !isValidLatitude(query.lat) ? "lat" : "lng",
                msg: "lat/lng is invalid",
            },
        ]);
    }

    if (!isCoordinateInVungTauBounds(query.lat, query.lng)) {
        throw new ApiError(422, "Validation error", [
            {
                path: "lat",
                msg: "map search location must be inside Vung Tau",
            },
            {
                path: "lng",
                msg: "map search location must be inside Vung Tau",
            },
        ]);
    }

    const radius = Math.min(
        maxMapSearchRadiusMeters,
        Math.max(1, query.radius ?? defaultMapSearchRadiusMeters),
    );

    return {
        lat: query.lat,
        lng: query.lng,
        radius,
    };
};

const getPublicListingOrThrow = async (listingId: number) => {
    const listing = await Listing.findOne({
        listingId,
        status: "active",
        deletedAt: null,
    });

    if (!listing) {
        throw new ApiError(404, "Listing not found");
    }

    return listing;
};

const listInclusiveDates = (checkIn: string, checkOut: string) => {
    const dates: string[] = [];
    const cursor = new Date(`${checkIn}T00:00:00.000Z`);
    const end = new Date(`${checkOut}T00:00:00.000Z`);

    while (cursor < end) {
        dates.push(cursor.toISOString().slice(0, 10));
        cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    return dates;
};

const isDateRangeAvailable = (
    calendarRows: ListingAvailabilityDayRecord[],
    checkIn: string,
    checkOut: string,
) => {
    const availabilityByDate = new Map(calendarRows.map((item) => [item.date, item] as const));

    return listInclusiveDates(checkIn, checkOut).every((date) => {
        const day = availabilityByDate.get(date);

        if (!day) {
            return true;
        }

        return !day.isBlockedByHost && day.isAvailable;
    });
};

const buildAmenityLookup = async () => {
    const amenities = (await Amenity.find({
        active: true,
        isActive: true,
        deletedAt: null,
    }).lean()) as Array<{
        amenityId: number;
        name: string;
        active: boolean;
        isActive: boolean;
    }>;
    const aliasMap = new Map<string, number>();

    for (const amenity of amenities) {
        aliasMap.set(normalizeAmenityToken(amenity.name), amenity.amenityId);
    }

    aliasMap.set("wifi", 1);
    aliasMap.set("pool", 5);
    aliasMap.set("parking", 6);
    aliasMap.set("airconditioning", 2);
    aliasMap.set("washer", 3);
    aliasMap.set("kitchen", 4);
    aliasMap.set("tv", 7);
    aliasMap.set("balcony", 8);
    aliasMap.set("fireplace", 9);
    aliasMap.set("fridge", 10);
    aliasMap.set("refrigerator", 10);
    aliasMap.set("hairdryer", 11);
    aliasMap.set("iron", 12);

    return {
        amenities,
        aliasMap,
    };
};

const resolveAmenityIds = async (amenitiesQuery?: string) => {
    if (!amenitiesQuery) {
        return undefined;
    }

    const requestedTokens = Array.from(
        new Set(
            amenitiesQuery
                .split(",")
                .map((item) => normalizeAmenityToken(item))
                .filter(Boolean),
        ),
    );

    if (requestedTokens.length === 0) {
        return undefined;
    }

    const { aliasMap } = await buildAmenityLookup();
    const amenityIds = requestedTokens.map((token) => aliasMap.get(token) ?? null);

    if (amenityIds.some((amenityId) => amenityId === null)) {
        throw new ApiError(422, "Validation error", [
            {
                path: "amenities",
                msg: "amenities contains an unknown value",
            },
        ]);
    }

    return amenityIds as number[];
};

const getReviewSummaryMap = async (listingIds: number[]): Promise<ReviewSummaryMap> => {
    if (listingIds.length === 0) {
        return new Map();
    }

    const visibleReviews = (await Review.find({
        listingId: { $in: listingIds },
        isVisible: true,
        deletedAt: null,
    }).lean()) as Array<{
        listingId: number;
        rating: number;
    }>;

    const summaryByListing = new Map<number, { ratingSum: number; reviewCount: number }>();

    for (const review of visibleReviews) {
        const current = summaryByListing.get(review.listingId) ?? {
            ratingSum: 0,
            reviewCount: 0,
        };

        current.ratingSum += review.rating;
        current.reviewCount += 1;
        summaryByListing.set(review.listingId, current);
    }

    return new Map(
        Array.from(summaryByListing.entries()).map(([listingId, summary]) => [
            listingId,
            {
                avgRating: Number((summary.ratingSum / summary.reviewCount).toFixed(1)),
                reviewCount: summary.reviewCount,
            },
        ]),
    );
};

const getAmenityDetails = async (amenityIds: number[]) => {
    if (amenityIds.length === 0) {
        return [];
    }

    const amenities = (await Amenity.find({
        amenityId: { $in: amenityIds },
        active: true,
        isActive: true,
        deletedAt: null,
    }).lean()) as Array<{
        amenityId: number;
        name: string;
        icon?: string | null;
        active: boolean;
    }>;
    const amenityById = new Map(amenities.map((amenity) => [amenity.amenityId, amenity]));

    return amenityIds
        .map((amenityId) => amenityById.get(amenityId))
        .filter((amenity): amenity is NonNullable<typeof amenity> => Boolean(amenity))
        .map((amenity) => ({
            amenityId: amenity.amenityId,
            name: amenity.name,
            icon: amenity.icon ?? null,
        }));
};

const getListingReviewSummary = async (listingId: number) => {
    const summaryMap = await getReviewSummaryMap([listingId]);

    return (
        summaryMap.get(listingId) ?? {
            avgRating: 0,
            reviewCount: 0,
        }
    );
};

const getBookedListingIdsForRange = async (listingIds: number[], checkIn?: string, checkOut?: string) => {
    if (!checkIn || !checkOut || listingIds.length === 0) {
        return new Set<number>();
    }

    const bookings = await Booking.findAll({
        where: {
            listingId: {
                [Op.in]: listingIds,
            },
            ...buildActiveBookingStatusWhere(),
            checkInDate: {
                [Op.lt]: checkOut,
            },
            checkOutDate: {
                [Op.gt]: checkIn,
            },
        },
        attributes: ["listingId"],
    });

    return new Set(bookings.map((booking) => booking.listingId));
};

const getBookedDatesForMonth = async (listingId: number, month: number, year: number) => {
    const start = `${year}-${String(month).padStart(2, "0")}-01`;
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    const end = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;

    const bookings = await Booking.findAll({
        where: {
            listingId,
            ...buildActiveBookingStatusWhere(),
            checkInDate: {
                [Op.lt]: end,
            },
            checkOutDate: {
                [Op.gt]: start,
            },
        },
    });

    const bookedDates = new Set<string>();

    for (const booking of bookings) {
        for (const date of listInclusiveDates(
            booking.checkInDate > start ? booking.checkInDate : start,
            booking.checkOutDate < end ? booking.checkOutDate : end,
        )) {
            bookedDates.add(date);
        }
    }

    return bookedDates;
};

export const getPublicListings = async (query: PublicListingsQuery) => {
    const { page, limit } = parsePagination(query.page, query.limit);
    const mapSearch = resolveMapSearchInput(query);
    const distanceByListingId = new Map<number, number>();

    if ((query.checkIn && !query.checkOut) || (!query.checkIn && query.checkOut)) {
        throw new ApiError(422, "Validation error", [
            {
                path: !query.checkIn ? "checkIn" : "checkOut",
                msg: "checkIn and checkOut must be provided together",
            },
        ]);
    }

    if (query.checkIn && query.checkOut) {
        const checkInDate = new Date(`${query.checkIn}T00:00:00.000Z`);
        const checkOutDate = new Date(`${query.checkOut}T00:00:00.000Z`);

        if (checkOutDate <= checkInDate) {
            throw new ApiError(400, "checkOut must be after checkIn");
        }
    }

    if (query.minPrice !== undefined && query.maxPrice !== undefined && query.minPrice > query.maxPrice) {
        throw new ApiError(422, "Validation error", [
            {
                path: "maxPrice",
                msg: "maxPrice must be greater than or equal to minPrice",
            },
        ]);
    }

    if (query.locationGroup && !isValidLocationGroup(query.locationGroup)) {
        throw new ApiError(422, "Validation error", [
            {
                path: "locationGroup",
                msg: "locationGroup is invalid",
            },
        ]);
    }

    const publicFilter: {
        status: "active";
        deletedAt: null;
        propertyType?: PropertyType;
        roomType?: RoomType;
        maxGuests?: { $gte: number };
        basePrice?: { $gte?: number; $lte?: number };
    } = {
        status: "active",
        deletedAt: null,
    };

    if (query.propertyType) publicFilter.propertyType = query.propertyType;
    if (query.roomType) publicFilter.roomType = query.roomType;
    if (query.guests !== undefined) publicFilter.maxGuests = { $gte: query.guests };

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
        publicFilter.basePrice = {};
        if (query.minPrice !== undefined) publicFilter.basePrice.$gte = query.minPrice;
        if (query.maxPrice !== undefined) publicFilter.basePrice.$lte = query.maxPrice;
    }

    const amenityIds = await resolveAmenityIds(query.amenities);
    const listings = await Listing.find(publicFilter);
    const listingIds = listings.map((listing) => listing.listingId);
    const [reviewSummaryMap, amenityIdsMap, imageMap, availabilityMap, bookedListingIds] = await Promise.all([
        getReviewSummaryMap(listingIds),
        getListingAmenityIdsMap(listings),
        getListingImagesMap(listings),
        getAvailabilityCalendarMap(listings),
        getBookedListingIdsForRange(listingIds, query.checkIn, query.checkOut),
    ]);

    const filteredListings = listings.filter((listing) => {
        if (query.city && !compareStrings(listing.city, query.city)) {
            return false;
        }

        if (query.district && !compareStrings(listing.district, query.district)) {
            return false;
        }

        if (
            query.locationGroup &&
            !isAddressInLocationGroup(buildSearchableListingAddress(listing), query.locationGroup)
        ) {
            return false;
        }

        if (mapSearch) {
            if (!hasValidListingCoordinates(listing)) {
                return false;
            }

            const distanceMeters = getDistanceMeters(
                mapSearch.lat,
                mapSearch.lng,
                Number(listing.latitude),
                Number(listing.longitude),
            );

            if (distanceMeters > mapSearch.radius) {
                return false;
            }

            distanceByListingId.set(listing.listingId, Math.round(distanceMeters));
        }

        const listingAmenityIds = amenityIdsMap.get(listing.listingId) ?? [];

        if (amenityIds && !amenityIds.every((amenityId) => listingAmenityIds.includes(amenityId))) {
            return false;
        }

        if (query.checkIn && query.checkOut) {
            if (bookedListingIds.has(listing.listingId)) {
                return false;
            }

            if (!isDateRangeAvailable(availabilityMap.get(listing.listingId) ?? [], query.checkIn, query.checkOut)) {
                return false;
            }
        }

        return true;
    });

    const items = filteredListings.map<PublicListingSearchItem>((listing) => {
        const summary = reviewSummaryMap.get(listing.listingId) ?? {
            avgRating: 0,
            reviewCount: 0,
        };
        const images = imageMap.get(listing.listingId) ?? [];
        const coverImage = getCoverImage(images);

        return {
            listingId: listing.listingId,
            title: listing.title,
            description: listing.description,
            basePrice: listing.basePrice,
            ratingAvg: summary.avgRating,
            reviewCount: summary.reviewCount,
            isAvailable: true,
            addressLine: listing.addressLine,
            ward: listing.ward,
            city: listing.city,
            district: listing.district,
            propertyType: listing.propertyType,
            roomType: listing.roomType,
            maxGuests: listing.maxGuests,
            bedrooms: listing.bedrooms,
            beds: listing.beds,
            bathrooms: listing.bathrooms,
            currency: listing.currency,
            imageUrl: coverImage?.url ?? null,
            coverImage: coverImage ? serializeListingImage(coverImage) : null,
            images: images.map(serializeListingImage),
            ...(distanceByListingId.has(listing.listingId)
                ? { distanceMeters: distanceByListingId.get(listing.listingId) }
                : {}),
        };
    });

    const sortKey = query.sort ?? "newest";

    items.sort((left, right) => {
        if (mapSearch && query.sort === undefined) {
            return (left.distanceMeters ?? Number.MAX_SAFE_INTEGER) -
                (right.distanceMeters ?? Number.MAX_SAFE_INTEGER) ||
                right.listingId - left.listingId;
        }

        const businessCityPriority =
            Number(compareStrings(right.city, defaultBusinessCity)) -
            Number(compareStrings(left.city, defaultBusinessCity));

        if (!query.city && sortKey === "newest" && businessCityPriority !== 0) {
            return businessCityPriority;
        }

        if (sortKey === "price_asc") {
            return left.basePrice - right.basePrice || right.listingId - left.listingId;
        }

        if (sortKey === "price_desc") {
            return right.basePrice - left.basePrice || right.listingId - left.listingId;
        }

        if (sortKey === "rating_desc") {
            return right.ratingAvg - left.ratingAvg || right.listingId - left.listingId;
        }

        return right.listingId - left.listingId;
    });

    const totalItems = items.length;
    const paginatedItems = items.slice((page - 1) * limit, page * limit);

    return {
        items: paginatedItems,
        pagination: {
            page,
            limit,
            totalItems,
            totalPages: Math.max(1, Math.ceil(totalItems / limit)),
        },
    };
};

export const getPublicListingDetail = async (listingId: number) => {
    const listing = await getPublicListingOrThrow(listingId);
    const [amenityIds, images, rules, reviewSummary, host] = await Promise.all([
        getListingAmenityIdsForListing(listing),
        getListingImagesForListing(listing),
        getListingRulesForListing(listing),
        getListingReviewSummary(listing.listingId),
        User.findById(listing.hostId),
    ]);
    const amenities = await getAmenityDetails(amenityIds);

    return {
        listingId: listing.listingId,
        title: listing.title,
        description: listing.description,
        basePrice: listing.basePrice,
        weekendPrice: listing.weekendPrice ?? null,
        cleaningFee: listing.cleaningFee ?? null,
        serviceFeePct: listing.serviceFeePct ?? null,
        currency: listing.currency,
        maxGuests: listing.maxGuests,
        bedrooms: listing.bedrooms,
        beds: listing.beds,
        bathrooms: listing.bathrooms,
        propertyType: listing.propertyType,
        roomType: listing.roomType,
        minNights: listing.minNights,
        maxNights: listing.maxNights ?? null,
        checkInFrom: rules.checkInFrom,
        checkOutBefore: rules.checkOutBefore,
        cancellationPolicy: listing.cancellationPolicy,
        instantBookEnabled: listing.instantBookEnabled,
        addressSummary: {
            addressLine: listing.addressLine,
            ward: listing.ward,
            district: listing.district,
            city: listing.city,
            stateRegion: listing.stateRegion ?? null,
            country: listing.country,
            postalCode: listing.postalCode ?? null,
        },
        amenities,
        images: images.map(serializeListingImage),
        ratingSummary: reviewSummary,
        host: host
            ? {
                  userId: Number(host.id),
                  name: `${host.firstName} ${host.lastName}`.trim(),
                  avatarUrl: host.avatarUrl ?? null,
              }
            : null,
    };
};

export const getPublicListingAvailability = async (listingId: number, query: PublicListingAvailabilityQuery) => {
    const listing = await getPublicListingOrThrow(listingId);
    const now = new Date();
    const month = query.month ?? now.getUTCMonth() + 1;
    const year = query.year ?? now.getUTCFullYear();
    const totalDays = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const [calendarRows, bookedDates] = await Promise.all([
        getAvailabilityCalendarForListing(listing),
        getBookedDatesForMonth(listing.listingId, month, year),
    ]);
    const availabilityMap = new Map(calendarRows.map((item) => [item.date, item] as const));

    const days = Array.from({ length: totalDays }, (_, index) => {
        const date = `${year}-${String(month).padStart(2, "0")}-${String(index + 1).padStart(2, "0")}`;
        const existing = availabilityMap.get(date);

        return {
            date,
            isAvailable: bookedDates.has(date) ? false : existing ? !existing.isBlockedByHost && existing.isAvailable : true,
            price: existing?.priceOverride ?? getDefaultDailyPrice(listing, date),
            minNights: existing?.minNightsOverride ?? listing.minNights,
        };
    });

    return {
        listingId: listing.listingId,
        month,
        year,
        days,
    };
};

export const getPublicListingReviews = async (listingId: number, query: PublicListingReviewsQuery) => {
    await getPublicListingOrThrow(listingId);

    const { page, limit } = parsePagination(query.page, query.limit);
    const overallReviews = (await Review.find({
        listingId,
        isVisible: true,
        deletedAt: null,
    })
        .sort({ createdAt: -1, reviewId: -1 })
        .lean()) as Array<{
        reviewId: number;
        rating: number;
        comment: string;
        reviewerName: string;
        hostReply: string | null;
        createdAt: Date;
    }>;

    const summary =
        overallReviews.length > 0
            ? {
                  avgRating: Number(
                      (
                          overallReviews.reduce((total, review) => total + review.rating, 0) / overallReviews.length
                      ).toFixed(1),
                  ),
                  reviewCount: overallReviews.length,
              }
            : {
                  avgRating: 0,
                  reviewCount: 0,
              };

    const filteredReviews =
        query.rating !== undefined ? overallReviews.filter((review) => review.rating === query.rating) : overallReviews;
    const paginatedReviews = filteredReviews.slice((page - 1) * limit, page * limit);

    return {
        items: paginatedReviews.map((review) => ({
            reviewId: review.reviewId,
            rating: review.rating,
            comment: sanitizeText(review.comment),
            reviewerName: sanitizeSingleLineText(review.reviewerName),
            hostReply: review.hostReply ? sanitizeText(review.hostReply) : null,
            createdAt: review.createdAt,
        })),
        summary,
        pagination: {
            page,
            limit,
            totalItems: filteredReviews.length,
            totalPages: Math.max(1, Math.ceil(filteredReviews.length / limit)),
        },
    };
};

export const getPublicListingRules = async (listingId: number) => {
    const listing = await getPublicListingOrThrow(listingId);
    const rules = await getListingRulesForListing(listing);

    return {
        checkInFrom: rules.checkInFrom,
        checkOutBefore: rules.checkOutBefore,
        smokingAllowed: rules.smokingAllowed,
        petsAllowed: rules.petsAllowed,
        partyAllowed: rules.partyAllowed,
        quietHours: rules.quietHours ?? null,
    };
};
