import { ListingDocument, ListingImageRecord, ListingStatus } from "../models/listing";

export const listingApiStatuses = ["draft", "pending_approval", "published", "hidden"] as const;
export type ListingApiStatus = (typeof listingApiStatuses)[number];

const internalToApiStatus: Record<ListingStatus, string> = {
    draft: "draft",
    pending_approval: "pending_approval",
    active: "published",
    inactive: "hidden",
    rejected: "hidden",
    suspended: "hidden",
};

const apiToInternalStatus: Record<ListingApiStatus, ListingStatus> = {
    draft: "draft",
    pending_approval: "pending_approval",
    published: "active",
    hidden: "inactive",
};

export const toApiListingStatus = (status: ListingStatus) => internalToApiStatus[status];

export const toInternalListingStatus = (status: ListingApiStatus) => apiToInternalStatus[status];

export const serializeListingImage = (image: ListingImageRecord) => ({
    imageId: image.imageId,
    url: image.url,
    caption: image.caption ?? null,
    sortOrder: image.sortOrder,
});

export const serializeListingSummary = (listing: ListingDocument) => ({
    listingId: listing.listingId,
    title: listing.title,
    status: toApiListingStatus(listing.status),
    description: listing.description,
    addressLine: listing.addressLine,
    ward: listing.ward,
    district: listing.district,
    city: listing.city,
    propertyType: listing.propertyType,
    roomType: listing.roomType,
    maxGuests: listing.maxGuests,
    bedrooms: listing.bedrooms,
    beds: listing.beds,
    bathrooms: listing.bathrooms,
    basePrice: listing.basePrice,
    currency: listing.currency,
    imageUrl: listing.images[0]?.url ?? null,
});

export const serializeListingDetail = (listing: ListingDocument) => ({
    listingId: listing.listingId,
    status: toApiListingStatus(listing.status),
    hostId: String(listing.hostId),
    title: listing.title,
    description: listing.description,
    addressLine: listing.addressLine,
    ward: listing.ward,
    district: listing.district,
    city: listing.city,
    stateRegion: listing.stateRegion ?? null,
    country: listing.country,
    postalCode: listing.postalCode ?? null,
    latitude: listing.latitude,
    longitude: listing.longitude,
    propertyType: listing.propertyType,
    roomType: listing.roomType,
    maxGuests: listing.maxGuests,
    bedrooms: listing.bedrooms,
    beds: listing.beds,
    bathrooms: listing.bathrooms,
    basePrice: listing.basePrice,
    weekendPrice: listing.weekendPrice ?? null,
    cleaningFee: listing.cleaningFee ?? null,
    serviceFeePct: listing.serviceFeePct ?? null,
    currency: listing.currency,
    minNights: listing.minNights,
    maxNights: listing.maxNights ?? null,
    checkInFrom: listing.checkInFrom,
    checkOutBefore: listing.checkOutBefore,
    cancellationPolicy: listing.cancellationPolicy,
    instantBookEnabled: listing.instantBookEnabled,
    amenityIds: listing.amenityIds,
    images: listing.images.map(serializeListingImage),
    smokingAllowed: listing.smokingAllowed,
    petsAllowed: listing.petsAllowed,
    partyAllowed: listing.partyAllowed,
    quietHours: listing.quietHours ?? null,
    createdAt: listing.createdAt,
    updatedAt: listing.updatedAt,
});

export const getDefaultDailyPrice = (listing: ListingDocument, date: string) => {
    const weekday = new Date(`${date}T00:00:00.000Z`).getUTCDay();
    const isWeekend = weekday === 0 || weekday === 6;

    if (isWeekend && listing.weekendPrice) {
        return listing.weekendPrice;
    }

    return listing.basePrice;
};
