import {
    useEffect,
    useMemo,
    useRef,
    useState,
    type ReactNode,
    type RefObject,
    type TouchEvent,
} from "react";
import {
    FaArrowLeft,
    FaCarSide,
    FaCheckCircle,
    FaChevronLeft,
    FaChevronRight,
    FaFireAlt,
    FaMinus,
    FaMapMarkerAlt,
    FaPlus,
    FaSnowflake,
    FaStar,
    FaSwimmingPool,
    FaTimes,
    FaUtensils,
    FaWifi,
} from "react-icons/fa";
import {
    FiCalendar,
    FiHeart,
    FiMessageCircle,
    FiShare2,
    FiShoppingBag,
    FiUsers,
} from "react-icons/fi";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { APP_ROUTES } from "../../../config/routes";
import { createBookingQueueItem } from "../../../features/bookingQueue/bookingQueueStorage";
import { useBookingQueue } from "../../../features/bookingQueue/useBookingQueue";
import { addRecentlyViewedListing } from "../../../features/recentlyViewed/recentlyViewedStorage";
import NearbyRecommendationsSection from "../../../features/recommendations/NearbyRecommendationsSection";
import { useSavedListings } from "../../../features/wishlist/useSavedListings";
import type {
    ApiListingDetail,
    PopularDestination,
} from "../../../models/entities/Listing";
import { createOrGetConversation } from "../../../services/api/conversationsApi";
import { createBooking } from "../../../services/bookingService";
import {
    getListingAvailability,
    getListingById,
    getListingReviews,
    getListingRules,
} from "../../../services/listingService";
import { getCurrentUser } from "../../../store/authStore";
import SearchPopover from "../../components/search/SearchPopover";
import DatePickerPanel from "../../components/search/booking/DatePickerPanel";
import type { GuestSelection } from "../../components/search/booking/Guest";
import {
    buildGuestSummary,
    defaultGuestSelection,
    guestFieldConfigs,
    parseBookingSearchParams,
    toIsoDate,
    type BookingSearchState,
} from "../../components/search/searchState";

type ListingDetailLocationState = {
    returnTo?: string;
};

type BookingField = "checkin" | "checkout" | "guests" | null;
type MobileBookingSheet = "dates" | "guests" | null;
type MobileDateField = "checkin" | "checkout";

type GalleryItem = {
    id: string;
    imageUrl: string;
    label: string;
};

type GuestReview = {
    id: string;
    guestName: string;
    date: string;
    rating: number;
    content: string;
};

type HostProfile = {
    name: string;
    avatarUrl?: string;
    verified: boolean;
    listingCount: number;
    joinedYear: number;
    bio: string;
};

type PolicyItem = {
    label: string;
    value?: string;
};

type ReviewMetric = {
    label: string;
    score: number;
};

type AmenityItem = {
    icon: ReactNode;
    label: string;
};

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
});

const cardClass =
    "rounded-2xl border border-[#e8ddd1] bg-white shadow-[0_30px_80px_-50px_rgba(71,47,23,0.38)] sm:rounded-[34px]";
const bookingQueueLimitMessage =
    "Bạn chỉ có thể thêm tối đa 5 chỗ ở vào danh sách chờ đặt. Bạn có thể lưu chỗ ở này để xem sau.";

const aiImageTypeTitleMap: Record<string, string> = {
    bedroom: "Phòng ngủ",
    living_room: "Phòng khách",
    kitchen: "Nhà bếp",
    bathroom: "Phòng tắm",
    pool: "Hồ bơi",
    balcony: "Ban công",
    garden: "Sân vườn",
    rooftop: "Sân thượng",
    parking: "Chỗ đậu xe",
    bbq_area: "Khu BBQ",
    dining_area: "Khu vực ăn uống",
    front_view: "Mặt tiền villa",
    outdoor_area: "Không gian ngoài trời",
    hallway: "Hành lang",
    stairs: "Cầu thang",
    sea_view: "View biển",
    city_view: "View thành phố",
    other: "Ảnh chỗ nghỉ",
};

const fallbackHostProfiles: HostProfile[] = [
    {
        name: "Minh Thành",
        verified: true,
        listingCount: 12,
        joinedYear: 2021,
        bio: "Chủ nhà tại Vũng Tàu, ưu tiên phản hồi nhanh và chuẩn bị không gian nghỉ dưỡng riêng tư cho gia đình, nhóm bạn.",
    },
    {
        name: "Thư host",
        verified: true,
        listingCount: 8,
        joinedYear: 2022,
        bio: "Yêu thích những căn villa gần biển, luôn gửi hướng dẫn check-in rõ ràng và gợi ý địa điểm ăn uống quanh chỗ ở.",
    },
    {
        name: "Yến Villa",
        verified: false,
        listingCount: 5,
        joinedYear: 2023,
        bio: "Tập trung vào các căn nghỉ sáng thoáng, tiện nghi đủ cho kỳ nghỉ ngắn ngày hoặc chuyến đi cùng gia đình.",
    },
];

const fallbackAmenities: AmenityItem[] = [
    { icon: <FaSwimmingPool />, label: "Hồ bơi riêng" },
    { icon: <FaWifi />, label: "Wi-Fi tốc độ cao" },
    { icon: <FaUtensils />, label: "Bếp đầy đủ tiện nghi" },
    { icon: <FaFireAlt />, label: "Khu BBQ ngoài trời" },
    { icon: <FaSnowflake />, label: "Điều hòa tất cả phòng" },
    { icon: <FaCarSide />, label: "Chỗ đậu xe miễn phí" },
];

const formatDateInput = (date: Date) => {
    const safeDate = new Date(date);
    safeDate.setHours(12, 0, 0, 0);
    return toIsoDate(safeDate);
};

const createDateOffset = (offsetDays: number) => {
    const date = new Date();
    date.setDate(date.getDate() + offsetDays);
    return formatDateInput(date);
};

const addDaysToIso = (isoDate: string, days: number) => {
    const date = new Date(`${isoDate}T00:00:00`);
    date.setDate(date.getDate() + days);
    return formatDateInput(date);
};

