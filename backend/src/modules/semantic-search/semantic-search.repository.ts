import { Op } from "sequelize";

import { buildActiveBookingStatusWhere } from "../../common/booking-availability";
import {
    getAvailabilityCalendarMap,
    getListingAmenityIdsMap,
    getListingImagesMap,
} from "../../common/listing-relations";
import Amenity from "../../models/amenity";
import Booking from "../../models/booking";
import Listing, {
    ListingAvailabilityDayRecord,
    ListingDocument,
} from "../../models/listing";
import Review from "../../models/review";
import {
    ListingVectorPayload,
    SemanticSearchFilters,
    SemanticSearchItem,
    semanticPublicListingStatuses,
} from "./semantic-search.types";
import {
    buildLocationKeys,
    getVungTauAreaDisplayNames,
    inferVungTauAreaKeys,
    isVungTauRelatedText,
    listNights,
    normalizeKey,
    normalizeVietnameseText,
    toNumber,
    uniqueNumbers,
    uniqueStrings,
} from "./semantic-search.utils";

type ReviewSummary = {
    ratingAvg: number;
    reviewCount: number;
    reviewSnippets: string[];
};

export type ListingIndexRecord = {
    listing: ListingDocument;
    amenityIds: number[];
    amenityNames: string[];
    reviewSummary: ReviewSummary;
};

const defaultAmenityAliases: Record<string, number> = {
    wifi: 1,
    internet: 1,

    air_conditioning: 2,
    airconditioner: 2,
    airconditioning: 2,
    dieuhoa: 2,
    maylanh: 2,

    washer: 3,
    maygiat: 3,

    kitchen: 4,
    bep: 4,

    pool: 5,
    hoboi: 5,
    beboi: 5,

    parking: 6,
    baixe: 6,
    dauxe: 6,

    tv: 7,
    tivi: 7,

    balcony: 8,
    bancong: 8,

    refrigerator: 10,
    fridge: 10,
    tulanh: 10,

    hairdryer: 11,
    maysaytoc: 11,

    iron: 12,
    banui: 12,
};

export const getAmenityLookup = async () => {
    const amenities = await Amenity.findAll({
        where: {
            active: true,
            isActive: true,
            deletedAt: null,
        },
        attributes: ["amenityId", "name"],
    });

    const rows = amenities.map((amenity) => ({
        amenityId: amenity.amenityId,
        name: amenity.name,
    }));

    const byId = new Map(rows.map((amenity) => [amenity.amenityId, amenity]));

    const byNormalizedName = new Map<string, number>();

    for (const amenity of rows) {
        const key = normalizeVietnameseText(amenity.name).replace(/\s+/g, "");
        byNormalizedName.set(key, amenity.amenityId);
    }

    const bySemanticCode = new Map<string, number>();

    for (const [code, fallbackId] of Object.entries(defaultAmenityAliases)) {
        const existingByName = byNormalizedName.get(code);
        const existingByFallbackId = byId.get(fallbackId);

        if (existingByName) {
            bySemanticCode.set(code, existingByName);
        } else if (existingByFallbackId) {
            bySemanticCode.set(code, existingByFallbackId.amenityId);
        }
    }

    for (const amenity of rows) {
        const normalized = normalizeVietnameseText(amenity.name).replace(/\s+/g, "");
        bySemanticCode.set(normalized, amenity.amenityId);
    }

    return {
        rows,
        byId,
        byNormalizedName,
        bySemanticCode,
    };
};

export const resolveAmenityIds = async (values: Array<string | number>) => {
    if (values.length === 0) return [];

    const { bySemanticCode, byNormalizedName, byId } = await getAmenityLookup();
    const resolvedIds: number[] = [];

    for (const value of values) {
        if (typeof value === "number" || /^\d+$/.test(String(value))) {
            const id = Number(value);

            if (byId.has(id)) {
                resolvedIds.push(id);
            }

            continue;
        }

        const key = normalizeVietnameseText(String(value)).replace(/\s+/g, "");

        const amenityId =
            bySemanticCode.get(key) ??
            byNormalizedName.get(key);

        if (amenityId) {
            resolvedIds.push(amenityId);
        }
    }

    return uniqueNumbers(resolvedIds);
};

