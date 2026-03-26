import { useEffect, useMemo, useRef, useState, type CSSProperties, type TouchEvent } from "react";
import {
    FaArrowLeft,
    FaCalendarAlt,
    FaCarSide,
    FaCheckCircle,
    FaChevronLeft,
    FaChevronRight,
    FaFireAlt,
    FaMapMarkerAlt,
    FaSnowflake,
    FaStar,
    FaSwimmingPool,
    FaTimes,
    FaUsers,
    FaUtensils,
    FaWifi,
} from "react-icons/fa";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { APP_ROUTES } from "../../../config/routes";
import {
    buildGuestPaymentPath,
    createBookingDraft,
    savePendingBookingDraft,
} from "../../../services/bookingService";
import { getListingById } from "../../../services/listingService";
import DatePickerPanel from "../../components/search/booking/DatePickerPanel";
import type { GuestSelection } from "../../components/search/booking/Guest";
import {
    parseBookingSearchParams,
    toIsoDate,
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

type GuestFieldConfig = {
    key: keyof GuestSelection;
    label: string;
    description: string;
    min: number;
    max: number;
};


const currencyFormatter = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
});

const serifHeadingStyle: CSSProperties = {
    fontFamily: '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif',
};

const sidebarCardClass =
    "rounded-2xl border border-[#e8ddd1] bg-white p-5 shadow-[0_30px_80px_-48px_rgba(71,47,23,0.38)] sm:p-6";

const mobileCardClass =
    "rounded-2xl border border-[#e8ddd1] bg-white p-5 shadow-[0_28px_70px_-44px_rgba(71,47,23,0.32)] sm:p-6";

const accentBadgeClass = "border border-cyan-100 bg-cyan-50 text-cyan-600";

const activeBookingFieldClass = "border-cyan-600 bg-cyan-50";

const inactiveBookingFieldClass = "border-cyan-100 bg-white hover:border-cyan-300";


const guestFieldConfigs: GuestFieldConfig[] = [
    { key: "adults", label: "Người lớn", description: "Từ 13 tuổi trở lên", min: 1, max: 16 },
    { key: "children", label: "Trẻ em", description: "Từ 2 - 12 tuổi", min: 0, max: 8 },
    { key: "infants", label: "Em bé", description: "Dưới 2 tuổi", min: 0, max: 5 },
    { key: "pets", label: "Thú cưng", description: "Mang theo thú cưng", min: 0, max: 5 },
];

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

const getGuestSummary = (selection: GuestSelection) => {
    const stayingGuests = selection.adults + selection.children;
    const fragments: string[] = [`${stayingGuests} khách`];

    if (selection.infants > 0) {
        fragments.push(`${selection.infants} em bé`);
    }

    if (selection.pets > 0) {
        fragments.push(`${selection.pets} thú cưng`);
    }

    return fragments.join(", ");
};

const isMobileViewport = () => window.matchMedia("(max-width: 1279.98px)").matches;

type ListingDetailContentProps = {
    villaId?: string;
};