const getNightCount = (checkIn: string, checkOut: string) => {
    if (!checkIn || !checkOut) {
        return 1;
    }

    const start = new Date(`${checkIn}T00:00:00`);
    const end = new Date(`${checkOut}T00:00:00`);
    const differenceInDays = Math.round(
        (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
    );

    return differenceInDays > 0 ? differenceInDays : 1;
};

const formatFieldDate = (isoDate: string) => {
    if (!isoDate) {
        return "Thêm ngày";
    }

    const parsed = new Date(`${isoDate}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) {
        return "Thêm ngày";
    }

    return new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(parsed);
};

const clampScore = (score: number) => Math.max(0, Math.min(5, score));

const getInitials = (name: string) =>
    name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase() || "H";

const isMobileViewport = () =>
    typeof window !== "undefined" &&
    window.matchMedia("(max-width: 1279.98px)").matches;

const buildImageLabel = (
    image: ApiListingDetail["images"][number],
    index: number,
) => {
    const directTitle =
        image.displayTitle ?? image.display_title ?? image.aiDisplayTitle;

    if (directTitle?.trim()) {
        return directTitle.trim();
    }

    const imageType = image.aiImageType ?? image.ai_image_type;
    if (imageType && aiImageTypeTitleMap[imageType]) {
        return aiImageTypeTitleMap[imageType];
    }

    const description = image.aiDescription ?? image.ai_description;
    if (description?.trim()) {
        return description.trim().length > 42
            ? `${description.trim().slice(0, 41)}...`
            : description.trim();
    }

    return `Ảnh chỗ nghỉ ${index + 1}`;
};

const buildGalleryItems = (
    listing: ApiListingDetail | null,
    destination: PopularDestination | null,
): GalleryItem[] => {
    if (!destination) {
        return [];
    }

    return (listing?.images ?? [])
        .filter((image) => Boolean(image.url))
        .sort(
            (left, right) =>
                Number(Boolean(right.isCover ?? right.is_cover)) -
                Number(Boolean(left.isCover ?? left.is_cover)) ||
                (left.sortOrder ?? left.sort_order ?? 0) -
                (right.sortOrder ?? right.sort_order ?? 0),
        )
        .map((image, index) => ({
            id: String(
                image.imageId ??
                image.id ??
                image.listingImageId ??
                `${destination.id}-${index}`,
            ),
            imageUrl: image.url,
            label: buildImageLabel(image, index),
        }));
};

const getListingSeedNumber = (listingId: string) => {
    const matchedNumber = listingId.match(/\d+/)?.[0];
    const parsed = Number.parseInt(matchedNumber ?? "1", 10);
    return Number.isFinite(parsed) ? parsed : 1;
};

const buildFallbackHostProfile = (listing: PopularDestination): HostProfile => {
    const seedNumber = getListingSeedNumber(listing.id);
    const profile =
        fallbackHostProfiles[seedNumber % fallbackHostProfiles.length];

    return {
        ...profile,
        listingCount: Math.max(
            profile.listingCount,
            Math.min(18, listing.bedrooms + seedNumber + 2),
        ),
        verified: profile.verified || listing.rating >= 4.8,
    };
};

const buildHostProfile = (
    rawListing: ApiListingDetail | null,
    destination: PopularDestination,
): HostProfile => {
    if (rawListing?.host) {
        return {
            name: rawListing.host.name || "Chủ nhà",
            avatarUrl: rawListing.host.avatarUrl ?? undefined,
            verified: true,
            listingCount: 1,
            joinedYear: new Date().getFullYear(),
            bio: "Chủ nhà đang quản lý chỗ nghỉ này và có thể hỗ trợ thông tin nhận phòng, lịch trống hoặc nhu cầu riêng của nhóm bạn.",
        };
    }

    return buildFallbackHostProfile(destination);
};

const buildFallbackReviews = (listing: PopularDestination): GuestReview[] => {
    if (listing.rating <= 0) {
        return [];
    }

    return [
        {
            id: `${listing.id}-review-1`,
            guestName: "Minh Anh",
            date: "2026-03-18",
            rating: Math.min(5, Math.round(listing.rating)),
            content: `${listing.name} sạch sẽ, dễ di chuyển và khu sinh hoạt chung rất hợp cho nhóm đông người. Host phản hồi nhanh trước giờ nhận phòng.`,
        },
        {
            id: `${listing.id}-review-2`,
            guestName: "Gia Huy",
            date: "2026-02-24",
            rating: Math.max(4, Math.round(listing.rating - 0.2)),
            content:
                "Không gian đúng như mô tả, bếp và khu nghỉ ngơi đủ tiện nghi. Nhóm mình thích nhất phần sân và vị trí gần các điểm ăn uống.",
        },
    ];
};

const buildOverview = (listing: PopularDestination) =>
    `${listing.name} là chỗ nghỉ riêng tư tại ${listing.address}, phù hợp cho gia đình hoặc nhóm bạn muốn có không gian sinh hoạt thoải mái. Chỗ nghỉ nổi bật với khu vực nghỉ ngơi rộng, bếp tiện nghi, vị trí thuận tiện và các tiện ích cần thiết cho một kỳ lưu trú ngắn ngày hoặc cuối tuần.`;

const getAmenityIcon = (name: string) => {
    const normalizedName = name.toLowerCase();

    if (normalizedName.includes("wifi") || normalizedName.includes("wi-fi")) {
        return <FaWifi />;
    }

    if (normalizedName.includes("hồ bơi") || normalizedName.includes("pool")) {
        return <FaSwimmingPool />;
    }

    if (normalizedName.includes("bếp") || normalizedName.includes("kitchen")) {
        return <FaUtensils />;
    }

    if (normalizedName.includes("bbq") || normalizedName.includes("nướng")) {
        return <FaFireAlt />;
    }

    if (
        normalizedName.includes("điều hòa") ||
        normalizedName.includes("máy lạnh")
    ) {
        return <FaSnowflake />;
    }

    if (normalizedName.includes("đậu xe") || normalizedName.includes("parking")) {
        return <FaCarSide />;
    }

    return <FaCheckCircle />;
};

const buildAmenityItems = (
    rawListing: ApiListingDetail | null,
    destination: PopularDestination | null,
): AmenityItem[] => {
    const names = [
        ...(rawListing?.amenities?.map((amenity) => amenity.name) ?? []),
        ...(destination?.amenities ?? []),
    ]
        .map((name) => name.trim())
        .filter(Boolean);
    const uniqueNames = Array.from(new Set(names));

    if (uniqueNames.length === 0) {
        return fallbackAmenities;
    }

    return uniqueNames.slice(0, 9).map((name) => ({
        icon: getAmenityIcon(name),
        label: name,
    }));
};

const buildReviewMetrics = (listing: PopularDestination): ReviewMetric[] => [
    { label: "Vị trí", score: clampScore(listing.rating) },
    { label: "Sạch sẽ", score: clampScore(Math.max(4.5, listing.rating - 0.1)) },
    {
        label: "Tiện nghi",
        score: clampScore(Math.max(4.5, listing.rating - 0.05)),
    },
];

const getReturnTarget = (locationState: ListingDetailLocationState | null) => {
    const fromState = locationState?.returnTo;
    const fromStorage =
        typeof window !== "undefined"
            ? window.sessionStorage.getItem("popular_return_to")
            : null;

    return fromState || fromStorage || "";
};

type StatusCardProps = {
    title: string;
    description?: string;
    action?: ReactNode;
};

const StatusCard = ({ title, description, action }: StatusCardProps) => (
    <section className="min-h-screen bg-[#f4f0eb] px-4 pb-16 pt-28 text-center sm:px-6">
        <div className={`mx-auto max-w-3xl px-6 py-12 ${cardClass}`}>
            <h1 className="text-3xl font-bold text-zinc-900">{title}</h1>
            {description ? (
                <p className="mt-3 text-sm leading-6 text-zinc-500">{description}</p>
            ) : null}
            {action ? <div className="mt-6">{action}</div> : null}
        </div>
    </section>
);

type BookingSelectionFieldProps = {
    label: string;
    value: string;
    icon: ReactNode;
    isActive?: boolean;
    onClick: () => void;
    buttonRef?: RefObject<HTMLButtonElement | null>;
};

const BookingSelectionField = ({
    label,
    value,
    icon,
    isActive = false,
    onClick,
    buttonRef,
}: BookingSelectionFieldProps) => (
    <button
        ref={buttonRef}
        type="button"
        onClick={onClick}
        className={`flex w-full items-start gap-3 rounded-2xl border px-4 py-4 text-left transition-all duration-200 sm:rounded-[28px] ${isActive
            ? "border-cyan-300 bg-cyan-50/80 shadow-[0_18px_35px_-28px_rgba(15,23,42,0.32)] ring-4 ring-cyan-100"
            : "border-slate-200 bg-white hover:border-cyan-200 hover:bg-slate-50/70"
            }`}
    >
        <span
            className={`mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[18px] ${isActive ? "bg-cyan-100 text-cyan-700" : "bg-slate-50 text-slate-500"
                }`}
        >
            {icon}
        </span>
        <span className="min-w-0 flex-1">
            <span className="block text-xs font-semibold text-gray-800">{label}</span>
            <span className="mt-1 block text-[1.05rem] font-semibold tracking-tight text-zinc-900">
                {value}
            </span>
        </span>
    </button>
);

type GuestControlsProps = {
    value: GuestSelection;
    compact?: boolean;
    /** Override the adults maximum with the listing's maxGuests */
    maxAdults?: number;
    onAdjust: (
        key: keyof GuestSelection,
        delta: number,
        min: number,
        max: number,
    ) => void;
};

const GuestControls = ({
    value,
    compact = false,
    maxAdults,
    onAdjust,
}: GuestControlsProps) => (
    <div className="space-y-3">
        {guestFieldConfigs.map((field) => {
            const effectiveMax = field.key === "adults" && maxAdults !== undefined
                ? maxAdults
                : field.max;
            const currentValue = value[field.key];
            const disableMinus = currentValue <= field.min;
            const disablePlus = currentValue >= effectiveMax;

            return (
                <div
                    key={field.key}
                    className={`grid items-center gap-4 rounded-[24px] bg-white px-4 ${compact
                        ? "grid-cols-[minmax(150px,1fr)_auto] py-3"
                        : "grid-cols-[1fr_auto] py-4"
                        }`}
                >
                    <div>
                        <p
                            className={`${compact ? "text-sm" : "text-base"} font-semibold text-gray-900`}
                        >
                            {field.label}
                        </p>
                        <p className={`${compact ? "text-xs" : "text-sm"} text-gray-500`}>
                            {field.description}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            disabled={disableMinus}
                            onClick={() => onAdjust(field.key, -1, field.min, field.max)}
                            className={`inline-flex items-center justify-center rounded-full border border-gray-300 bg-white text-gray-600 shadow-sm transition-colors hover:border-cyan-300 hover:text-cyan-700 disabled:cursor-not-allowed disabled:opacity-35 ${compact ? "h-9 w-9" : "h-10 w-10"
                                }`}
                            aria-label={`Giảm ${field.label}`}
                        >
                            <FaMinus size={10} />
                        </button>
                        <span className="w-6 text-center text-sm font-semibold text-gray-900">
                            {currentValue}
                        </span>
                        <button
                            type="button"
                            disabled={disablePlus}
                            onClick={() => onAdjust(field.key, 1, field.min, effectiveMax)}
                            className={`inline-flex items-center justify-center rounded-full border border-gray-300 bg-white text-gray-600 shadow-sm transition-colors hover:border-cyan-300 hover:text-cyan-700 disabled:cursor-not-allowed disabled:opacity-35 ${compact ? "h-9 w-9" : "h-10 w-10"
                                }`}
                            aria-label={`Tăng ${field.label}`}
                        >
                            <FaPlus size={10} />
                        </button>
                    </div>
                </div>
            );
        })}
    </div>
);

type GalleryProps = {
    items: GalleryItem[];
    currentImage: GalleryItem | null;
    selectedIndex: number;
    onSelect: (index: number) => void;
    onPrevious: () => void;
    onNext: () => void;
    onOpenModal: () => void;
    onTouchStart: (event: TouchEvent<HTMLElement>) => void;
    onTouchEnd: (event: TouchEvent<HTMLElement>) => void;
};

const ListingGallery = ({
    items,
    currentImage,
    selectedIndex,
    onSelect,
    onPrevious,
    onNext,
    onOpenModal,
    onTouchStart,
    onTouchEnd,
}: GalleryProps) => {
    const hasImages = items.length > 0 && Boolean(currentImage);

    return (
        <div className="mt-6">
            <div
                className="group relative overflow-hidden rounded-[34px] bg-[#ded4c9] shadow-[0_30px_80px_-55px_rgba(71,47,23,0.45)] [touch-action:pan-y]"
                onTouchStart={onTouchStart}
                onTouchEnd={onTouchEnd}
            >
                {currentImage ? (
                    <img
                        src={currentImage.imageUrl}
                        alt={currentImage.label}
                        className="h-[320px] w-full object-cover sm:h-[420px] xl:h-[520px]"
                    />
                ) : (
                    <div className="flex h-[320px] w-full items-center justify-center text-sm font-semibold text-zinc-600 sm:h-[420px] xl:h-[520px]">
                        Chưa có ảnh
                    </div>
                )}

                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-black/10" />
                <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-zinc-900 shadow-lg">
                    {hasImages ? `${selectedIndex + 1}/${items.length}` : "Chưa có ảnh"}
                </div>

                <button
                    type="button"
                    onClick={onPrevious}
                    disabled={!hasImages}
                    className="absolute left-3 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/92 text-zinc-900 shadow-lg transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 sm:left-4"
                    aria-label="Xem ảnh trước"
                >
                    <FaChevronLeft />
                </button>
                <button
                    type="button"
                    onClick={onNext}
                    disabled={!hasImages}
                    className="absolute right-3 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/92 text-zinc-900 shadow-lg transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 sm:right-4"
                    aria-label="Xem ảnh tiếp theo"
                >
                    <FaChevronRight />
                </button>

                <button
                    type="button"
                    onClick={onOpenModal}
                    disabled={!hasImages}
                    className="absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-full bg-white/92 px-4 py-2.5 text-sm font-semibold text-zinc-900 shadow-lg transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    Xem tất cả ảnh
                    <FaChevronRight className="text-xs" />
                </button>
            </div>

            {items.length > 0 ? (
                <div className="mt-4 flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {items.map((item, index) => (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => onSelect(index)}
                            className={`relative h-[88px] min-w-[112px] overflow-hidden rounded-[22px] border transition-all sm:h-24 sm:min-w-[138px] ${index === selectedIndex
                                ? "border-cyan-600 ring-4 ring-cyan-600/15"
                                : "border-[#e0d1c1]"
                                }`}
                        >
                            <img
                                src={item.imageUrl}
                                alt={item.label}
                                className="h-full w-full object-cover"
                            />
                        </button>
                    ))}
                </div>
            ) : null}
        </div>
    );
};

type PoliciesCardProps = {
    policies: PolicyItem[];
};

const PoliciesCard = ({ policies }: PoliciesCardProps) => (
    <div className={`${cardClass} p-5`}>
        <h2 className="text-[1.5rem] font-semibold leading-none tracking-tight text-[#231a12] sm:text-[2rem]">
            Chính sách villa
        </h2>
        <div className="mt-5 space-y-3">
            {policies.map((policy) => (
                <div
                    key={policy.label}
                    className="flex items-start gap-3 rounded-[22px] bg-[#fffaf5] px-4 py-3 text-sm text-zinc-700 sm:text-[15px]"
                >
                    <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-600 text-[10px] text-white">
                        <FaCheckCircle />
                    </span>
                    <span>
                        {policy.label}
                        {policy.value ? (
                            <strong className="ml-1 font-semibold text-zinc-900">
                                {policy.value}
                            </strong>
                        ) : null}
                    </span>
                </div>
            ))}
        </div>
    </div>
);

type HostCardProps = {
    host: HostProfile;
    canMessageHost: boolean;
    isOpeningConversation: boolean;
    onMessageHost: () => void;
};

const HostCard = ({
    host,
    canMessageHost,
    isOpeningConversation,
    onMessageHost,
}: HostCardProps) => (
    <section className="mt-12">
        <h2 className="text-[2.2rem] font-semibold leading-none tracking-tight text-[#231a12]">
            Thông tin host
        </h2>
        <div className={`mt-5 p-5 sm:p-6 ${cardClass}`}>
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                {host.avatarUrl ? (
                    <img
                        src={host.avatarUrl}
                        alt={host.name}
                        className="h-20 w-20 rounded-full object-cover"
                    />
                ) : (
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-cyan-600 text-xl font-bold text-white">
                        {getInitials(host.name)}
                    </div>
                )}

                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-xl font-semibold text-zinc-900">{host.name}</h3>
                        <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${host.verified
                                ? "bg-cyan-50 text-cyan-700"
                                : "bg-amber-50 text-amber-700"
                                }`}
                        >
                            {host.verified ? "Đã xác minh" : "Đang xác minh"}
                        </span>
                    </div>
                    <p className="mt-2 text-sm text-zinc-500">
                        {host.listingCount} chỗ ở đang quản lý · Tham gia từ{" "}
                        {host.joinedYear}
                    </p>
                    <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-600 sm:text-[15px]">
                        {host.bio}
                    </p>
                </div>

                {canMessageHost ? (
                    <button
                        type="button"
                        onClick={onMessageHost}
                        disabled={isOpeningConversation}
                        className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-5 py-3 text-sm font-semibold text-cyan-700 transition-colors hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-60 sm:self-start"
                    >
                        <FiMessageCircle />
                        {isOpeningConversation ? "Đang mở..." : "Nhắn tin cho host"}
                    </button>
                ) : null}
            </div>
        </div>
    </section>
);

type ReviewsSectionProps = {
    listing: PopularDestination;
    reviews: GuestReview[];
};

const ReviewsSection = ({ listing, reviews }: ReviewsSectionProps) => {
    const reviewCount = reviews.length;
    const averageReviewScore =
        reviewCount > 0
            ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount
            : listing.rating;
    const reviewMetrics = buildReviewMetrics(listing);

    return (
        <section className="mt-12">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <h2 className="text-[2.2rem] font-semibold leading-none tracking-tight text-[#231a12]">
                    Đánh giá của khách
                </h2>
                <p className="text-sm font-semibold text-zinc-600">
                    Điểm trung bình {averageReviewScore.toFixed(1)} · {reviewCount} đánh
                    giá
                </p>
            </div>

            <div className={`mt-5 p-5 sm:p-6 ${cardClass}`}>
                {reviewCount > 0 ? (
                    <div className="grid gap-6 lg:grid-cols-[230px_minmax(0,1fr)]">
                        <div className="border-b border-[#efe4d8] pb-6 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-6">
                            <div className="flex items-center gap-1 text-cyan-600">
                                {Array.from({ length: 5 }).map((_, index) => (
                                    <FaStar key={index} />
                                ))}
                            </div>
                            <p className="mt-4 text-[2.25rem] font-semibold tracking-tight text-[#231a12]">
                                {averageReviewScore.toFixed(1)}
                            </p>
                            <p className="mt-1 text-sm text-zinc-600">
                                {reviewCount} khách đã để lại đánh giá cho chỗ ở này.
                            </p>
                            <div className="mt-6 space-y-4">
                                {reviewMetrics.map((metric) => (
                                    <div
                                        key={metric.label}
                                        className="grid gap-2 sm:grid-cols-[72px_minmax(0,1fr)_36px] sm:items-center lg:grid-cols-1"
                                    >
                                        <span className="text-sm font-semibold text-zinc-700">
                                            {metric.label}
                                        </span>
                                        <div className="h-2 rounded-full bg-[#eadfd2]">
                                            <div
                                                className="h-2 rounded-full bg-cyan-600"
                                                style={{
                                                    width: `${Math.min(100, (metric.score / 5) * 100)}%`,
                                                }}
                                            />
                                        </div>
                                        <span className="text-sm font-semibold text-zinc-800">
                                            {metric.score.toFixed(1)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            {reviews.map((review) => (
                                <article
                                    key={review.id}
                                    className="rounded-[28px] border border-[#efe4d8] bg-[#fffaf5] p-4 shadow-sm"
                                >
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-cyan-600 text-sm font-bold text-white">
                                                {getInitials(review.guestName)}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-zinc-900">
                                                    {review.guestName}
                                                </p>
                                                <p className="text-xs text-zinc-500">
                                                    {formatFieldDate(review.date)}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-sm font-semibold text-cyan-700">
                                            <FaStar className="text-xs" />
                                            {review.rating.toFixed(1)}
                                        </span>
                                    </div>
                                    <p className="mt-3 text-sm leading-7 text-zinc-600">
                                        {review.content}
                                    </p>
                                </article>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="rounded-[30px] border border-dashed border-[#e4d7c8] bg-[#fffaf5] px-5 py-10 text-center">
                        <p className="text-base font-semibold text-zinc-900">
                            Chưa có đánh giá
                        </p>
                        <p className="mt-2 text-sm text-zinc-500">
                            Những đánh giá đầu tiên của khách sẽ hiển thị tại đây.
                        </p>
                    </div>
                )}
            </div>
        </section>
    );
};

type BookingCardProps = {
    variant: "mobile" | "desktop";
    nightlyRate: number;
    nights: number;
    guestCount: number;
    guestSummary: string;
    checkIn: string;
    checkOut: string;
    isBooking: boolean;
    activeDesktopField: BookingField;
    todayIso: string;
    nightOffset: number;
    /** ISO dates that are already booked — shown as disabled in the calendar */
    bookedDates?: string[];
    /** Listing's max guest count — used to cap the adults selector */
    maxGuests: number;
    activeDesktopAnchorRef: RefObject<HTMLElement | null>;
    desktopBookingRef: RefObject<HTMLDivElement | null>;
    desktopPopoverRef: RefObject<HTMLDivElement | null>;
    desktopDateFieldsRef: RefObject<HTMLDivElement | null>;
    checkInFieldRef: RefObject<HTMLButtonElement | null>;
    checkOutFieldRef: RefObject<HTMLButtonElement | null>;
    guestFieldRef: RefObject<HTMLButtonElement | null>;
    guestSelection: GuestSelection;
    onOpenDate: (field: MobileDateField) => void;
    onOpenGuests: () => void;
    onSelectCheckIn: (nextDate: string) => void;
    onSelectCheckOut: (nextDate: string) => void;
    onNightOffsetChange: (nextOffset: number) => void;
    onAdjustGuest: (
        key: keyof GuestSelection,
        delta: number,
        min: number,
        max: number,
    ) => void;
    onBookNow: () => void;
};

const BookingCard = ({
    variant,
    nightlyRate,
    nights,
    guestCount,
    guestSummary,
    checkIn,
    checkOut,
    isBooking,
    activeDesktopField,
    todayIso,
    nightOffset,
    bookedDates,
    maxGuests,
    activeDesktopAnchorRef,
    desktopBookingRef,
    desktopPopoverRef,
    desktopDateFieldsRef,
    checkInFieldRef,
    checkOutFieldRef,
    guestFieldRef,
    guestSelection,
    onOpenDate,
    onOpenGuests,
    onSelectCheckIn,
    onSelectCheckOut,
    onNightOffsetChange,
    onAdjustGuest,
    onBookNow,
}: BookingCardProps) => {
    const isDesktop = variant === "desktop";
    const showDatePopover =
        isDesktop &&
        (activeDesktopField === "checkin" || activeDesktopField === "checkout");
    const showGuestPopover = isDesktop && activeDesktopField === "guests";

    return (
        <>
            <div
                ref={isDesktop ? desktopBookingRef : null}
                className={`${cardClass} p-5 sm:p-6`}
            >
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                            <p className="text-[2rem] font-semibold tracking-tight text-[#231a12]">
                                {currencyFormatter.format(nightlyRate)}
                            </p>
                            <span className="text-sm text-zinc-600">/ đêm</span>
                        </div>
                        <p className="mt-1 text-sm text-zinc-500">
                            Giá linh hoạt theo thời gian lưu trú.
                        </p>
                    </div>
                    <div className="inline-flex shrink-0 items-center gap-2 rounded-full border border-cyan-100 bg-cyan-50 px-3 py-1.5 text-xs font-bold text-cyan-700">
                        <FiUsers className="text-sm" />
                        {guestCount} khách
                    </div>
                </div>

                <div
                    ref={isDesktop ? desktopDateFieldsRef : null}
                    className="mt-4 grid gap-3"
                >
                    <BookingSelectionField
                        label="Nhận phòng"
                        value={formatFieldDate(checkIn)}
                        icon={<FiCalendar size={18} />}
                        isActive={isDesktop && activeDesktopField === "checkin"}
                        onClick={() => onOpenDate("checkin")}
                        buttonRef={isDesktop ? checkInFieldRef : undefined}
                    />
                    <BookingSelectionField
                        label="Trả phòng"
                        value={formatFieldDate(checkOut)}
                        icon={<FiCalendar size={18} />}
                        isActive={isDesktop && activeDesktopField === "checkout"}
                        onClick={() => onOpenDate("checkout")}
                        buttonRef={isDesktop ? checkOutFieldRef : undefined}
                    />
                    <BookingSelectionField
                        label="Khách"
                        value={guestSummary}
                        icon={<FiUsers size={18} />}
                        isActive={showGuestPopover}
                        onClick={onOpenGuests}
                        buttonRef={isDesktop ? guestFieldRef : undefined}
                    />
                </div>

                <div className="mt-6 rounded-[28px] border border-cyan-100 bg-cyan-50/40 p-4">
                    <div className="flex items-center justify-between gap-4 text-sm text-zinc-700">
                        <span className="font-bold">Kỳ nghỉ của bạn</span>
                        <span>{nights} đêm</span>
                    </div>
                    <div className="mt-5 flex items-end justify-between gap-4">
                        <div>
                            <p className="text-base font-semibold text-[#231a12]">
                                Tổng tiền được xác nhận ở bước thanh toán
                            </p>
                            <p className="mt-1 text-xs text-zinc-500">
                                Áp dụng lịch giá và ưu đãi hiện hành
                            </p>
                        </div>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={onBookNow}
                    disabled={isBooking}
                    className="mt-6 inline-flex min-h-14 w-full items-center justify-center rounded-[26px] bg-cyan-600 px-6 text-base font-semibold text-white shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-cyan-300"
                >
                    {isBooking ? "Đang tạo đặt phòng..." : "Đặt ngay"}
                </button>
                <p className="mt-3 text-center text-sm text-zinc-500">
                    Chưa trừ tiền ngay
                </p>

                <div className="mt-6 border-t border-[#ece2d8] pt-4">
                    <div className="flex items-center justify-between gap-4">
                        <span className="text-sm text-zinc-500">Tổng {nights} đêm</span>
                        <span className="text-sm font-semibold text-[#231a12]">
                            Xác nhận sau khi tạo đặt phòng
                        </span>
                    </div>
                    <div className="mt-4 flex items-center gap-2 rounded-[24px] bg-cyan-50 px-4 py-3 text-xs font-medium text-zinc-600">
                        <FaCheckCircle className="shrink-0 text-cyan-600" />
                        Miễn phí hủy trong khung thời gian hỗ trợ
                    </div>
                </div>
            </div>

            {showDatePopover ? (
                <SearchPopover
                    ref={desktopPopoverRef}
                    isOpen
                    anchorRef={desktopDateFieldsRef as RefObject<HTMLElement | null>}
                    align="end"
                    offset={12}
                    className="w-[min(860px,calc(100vw-2rem))]"
                >
                    <DatePickerPanel
                        key={`desktop-${activeDesktopField}-${checkIn}-${checkOut}`}
                        isOpen
                        selectedDate={activeDesktopField === "checkin" ? checkIn : checkOut}
                        minDate={
                            activeDesktopField === "checkin" ? todayIso : checkIn || todayIso
                        }
                        rangeStartDate={checkIn}
                        rangeEndDate={checkOut}
                        activeField={
                            activeDesktopField === "checkout" ? "checkOut" : "checkIn"
                        }
                        selectedNightOffset={nightOffset}
                        bookedDates={bookedDates}
                        onSelectDate={
                            activeDesktopField === "checkin"
                                ? onSelectCheckIn
                                : onSelectCheckOut
                        }
                        onNightOffsetChange={onNightOffsetChange}
                        variant="popover"
                    />
                </SearchPopover>
            ) : null}

            {showGuestPopover ? (
                <SearchPopover
                    ref={desktopPopoverRef}
                    isOpen
                    anchorRef={activeDesktopAnchorRef}
                    align="end"
                    offset={14}
                    className="w-[min(390px,calc(100vw-2rem))]"
                >
                    <div className="rounded-[34px] border border-black/5 bg-white p-5 shadow-[0_36px_85px_-46px_rgba(15,23,42,0.38)]">
                        <p className="text-base font-semibold text-gray-900">
                            Bạn đi cùng ai?
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                            Tối đa {maxGuests} khách, chưa tính em bé và thú cưng.
                        </p>
                        <div className="mt-5 rounded-[26px] bg-slate-50 p-2">
                            <GuestControls
                                value={guestSelection}
                                compact
                                maxAdults={maxGuests}
                                onAdjust={onAdjustGuest}
                            />
                        </div>
                    </div>
                </SearchPopover>
            ) : null}
        </>
    );
};

type MobileBookingSheetProps = {
    sheet: MobileBookingSheet;
    mobileDateField: MobileDateField;
    checkIn: string;
    checkOut: string;
    todayIso: string;
    nightOffset: number;
    /** ISO dates that are already booked — shown as disabled in the mobile calendar */
    bookedDates?: string[];
    /** Listing's max guest count — used to cap the adults selector */
    maxGuests: number;
    guestSelection: GuestSelection;
    onClose: () => void;
    onDateFieldChange: (field: MobileDateField) => void;
    onSelectCheckIn: (nextDate: string) => void;
    onSelectCheckOut: (nextDate: string) => void;
    onNightOffsetChange: (nextOffset: number) => void;
    onAdjustGuest: (
        key: keyof GuestSelection,
        delta: number,
        min: number,
        max: number,
    ) => void;
};

const MobileBookingSheetPanel = ({
    sheet,
    mobileDateField,
    checkIn,
    checkOut,
    todayIso,
    nightOffset,
    bookedDates,
    maxGuests,
    guestSelection,
    onClose,
    onDateFieldChange,
    onSelectCheckIn,
    onSelectCheckOut,
    onNightOffsetChange,
    onAdjustGuest,
}: MobileBookingSheetProps) => {
    if (!sheet) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-[80] xl:hidden">
            <div
                className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
                onClick={onClose}
                role="presentation"
            />
            <div className="absolute inset-x-0 bottom-0 top-0 overflow-y-auto rounded-t-[38px] bg-[#f4f0eb] px-4 pb-8 pt-4 shadow-2xl">
                <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-zinc-300" />
                <div className="flex items-center justify-between gap-4">
                    <h2 className="text-2xl font-bold text-zinc-950">
                        {sheet === "dates" ? "Chọn ngày lưu trú" : "Chọn số lượng khách"}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-cyan-100 bg-white text-zinc-700 transition-colors hover:border-cyan-300 hover:text-cyan-700"
                        aria-label="Đóng"
                    >
                        <FaTimes />
                    </button>
                </div>

                {sheet === "dates" ? (
                    <div className="mt-5 rounded-[34px] border border-cyan-100 bg-white p-4 shadow-sm">
                        <div className="mb-4 grid grid-cols-2 gap-2">
                            {(["checkin", "checkout"] as const).map((field) => (
                                <button
                                    key={field}
                                    type="button"
                                    onClick={() => onDateFieldChange(field)}
                                    className={`rounded-[24px] border px-3 py-3 text-left transition-colors ${mobileDateField === field
                                        ? "border-cyan-600 bg-cyan-600 text-white"
                                        : "border-cyan-100 bg-white text-zinc-800 hover:border-cyan-300"
                                        }`}
                                >
                                    <p
                                        className={`text-xs ${mobileDateField === field ? "text-white/75" : "text-zinc-500"}`}
                                    >
                                        {field === "checkin" ? "Nhận phòng" : "Trả phòng"}
                                    </p>
                                    <p className="mt-1 text-sm font-semibold">
                                        {formatFieldDate(field === "checkin" ? checkIn : checkOut)}
                                    </p>
                                </button>
                            ))}
                        </div>
                        <DatePickerPanel
                            key={`mobile-${mobileDateField}-${checkIn}-${checkOut}`}
                            isOpen
                            selectedDate={mobileDateField === "checkin" ? checkIn : checkOut}
                            minDate={
                                mobileDateField === "checkin" ? todayIso : checkIn || todayIso
                            }
                            rangeStartDate={checkIn}
                            rangeEndDate={checkOut}
                            activeField={
                                mobileDateField === "checkout" ? "checkOut" : "checkIn"
                            }
                            selectedNightOffset={nightOffset}
                            bookedDates={bookedDates}
                            onSelectDate={
                                mobileDateField === "checkin"
                                    ? onSelectCheckIn
                                    : onSelectCheckOut
                            }
                            onNightOffsetChange={onNightOffsetChange}
                            variant="inline"
                        />
                    </div>
                ) : (
                    <div className="mt-5 rounded-[34px] border border-cyan-100 bg-white p-4 shadow-sm">
                        <div className="rounded-[26px] bg-slate-50 p-2">
                            <GuestControls value={guestSelection} maxAdults={maxGuests} onAdjust={onAdjustGuest} />
                        </div>
                    </div>
                )}

                <button
                    type="button"
                    onClick={onClose}
                    className="mt-5 inline-flex min-h-14 w-full items-center justify-center rounded-[26px] bg-cyan-600 px-6 text-base font-semibold text-white shadow-sm transition-colors hover:bg-cyan-700"
                >
                    Áp dụng
                </button>
            </div>
        </div>
    );
};

type GalleryModalProps = {
    listingName: string;
    items: GalleryItem[];
    currentImage: GalleryItem | null;
    selectedIndex: number;
    onClose: () => void;
    onSelect: (index: number) => void;
    onPrevious: () => void;
    onNext: () => void;
    onTouchStart: (event: TouchEvent<HTMLElement>) => void;
    onTouchEnd: (event: TouchEvent<HTMLElement>) => void;
};

const GalleryModal = ({
    listingName,
    items,
    currentImage,
    selectedIndex,
    onClose,
    onSelect,
    onPrevious,
    onNext,
    onTouchStart,
    onTouchEnd,
}: GalleryModalProps) => {
    if (!currentImage || items.length === 0) {
        return null;
    }

    return (
        <div
            className="fixed inset-0 z-[90] overflow-y-auto bg-black/70 backdrop-blur-sm"
            onClick={onClose}
            role="presentation"
        >
            <div
                className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4 py-6 sm:px-6 lg:px-8"
                onClick={(event) => event.stopPropagation()}
                role="dialog"
                aria-modal="true"
            >
                <div className="w-full rounded-[36px] border border-white/10 bg-[#161616] p-4 text-white shadow-2xl sm:p-6">
                    <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
                        <div>
                            <p className="text-sm tracking-[0.18em] text-white/55">
                                Thư viện ảnh
                            </p>
                            <h2 className="mt-1 text-2xl font-semibold">{listingName}</h2>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition-colors hover:bg-white/20"
                            aria-label="Đóng thư viện ảnh"
                        >
                            <FaTimes />
                        </button>
                    </div>

                    <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
                        <div
                            className="relative overflow-hidden rounded-[32px] bg-black [touch-action:pan-y]"
                            onTouchStart={onTouchStart}
                            onTouchEnd={onTouchEnd}
                        >
                            <img
                                src={currentImage.imageUrl}
                                alt={currentImage.label}
                                className="h-[320px] w-full object-cover sm:h-[460px] xl:h-[620px]"
                            />
                            <button
                                type="button"
                                onClick={onPrevious}
                                className="absolute left-4 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-zinc-900 shadow-lg"
                                aria-label="Xem ảnh trước"
                            >
                                <FaChevronLeft />
                            </button>
                            <button
                                type="button"
                                onClick={onNext}
                                className="absolute right-4 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-zinc-900 shadow-lg"
                                aria-label="Xem ảnh tiếp theo"
                            >
                                <FaChevronRight />
                            </button>
                            <div className="absolute left-4 top-4 rounded-full bg-black/50 px-3 py-1.5 text-sm font-semibold text-white backdrop-blur">
                                {selectedIndex + 1}/{items.length}
                            </div>
                        </div>

                        <div className="gallery-thumbnail-scroll max-h-[320px] space-y-3 overflow-y-auto pr-2 sm:max-h-[460px] xl:max-h-[620px]">
                            {items.map((item, index) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => onSelect(index)}
                                    className={`flex w-full items-center gap-3 rounded-[22px] border p-2 text-left transition-colors ${index === selectedIndex
                                        ? "border-cyan-600 bg-white/10"
                                        : "border-white/10 bg-white/5 hover:bg-white/10"
                                        }`}
                                >
                                    <img
                                        src={item.imageUrl}
                                        alt={item.label}
                                        className="h-20 w-24 rounded-[18px] object-cover"
                                    />
                                    <p className="min-w-0 truncate text-sm font-semibold text-white">
                                        {item.label}
                                    </p>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ListingDetailContent = ({ villaId }: { villaId?: string }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const locationState = location.state as ListingDetailLocationState | null;

    const [destination, setDestination] = useState<PopularDestination | null>(
        null,
    );
    const [rawListing, setRawListing] = useState<ApiListingDetail | null>(null);
    const [guestReviews, setGuestReviews] = useState<GuestReview[]>([]);
    const [policyItems, setPolicyItems] = useState<PolicyItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [isBooking, setIsBooking] = useState(false);
    const [isOpeningConversation, setIsOpeningConversation] = useState(false);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
    const [activeDesktopField, setActiveDesktopField] =
        useState<BookingField>(null);
    const [mobileBookingSheet, setMobileBookingSheet] =
        useState<MobileBookingSheet>(null);
    const [mobileDateField, setMobileDateField] =
        useState<MobileDateField>("checkin");
    const [actionFeedback, setActionFeedback] = useState<string | null>(null);
    const [unavailableDates, setUnavailableDates] = useState<string[]>([]);

    const bookingQueue = useBookingQueue();
    const {
        isSaved,
        toggleSaved,
        isLoading: isWishlistLoading,
        error: wishlistError,
    } = useSavedListings();

    const desktopBookingRef = useRef<HTMLDivElement | null>(null);
    const desktopPopoverRef = useRef<HTMLDivElement | null>(null);
    const desktopDateFieldsRef = useRef<HTMLDivElement | null>(null);
    const checkInFieldRef = useRef<HTMLButtonElement | null>(null);
    const checkOutFieldRef = useRef<HTMLButtonElement | null>(null);
    const guestFieldRef = useRef<HTMLButtonElement | null>(null);
    const feedbackTimerRef = useRef<number | null>(null);
    const touchStartXRef = useRef<number | null>(null);

    const bookingSearchState = useMemo(
        () => parseBookingSearchParams(location.search),
        [location.search],
    );
    const initialBookingState = useMemo(
        () => ({
            checkIn: bookingSearchState.checkIn || createDateOffset(1),
            checkOut: bookingSearchState.checkOut || createDateOffset(4),
            guests:
                bookingSearchState.guests.adults > 0
                    ? bookingSearchState.guests
                    : defaultGuestSelection,
        }),
        [bookingSearchState],
    );

    const [checkIn, setCheckIn] = useState(initialBookingState.checkIn);
    const [checkOut, setCheckOut] = useState(initialBookingState.checkOut);
    const [nightOffset, setNightOffset] = useState(0);

    // Fetch booked dates for the next 6 months so calendar shows unavailable days
    useEffect(() => {
        if (!villaId) return;

        const fetchUnavailableDates = async () => {
            try {
                const now = new Date();
                const monthCount = 6;
                const results = await Promise.all(
                    Array.from({ length: monthCount }, (_, offset) => {
                        const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
                        return getListingAvailability(villaId, {
                            month: d.getMonth() + 1,
                            year: d.getFullYear(),
                        });
                    }),
                );

                const booked = results
                    .flatMap((r) => r.days)
                    .filter((d) => !d.isAvailable)
                    .map((d) => d.date);

                setUnavailableDates(booked);
            } catch {
                // Non-critical — calendar degrades gracefully without booked dates
            }
        };

        void fetchUnavailableDates();
    }, [villaId]);
    const [guestSelection, setGuestSelection] = useState<GuestSelection>(
        initialBookingState.guests,
    );

    const todayIso = useMemo(() => toIsoDate(new Date()), []);
    const galleryItems = useMemo(
        () => buildGalleryItems(rawListing, destination),
        [destination, rawListing],
    );
    const amenities = useMemo(
        () => buildAmenityItems(rawListing, destination),
        [destination, rawListing],
    );
    const recommendationSearchState = useMemo<BookingSearchState>(
        () => ({
            q: bookingSearchState.q,
            location: bookingSearchState.location,
            locationGroup: bookingSearchState.locationGroup,
            mapLat: bookingSearchState.mapLat,
            mapLng: bookingSearchState.mapLng,
            mapRadius: bookingSearchState.mapRadius,
            checkIn,
            checkOut,
            guests: guestSelection,
        }),
        [
            bookingSearchState.q,
            bookingSearchState.location,
            bookingSearchState.locationGroup,
            bookingSearchState.mapLat,
            bookingSearchState.mapLng,
            bookingSearchState.mapRadius,
            checkIn,
            checkOut,
            guestSelection,
        ],
    );

    const currentImage =
        galleryItems[selectedImageIndex] ?? galleryItems[0] ?? null;
    const guestCount = guestSelection.adults + guestSelection.children;
    const guestSummary = buildGuestSummary(guestSelection);
    const nights = getNightCount(checkIn, checkOut);
    const nightlyRate = destination?.pricePerNight ?? 0;
    const currentUser = getCurrentUser();
    const listingHostUserId = rawListing?.host?.userId ?? null;
    const isCurrentUserListingHost =
        Boolean(currentUser && listingHostUserId) &&
        String(currentUser?.id) === String(listingHostUserId);
    const canMessageHost = !isCurrentUserListingHost;
    const isListingSaved = destination ? isSaved(destination.id) : false;
    const isListingInQueue = destination
        ? bookingQueue.hasItem(destination.id)
        : false;
    const activeDesktopAnchorRef = (
        activeDesktopField === "checkin"
            ? checkInFieldRef
            : activeDesktopField === "checkout"
                ? checkOutFieldRef
                : guestFieldRef
    ) as RefObject<HTMLElement | null>;

    useEffect(() => {
        if (!villaId) {
            setIsLoading(false);
            setLoadError("Thiếu mã chỗ nghỉ.");
            return;
        }

        let ignore = false;

        const loadDetail = async () => {
            setIsLoading(true);
            setLoadError("");

            try {
                const [listingResult, reviewResult, rules] = await Promise.all([
                    getListingById(villaId),
                    getListingReviews(villaId, { page: 1, limit: 10 }),
                    getListingRules(villaId),
                ]);

                if (ignore) {
                    return;
                }

                if (!listingResult) {
                    setDestination(null);
                    setRawListing(null);
                    return;
                }

                const mappedReviews = reviewResult.items.map((review) => ({
                    id: String(review.reviewId),
                    guestName: review.reviewerName || "Khách lưu trú",
                    date: String(review.createdAt).slice(0, 10),
                    rating: review.rating,
                    content:
                        review.comment || "Khách hàng đã để lại đánh giá cho chỗ nghỉ này.",
                }));

                setDestination(listingResult.destination);
                setRawListing(listingResult.raw);
                setGuestReviews(
                    mappedReviews.length > 0
                        ? mappedReviews
                        : buildFallbackReviews(listingResult.destination),
                );
                setPolicyItems([
                    { label: "Nhận phòng sau", value: rules.checkInFrom },
                    { label: "Trả phòng trước", value: rules.checkOutBefore },
                    {
                        label: "Cho hút thuốc",
                        value: rules.smokingAllowed ? "Có" : "Không",
                    },
                    { label: "Cho thú cưng", value: rules.petsAllowed ? "Có" : "Không" },
                    { label: "Tổ chức tiệc", value: rules.partyAllowed ? "Có" : "Không" },
                    ...(rules.quietHours
                        ? [{ label: "Giờ yên tĩnh", value: rules.quietHours }]
                        : []),
                ]);
            } catch (error) {
                if (!ignore) {
                    setLoadError(
                        error instanceof Error
                            ? error.message
                            : "Không tải được chi tiết chỗ nghỉ.",
                    );
                }
            } finally {
                if (!ignore) {
                    setIsLoading(false);
                }
            }
        };

        void loadDetail();

        return () => {
            ignore = true;
        };
    }, [villaId]);

    useEffect(() => {
        if (destination) {
            addRecentlyViewedListing(destination);
        }
    }, [destination]);

    useEffect(() => {
        setSelectedImageIndex((currentIndex) => {
            if (galleryItems.length === 0) {
                return 0;
            }

            return Math.min(currentIndex, galleryItems.length - 1);
        });
    }, [galleryItems.length]);

    useEffect(() => {
        return () => {
            if (feedbackTimerRef.current !== null) {
                window.clearTimeout(feedbackTimerRef.current);
            }
        };
    }, []);

    useEffect(() => {
        const shouldLockScroll = isGalleryModalOpen || mobileBookingSheet !== null;
        if (!shouldLockScroll) {
            return;
        }

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [isGalleryModalOpen, mobileBookingSheet]);

    useEffect(() => {
        if (!activeDesktopField) {
            return;
        }

        const handleMouseDown = (event: MouseEvent) => {
            const target = event.target as Node;

            if (
                desktopBookingRef.current?.contains(target) ||
                desktopPopoverRef.current?.contains(target)
            ) {
                return;
            }

            setActiveDesktopField(null);
        };

        document.addEventListener("mousedown", handleMouseDown);

        return () => document.removeEventListener("mousedown", handleMouseDown);
    }, [activeDesktopField]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key !== "Escape") {
                return;
            }

            if (isGalleryModalOpen) {
                setIsGalleryModalOpen(false);
                return;
            }

            if (mobileBookingSheet) {
                setMobileBookingSheet(null);
                return;
            }

            if (activeDesktopField) {
                setActiveDesktopField(null);
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [activeDesktopField, isGalleryModalOpen, mobileBookingSheet]);

    const showActionFeedback = (message: string) => {
        setActionFeedback(message);

        if (feedbackTimerRef.current !== null) {
            window.clearTimeout(feedbackTimerRef.current);
        }

        feedbackTimerRef.current = window.setTimeout(() => {
            setActionFeedback(null);
        }, 3200);
    };

    const closeAllBookingPanels = () => {
        setActiveDesktopField(null);
        setMobileBookingSheet(null);
    };

    const handleBack = () => {
        const returnTo = getReturnTarget(locationState);

        if (returnTo) {
            window.sessionStorage.removeItem("popular_return_to");
            navigate(returnTo);
            return;
        }

        navigate(APP_ROUTES.home);
    };

    const handleShare = async () => {
        if (!destination) {
            return;
        }

        const shareUrl = window.location.href;

        try {
            if ("share" in navigator && typeof navigator.share === "function") {
                await navigator.share({
                    title: destination.name,
                    text: `Xem ${destination.name} trên Minh Thành Villa`,
                    url: shareUrl,
                });
                showActionFeedback("Đã mở chia sẻ cho villa này.");
                return;
            }

            await navigator.clipboard.writeText(shareUrl);
            showActionFeedback("Đã sao chép liên kết villa.");
        } catch (error) {
            if (error instanceof DOMException && error.name === "AbortError") {
                return;
            }

            showActionFeedback(
                "Chưa thể chia sẻ lúc này. Bạn thử sao chép lại liên kết sau nhé.",
            );
        }
    };

    const handleToggleSaved = async () => {
        if (!destination) {
            return;
        }

        try {
            const nextSaved = await toggleSaved(destination.id);
            showActionFeedback(
                nextSaved
                    ? "Đã lưu villa vào danh sách xem sau."
                    : "Đã bỏ lưu villa này.",
            );
        } catch {
            showActionFeedback("Không cập nhật được wishlist. Vui lòng thử lại.");
        }
    };

    const handleToggleBookingQueue = () => {
        if (!destination) {
            return;
        }

        if (isListingInQueue) {
            bookingQueue.removeItem(destination.id);
            showActionFeedback("Đã xóa villa khỏi danh sách chờ đặt.");
            return;
        }

        const result = bookingQueue.addItem(
            createBookingQueueItem(destination, {
                checkIn,
                checkOut,
                guests: guestCount,
                guestSummary,
            }),
        );

        if (result.status === "full") {
            showActionFeedback(bookingQueueLimitMessage);
            return;
        }

        if (result.status === "exists") {
            showActionFeedback("Villa này đã có trong danh sách chờ đặt.");
            return;
        }

        showActionFeedback("Đã thêm villa vào danh sách chờ đặt.");
    };

    const handleOpenHostMessage = async () => {
        if (!destination) {
            return;
        }

        if (!currentUser) {
            navigate(
                `${APP_ROUTES.login}?redirectTo=${encodeURIComponent(`${location.pathname}${location.search}`)}`,
            );
            return;
        }

        if (isCurrentUserListingHost) {
            showActionFeedback("Bạn không thể nhắn tin cho chính chỗ nghỉ của mình.");
            return;
        }

        const listingId = rawListing?.listingId ?? Number(destination.id);
        if (!Number.isFinite(Number(listingId))) {
            showActionFeedback("Không xác định được chỗ nghỉ để mở hội thoại.");
            return;
        }

        setIsOpeningConversation(true);
        setActionFeedback(null);

        try {
            const result = await createOrGetConversation(Number(listingId));
            navigate(APP_ROUTES.messages, {
                state: {
                    selectedConversationId: result.conversation.id,
                    returnTo: `${location.pathname}${location.search}`,
                    checkIn,
                    checkOut,
                    guests: guestCount,
                    guestSummary,
                },
            });
        } catch (error) {
            showActionFeedback(
                error instanceof Error
                    ? error.message
                    : "Không mở được hội thoại với host.",
            );
        } finally {
            setIsOpeningConversation(false);
        }
    };

    const handleBookNow = async () => {
        if (!destination) {
            return;
        }

        // If there are items in the booking queue, go to multi-booking checkout
        if (bookingQueue.items.length > 0) {
            if (!checkIn || !checkOut) {
                showActionFeedback("Vui lòng chọn ngày nhận phòng và trả phòng.");
                return;
            }

            navigate(APP_ROUTES.multiBooking, {
                state: {
                    listingId: Number(destination.id),
                    title: destination.name,
                    imageUrl: destination.imageUrl,
                    basePrice: destination.pricePerNight,
                    location: destination.address,
                    checkIn,
                    checkOut,
                    guests: guestCount,
                    guestSummary,
                },
            });
            return;
        }

        // Single booking flow (no queue)
        setIsBooking(true);
        setActionFeedback(null);

        try {
            const booking = await createBooking({
                listingId: Number(destination.id),
                checkIn,
                checkOut,
                guests: guestCount,
            });

            navigate(APP_ROUTES.guestPaymentDetail(String(booking.bookingId)), {
                state: { returnTo: `${location.pathname}${location.search}` },
            });
        } catch (error) {
            showActionFeedback(
                error instanceof Error ? error.message : "Không thể tạo đặt phòng.",
            );
        } finally {
            setIsBooking(false);
        }
    };


    const handleNightOffsetChange = (nextOffset: number) => {
        setNightOffset(nextOffset);

        if (checkIn && nextOffset > 0) {
            setCheckOut(addDaysToIso(checkIn, nextOffset));
            closeAllBookingPanels();
        }
    };

    const handleCheckInChange = (nextDate: string) => {
        setCheckIn(nextDate);

        if (nightOffset > 0) {
            setCheckOut(addDaysToIso(nextDate, nightOffset));
            closeAllBookingPanels();
            return;
        }

        const hasValidCheckout =
            checkOut &&
            new Date(`${checkOut}T00:00:00`).getTime() >
            new Date(`${nextDate}T00:00:00`).getTime();

        setCheckOut(hasValidCheckout ? checkOut : addDaysToIso(nextDate, 1));

        if (mobileBookingSheet === "dates") {
            setMobileDateField("checkout");
        } else {
            setActiveDesktopField("checkout");
        }
    };

    const handleCheckoutChange = (nextDate: string) => {
        if (!checkIn) {
            setCheckIn(nextDate);
            setCheckOut(addDaysToIso(nextDate, 1));
            return;
        }

        const nextCheckoutMs = new Date(`${nextDate}T00:00:00`).getTime();
        const checkInMs = new Date(`${checkIn}T00:00:00`).getTime();

        setCheckOut(
            nextCheckoutMs <= checkInMs ? addDaysToIso(checkIn, 1) : nextDate,
        );
        closeAllBookingPanels();
    };

    const handleAdjustGuest = (
        key: keyof GuestSelection,
        delta: number,
        min: number,
        max: number,
    ) => {
        setGuestSelection((currentSelection) => {
            const nextValue = currentSelection[key] + delta;

            if (nextValue < min || nextValue > max) {
                return currentSelection;
            }

            return {
                ...currentSelection,
                [key]: nextValue,
            };
        });
    };

    const openDateSelection = (field: MobileDateField) => {
        if (isMobileViewport()) {
            setMobileBookingSheet("dates");
            setMobileDateField(field);
            return;
        }

        setActiveDesktopField((currentField) =>
            currentField === field ? null : field,
        );
    };

    const openGuestSelection = () => {
        if (isMobileViewport()) {
            setMobileBookingSheet("guests");
            return;
        }

        setActiveDesktopField((currentField) =>
            currentField === "guests" ? null : "guests",
        );
    };

    const handlePreviousImage = () => {
        if (galleryItems.length === 0) {
            return;
        }

        setSelectedImageIndex((currentIndex) =>
            currentIndex === 0 ? galleryItems.length - 1 : currentIndex - 1,
        );
    };

    const handleNextImage = () => {
        if (galleryItems.length === 0) {
            return;
        }

        setSelectedImageIndex(
            (currentIndex) => (currentIndex + 1) % galleryItems.length,
        );
    };

    const handleGalleryTouchStart = (event: TouchEvent<HTMLElement>) => {
        touchStartXRef.current = event.changedTouches[0]?.clientX ?? null;
    };

    const handleGalleryTouchEnd = (event: TouchEvent<HTMLElement>) => {
        if (touchStartXRef.current === null) {
            return;
        }

        const touchEndX = event.changedTouches[0]?.clientX;
        if (typeof touchEndX !== "number") {
            touchStartXRef.current = null;
            return;
        }

        const delta = touchEndX - touchStartXRef.current;
        touchStartXRef.current = null;

        if (Math.abs(delta) < 42) {
            return;
        }

        if (delta < 0) {
            handleNextImage();
        } else {
            handlePreviousImage();
        }
    };

    if (isLoading) {
        return <StatusCard title="Đang tải chỗ nghỉ..." />;
    }

    if (loadError) {
        return (
            <StatusCard title="Không tải được chỗ nghỉ" description={loadError} />
        );
    }

    if (!destination) {
        return (
            <StatusCard
                title="Không tìm thấy villa"
                action={
                    <button
                        type="button"
                        onClick={() => navigate(APP_ROUTES.home)}
                        className="inline-flex items-center gap-2 rounded-full border border-zinc-300 bg-white px-6 py-3 text-sm font-semibold text-zinc-900 transition-colors hover:bg-zinc-100"
                    >
                        <FaArrowLeft />
                        Về trang chủ
                    </button>
                }
            />
        );
    }

    const hostProfile = buildHostProfile(rawListing, destination);

    return (
        <>
            <section className="bg-[#f4f0eb] pb-16 pt-24 text-zinc-900 sm:pt-28">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <button
                        type="button"
                        onClick={handleBack}
                        className="inline-flex items-center gap-2 rounded-full border border-cyan-100 bg-white/90 px-5 py-2.5 text-sm font-semibold text-zinc-900 shadow-sm transition-colors hover:border-cyan-300 hover:bg-white"
                    >
                        <FaArrowLeft />
                        Quay lại danh sách
                    </button>

                    <div className="mt-6 grid gap-10 xl:grid-cols-[minmax(0,1fr)_340px]">
                        <main className="min-w-0">
                            <header className="space-y-3">
                                <h1 className="text-[1.85rem] font-semibold leading-none tracking-tight text-[#231a12] sm:text-[2.75rem] md:text-[3.35rem]">
                                    {destination.name}
                                </h1>

                                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-zinc-600 sm:text-[15px]">
                                    <div className="inline-flex items-center gap-1.5 text-cyan-600">
                                        {Array.from({ length: 5 }).map((_, index) => (
                                            <FaStar key={index} className="text-sm" />
                                        ))}
                                        <span className="ml-1 font-semibold text-zinc-800">
                                            {destination.rating.toFixed(1)}
                                        </span>
                                    </div>
                                    <span className="h-1 w-1 rounded-full bg-[#cdbcab]" />
                                    <span className="inline-flex items-center gap-2">
                                        <FaMapMarkerAlt className="text-cyan-600" />
                                        {destination.address}
                                    </span>
                                </div>

                                <div className="flex flex-wrap items-center gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={handleShare}
                                        className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#e0d1c1] bg-white/90 px-4 py-2.5 text-sm font-semibold text-zinc-900 shadow-sm transition-colors hover:border-cyan-300 hover:text-cyan-700"
                                    >
                                        <FiShare2 />
                                        Chia sẻ
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleToggleSaved}
                                        disabled={isWishlistLoading}
                                        className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold shadow-sm transition-colors ${isListingSaved
                                            ? "border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
                                            : "border-[#e0d1c1] bg-white/90 text-zinc-900 hover:border-rose-200 hover:text-rose-600"
                                            } disabled:cursor-not-allowed disabled:opacity-60`}
                                    >
                                        <FiHeart
                                            className={isListingSaved ? "fill-current" : undefined}
                                        />
                                        {isWishlistLoading ? "Đang đồng bộ" : isListingSaved ? "Đã lưu" : "Lưu"}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleToggleBookingQueue}
                                        className={`relative inline-flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold shadow-sm transition-colors ${isListingInQueue
                                            ? "border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100"
                                            : "border-[#e0d1c1] bg-white/90 text-zinc-900 hover:border-cyan-300 hover:text-cyan-700"
                                            }`}
                                    >
                                        <FiShoppingBag />
                                        {isListingInQueue ? "✓ Đã thêm vào giỏ" : "Thêm vào giỏ chờ"}
                                        {bookingQueue.items.length > 0 && (
                                            <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-cyan-600 px-1 text-xs font-bold text-white">
                                                {bookingQueue.items.length}
                                            </span>
                                        )}
                                    </button>
                                </div>

                                {actionFeedback || wishlistError ? (
                                    <p className={`rounded-[24px] border px-4 py-3 text-sm font-medium ${wishlistError && !actionFeedback
                                        ? "border-amber-100 bg-amber-50 text-amber-700"
                                        : "border-cyan-100 bg-cyan-50 text-cyan-700"
                                        }`}>
                                        {actionFeedback ?? wishlistError}
                                    </p>
                                ) : null}
                            </header>

                            <ListingGallery
                                items={galleryItems}
                                currentImage={currentImage}
                                selectedIndex={selectedImageIndex}
                                onSelect={setSelectedImageIndex}
                                onPrevious={handlePreviousImage}
                                onNext={handleNextImage}
                                onOpenModal={() => setIsGalleryModalOpen(true)}
                                onTouchStart={handleGalleryTouchStart}
                                onTouchEnd={handleGalleryTouchEnd}
                            />

                            <div className="mt-8 xl:hidden">
                                <BookingCard
                                    variant="mobile"
                                    nightlyRate={nightlyRate}
                                    nights={nights}
                                    guestCount={guestCount}
                                    guestSummary={guestSummary}
                                    checkIn={checkIn}
                                    checkOut={checkOut}
                                    isBooking={isBooking}
                                    activeDesktopField={activeDesktopField}
                                    todayIso={todayIso}
                                    nightOffset={nightOffset}
                                    bookedDates={unavailableDates}
                                    maxGuests={destination.maxGuests}
                                    activeDesktopAnchorRef={activeDesktopAnchorRef}
                                    desktopBookingRef={desktopBookingRef}
                                    desktopPopoverRef={desktopPopoverRef}
                                    desktopDateFieldsRef={desktopDateFieldsRef}
                                    checkInFieldRef={checkInFieldRef}
                                    checkOutFieldRef={checkOutFieldRef}
                                    guestFieldRef={guestFieldRef}
                                    guestSelection={guestSelection}
                                    onOpenDate={openDateSelection}
                                    onOpenGuests={openGuestSelection}
                                    onSelectCheckIn={handleCheckInChange}
                                    onSelectCheckOut={handleCheckoutChange}
                                    onNightOffsetChange={handleNightOffsetChange}
                                    onAdjustGuest={handleAdjustGuest}
                                    onBookNow={handleBookNow}
                                />
                            </div>

                            <section className="mt-10">
                                <h2 className="text-[1.6rem] font-semibold leading-none tracking-tight text-[#231a12] sm:text-[2.2rem]">
                                    Tổng quan
                                </h2>
                                <p className="mt-4 max-w-4xl text-base leading-8 text-zinc-600 sm:text-[17px]">
                                    {buildOverview(destination)}
                                </p>
                            </section>

                            <HostCard
                                host={hostProfile}
                                canMessageHost={canMessageHost}
                                isOpeningConversation={isOpeningConversation}
                                onMessageHost={handleOpenHostMessage}
                            />

                            <ReviewsSection listing={destination} reviews={guestReviews} />

                            {canMessageHost ? (
                                <section className="mt-12">
                                    <div className={`p-5 sm:p-6 ${cardClass}`}>
                                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                            <div className="min-w-0">
                                                <h2 className="text-[1.6rem] font-semibold leading-none tracking-tight text-[#231a12] sm:text-[2.2rem]">
                                                    Nhắn tin cho host
                                                </h2>
                                                <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-600">
                                                    Mở trang nhắn tin riêng để trao đổi về lịch trống,
                                                    nhận phòng hoặc nhu cầu riêng của nhóm bạn.
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleOpenHostMessage}
                                                disabled={isOpeningConversation}
                                                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-cyan-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-cyan-300"
                                            >
                                                <FiMessageCircle />
                                                {isOpeningConversation
                                                    ? "Đang mở..."
                                                    : "Nhắn tin cho host"}
                                            </button>
                                        </div>
                                    </div>
                                </section>
                            ) : null}

                            <section className="mt-12">
                                <h2 className="text-[1.6rem] font-semibold leading-none tracking-tight text-[#231a12] sm:text-[2.2rem]">
                                    Tiện nghi
                                </h2>
                                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                    {amenities.map((amenity) => (
                                        <div
                                            key={amenity.label}
                                            className="flex items-center gap-3 rounded-[26px] border border-[#ece2d7] bg-white px-4 py-4 text-sm font-medium text-zinc-700 shadow-[0_20px_50px_-45px_rgba(71,47,23,0.3)] sm:text-[15px]"
                                        >
                                            <span className="text-cyan-600">{amenity.icon}</span>
                                            {amenity.label}
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <div className="mt-8 xl:hidden">
                                <PoliciesCard policies={policyItems} />
                            </div>
                        </main>

                        <aside className="hidden space-y-6 xl:sticky xl:top-28 xl:block xl:self-start">
                            <BookingCard
                                variant="desktop"
                                nightlyRate={nightlyRate}
                                nights={nights}
                                guestCount={guestCount}
                                guestSummary={guestSummary}
                                checkIn={checkIn}
                                checkOut={checkOut}
                                isBooking={isBooking}
                                activeDesktopField={activeDesktopField}
                                todayIso={todayIso}
                                nightOffset={nightOffset}
                                bookedDates={unavailableDates}
                                maxGuests={destination.maxGuests}
                                activeDesktopAnchorRef={activeDesktopAnchorRef}
                                desktopBookingRef={desktopBookingRef}
                                desktopPopoverRef={desktopPopoverRef}
                                desktopDateFieldsRef={desktopDateFieldsRef}
                                checkInFieldRef={checkInFieldRef}
                                checkOutFieldRef={checkOutFieldRef}
                                guestFieldRef={guestFieldRef}
                                guestSelection={guestSelection}
                                onOpenDate={openDateSelection}
                                onOpenGuests={openGuestSelection}
                                onSelectCheckIn={handleCheckInChange}
                                onSelectCheckOut={handleCheckoutChange}
                                onNightOffsetChange={handleNightOffsetChange}
                                onAdjustGuest={handleAdjustGuest}
                                onBookNow={handleBookNow}
                            />
                            <PoliciesCard policies={policyItems} />
                        </aside>
                    </div>
                </div>
            </section>

            <NearbyRecommendationsSection
                currentListing={destination}
                searchState={recommendationSearchState}
            />

            <MobileBookingSheetPanel
                sheet={mobileBookingSheet}
                mobileDateField={mobileDateField}
                checkIn={checkIn}
                checkOut={checkOut}
                todayIso={todayIso}
                nightOffset={nightOffset}
                bookedDates={unavailableDates}
                maxGuests={destination.maxGuests}
                guestSelection={guestSelection}
                onClose={() => setMobileBookingSheet(null)}
                onDateFieldChange={setMobileDateField}
                onSelectCheckIn={handleCheckInChange}
                onSelectCheckOut={handleCheckoutChange}
                onNightOffsetChange={handleNightOffsetChange}
                onAdjustGuest={handleAdjustGuest}
            />

            {isGalleryModalOpen ? (
                <GalleryModal
                    listingName={destination.name}
                    items={galleryItems}
                    currentImage={currentImage}
                    selectedIndex={selectedImageIndex}
                    onClose={() => setIsGalleryModalOpen(false)}
                    onSelect={setSelectedImageIndex}
                    onPrevious={handlePreviousImage}
                    onNext={handleNextImage}
                    onTouchStart={handleGalleryTouchStart}
                    onTouchEnd={handleGalleryTouchEnd}
                />
            ) : null}
        </>
    );
};

const ListingDetailPage = () => {
    const location = useLocation();
    const { villaId } = useParams();

    return (
        <ListingDetailContent
            key={`${villaId ?? "listing-detail"}-${location.search}`}
            villaId={villaId}
        />
    );
};

export default ListingDetailPage;