const getReviewSummaryMap = async (listingIds: number[]) => {
    if (listingIds.length === 0) {
        return new Map<number, ReviewSummary>();
    }

    const reviews = await Review.findAll({
        where: {
            listingId: { [Op.in]: listingIds },
            isVisible: true,
            deletedAt: null,
        },
        attributes: ["listingId", "rating", "comment", "createdAt"],
        order: [["createdAt", "DESC"]],
    });

    const summaryMap = new Map<
        number,
        {
            ratingSum: number;
            reviewCount: number;
            reviewSnippets: string[];
        }
    >();

    for (const review of reviews) {
        const current = summaryMap.get(review.listingId) ?? {
            ratingSum: 0,
            reviewCount: 0,
            reviewSnippets: [],
        };

        current.ratingSum += review.rating;
        current.reviewCount += 1;

        if (review.comment && current.reviewSnippets.length < 3) {
            current.reviewSnippets.push(review.comment.slice(0, 180));
        }

        summaryMap.set(review.listingId, current);
    }

    return new Map(
        Array.from(summaryMap.entries()).map(([listingId, summary]) => [
            listingId,
            {
                ratingAvg: Number((summary.ratingSum / summary.reviewCount).toFixed(1)),
                reviewCount: summary.reviewCount,
                reviewSnippets: summary.reviewSnippets,
            },
        ]),
    );
};

const isCalendarAvailable = (
    calendarRows: ListingAvailabilityDayRecord[],
    checkIn?: string,
    checkOut?: string,
) => {
    if (!checkIn || !checkOut) return true;

    const calendarByDate = new Map(calendarRows.map((row) => [row.date, row] as const));

    return listNights(checkIn, checkOut).every((date) => {
        const day = calendarByDate.get(date);
        return !day || (day.isAvailable && !day.isBlockedByHost);
    });
};

const getBookedListingIds = async (listingIds: number[], checkIn?: string, checkOut?: string) => {
    if (!checkIn || !checkOut || listingIds.length === 0) {
        return new Set<number>();
    }

    const bookings = await Booking.findAll({
        where: {
            listingId: { [Op.in]: listingIds },
            ...buildActiveBookingStatusWhere(),
            checkInDate: { [Op.lt]: checkOut },
            checkOutDate: { [Op.gt]: checkIn },
        },
        attributes: ["listingId"],
    });

    return new Set(bookings.map((booking) => booking.listingId));
};

const getListingLocationText = (listing: ListingDocument) =>
    [
        listing.title,
        listing.description,
        listing.addressLine,
        listing.ward,
        listing.district,
        listing.city,
        listing.stateRegion ?? "",
    ].join(" ");

const isListingAllowedForVungTauSearch = (listing: ListingDocument, forceVungTauOnly: boolean) => {
    if (!forceVungTauOnly) return true;
    return isVungTauRelatedText(getListingLocationText(listing));
};

export const getActiveListingIndexRecords = async (
    forceVungTauOnly = true,
): Promise<ListingIndexRecord[]> => {
    const listings = await Listing.findAll({
        where: {
            status: { [Op.in]: semanticPublicListingStatuses },
            deletedAt: null,
        },
        order: [["listingId", "ASC"]],
    });

    const filteredListings = listings.filter((listing) =>
        isListingAllowedForVungTauSearch(listing, forceVungTauOnly),
    );

    const listingIds = filteredListings.map((listing) => listing.listingId);

    const [amenityIdsMap, reviewSummaryMap, amenityLookup] = await Promise.all([
        getListingAmenityIdsMap(filteredListings),
        getReviewSummaryMap(listingIds),
        getAmenityLookup(),
    ]);

    return filteredListings.map((listing) => {
        const amenityIds = amenityIdsMap.get(listing.listingId) ?? [];

        return {
            listing,
            amenityIds,
            amenityNames: amenityIds
                .map((amenityId) => amenityLookup.byId.get(amenityId)?.name)
                .filter((name): name is string => Boolean(name)),
            reviewSummary: reviewSummaryMap.get(listing.listingId) ?? {
                ratingAvg: 0,
                reviewCount: 0,
                reviewSnippets: [],
            },
        };
    });
};