const ListingDetailContent = ({ villaId }: ListingDetailContentProps) => {
    const navigate = useNavigate();
    const location = useLocation();
    const destination = getListingById(villaId);
    const initialBookingState = useMemo(() => {
        const parsed = parseBookingSearchParams(location.search);

        return {
            checkIn: parsed.checkIn || createDateOffset(1),
            checkOut: parsed.checkOut || createDateOffset(4),
            guests: parsed.guests.adults > 0 ? parsed.guests : defaultGuestSelection,
        };
    }, [location.search]);

    const [checkIn, setCheckIn] = useState(initialBookingState.checkIn);
    const [checkOut, setCheckOut] = useState(initialBookingState.checkOut);
    const [nightOffset, setNightOffset] = useState(0);
    const [guestSelection, setGuestSelection] = useState<GuestSelection>(initialBookingState.guests);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
    const [activeDesktopField, setActiveDesktopField] = useState<BookingField>(null);
    const [mobileBookingSheet, setMobileBookingSheet] = useState<MobileBookingSheet>(null);
    const [mobileDateField, setMobileDateField] = useState<"checkin" | "checkout">("checkin");

    const desktopBookingRef = useRef<HTMLDivElement | null>(null);
    const touchStartXRef = useRef<number | null>(null);
    const todayIso = useMemo(() => toIsoDate(new Date()), []);

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

        const handlePointerDown = (event: PointerEvent) => {
            if (desktopBookingRef.current && !desktopBookingRef.current.contains(event.target as Node)) {
                setActiveDesktopField(null);
            }
        };

        document.addEventListener("pointerdown", handlePointerDown);
        return () => document.removeEventListener("pointerdown", handlePointerDown);
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

    const galleryItems: GalleryItem[] = [
        { id: `${destination.id}-cover`, imageUrl: destination.imageUrl, label: "Ảnh đại diện", placeholder: false },
        { id: `${destination.id}-detail-01`, imageUrl: destination.imageUrl, label: "Ảnh chi tiết 01", placeholder: true },
        { id: `${destination.id}-detail-02`, imageUrl: destination.imageUrl, label: "Ảnh chi tiết 02", placeholder: true },
        { id: `${destination.id}-detail-03`, imageUrl: destination.imageUrl, label: "Ảnh chi tiết 03", placeholder: true },
        { id: `${destination.id}-detail-04`, imageUrl: destination.imageUrl, label: "Ảnh chi tiết 04", placeholder: true },
    ];

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

    const policyItems: PolicyItem[] = [
        { label: "Nhận phòng sau", value: "14:00" },
        { label: "Trả phòng trước", value: "12:00" },
        { label: "Tổ chức tiệc hoặc sự kiện" },
    ];

    const nights = getNightCount(checkIn, checkOut);
    const nightlyRate = destination.pricePerNight;
    const totalPrice = nightlyRate * nights;
    const stayingGuestCount = guestSelection.adults + guestSelection.children;
    const guestSummary = getGuestSummary(guestSelection);

    const handleBookNow = () => {
        const bookingDraft = createBookingDraft(destination, {
            location: destination.address,
            checkIn,
            checkOut,
            guests: guestSelection,
        });

        savePendingBookingDraft(bookingDraft);
        navigate(buildGuestPaymentPath(bookingDraft.bookingId), {
            state: {
                returnTo: `${location.pathname}${location.search}`,
            },
        });
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
        setSelectedImageIndex((currentIndex) => (currentIndex === 0 ? galleryItems.length - 1 : currentIndex - 1));
    };

    const handleNextImage = () => {
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
        return guestFieldConfigs.map((field) => {
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
                        <p className={`${compact ? "text-sm" : "text-base"} font-semibold text-zinc-900`}>{field.label}</p>
                        <p className={`${compact ? "text-xs" : "text-sm"} text-black`}>{field.description}</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            disabled={disableMinus}
                            onClick={() => handleAdjustGuest(field.key, -1, field.min, field.max)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#d5c5b2] text-base font-semibold text-zinc-700 transition-colors hover:border-cyan-600 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label={`Giảm ${field.label}`}
                        >
                            -
                        </button>

                        <span className="w-6 text-center text-sm font-semibold text-zinc-900">{currentValue}</span>

                        <button
                            type="button"
                            disabled={disablePlus}
                            onClick={() => handleAdjustGuest(field.key, 1, field.min, field.max)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#d5c5b2] text-base font-semibold text-zinc-700 transition-colors hover:border-cyan-600 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label={`Tăng ${field.label}`}
                        >
                            +
                        </button>
                    </div>
                </div>
            );
        });
    };

    const renderBookingCard = (variant: "mobile" | "desktop") => {
        const isDesktop = variant === "desktop";
        const showDatePopover = isDesktop && (activeDesktopField === "checkin" || activeDesktopField === "checkout");
        const showGuestPopover = isDesktop && activeDesktopField === "guest";
        const cardClass = isDesktop ? sidebarCardClass : mobileCardClass;

        return (
            <div ref={isDesktop ? desktopBookingRef : null} className={cardClass}>
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                            <p className="text-[2rem] font-semibold tracking-tight text-[#231a12]">
                                {currencyFormatter.format(nightlyRate)}
                            </p>
                            <span className="text-sm text-black">/ đêm</span>
                        </div>

                        <p className="mt-1 text-sm text-black whitespace-nowrap">
                            Giá linh hoạt theo thời gian lưu trú.
                        </p>
                    </div>
                    <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${accentBadgeClass}`}>
                        <FaUsers />
                        {stayingGuestCount} khách
                    </div>
                </div>

                <div className="relative mt-6">
                    <div className="grid gap-3 sm:grid-cols-2">
                        <button
                            type="button"
                            onClick={() => openDateSelection("checkin")}
                            className={`rounded-xl border px-4 py-3 text-left transition-colors ${activeDesktopField === "checkin" && isDesktop ? activeBookingFieldClass : inactiveBookingFieldClass
                                }`}
                        >
                            <span className="mb-2 flex items-center gap-2 text-[11px] font-semibold tracking-[0.18em] text-black">
                                <FaCalendarAlt />
                                Nhận phòng
                            </span>
                            <span className="block text-sm font-semibold text-zinc-900">{formatFieldDate(checkIn)}</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => openDateSelection("checkout")}
                            className={`rounded-xl border px-4 py-3 text-left transition-colors ${activeDesktopField === "checkout" && isDesktop ? activeBookingFieldClass : inactiveBookingFieldClass
                                }`}
                        >
                            <span className="mb-2 flex items-center gap-2 text-[11px] font-semibold  tracking-[0.18em] text-black">
                                <FaCalendarAlt />
                                Trả phòng
                            </span>
                            <span className="block text-sm font-semibold text-zinc-900">{formatFieldDate(checkOut)}</span>
                        </button>
                    </div>

                    {showDatePopover ? (
                        <DatePickerPanel
                            key={`desktop-${activeDesktopField}-${checkIn}-${checkOut}`}
                            isOpen
                            selectedDate={activeDesktopField === "checkin" ? checkIn : checkOut}
                            minDate={activeDesktopField === "checkin" ? todayIso : checkIn || todayIso}
                            rangeStartDate={checkIn}
                            rangeEndDate={checkOut}
                            activeField={activeDesktopField === "checkout" ? "checkOut" : "checkIn"}
                            selectedNightOffset={nightOffset}
                            onSelectDate={activeDesktopField === "checkin" ? handleCheckInChange : handleCheckoutChange}
                            onNightOffsetChange={handleNightOffsetChange}
                            className="left-auto right-0 w-[min(860px,calc(100vw-2rem))] translate-x-0"
                        />
                    ) : null}
                </div>

                <div className="relative mt-3">
                    <button
                        type="button"
                        onClick={openGuestSelection}
                        className={`w-full rounded-xl border px-4 py-3 text-left transition-colors ${showGuestPopover ? activeBookingFieldClass : inactiveBookingFieldClass
                            }`}
                    >
                        <span className="mb-2 flex items-center gap-2 text-[11px] font-semibold tracking-[0.18em] text-black">
                            <FaUsers />
                            Khách
                        </span>
                        <span className="block text-sm font-semibold text-zinc-900">{guestSummary}</span>
                    </button>

                    {showGuestPopover ? (
                        <div className="absolute right-0 top-[calc(100%+12px)] z-40 w-full min-w-[320px] rounded-2xl border border-cyan-100 bg-white p-5 shadow-2xl">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-sm font-semibold text-zinc-900">Bạn đi cùng ai?</p>
                                    <p className="mt-1 text-xs text-black">Tối đa 16 khách, không tính em bé và thú cưng.</p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setActiveDesktopField(null)}
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-full text-black transition-colors hover:bg-zinc-100 hover:text-zinc-900"
                                    aria-label="Đóng khách"
                                >
                                    <FaTimes className="text-sm" />
                                </button>
                            </div>

                            <div className="mt-4 space-y-2">{renderGuestControls(true)}</div>

                            <button
                                type="button"
                                onClick={() => setActiveDesktopField(null)}
                                className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-xl bg-cyan-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-cyan-700"
                            >
                                Áp dụng
                            </button>
                        </div>
                    ) : null}
                </div>

                <div className="mt-6 rounded-2xl border border-cyan-100 bg-cyan-50/40 p-4">
                    <div className="flex items-center justify-between gap-4 text-sm text-black">
                        <span>Kỳ nghỉ của bạn</span>
                        <span>{nights} đêm</span>
                    </div>

                    <div className="mt-4 flex items-end justify-between gap-4">
                        <div>
                            <p className="text-[1.9rem] font-semibold tracking-tight text-[#231a12]">{currencyFormatter.format(totalPrice)}</p>
                            <p className="mt-1 text-xs text-black">
                                {currencyFormatter.format(nightlyRate)} x {nights} đêm
                            </p>
                        </div>

                        <div className={`rounded-full px-3 py-1.5 text-xs font-semibold ${accentBadgeClass}`}>
                            {stayingGuestCount} khách
                        </div>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={handleBookNow}
                    className="mt-6 inline-flex min-h-14 w-full items-center justify-center rounded-xl bg-cyan-600 px-6 text-base font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5 hover:bg-cyan-700"
                >
                    Đặt ngay
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
        );
    };

    const renderPoliciesCard = () => {
        return (
            <div className={sidebarCardClass}>
                <h2 className="text-[2.1rem] leading-none tracking-tight text-[#231a12]" style={serifHeadingStyle}>
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
                                    style={serifHeadingStyle}
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
                            </header>

                            <div className="mt-6">
                                <div
                                    className="group relative overflow-hidden rounded-2xl bg-[#ded4c9] [touch-action:pan-y]"
                                    onTouchStart={handleGalleryTouchStart}
                                    onTouchEnd={handleGalleryTouchEnd}
                                >
                                    <img
                                        src={currentImage.imageUrl}
                                        alt={currentImage.label}
                                        className="h-[320px] w-full object-cover sm:h-[420px] xl:h-[520px]"
                                    />

                                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-black/10" />

                                    <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-zinc-900 shadow-lg">
                                        <span>
                                            {selectedImageIndex + 1}/{galleryItems.length}
                                        </span>
                                        {currentImage.placeholder ? <span className="text-black">Ảnh demo</span> : null}
                                    </div>

                                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 sm:pl-4">
                                        <button
                                            type="button"
                                            onClick={handlePreviousImage}
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
                                            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/92 text-zinc-900 shadow-lg transition-transform hover:scale-105"
                                            aria-label="Xem ảnh tiếp theo"
                                        >
                                            <FaChevronRight />
                                        </button>
                                    </div>

                                    <div className="absolute bottom-4 right-4">
                                        <button
                                            type="button"
                                            onClick={() => setIsGalleryModalOpen(true)}
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

                            <div className="mt-8 xl:hidden">{renderBookingCard("mobile")}</div>

                            <section className="mt-10">
                                <h2 className="text-[2.2rem] leading-none tracking-tight text-[#231a12]" style={serifHeadingStyle}>
                                    Tổng quan
                                </h2>
                                <p className="mt-4 max-w-4xl text-base leading-8 text-zinc-600 sm:text-[17px]">
                                    {getOverview(destination.name, destination.address)}
                                </p>
                            </section>

                            <section className="mt-12">
                                <h2 className="text-[2.2rem] leading-none tracking-tight text-[#231a12]" style={serifHeadingStyle}>
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

                            <section className="mt-12">
                                <h2 className="text-[2.2rem] leading-none tracking-tight text-[#231a12]" style={serifHeadingStyle}>
                                    Đánh giá khách lưu trú
                                </h2>

                                <div className="mt-5 rounded-2xl border border-[#e8ddd1] bg-white p-5 shadow-[0_30px_80px_-50px_rgba(71,47,23,0.38)] sm:p-6">
                                    <div className="grid gap-6 lg:grid-cols-[230px_minmax(0,1fr)]">
                                        <div className="border-b border-[#efe4d8] pb-6 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-6">
                                            <div className="flex items-center gap-1 text-cyan-600">
                                                {Array.from({ length: 5 }).map((_, index) => (
                                                    <FaStar key={index} />
                                                ))}
                                            </div>

                                            <p className="mt-4 text-[2.25rem] font-semibold tracking-tight text-[#231a12]">
                                                {destination.rating.toFixed(1)}
                                            </p>
                                            <p className="mt-1 text-sm text-black">Đánh giá tổng thể từ khách đã lưu trú.</p>

                                            <div className="mt-6 flex items-center gap-3">
                                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-600 text-sm font-bold text-white">
                                                    ER
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-zinc-900">Emily R.</p>
                                                    <p className="text-sm text-black">15/02/2024</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            {reviewMetrics.map((metric) => (
                                                <div key={metric.label} className="grid gap-2 sm:grid-cols-[96px_minmax(0,1fr)_40px_16px] sm:items-center">
                                                    <span className="text-sm font-semibold text-zinc-700">{metric.label}</span>
                                                    <div className="h-2 rounded-full bg-[#eadfd2]">
                                                        <div
                                                            className="h-2 rounded-full bg-cyan-600"
                                                            style={{ width: `${Math.min(100, (metric.score / 5) * 100)}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-sm font-semibold text-zinc-800">{metric.score.toFixed(1)}</span>
                                                    <FaChevronRight className="text-xs text-zinc-400" />
                                                </div>
                                            ))}

                                            <p className="pt-2 text-sm leading-7 text-zinc-600 sm:text-[15px]">
                                                Villa sạch sẽ, hồ bơi đẹp và không gian rộng rãi cho nhóm bạn hoặc gia đình. Khu vực bếp, phòng ngủ và sân ngoài trời đều
                                                tạo cảm giác thư giãn như một kỳ nghỉ đúng nghĩa.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <div className="mt-8 xl:hidden">{renderPoliciesCard()}</div>
                        </div>

                        <aside className="hidden space-y-6 xl:sticky xl:top-28 xl:block xl:self-start">
                            {renderBookingCard("desktop")}
                            {renderPoliciesCard()}
                        </aside>
                    </div>
                </div>
            </section>

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

            {isGalleryModalOpen ? (
                <div className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-sm" onClick={() => setIsGalleryModalOpen(false)} role="presentation">
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

                                <div className="space-y-3">
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
                                                    <p className="mt-1 text-xs text-white/65">
                                                        {item.placeholder ? "Ảnh demo, thay bằng ảnh thật khi có dữ liệu." : "Ảnh bìa đang hiển thị ở đầu trang."}
                                                    </p>
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
