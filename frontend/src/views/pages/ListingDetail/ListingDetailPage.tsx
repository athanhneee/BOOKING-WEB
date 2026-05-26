import { useEffect, useMemo, useRef, useState, type ReactNode, type RefObject, type TouchEvent } from "react";
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
import { FiCalendar, FiHeart, FiMessageCircle, FiShare2, FiShoppingBag, FiUsers } from "react-icons/fi";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import type { ApiListingDetail, PopularDestination } from "../../../models/entities/Listing";
import { APP_ROUTES } from "../../../config/routes";
import {
    createBookingQueueItem,
} from "../../../features/bookingQueue/bookingQueueStorage";
import { useBookingQueue } from "../../../features/bookingQueue/useBookingQueue";
import { addRecentlyViewedListing } from "../../../features/recentlyViewed/recentlyViewedStorage";
import NearbyRecommendationsSection from "../../../features/recommendations/NearbyRecommendationsSection";
import { useSavedListings } from "../../../features/wishlist/useSavedListings";
import { createBooking } from "../../../services/bookingService";
import { createOrGetConversation } from "../../../services/api/conversationsApi";
import { getListingById, getListingReviews, getListingRules } from "../../../services/listingService";
import { getCurrentUser } from "../../../store/authStore";
import SearchPopover from "../../components/search/SearchPopover";
import DatePickerPanel from "../../components/search/booking/DatePickerPanel";
import type { GuestSelection } from "../../components/search/booking/Guest";
import {
    buildGuestSummary as buildSearchGuestSummary,
    defaultGuestSelection as defaultSearchGuestSelection,
    guestFieldConfigs as sharedGuestFieldConfigs,
    parseBookingSearchParams,
    toIsoDate,
    type BookingSearchState,
} from "../../components/search/searchState";

type ListingDetailLocationState = {
    returnTo?: string;
};

type ReviewMetric = {
    label: string;
    score: number;
};

type PolicyItem = {
    label: string;
    value?: string;
};

type BookingField = "checkin" | "checkout" | "guest" | null;
type MobileBookingSheet = "dates" | "guests" | null;

type GalleryItem = {
    id: string;
    imageUrl: string;
    label: string;
    placeholder: boolean;
};

type HostProfile = {
    name: string;
    avatarUrl?: string;
    verified: boolean;
    listingCount: number;
    joinedYear: number;
    bio: string;
};

type GuestReview = {
    id: string;
    guestName: string;
    date: string;
    rating: number;
    content: string;
};


const currencyFormatter = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
});

const sidebarCardClass =
    "rounded-2xl border border-[#e8ddd1] bg-white p-1 shadow-[0_30px_80px_-48px_rgba(71,47,23,0.38)] sm:p-4";

const mobileCardClass =
    "rounded-2xl border border-[#e8ddd1] bg-white p-5 shadow-[0_28px_70px_-44px_rgba(71,47,23,0.32)] sm:p-6";

const accentBadgeClass = "border border-cyan-100 bg-cyan-50 text-cyan-600";

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

const buildAiImageLabel = (image: ApiListingDetail["images"][number], index: number) => {
    const directTitle = image.displayTitle ?? image.display_title ?? image.aiDisplayTitle;

    if (directTitle?.trim()) {
        return directTitle.trim();
    }

    const imageType = image.aiImageType ?? image.ai_image_type;

    if (imageType && aiImageTypeTitleMap[imageType]) {
        return aiImageTypeTitleMap[imageType];
    }

    const description = image.aiDescription ?? image.ai_description;

    if (description?.trim()) {
        return description.trim().length > 42 ? `${description.trim().slice(0, 41)}…` : description.trim();
    }

    return `Ảnh chỗ nghỉ ${index + 1}`;
};
const hostProfiles: HostProfile[] = [
    {
        name: "Minh Thành",
        verified: true,
        listingCount: 12,
        joinedYear: 2021,
        bio: "Chủ nhà tại Vũng Tàu, ưu tiên phản hồi nhanh và chuẩn bị không gian nghỉ dưỡng riêng tư cho gia đình, nhóm bạn.",
    },
    {
        name: "Thư Host",
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

const getListingSeedNumber = (listingId: string) => {
    const matchedNumber = listingId.match(/\d+/)?.[0];
    const parsed = Number.parseInt(matchedNumber ?? "1", 10);
    return Number.isFinite(parsed) ? parsed : 1;
};

const getHostProfile = (listing: PopularDestination): HostProfile => {
    const seedNumber = getListingSeedNumber(listing.id);
    const profile = hostProfiles[seedNumber % hostProfiles.length];

    return {
        ...profile,
        listingCount: Math.max(profile.listingCount, Math.min(18, listing.bedrooms + seedNumber + 2)),
        verified: profile.verified || listing.rating >= 4.8,
    };
};

const getInitials = (name: string) =>
    name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase() || "H";

const isTechnicalImageLabel = (value?: string | null) => {
    const label = value?.trim();

    if (!label) {
        return true;
    }

    if (/^https?:\/\//i.test(label) || label.includes("/")) {
        return true;
    }

    return /\.(jpe?g|png|webp|gif|avif|heic)$/i.test(label) || /^z\d{6,}/i.test(label);
};

const getFriendlyImageLabel = (
    image: ApiListingDetail["images"][number] & {
        display_title?: string | null;
        alt_text?: string | null;
    },
    index: number,
) => {
    const candidates = [
        image.displayTitle,
        image.display_title,
        image.caption,
        image.altText,
        image.alt_text,
    ];
    const friendly = candidates.find((candidate) => !isTechnicalImageLabel(candidate));

    return friendly?.trim() || `Ảnh chỗ nghỉ ${index + 1}`;
};

const buildGuestReviews = (listing: PopularDestination): GuestReview[] => {
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
            content: "Không gian đúng như mô tả, bếp và khu nghỉ ngơi đủ tiện nghi. Nhóm mình thích nhất phần sân và vị trí gần các điểm ăn uống.",
        },
    ];
};