export const buildListingSearchDocument = (record: ListingIndexRecord) => {
    const { listing, amenityNames, reviewSummary } = record;
    const locationText = getListingLocationText(listing);
    const vungTauAreaKeys = inferVungTauAreaKeys(locationText);
    const vungTauAreaNames = getVungTauAreaDisplayNames(vungTauAreaKeys);

    const stayPurposeHints = [
        listing.maxGuests >= 4 ? "phù hợp gia đình hoặc nhóm bạn" : "",
        listing.maxGuests === 2 ? "phù hợp cặp đôi hoặc hai người" : "",
        listing.roomType === "entire_place" ? "nguyên căn, riêng tư" : "",
        listing.propertyType === "villa" ? "villa nghỉ dưỡng" : "",
        listing.propertyType === "hotel" ? "khách sạn lưu trú ngắn ngày" : "",
        listing.propertyType === "apartment" ? "căn hộ tiện nghi" : "",
        vungTauAreaNames.length > 0 ? `khu vực Vũng Tàu: ${vungTauAreaNames.join(", ")}` : "",
    ].filter(Boolean);

    return [
        `Tên nơi ở: ${listing.title}.`,
        `Mô tả: ${listing.description}.`,
        `Địa chỉ: ${listing.addressLine}, ${listing.ward}, ${listing.district}, ${listing.city}.`,
        `Tỉnh/thành hoặc vùng: ${listing.stateRegion ?? listing.city}.`,
        `Khu vực du lịch Vũng Tàu: ${vungTauAreaNames.join(", ") || "không xác định cụ thể"}.`,
        `Loại chỗ ở: ${listing.propertyType}. Loại phòng: ${listing.roomType}.`,
        `Sức chứa: tối đa ${listing.maxGuests} khách, ${listing.bedrooms} phòng ngủ, ${listing.beds} giường, ${listing.bathrooms} phòng tắm.`,
        `Tiện nghi: ${amenityNames.join(", ") || "không có dữ liệu"}.`,
        `Giá cơ bản mỗi đêm: ${toNumber(listing.basePrice)} ${listing.currency}.`,
        `Giá cuối tuần: ${listing.weekendPrice ? toNumber(listing.weekendPrice) : "không có"}.`,
        `Phù hợp: ${stayPurposeHints.join(", ") || "lưu trú du lịch Vũng Tàu"}.`,
        `Quy định: hút thuốc ${listing.smokingAllowed ? "được phép" : "không được phép"}, thú cưng ${listing.petsAllowed ? "được phép" : "không được phép"}, tiệc tùng ${listing.partyAllowed ? "được phép" : "không được phép"}.`,
        `Check-in từ ${listing.checkInFrom}, check-out trước ${listing.checkOutBefore}.`,
        `Đánh giá trung bình: ${reviewSummary.ratingAvg}/5 từ ${reviewSummary.reviewCount} đánh giá.`,
        `Nhận xét nổi bật: ${reviewSummary.reviewSnippets.join(" | ") || "chưa có nhận xét"}.`,
        `Ngữ cảnh tìm kiếm: du lịch biển Vũng Tàu, nghỉ dưỡng cuối tuần, gần biển, căn hộ, khách sạn, villa, homestay.`,
    ]
        .join("\n")
        .replace(/\s+/g, " ")
        .trim();
};

export const buildListingVectorPayload = (record: ListingIndexRecord): ListingVectorPayload => {
    const { listing, amenityIds, amenityNames } = record;
    const locationText = getListingLocationText(listing);
    const vungTauAreaKeys = inferVungTauAreaKeys(locationText);
    const vungTauAreaNames = getVungTauAreaDisplayNames(vungTauAreaKeys);

    return {
        listing_id: listing.listingId,
        title: listing.title,

        city: listing.city,
        city_key: normalizeKey(listing.city),
        district: listing.district,
        district_key: normalizeKey(listing.district),
        ward: listing.ward,
        ward_key: normalizeKey(listing.ward),

        location_keys: buildLocationKeys({
            city: listing.city,
            district: listing.district,
            ward: listing.ward,
            addressLine: listing.addressLine,
            title: listing.title,
            description: listing.description,
        }),
        vung_tau_area_keys: vungTauAreaKeys,
        vung_tau_area_names: vungTauAreaNames,

        base_price: toNumber(listing.basePrice),
        max_guests: listing.maxGuests,

        amenity_ids: amenityIds,
        amenity_names: amenityNames,

        property_type: listing.propertyType,
        room_type: listing.roomType,

        status: listing.status as ListingVectorPayload["status"],
    };
};

