export type StayCategory = "Villa" | "Căn hộ" | "Homestay" | "Nhà nguyên căn" | "Khách sạn";
export type StayBadge = "Yêu thích" | "Nổi bật" | "Mới" | "Được đặt nhiều";

export type StayAmenity =
    | "Hồ bơi"
    | "Wifi"
    | "Bếp"
    | "Điều hòa"
    | "Máy giặt"
    | "Chỗ đậu xe"
    | "Cho mang thú cưng"
    | "Gần biển"
    | "Có BBQ"
    | "Ban công"
    | "View đẹp"
    | "Tự check-in"
    | string;

export type StayHighlight =
    | "Chủ nhà siêu cấp"
    | "Được yêu thích"
    | "Mới đăng"
    | "Giảm giá"
    | "Đặt nhiều"
    | "Miễn phí hủy";

export type StayPolicy =
    | "Thanh toán linh hoạt"
    | "Miễn phí hủy"
    | "Xác nhận nhanh"
    | "Nhận phòng trong ngày";

export type StayQuickChoice = "Gần trung tâm" | "Phù hợp gia đình" | "Phù hợp nhóm đông";

export type PopularDestination = {
    id: string;
    name: string;
    address: string;
    rating: number;
    pricePerNight: number;
    imageUrl: string;
    description: string;
    category: StayCategory;
    guests: number;
    bedrooms: number;
    beds: number;
    bathrooms: number;
    badge?: StayBadge;
    amenities: StayAmenity[];
    highlights: StayHighlight[];
    policies: StayPolicy[];
    quickChoices: StayQuickChoice[];
};

export type ApiPropertyType = "apartment" | "villa" | "hotel" | "homestay";
export type ApiRoomType = "entire_place" | "private_room" | "shared_room";

export type ApiListingSummary = {
    listingId: number;
    title: string;
    description: string;
    basePrice: number;
    ratingAvg: number;
    reviewCount: number;
    isAvailable: boolean;
    addressLine: string;
    ward: string;
    district: string;
    city: string;
    propertyType: ApiPropertyType;
    roomType: ApiRoomType;
    maxGuests: number;
    bedrooms: number;
    beds: number;
    bathrooms: number;
    currency: string;
    imageUrl: string | null;
    image_url?: string | null;
    coverImageUrl?: string | null;
    coverImage?: ApiListingImage | null;
    images?: ApiListingImage[];
};

export type ApiListingImage = {
    imageId: number;
    id?: number;
    listingImageId?: number;
    url: string;
    imageUrl?: string | null;
    image_url?: string | null;
    secureUrl?: string | null;
    publicUrl?: string | null;
    key?: string | null;
    objectKey?: string | null;
    caption: string | null;

    displayTitle?: string | null;
    display_title?: string | null;

    altText?: string | null;
    alt_text?: string | null;

    aiDisplayTitle?: string | null;

    aiImageType?: string | null;
    ai_image_type?: string | null;

    aiSceneTags?: string[];
    ai_scene_tags?: string[];

    aiAmenityTags?: string[];
    ai_amenity_tags?: string[];

    aiDescription?: string | null;
    ai_description?: string | null;

    aiConfidence?: number | null;
    ai_confidence?: number | null;

    aiQualityWarnings?: string[];
    ai_quality_warnings?: string[];

    aiAnalysisStatus?: "pending" | "analyzed" | "failed";
    ai_analysis_status?: "pending" | "analyzed" | "failed";

    aiErrorMessage?: string | null;
    ai_error_message?: string | null;

    aiAnalyzedAt?: string | null;
    ai_analyzed_at?: string | null;

    sortOrder: number;
    sort_order?: number;
    isCover?: boolean;
    is_cover?: boolean;
};