const formatDateInput = (date: Date) => {
    const safeDate = new Date(date);
    safeDate.setHours(12, 0, 0, 0);
    const year = safeDate.getFullYear();
    const month = String(safeDate.getMonth() + 1).padStart(2, "0");
    const day = String(safeDate.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
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
    const differenceInMs = end.getTime() - start.getTime();
    const differenceInDays = Math.round(differenceInMs / (1000 * 60 * 60 * 24));
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

const getOverview = (name: string, address: string) => {
    return `${name} là villa nghỉ dưỡng riêng tư tại ${address}, nổi bật với hồ bơi riêng, khoảng sân thoáng, khu bếp tiện nghi và không gian sinh hoạt phù hợp cho gia đình hoặc nhóm bạn. Thiết kế ưu tiên ánh sáng tự nhiên, cảm giác thư giãn và sự riêng tư để mỗi kỳ nghỉ luôn trọn vẹn và dễ chịu hơn.`;
};

const isMobileViewport = () => window.matchMedia("(max-width: 1279.98px)").matches;

type BookingSelectionFieldProps = {
    label: string;
    value: string;
    icon: ReactNode;
    isActive: boolean;
    onClick: () => void;
    buttonRef?: RefObject<HTMLButtonElement | null>;
};

const BookingSelectionField = ({
    label,
    value,
    icon,
    isActive,
    onClick,
    buttonRef,
}: BookingSelectionFieldProps) => (
    <button
        ref={buttonRef}
        type="button"
        onClick={onClick}
        className={`flex w-full items-start gap-3 rounded-[24px] border px-4 py-4 text-left transition-all duration-200 ${isActive
            ? "border-cyan-300 bg-cyan-50/70 shadow-[0_18px_35px_-28px_rgba(15,23,42,0.32)] ring-1 ring-cyan-200"
            : "border-slate-200 bg-white hover:border-cyan-200 hover:bg-slate-50/70"
            }`}
    >
        <span
            className={`mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${isActive ? "bg-cyan-100 text-cyan-700" : "bg-slate-50 text-slate-500"
                }`}
        >
            {icon}
        </span>

        <span className="min-w-0 flex-1">
            <span className="block text-xs font-semibold text-gray-800">{label}</span>
            <span className="mt-1 block text-[1.05rem] font-semibold tracking-tight text-zinc-900">{value}</span>
        </span>
    </button>
);

type ListingDetailContentProps = {
    villaId?: string;
};

const ListingDetailContent = ({ villaId }: ListingDetailContentProps) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [destination, setDestination] = useState<PopularDestination | null>(null);
    const [rawListing, setRawListing] = useState<ApiListingDetail | null>(null);
    const [guestReviews, setGuestReviews] = useState<GuestReview[]>([]);
    const [policyItems, setPolicyItems] = useState<PolicyItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [isBooking, setIsBooking] = useState(false);
    const [isOpeningConversation, setIsOpeningConversation] = useState(false);
    const bookingSearchState = useMemo(() => parseBookingSearchParams(location.search), [location.search]);
    const initialBookingState = useMemo(() => {
        return {
            checkIn: bookingSearchState.checkIn || createDateOffset(1),
            checkOut: bookingSearchState.checkOut || createDateOffset(4),
            guests: bookingSearchState.guests.adults > 0 ? bookingSearchState.guests : defaultSearchGuestSelection,
        };
    }, [bookingSearchState]);

    const [checkIn, setCheckIn] = useState(initialBookingState.checkIn);
    const [checkOut, setCheckOut] = useState(initialBookingState.checkOut);
    const [nightOffset, setNightOffset] = useState(0);
    const [guestSelection, setGuestSelection] = useState<GuestSelection>(initialBookingState.guests);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
    const [activeDesktopField, setActiveDesktopField] = useState<BookingField>(null);
    const [mobileBookingSheet, setMobileBookingSheet] = useState<MobileBookingSheet>(null);
    const [mobileDateField, setMobileDateField] = useState<"checkin" | "checkout">("checkin");
    const [actionFeedback, setActionFeedback] = useState<string | null>(null);
    const { isSaved, toggleSaved } = useSavedListings();
    const bookingQueue = useBookingQueue();

    const desktopBookingRef = useRef<HTMLDivElement | null>(null);
    const desktopPopoverRef = useRef<HTMLDivElement | null>(null);
    const desktopDateFieldsRef = useRef<HTMLDivElement | null>(null);
    const checkInFieldRef = useRef<HTMLButtonElement | null>(null);
    const checkOutFieldRef = useRef<HTMLButtonElement | null>(null);
    const guestFieldRef = useRef<HTMLButtonElement | null>(null);
    const feedbackTimerRef = useRef<number | null>(null);
    const touchStartXRef = useRef<number | null>(null);
    const todayIso = useMemo(() => toIsoDate(new Date()), []);
    const recommendationSearchState = useMemo<BookingSearchState>(() => ({
        location: bookingSearchState.location,
        checkIn,
        checkOut,
        guests: guestSelection,
    }), [bookingSearchState.location, checkIn, checkOut, guestSelection]);
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

                if (ignore) return;

                if (!listingResult) {
                    setDestination(null);
                    setRawListing(null);
                    return;
                }

                setDestination(listingResult.destination);
                setRawListing(listingResult.raw);

                const mappedReviews = reviewResult.items.map((review) => ({
                    id: String(review.reviewId),
                    guestName: review.reviewerName || "Khách lưu trú",
                    date: String(review.createdAt).slice(0, 10),
                    rating: review.rating,
                    content: review.comment || "Khách hàng đã để lại đánh giá cho chỗ nghỉ này.",
                }));

                setGuestReviews(mappedReviews.length > 0 ? mappedReviews : buildGuestReviews(listingResult.destination));

                setPolicyItems([
                    { label: "Nhận phòng sau", value: rules.checkInFrom },
                    { label: "Trả phòng trước", value: rules.checkOutBefore },
                    { label: "Cho hút thuốc", value: rules.smokingAllowed ? "Có" : "Không" },
                    { label: "Cho thú cưng", value: rules.petsAllowed ? "Có" : "Không" },
                    { label: "Tổ chức tiệc", value: rules.partyAllowed ? "Có" : "Không" },
                    ...(rules.quietHours ? [{ label: "Giờ yên tĩnh", value: rules.quietHours }] : []),
                ]);
            } catch (error) {
                if (ignore) return;

                setLoadError(error instanceof Error ? error.message : "Không tải được chi tiết chỗ nghỉ.");
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

    const handleBack = () => {
        const state = location.state as ListingDetailLocationState | null;
        const fromState = state?.returnTo;
        const fromStorage = sessionStorage.getItem("popular_return_to");
        const returnTo = fromState || fromStorage;

        if (returnTo) {
            sessionStorage.removeItem("popular_return_to");
            navigate(returnTo);
            return;
        }

        navigate(APP_ROUTES.home);
    };

    const showActionFeedback = (message: string) => {
        setActionFeedback(message);

        if (feedbackTimerRef.current !== null) {
            window.clearTimeout(feedbackTimerRef.current);
        }

        feedbackTimerRef.current = window.setTimeout(() => {
            setActionFeedback(null);
        }, 3200);
    };
    if (isLoading) {
        return (
            <section className="mx-auto max-w-3xl px-4 py-28 text-center sm:px-6">
                <h1 className="text-3xl font-bold text-zinc-900">Đang tải chỗ nghỉ...</h1>
            </section>
        );
    }

    if (loadError) {
        return (
            <section className="mx-auto max-w-3xl px-4 py-28 text-center sm:px-6">
                <h1 className="text-3xl font-bold text-zinc-900">Không tải được chỗ nghỉ </h1>
                <p className="mt-3 text-sm text-zinc-500">{loadError}</p>
            </section>
        );
    }
    if (!destination) {
        return (
            <section className="mx-auto max-w-3xl px-4 py-28 text-center sm:px-6">
                <h1 className="text-3xl font-bold text-zinc-900">Không tìm thấy villa</h1>
                <button
                    type="button"
                    onClick={() => navigate(APP_ROUTES.home)}
                    className="mt-6 inline-flex items-center gap-2 rounded-xl border border-zinc-300 bg-white px-6 py-3 text-sm font-semibold text-zinc-900 transition-colors hover:bg-zinc-100"
                >
                    <FaArrowLeft />
                    Về trang chủ
                </button>
            </section>
        );
    }

    const galleryItems: GalleryItem[] = (rawListing?.images ?? [])
        .filter((image) => Boolean(image.url))
        .sort((left, right) => Number(Boolean(right.isCover)) - Number(Boolean(left.isCover)) || left.sortOrder - right.sortOrder)
        .map((image, index) => ({
            id: String(image.imageId ?? `${destination.id}-${index}`),
            imageUrl: image.url,
            label: buildAiImageLabel(image, index),
            placeholder: false,
        }));
    const hasGalleryImages = galleryItems.length > 0;

    const currentImage = galleryItems[selectedImageIndex] ?? galleryItems[0];
    const reviewMetrics: ReviewMetric[] = [
        { label: "Vị trí", score: destination.rating },
        { label: "Sạch sẽ", score: Math.max(4.6, destination.rating - 0.1) },
        { label: "Tiện nghi", score: Math.max(4.7, destination.rating - 0.05) },
    ];

    const amenities = [
        { icon: <FaSwimmingPool />, label: "Hồ bơi riêng" },
        { icon: <FaWifi />, label: "Wi-Fi tốc độ cao" },
        { icon: <FaUtensils />, label: "Bếp đầy đủ tiện nghi" },
        { icon: <FaFireAlt />, label: "Khu BBQ ngoài trời" },
        { icon: <FaSnowflake />, label: "Điều hòa tất cả phòng" },
        { icon: <FaCarSide />, label: "Chỗ đậu xe miễn phí" },
    ];



    const nights = getNightCount(checkIn, checkOut);
    const nightlyRate = destination.pricePerNight;
    const totalPrice = nightlyRate * nights;
    const stayingGuestCount = guestSelection.adults + guestSelection.children;
    const guestSummary = buildSearchGuestSummary(guestSelection);
    const hostProfile: HostProfile = rawListing?.host
        ? {
            name: rawListing.host.name || "Chủ nhà",
            avatarUrl: rawListing.host.avatarUrl ?? undefined,
            verified: true,
            listingCount: 1,
            joinedYear: new Date().getFullYear(),
            bio: "Chủ nhà.",
        }
        : getHostProfile(destination);

    const reviewCount = guestReviews.length;
    const averageReviewScore = reviewCount > 0
        ? guestReviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount
        : destination.rating;
    const currentQueueItem = createBookingQueueItem(destination, {
        checkIn,
        checkOut,
        guests: stayingGuestCount,
        guestSummary,
    });
    const isListingSaved = isSaved(destination.id);
    const isListingInQueue = bookingQueue.hasItem(destination.id);
    const currentUser = getCurrentUser();
    const listingHostUserId = rawListing?.host?.userId ?? null;
    const isCurrentUserListingHost =
        Boolean(currentUser && listingHostUserId) &&
        String(currentUser?.id) === String(listingHostUserId);
    const showHostMessageAction = !isCurrentUserListingHost;
    const activeDesktopAnchorRef = (
        activeDesktopField === "checkin"
            ? checkInFieldRef
            : activeDesktopField === "checkout"
                ? checkOutFieldRef
                : guestFieldRef
    ) as RefObject<HTMLElement | null>;

    const handleShare = async () => {
        const shareUrl = window.location.href;

        try {
            if ("share" in navigator && typeof navigator.share === "function") {
                await navigator.share({
                    title: destination.name,
                    text: `Xem ${destination.name} trên minh thanh villa`,
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

            showActionFeedback("Chưa thể chia sẻ lúc này. Bạn thử sao chép lại liên kết sau nhé.");
        }
    };

    const handleToggleSaved = () => {
        const nextSaved = toggleSaved(destination.id);
        showActionFeedback(nextSaved ? "Đã lưu villa vào danh sách xem sau." : "Đã bỏ lưu villa này.");
    };

    const handleToggleBookingQueue = () => {
        if (isListingInQueue) {
            bookingQueue.removeItem(destination.id);
            showActionFeedback("Đã xóa villa khỏi danh sách chờ đặt.");
            return;
        }

        const result = bookingQueue.addItem(currentQueueItem);
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

    const openHostMessage = async () => {
        if (!currentUser) {
            navigate(`${APP_ROUTES.login}?redirectTo=${encodeURIComponent(`${location.pathname}${location.search}`)}`);
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
                    guests: stayingGuestCount,
                    guestSummary,
                },
            });
        } catch (error) {
            showActionFeedback(error instanceof Error ? error.message : "Không mở được hội thoại với host.");
        } finally {
            setIsOpeningConversation(false);
        }
    };

    const handleBookNow = async () => {
        if (!destination) return;

        setIsBooking(true);
        setActionFeedback(null);

        try {
            const booking = await createBooking({
                listingId: Number(destination.id),
                checkInDate: checkIn,
                checkOutDate: checkOut,
                guestCount: guestSelection.adults + guestSelection.children,
            });

            navigate(APP_ROUTES.guestPaymentDetail(String(booking.bookingId)), {
                state: {
                    returnTo: `${location.pathname}${location.search}`,
                },
            });
        } catch (error) {
            showActionFeedback(error instanceof Error ? error.message : "Không thể tạo đặt phòng.");
        } finally {
            setIsBooking(false);
        }
    };

    const closeAllBookingPanels = () => {
        setActiveDesktopField(null);
        setMobileBookingSheet(null);
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

        const hasValidCheckout = checkOut && new Date(`${checkOut}T00:00:00`).getTime() > new Date(`${nextDate}T00:00:00`).getTime();
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

        if (new Date(`${nextDate}T00:00:00`).getTime() <= new Date(`${checkIn}T00:00:00`).getTime()) {
            setCheckOut(addDaysToIso(checkIn, 1));
        } else {
            setCheckOut(nextDate);
        }

        closeAllBookingPanels();
    };

    const handleAdjustGuest = (key: keyof GuestSelection, delta: number, min: number, max: number) => {
        setGuestSelection((current) => {
            const nextValue = current[key] + delta;
            if (nextValue < min || nextValue > max) {
                return current;
            }

            return {
                ...current,
                [key]: nextValue,
            };
        });
    };

    const openDateSelection = (field: "checkin" | "checkout") => {
        if (isMobileViewport()) {
            setMobileBookingSheet("dates");
            setMobileDateField(field);
            return;
        }

        setActiveDesktopField((current) => (current === field ? null : field));
    };

    const openGuestSelection = () => {
        if (isMobileViewport()) {
            setMobileBookingSheet("guests");
            return;
        }

        setActiveDesktopField((current) => (current === "guest" ? null : "guest"));
    };

    const handlePreviousImage = () => {
        if (galleryItems.length === 0) {
            return;
        }

        setSelectedImageIndex((currentIndex) => (currentIndex === 0 ? galleryItems.length - 1 : currentIndex - 1));
    };

    const handleNextImage = () => {
        if (galleryItems.length === 0) {
            return;
        }

        setSelectedImageIndex((currentIndex) => (currentIndex + 1) % galleryItems.length);
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

    const renderGuestControls = (compact: boolean) => {
        return sharedGuestFieldConfigs.map((field) => {
            const currentValue = guestSelection[field.key];
            const disableMinus = currentValue <= field.min;
            const disablePlus = currentValue >= field.max;

            return (
                <div
                    key={field.key}
                    className={`grid items-center gap-4 ${compact ? "grid-cols-[minmax(160px,1fr)_auto] py-3" : "grid-cols-[1fr_auto] py-4"
                        }`}
                >
                    <div>
                        <p className={`${compact ? "text-sm" : "text-base"} font-semibold text-gray-900`}>{field.label}</p>
                        <p className={`${compact ? "text-xs" : "text-sm"} text-gray-500`}>{field.description}</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            disabled={disableMinus}
                            onClick={() => handleAdjustGuest(field.key, -1, field.min, field.max)}
                            className={`inline-flex items-center justify-center rounded-full border border-gray-300 text-gray-600 transition-colors hover:border-cyan-300 hover:text-cyan-700 disabled:cursor-not-allowed disabled:opacity-35 ${compact ? "h-9 w-9" : "h-10 w-10"}`}
                            aria-label={`Giảm ${field.label}`}
                        >
                            <FaMinus size={10} />
                        </button>

                        <span className="w-6 text-center text-sm font-semibold text-gray-900">{currentValue}</span>

                        <button
                            type="button"
                            disabled={disablePlus}
                            onClick={() => handleAdjustGuest(field.key, 1, field.min, field.max)}
                            className={`inline-flex items-center justify-center rounded-full border border-gray-300 text-gray-600 transition-colors hover:border-cyan-300 hover:text-cyan-700 disabled:cursor-not-allowed disabled:opacity-35 ${compact ? "h-9 w-9" : "h-10 w-10"}`}
                            aria-label={`Tăng ${field.label}`}
                        >
                            <FaPlus size={10} />
                        </button>
                    </div>
                </div>
            );
        });
    };

    const renderUnifiedBookingCard = (variant: "mobile" | "desktop") => {
        const isDesktop = variant === "desktop";
        const showDatePopover = isDesktop && (activeDesktopField === "checkin" || activeDesktopField === "checkout");
        const showGuestPopover = isDesktop && activeDesktopField === "guest";
        const cardClass = isDesktop ? sidebarCardClass : mobileCardClass;

        return (
            <>
                <div ref={isDesktop ? desktopBookingRef : null} className={cardClass}>
                    <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                                <p className="text-[2rem] font-semibold tracking-tight text-[#231a12]">
                                    {currencyFormatter.format(nightlyRate)}
                                </p>
                                <span className="text-sm text-black">/ đêm</span>
                            </div>

                            <p className="mt-1 whitespace-nowrap text-sm text-black">
                                Giá linh hoạt theo thời gian lưu trú.
                            </p>
                        </div>

                        <div className={`inline-flex items-center gap-2 rounded-full px-1 py-1.5 text-xs font-bold border border-cyan-100 bg-cyan-50 text-cyan-600 ${accentBadgeClass}`}>
                            <FiUsers className="text-sm" />
                            {stayingGuestCount} khách
                        </div>
                    </div>

                    <div ref={isDesktop ? desktopDateFieldsRef : null} className="mt-3 grid gap-2 sm:grid-cols-1">
                        <BookingSelectionField
                            label="Nhận phòng"
                            value={formatFieldDate(checkIn)}
                            icon={<FiCalendar size={18} />}
                            isActive={activeDesktopField === "checkin" && isDesktop}
                            onClick={() => openDateSelection("checkin")}
                            buttonRef={isDesktop ? checkInFieldRef : undefined}
                        />

                        <BookingSelectionField
                            label="Trả phòng"
                            value={formatFieldDate(checkOut)}
                            icon={<FiCalendar size={18} />}
                            isActive={activeDesktopField === "checkout" && isDesktop}
                            onClick={() => openDateSelection("checkout")}
                            buttonRef={isDesktop ? checkOutFieldRef : undefined}
                        />
                    </div>

                    <div className="mt-3">
                        <BookingSelectionField
                            label="Khách"
                            value={guestSummary}
                            icon={<FiUsers size={18} />}
                            isActive={showGuestPopover}
                            onClick={openGuestSelection}
                            buttonRef={isDesktop ? guestFieldRef : undefined}
                        />
                    </div>

                    <div className="mt-6 rounded-2xl border border-cyan-100 bg-cyan-50/40 p-4">
                        <div className="flex items-center justify-between gap-4 text-sm text-black">
                            <span className="font-bold">Kỳ nghỉ của bạn</span>
                            <span>{nights} đêm</span>
                        </div>

                        <div className="mt-5 flex items-end justify-between gap-4">
                            <div>
                                <p className="text-[1.9rem] font-semibold tracking-tight text-[#231a12]">{currencyFormatter.format(totalPrice)}</p>
                                <p className="mt-1 text-xs text-black">
                                    {currencyFormatter.format(nightlyRate)} x {nights} đêm
                                </p>
                            </div>

                            <div className={`inline-flex items-center gap-2 rounded-full px-1 py-1.5 text-xs font-bold border border-cyan-100 bg-cyan-50 text-cyan-600 ${accentBadgeClass}`}>
                                <FiUsers className="text-sm" />
                                {stayingGuestCount} khách
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleBookNow}
                        disabled={isBooking}
                        className="mt-6 inline-flex min-h-14 w-full items-center justify-center rounded-xl bg-cyan-600 px-6 text-base font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5 hover:bg-cyan-700"
                    >
                        {isBooking ? "Đang tạo đặt phòng..." : "Đặt ngay"}
                    </button>

                    <p className="mt-3 text-center text-sm text-black">Chưa trừ tiền ngay</p>

                    <div className="mt-6 border-t border-[#ece2d8] pt-4">
                        <div className="flex items-center justify-between gap-4">
                            <span className="text-sm text-black">Tổng {nights} đêm</span>
                            <span className="text-[1.75rem] font-semibold tracking-tight text-[#231a12]">
                                {currencyFormatter.format(totalPrice)}
                            </span>
                        </div>

                        <div className="mt-4 flex items-center gap-2 rounded-xl bg-cyan-50 px-3 py-3 text-xs font-medium text-zinc-600">
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
                            key={`desktop-shared-${activeDesktopField}-${checkIn}-${checkOut}`}
                            isOpen
                            selectedDate={activeDesktopField === "checkin" ? checkIn : checkOut}
                            minDate={activeDesktopField === "checkin" ? todayIso : checkIn || todayIso}
                            rangeStartDate={checkIn}
                            rangeEndDate={checkOut}
                            activeField={activeDesktopField === "checkout" ? "checkOut" : "checkIn"}
                            selectedNightOffset={nightOffset}
                            onSelectDate={activeDesktopField === "checkin" ? handleCheckInChange : handleCheckoutChange}
                            onNightOffsetChange={handleNightOffsetChange}
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
                        <div className="rounded-[30px] border border-black/5 bg-white p-5 shadow-[0_36px_85px_-46px_rgba(15,23,42,0.38)]">
                            <p className="text-base font-semibold text-gray-900">Bạn đi cùng ai?</p>
                            <p className="mt-1 text-sm text-gray-500">Tối đa 16 khách, chưa tính em bé và thú cưng.</p>

                            <div className="mt-5 space-y-4">{renderGuestControls(true)}</div>
                        </div>
                    </SearchPopover>
                ) : null}
            </>
        );
    };

    const renderPoliciesCard = () => {
        return (
            <div className={sidebarCardClass}>
                <h2 className="text-[2.1rem] leading-none tracking-tight text-[#231a12]">
                    Chính sách villa
                </h2>

                <div className="mt-6 space-y-4">
                    {policyItems.map((policy) => (
                        <div key={policy.label} className="flex items-start gap-3 text-sm text-zinc-700 sm:text-[15px]">
                            <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-600 text-[10px] text-white">
                                <FaCheckCircle />
                            </span>
                            <span>
                                {policy.label}
                                {policy.value ? <strong className="ml-1 font-semibold text-zinc-900">{policy.value}</strong> : null}
                            </span>
                        </div>
                    ))}
                </div>






            </div>
        );
    };

    return (
        <>
            <section className="bg-[#f4f0eb] pb-16 pt-24 text-zinc-900 sm:pt-28">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <button
                        type="button"
                        onClick={handleBack}
                        className="inline-flex items-center gap-2 rounded-full border border-cyan-100 bg-white/90 px-5 py-2.5 text-sm font-semibold text-zinc-900 transition-colors hover:border-cyan-300 hover:bg-white"
                    >
                        <FaArrowLeft />
                        Quay lại danh sách
                    </button>

                    <div className="mt-6 grid gap-10 xl:grid-cols-[minmax(0,1fr)_340px]">
                        <div className="min-w-0">
                            <header className="space-y-3">
                                <h1
                                    className="text-[2.75rem] leading-none tracking-tight text-[#231a12] sm:text-[3.35rem]"
                                >
                                    {destination.name}
                                </h1>

                                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-zinc-600 sm:text-[15px]">
                                    <div className="inline-flex items-center gap-1.5 text-cyan-600">
                                        {Array.from({ length: 5 }).map((_, index) => (
                                            <FaStar key={index} className="text-sm" />
                                        ))}
                                        <span className="ml-1 font-semibold text-zinc-800">{destination.rating.toFixed(1)}</span>
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
                                        className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#e0d1c1] bg-white/90 px-4 py-2.5 text-sm font-semibold text-zinc-900 transition-colors hover:border-cyan-300 hover:text-cyan-700"
                                    >
                                        <FiShare2 />
                                        Chia sẻ
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleToggleSaved}
                                        className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition-colors ${isListingSaved
                                            ? "border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
                                            : "border-[#e0d1c1] bg-white/90 text-zinc-900 hover:border-rose-200 hover:text-rose-600"
                                            }`}
                                    >
                                        <FiHeart className={isListingSaved ? "fill-current" : undefined} />
                                        {isListingSaved ? "Đã lưu" : "Lưu"}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleToggleBookingQueue}
                                        className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition-colors ${isListingInQueue
                                            ? "border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100"
                                            : "border-[#e0d1c1] bg-white/90 text-zinc-900 hover:border-cyan-300 hover:text-cyan-700"
                                            }`}
                                    >
                                        <FiShoppingBag />
                                        {isListingInQueue ? "Đã chờ đặt" : "Danh sách chờ đặt"}
                                    </button>
                                </div>

                                {actionFeedback ? (
                                    <p className="rounded-xl border border-cyan-100 bg-cyan-50 px-4 py-3 text-sm font-medium text-cyan-700">
                                        {actionFeedback}
                                    </p>
                                ) : null}
                            </header>

                            <div className="mt-6">
                                <div
                                    className="group relative overflow-hidden rounded-2xl bg-[#ded4c9] [touch-action:pan-y]"
                                    onTouchStart={handleGalleryTouchStart}
                                    onTouchEnd={handleGalleryTouchEnd}
                                >
                                    {hasGalleryImages ? (
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

                                    <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-zinc-900 shadow-lg">
                                        <span>
                                            {hasGalleryImages ? `${selectedImageIndex + 1}/${galleryItems.length}` : "Chưa có ảnh"}
                                        </span>
                                        {currentImage?.placeholder ? <span className="text-black">Ảnh demo</span> : null}
                                    </div>

                                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 sm:pl-4">
                                        <button
                                            type="button"
                                            onClick={handlePreviousImage}
                                            disabled={!hasGalleryImages}
                                            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/92 text-zinc-900 shadow-lg transition-transform hover:scale-105"
                                            aria-label="Xem ảnh trước"
                                        >
                                            <FaChevronLeft />
                                        </button>
                                    </div>

                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 sm:pr-4">
                                        <button
                                            type="button"
                                            onClick={handleNextImage}
                                            disabled={!hasGalleryImages}
                                            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/92 text-zinc-900 shadow-lg transition-transform hover:scale-105"
                                            aria-label="Xem ảnh tiếp theo"
                                        >
                                            <FaChevronRight />
                                        </button>
                                    </div>

                                    <div className="absolute bottom-4 right-4">
                                        <button
                                            type="button"
                                            onClick={() => hasGalleryImages && setIsGalleryModalOpen(true)}
                                            disabled={!hasGalleryImages}
                                            className="inline-flex items-center gap-2 rounded-full bg-white/92 px-4 py-2.5 text-sm font-semibold text-zinc-900 shadow-lg transition-transform hover:-translate-y-0.5"
                                        >
                                            Xem tất cả ảnh
                                            <FaChevronRight className="text-xs" />
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-4 flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                                    {galleryItems.map((item, index) => {
                                        const isActive = index === selectedImageIndex;

                                        return (
                                            <button
                                                key={item.id}
                                                type="button"
                                                onClick={() => setSelectedImageIndex(index)}
                                                className={`relative h-[88px] min-w-[112px] overflow-hidden rounded-xl border transition-all sm:h-24 sm:min-w-[138px] ${isActive ? "border-cyan-600 ring-2 ring-cyan-600/20" : "border-[#e0d1c1]"
                                                    }`}
                                            >
                                                <img src={item.imageUrl} alt={item.label} className="h-full w-full object-cover" />

                                                {item.placeholder ? (
                                                    <span className="absolute bottom-2 left-2 rounded-full bg-white/92 px-2 py-1 text-[10px] font-semibold text-zinc-900">
                                                        Thêm sau
                                                    </span>
                                                ) : null}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="mt-8 xl:hidden">{renderUnifiedBookingCard("mobile")}</div>

                            <section className="mt-10">
                                <h2 className="text-[2.2rem] leading-none tracking-tight text-[#231a12]">
                                    Tổng quan
                                </h2>
                                <p className="mt-4 max-w-4xl text-base leading-8 text-zinc-600 sm:text-[17px]">
                                    {getOverview(destination.name, destination.address)}
                                </p>
                            </section>

                            <section className="mt-12">
                                <h2 className="text-[2.2rem] leading-none tracking-tight text-[#231a12]">
                                    Thông tin host
                                </h2>

                                <div className="mt-5 rounded-2xl border border-[#e8ddd1] bg-white p-5 shadow-[0_30px_80px_-50px_rgba(71,47,23,0.38)] sm:p-6">
                                    <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                                        {hostProfile.avatarUrl ? (
                                            <img
                                                src={hostProfile.avatarUrl}
                                                alt={hostProfile.name}
                                                className="h-20 w-20 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-cyan-600 text-xl font-bold text-white">
                                                {getInitials(hostProfile.name)}
                                            </div>
                                        )}

                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-3">
                                                <h3 className="text-xl font-semibold text-zinc-900">{hostProfile.name}</h3>
                                                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${hostProfile.verified ? "bg-cyan-50 text-cyan-700" : "bg-amber-50 text-amber-700"}`}>
                                                    {hostProfile.verified ? "Đã xác minh" : "Đang xác minh"}
                                                </span>
                                            </div>
                                            <p className="mt-2 text-sm text-zinc-500">
                                                {hostProfile.listingCount} chỗ ở đang quản lý · Tham gia từ {hostProfile.joinedYear}
                                            </p>
                                            <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-600 sm:text-[15px]">{hostProfile.bio}</p>
                                        </div>

                                        {showHostMessageAction ? (
                                            <button
                                                type="button"
                                                onClick={openHostMessage}
                                                disabled={isOpeningConversation}
                                                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm font-semibold text-cyan-700 transition-colors hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-60 sm:self-start"
                                            >
                                                <FiMessageCircle />
                                                {isOpeningConversation ? "Đang mở..." : "Nhắn tin cho host"}
                                            </button>
                                        ) : null}
                                    </div>
                                </div>
                            </section>

                            <section className="mt-12">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                                    <h2 className="text-[2.2rem] leading-none tracking-tight text-[#231a12]">
                                        Đánh giá của khách
                                    </h2>
                                    <p className="text-sm font-semibold text-zinc-600">
                                        Điểm trung bình {averageReviewScore.toFixed(1)} · {reviewCount} đánh giá
                                    </p>
                                </div>

                                <div className="mt-5 rounded-2xl border border-[#e8ddd1] bg-white p-5 shadow-[0_30px_80px_-50px_rgba(71,47,23,0.38)] sm:p-6">
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
                                                <p className="mt-1 text-sm text-black">{reviewCount} khách đã để lại đánh giá cho chỗ ở này.</p>

                                                <div className="mt-6 space-y-4">
                                                    {reviewMetrics.map((metric) => (
                                                        <div key={metric.label} className="grid gap-2 sm:grid-cols-[72px_minmax(0,1fr)_36px] sm:items-center lg:grid-cols-1">
                                                            <span className="text-sm font-semibold text-zinc-700">{metric.label}</span>
                                                            <div className="h-2 rounded-full bg-[#eadfd2]">
                                                                <div
                                                                    className="h-2 rounded-full bg-cyan-600"
                                                                    style={{ width: `${Math.min(100, (metric.score / 5) * 100)}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-sm font-semibold text-zinc-800">{metric.score.toFixed(1)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                {guestReviews.map((review) => (
                                                    <article key={review.id} className="rounded-2xl border border-[#efe4d8] bg-[#fffaf5] p-4">
                                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                                            <div className="flex items-center gap-3">
                                                                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-cyan-600 text-sm font-bold text-white">
                                                                    {getInitials(review.guestName)}
                                                                </div>
                                                                <div>
                                                                    <p className="font-semibold text-zinc-900">{review.guestName}</p>
                                                                    <p className="text-xs text-zinc-500">{formatFieldDate(review.date)}</p>
                                                                </div>
                                                            </div>
                                                            <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-sm font-semibold text-cyan-700">
                                                                <FaStar className="text-xs" />
                                                                {review.rating.toFixed(1)}
                                                            </span>
                                                        </div>
                                                        <p className="mt-3 text-sm leading-7 text-zinc-600">{review.content}</p>
                                                    </article>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="rounded-2xl border border-dashed border-[#e4d7c8] bg-[#fffaf5] px-5 py-10 text-center">
                                            <p className="text-base font-semibold text-zinc-900">Chưa có đánh giá</p>
                                            <p className="mt-2 text-sm text-zinc-500">Những đánh giá đầu tiên của khách sẽ hiển thị tại đây.</p>
                                        </div>
                                    )}
                                </div>
                            </section>

                            {showHostMessageAction ? (
                                <section className="mt-12">
                                    <div className="rounded-2xl border border-[#e8ddd1] bg-white p-5 shadow-[0_30px_80px_-50px_rgba(71,47,23,0.38)] sm:p-6">
                                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                            <div className="min-w-0">
                                                <h2 className="text-[2.2rem] leading-none tracking-tight text-[#231a12]">
                                                    Nhắn tin cho host
                                                </h2>
                                                <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-600">
                                                    Mở trang nhắn tin riêng để trao đổi về lịch trống, nhận phòng hoặc nhu cầu riêng của nhóm bạn.
                                                </p>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={openHostMessage}
                                                disabled={isOpeningConversation}
                                                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-cyan-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-cyan-300"
                                            >
                                                <FiMessageCircle />
                                                {isOpeningConversation ? "Đang mở..." : "Nhắn tin cho host"}
                                            </button>
                                        </div>
                                    </div>
                                </section>
                            ) : null}

                            <section className="mt-12">
                                <h2 className="text-[2.2rem] leading-none tracking-tight text-[#231a12]">
                                    Tiện nghi
                                </h2>

                                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                    {amenities.map((amenity) => (
                                        <div
                                            key={amenity.label}
                                            className="flex items-center gap-3 rounded-xl border border-[#ece2d7] bg-white px-4 py-4 text-sm font-medium text-zinc-700 shadow-[0_20px_50px_-45px_rgba(71,47,23,0.3)] sm:text-[15px]"
                                        >
                                            <span className="text-cyan-600">{amenity.icon}</span>
                                            {amenity.label}
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <div className="mt-8 xl:hidden">{renderPoliciesCard()}</div>
                        </div>

                        <aside className="hidden space-y-6 xl:sticky xl:top-28 xl:block xl:self-start">
                            {renderUnifiedBookingCard("desktop")}
                            {renderPoliciesCard()}
                        </aside>
                    </div>
                </div>
            </section>

            <NearbyRecommendationsSection
                currentListing={destination}
                searchState={recommendationSearchState}
            />

            {mobileBookingSheet ? (
                <div className="fixed inset-0 z-[80] xl:hidden">
                    <div className="absolute inset-0 bg-black/45" onClick={() => setMobileBookingSheet(null)} role="presentation" />

                    <div className="absolute inset-x-0 bottom-0 top-0 overflow-y-auto rounded-t-2xl bg-[#f4f0eb] px-4 pb-8 pt-4 shadow-2xl">
                        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-zinc-300" />

                        <div className="flex items-center justify-between gap-4">
                            <h2 className="text-2xl font-bold text-zinc-950">
                                {mobileBookingSheet === "dates" ? "Chọn ngày lưu trú" : "Chọn số lượng khách"}
                            </h2>

                            <button
                                type="button"
                                onClick={() => setMobileBookingSheet(null)}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-cyan-100 bg-white text-zinc-700 transition-colors hover:border-cyan-300 hover:text-cyan-700"
                                aria-label="Đóng"
                            >
                                <FaTimes />
                            </button>
                        </div>

                        {mobileBookingSheet === "dates" ? (
                            <div className="mt-5 rounded-2xl border border-cyan-100 bg-white p-4 shadow-sm">
                                <div className="mb-4 grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setMobileDateField("checkin")}
                                        className={`rounded-xl border px-3 py-3 text-left transition-colors ${mobileDateField === "checkin"
                                            ? "border-cyan-600 bg-cyan-600 text-white"
                                            : "border-cyan-100 bg-white text-zinc-800 hover:border-cyan-300"
                                            }`}
                                    >
                                        <p className={`text-xs ${mobileDateField === "checkin" ? "text-white/75" : "text-black"}`}>Nhận phòng</p>
                                        <p className="mt-1 text-sm font-semibold">{formatFieldDate(checkIn)}</p>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setMobileDateField("checkout")}
                                        className={`rounded-xl border px-3 py-3 text-left transition-colors ${mobileDateField === "checkout"
                                            ? "border-cyan-600 bg-cyan-600 text-white"
                                            : "border-cyan-100 bg-white text-zinc-800 hover:border-cyan-300"
                                            }`}
                                    >
                                        <p className={`text-xs ${mobileDateField === "checkout" ? "text-white/75" : "text-black"}`}>Trả phòng</p>
                                        <p className="mt-1 text-sm font-semibold">{formatFieldDate(checkOut)}</p>
                                    </button>
                                </div>

                                <DatePickerPanel
                                    key={`mobile-${mobileDateField}-${checkIn}-${checkOut}`}
                                    isOpen
                                    selectedDate={mobileDateField === "checkin" ? checkIn : checkOut}
                                    minDate={mobileDateField === "checkin" ? todayIso : checkIn || todayIso}
                                    rangeStartDate={checkIn}
                                    rangeEndDate={checkOut}
                                    activeField={mobileDateField === "checkout" ? "checkOut" : "checkIn"}
                                    selectedNightOffset={nightOffset}
                                    onSelectDate={mobileDateField === "checkin" ? handleCheckInChange : handleCheckoutChange}
                                    onNightOffsetChange={handleNightOffsetChange}
                                    variant="inline"
                                />
                            </div>
                        ) : (
                            <div className="mt-5 rounded-2xl border border-cyan-100 bg-white p-4 shadow-sm">{renderGuestControls(false)}</div>
                        )}

                        <button
                            type="button"
                            onClick={() => setMobileBookingSheet(null)}
                            className="mt-5 inline-flex min-h-14 w-full items-center justify-center rounded-xl bg-cyan-600 px-6 text-base font-semibold text-white transition-colors hover:bg-cyan-700"
                        >
                            Áp dụng
                        </button>
                    </div>
                </div>
            ) : null}

            {isGalleryModalOpen && hasGalleryImages ? (
                <div className="fixed inset-0 z-[90] overflow-y-auto bg-black/70 backdrop-blur-sm" onClick={() => setIsGalleryModalOpen(false)} role="presentation">
                    <div
                        className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4 py-6 sm:px-6 lg:px-8"
                        onClick={(event) => event.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                    >
                        <div className="w-full rounded-2xl border border-white/10 bg-[#161616] p-4 text-white shadow-2xl sm:p-6">
                            <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
                                <div>
                                    <p className="text-sm tracking-[0.18em] text-white/55">Thư viện ảnh</p>
                                    <h2 className="mt-1 text-2xl font-semibold">{destination.name}</h2>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setIsGalleryModalOpen(false)}
                                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition-colors hover:bg-white/20"
                                    aria-label="Đóng thư viện ảnh"
                                >
                                    <FaTimes />
                                </button>
                            </div>

                            <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
                                <div
                                    className="relative overflow-hidden rounded-2xl bg-black [touch-action:pan-y]"
                                    onTouchStart={handleGalleryTouchStart}
                                    onTouchEnd={handleGalleryTouchEnd}
                                >
                                    <img
                                        src={currentImage.imageUrl}
                                        alt={currentImage.label}
                                        className="h-[320px] w-full object-cover sm:h-[460px] xl:h-[620px]"
                                    />

                                    <div className="absolute inset-y-0 left-0 flex items-center pl-4">
                                        <button
                                            type="button"
                                            onClick={handlePreviousImage}
                                            disabled={!hasGalleryImages}
                                            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-zinc-900 shadow-lg"
                                            aria-label="Xem ảnh trước"
                                        >
                                            <FaChevronLeft />
                                        </button>
                                    </div>

                                    <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                                        <button
                                            type="button"
                                            onClick={handleNextImage}
                                            disabled={!hasGalleryImages}
                                            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-zinc-900 shadow-lg"
                                            aria-label="Xem ảnh tiếp theo"
                                        >
                                            <FaChevronRight />
                                        </button>
                                    </div>

                                    <div className="absolute left-4 top-4 rounded-full bg-black/50 px-3 py-1.5 text-sm font-semibold text-white backdrop-blur">
                                        {selectedImageIndex + 1}/{galleryItems.length}
                                    </div>
                                </div>

                                <div className="gallery-thumbnail-scroll max-h-[320px] space-y-3 overflow-y-auto pr-2 sm:max-h-[460px] xl:max-h-[620px]">
                                    {galleryItems.map((item, index) => {
                                        const isActive = index === selectedImageIndex;

                                        return (
                                            <button
                                                key={item.id}
                                                type="button"
                                                onClick={() => setSelectedImageIndex(index)}
                                                className={`flex w-full items-center gap-3 rounded-xl border p-2 text-left transition-colors ${isActive ? "border-cyan-600 bg-white/10" : "border-white/10 bg-white/5 hover:bg-white/10"
                                                    }`}
                                            >
                                                <img src={item.imageUrl} alt={item.label} className="h-20 w-24 rounded-xl object-cover" />
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-semibold text-white">{item.label}</p>

                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}
        </>
    );
};

const ListingDetailPage = () => {
    const location = useLocation();
    const { villaId } = useParams();

    return <ListingDetailContent key={`${villaId ?? "listing-detail"}-${location.search}`} villaId={villaId} />;
};

export default ListingDetailPage;