export const findAvailableListingItems = async (
    listingIds: number[],
    filters: SemanticSearchFilters,
    semanticScoreMap: Map<number, number>,
): Promise<SemanticSearchItem[]> => {
    if (listingIds.length === 0) return [];

    const where: Record<string, unknown> = {
        listingId: { [Op.in]: listingIds },
        status: { [Op.in]: semanticPublicListingStatuses },
        deletedAt: null,
        maxGuests: { [Op.gte]: filters.guests },
    };

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
        where.basePrice = {
            ...(filters.minPrice !== undefined ? { [Op.gte]: filters.minPrice } : {}),
            ...(filters.maxPrice !== undefined ? { [Op.lte]: filters.maxPrice } : {}),
        };
    }

    if (filters.propertyType) {
        where.propertyType = filters.propertyType;
    }

    if (filters.roomType) {
        where.roomType = filters.roomType;
    }

    const listings = await Listing.findAll({ where });

    const [amenityIdsMap, imageMap, availabilityMap, reviewSummaryMap, bookedListingIds] =
        await Promise.all([
            getListingAmenityIdsMap(listings),
            getListingImagesMap(listings),
            getAvailabilityCalendarMap(listings),
            getReviewSummaryMap(listings.map((listing) => listing.listingId)),
            getBookedListingIds(
                listings.map((listing) => listing.listingId),
                filters.checkIn,
                filters.checkOut,
            ),
        ]);

    return listings
        .filter((listing) => {
            if (!isListingAllowedForVungTauSearch(listing, filters.forceVungTauOnly)) {
                return false;
            }

            if (filters.districtKey && normalizeKey(listing.district) !== filters.districtKey) {
                return false;
            }

            const locationText = getListingLocationText(listing);
            const listingAreaKeys = inferVungTauAreaKeys(locationText);

            if (
                filters.vungTauAreaKeys.length > 0 &&
                !filters.vungTauAreaKeys.some((areaKey) => listingAreaKeys.includes(areaKey))
            ) {
                return false;
            }

            const listingAmenityIds = amenityIdsMap.get(listing.listingId) ?? [];

            if (
                filters.amenityIds.length > 0 &&
                !filters.amenityIds.every((id) => listingAmenityIds.includes(id))
            ) {
                return false;
            }

            if (bookedListingIds.has(listing.listingId)) {
                return false;
            }

            if (
                !isCalendarAvailable(
                    availabilityMap.get(listing.listingId) ?? [],
                    filters.checkIn,
                    filters.checkOut,
                )
            ) {
                return false;
            }

            return true;
        })
        .map((listing) => {
            const images = imageMap.get(listing.listingId) ?? [];
            const reviewSummary = reviewSummaryMap.get(listing.listingId) ?? {
                ratingAvg: 0,
                reviewCount: 0,
                reviewSnippets: [],
            };

            const locationText = getListingLocationText(listing);
            const vungTauAreaKeys = inferVungTauAreaKeys(locationText);
            const semanticScore = semanticScoreMap.get(listing.listingId) ?? 0;

            return {
                listingId: listing.listingId,
                title: listing.title,
                description: listing.description,

                basePrice: toNumber(listing.basePrice),
                weekendPrice: listing.weekendPrice === null ? null : toNumber(listing.weekendPrice),
                currency: listing.currency,

                ratingAvg: reviewSummary.ratingAvg,
                reviewCount: reviewSummary.reviewCount,

                isAvailable: true,

                addressLine: listing.addressLine,
                ward: listing.ward,
                district: listing.district,
                city: listing.city,

                vungTauAreas: getVungTauAreaDisplayNames(vungTauAreaKeys),
                vungTauAreaKeys,

                propertyType: listing.propertyType,
                roomType: listing.roomType,

                maxGuests: listing.maxGuests,
                bedrooms: listing.bedrooms,
                beds: listing.beds,
                bathrooms: toNumber(listing.bathrooms),

                imageUrl: images[0]?.url ?? null,

                semanticScore,
                finalScore: 0,
                matchedReasons: [],
            };
        });
};

export const keywordSearchFallback = async (
    filters: SemanticSearchFilters,
): Promise<SemanticSearchItem[]> => {
    const keyword = `%${filters.query.trim()}%`;

    const where: Record<string, unknown> = {
        status: { [Op.in]: semanticPublicListingStatuses },
        deletedAt: null,
        maxGuests: { [Op.gte]: filters.guests },
        ...(filters.vungTauAreaKeys.length === 0
            ? {
                  [Op.or]: [
            { title: { [Op.like]: keyword } },
            { description: { [Op.like]: keyword } },
            { city: { [Op.like]: keyword } },
            { district: { [Op.like]: keyword } },
            { ward: { [Op.like]: keyword } },
            { addressLine: { [Op.like]: keyword } },
                  ],
              }
            : {}),
    };

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
        where.basePrice = {
            ...(filters.minPrice !== undefined ? { [Op.gte]: filters.minPrice } : {}),
            ...(filters.maxPrice !== undefined ? { [Op.lte]: filters.maxPrice } : {}),
        };
    }

    if (filters.propertyType) {
        where.propertyType = filters.propertyType;
    }

    if (filters.roomType) {
        where.roomType = filters.roomType;
    }

    const listings = await Listing.findAll({
        where,
        limit: 300,
        order: [["listingId", "DESC"]],
    });

    const filteredListingIds = listings
        .filter((listing) => isListingAllowedForVungTauSearch(listing, filters.forceVungTauOnly))
        .filter((listing) => {
            if (filters.vungTauAreaKeys.length === 0) return true;

            const listingAreaKeys = inferVungTauAreaKeys(getListingLocationText(listing));
            return filters.vungTauAreaKeys.some((areaKey) => listingAreaKeys.includes(areaKey));
        })
        .map((listing) => listing.listingId);

    return findAvailableListingItems(
        uniqueNumbers(filteredListingIds),
        filters,
        new Map(filteredListingIds.map((id) => [id, 0.35])),
    );
};