export type ApiListingDetail = {
    listingId: number;
    title: string;
    description: string;
    basePrice: number;
    weekendPrice: number | null;
    cleaningFee: number | null;
    serviceFeePct: number | null;
    currency: string;
    maxGuests: number;
    bedrooms: number;
    beds: number;
    bathrooms: number;
    propertyType: ApiPropertyType;
    roomType: ApiRoomType;
    minNights: number;
    maxNights: number | null;
    checkInFrom: string;
    checkOutBefore: string;
    cancellationPolicy: "flexible" | "moderate" | "strict";
    instantBookEnabled: boolean;
    addressSummary: {
        addressLine: string;
        ward: string;
        district: string;
        city: string;
        stateRegion: string | null;
        country: string;
        postalCode: string | null;
    };
    amenities: Array<{ amenityId: number; name: string; icon?: string | null }>;
    images: ApiListingImage[];
    ratingSummary: { avgRating: number; reviewCount: number };
    host: { userId: number; name: string; avatarUrl?: string | null } | null;
};

export type PaginatedListings = {
    items: ApiListingSummary[];
    pagination: {
        page: number;
        limit: number;
        totalItems: number;
        totalPages: number;
    };
};

const propertyTypeToCategory = (propertyType: ApiPropertyType): StayCategory => {
    if (propertyType === "villa") return "Villa";
    if (propertyType === "apartment") return "Căn hộ";
    if (propertyType === "hotel") return "Khách sạn";
    return "Homestay";
};

const buildAddress = (item: Pick<ApiListingSummary, "addressLine" | "ward" | "district" | "city">) =>
    [item.addressLine, item.ward, item.district, item.city].filter(Boolean).join(", ");

const getQuickChoices = (item: ApiListingSummary): StayQuickChoice[] => {
    const result = new Set<StayQuickChoice>();
    const address = buildAddress(item).toLowerCase();

    if (/trung tâm|phường 1|phường 2|bãi sau|bãi trước|back beach|front beach/i.test(address)) {
        result.add("Gần trung tâm");
    }

    if (item.maxGuests >= 8) {
        result.add("Phù hợp nhóm đông");
    }

    if (item.bedrooms >= 2 || item.maxGuests >= 4) {
        result.add("Phù hợp gia đình");
    }

    return Array.from(result);
};

export const mapListingSummaryToDestination = (item: ApiListingSummary): PopularDestination => {
    const rating = Number(item.ratingAvg || 0);

    return {
        id: String(item.listingId),
        name: item.title,
        address: buildAddress(item),
        rating,
        pricePerNight: Number(item.basePrice || 0),
        imageUrl: item.coverImageUrl ?? item.coverImage?.url ?? item.images?.find((image) => image.isCover)?.url ?? item.imageUrl ?? "",
        description: item.description ?? "",
        category: propertyTypeToCategory(item.propertyType),
        guests: Number(item.maxGuests || 1),
        bedrooms: Number(item.bedrooms || 0),
        beds: Number(item.beds || 0),
        bathrooms: Number(item.bathrooms || 0),
        badge: item.reviewCount >= 10 ? "Được đặt nhiều" : rating >= 4.8 ? "Yêu thích" : undefined,
        amenities: [],
        highlights: rating >= 4.8 ? ["Được yêu thích", "Miễn phí hủy"] : [],
        policies: ["Thanh toán linh hoạt"],
        quickChoices: getQuickChoices(item),
    };
};

export const mapListingDetailToDestination = (item: ApiListingDetail): PopularDestination => {
    const summaryLike: ApiListingSummary = {
        listingId: item.listingId,
        title: item.title,
        description: item.description,
        basePrice: item.basePrice,
        ratingAvg: item.ratingSummary?.avgRating ?? 0,
        reviewCount: item.ratingSummary?.reviewCount ?? 0,
        isAvailable: true,
        addressLine: item.addressSummary.addressLine,
        ward: item.addressSummary.ward,
        district: item.addressSummary.district,
        city: item.addressSummary.city,
        propertyType: item.propertyType,
        roomType: item.roomType,
        maxGuests: item.maxGuests,
        bedrooms: item.bedrooms,
        beds: item.beds,
        bathrooms: item.bathrooms,
        currency: item.currency,
        imageUrl: item.images?.find((image) => image.isCover)?.url ?? item.images?.[0]?.url ?? null,
    };

    return {
        ...mapListingSummaryToDestination(summaryLike),
        amenities: item.amenities?.map((amenity) => amenity.name) ?? [],
    };
};
