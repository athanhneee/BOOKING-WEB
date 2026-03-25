import { useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import { FaCalendarAlt, FaMapMarkerAlt, FaMinus, FaPlus, FaSearch, FaUsers } from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";
import { APP_ROUTES } from "../../../config/routes";
import useScrollVisibility from "../../../hooks/useScrollVisibility";
import SearchPopover from "./SearchPopover";
import DatePickerPanel from "./booking/DatePickerPanel";
import type { GuestSelection } from "./booking/Guest";
import {
    addDaysToIso,
    buildBookingSearchParams,
    buildGuestSummary,
    createDefaultBookingSearchState,
    defaultGuestSelection,
    formatSearchDate,
    formatSearchDateRange,
    getGuestCount,
    guestFieldConfigs,
    parseBookingSearchParams,
    sanitizeBookingSearchState,
    toIsoDate,
    type BookingSearchState,
} from "./searchState";

type SearchBarVariant = "home" | "listing";
type OpenField = "location" | "checkIn" | "checkOut" | "guests" | null;

type SearchBarProps = {
    variant?: SearchBarVariant;
    forceHidden?: boolean;
    forceVisible?: boolean;
    desktopAside?: ReactNode;
};

type SearchFieldButtonProps = {
    label: string;
    value: string;
    placeholder: string;
    icon: ReactNode;
    isActive: boolean;
    onClick: () => void;
    ariaLabel: string;
    buttonRef?: RefObject<HTMLButtonElement | null>;
};

const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Sáng";
    if (hour < 18) return "Chiều";
    return "Tối";
};

const SearchFieldButton = ({ label, value, placeholder, icon, isActive, onClick, ariaLabel, buttonRef }: SearchFieldButtonProps) => (
    <button
        ref={buttonRef}
        type="button"
        onClick={onClick}
        aria-label={ariaLabel}
        aria-expanded={isActive}
        className={`flex min-w-0 items-center gap-3 rounded-full px-4 py-3 text-left transition-all duration-200 ${
            isActive ? "bg-cyan-50 text-cyan-800 shadow-[inset_0_0_0_1px_rgba(8,145,178,0.16)]" : "text-gray-700 hover:bg-gray-50"
        }`}
    >
        <span className={`flex h-10 w-10 items-center justify-center rounded-full ${isActive ? "bg-cyan-100 text-cyan-700" : "bg-gray-100 text-gray-500"}`}>
            {icon}
        </span>
        <span className="min-w-0">
            <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500">{label}</span>
            <span className={`block truncate text-sm ${value ? "font-semibold text-gray-900" : "text-gray-500"}`}>{value || placeholder}</span>
        </span>
    </button>
);

const SearchBar = ({ variant, forceHidden = false, forceVisible = false, desktopAside }: SearchBarProps) => {
    const location = useLocation();
    const navigate = useNavigate();
    const isScrollVisible = useScrollVisibility({ threshold: 12, topOffset: 64, hideStartRatio: 0.5 });
    const inferredVariant: SearchBarVariant = variant ?? (location.pathname === APP_ROUTES.search ? "listing" : "home");
    const todayIso = useMemo(() => toIsoDate(new Date()), []);

    const [greeting, setGreeting] = useState(getGreeting);
    const [isPinned, setIsPinned] = useState(inferredVariant === "listing");
    const [openField, setOpenField] = useState<OpenField>(null);
    const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
    const [mobileDateField, setMobileDateField] = useState<"checkIn" | "checkOut">("checkIn");
    const [draftState, setDraftState] = useState<BookingSearchState>(() =>
        location.pathname === APP_ROUTES.search ? parseBookingSearchParams(location.search) : createDefaultBookingSearchState(),
    );

    const shellRef = useRef<HTMLDivElement | null>(null);
    const popoverRef = useRef<HTMLDivElement | null>(null);
    const locationInputRef = useRef<HTMLInputElement | null>(null);
    const locationButtonRef = useRef<HTMLButtonElement | null>(null);
    const checkInButtonRef = useRef<HTMLButtonElement | null>(null);
    const checkOutButtonRef = useRef<HTMLButtonElement | null>(null);
    const guestsButtonRef = useRef<HTMLButtonElement | null>(null);

    useEffect(() => setGreeting(getGreeting()), []);

    useEffect(() => {
        if (location.pathname === APP_ROUTES.search) {
            setDraftState(parseBookingSearchParams(location.search));
        }
    }, [location.pathname, location.search]);

    useEffect(() => {
        if (forceHidden) {
            setOpenField(null);
            setMobileSheetOpen(false);
            setIsPinned(false);
            return;
        }

        if (inferredVariant === "listing" || forceVisible) {
            setIsPinned(true);
            return;
        }

        const handleScroll = () => setIsPinned(window.scrollY > 320);
        handleScroll();
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, [forceHidden, forceVisible, inferredVariant]);

    useEffect(() => {
        if (openField !== "location") return;
        const frame = window.requestAnimationFrame(() => locationInputRef.current?.focus());
        return () => window.cancelAnimationFrame(frame);
    }, [openField]);

    useEffect(() => {
        if (!openField && !mobileSheetOpen) return;

        const handlePointerDown = (event: PointerEvent) => {
            const target = event.target as Node;
            if (shellRef.current?.contains(target) || popoverRef.current?.contains(target)) return;
            setOpenField(null);
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setOpenField(null);
                setMobileSheetOpen(false);
            }
        };

        document.addEventListener("pointerdown", handlePointerDown);
        window.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("pointerdown", handlePointerDown);
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [mobileSheetOpen, openField]);

    useEffect(() => {
        if (!mobileSheetOpen) return;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [mobileSheetOpen]);

    const shouldPin = inferredVariant === "listing" || forceVisible || isPinned || openField !== null || mobileSheetOpen;
    const shouldShow = inferredVariant === "listing" || forceVisible || isScrollVisible || openField !== null || mobileSheetOpen;
    const shouldShowIntro = inferredVariant === "home" && !shouldPin;
    const hasCustomGuestState = JSON.stringify(draftState.guests) !== JSON.stringify(defaultGuestSelection);

    const activeAnchor =
        openField === "location"
            ? locationButtonRef.current
            : openField === "checkIn"
              ? checkInButtonRef.current
              : openField === "checkOut"
                ? checkOutButtonRef.current
                : openField === "guests"
                  ? guestsButtonRef.current
                  : null;

    const updateGuests = (key: keyof GuestSelection, delta: number, min: number, max: number) => {
        setDraftState((current) => {
            const nextValue = current.guests[key] + delta;
            if (nextValue < min || nextValue > max) return current;
            return { ...current, guests: { ...current.guests, [key]: nextValue } };
        });
    };

    const resetSearch = () => {
        setDraftState(createDefaultBookingSearchState());
        setOpenField(null);
        setMobileDateField("checkIn");
    };

    const clearDates = () => {
        setDraftState((current) => ({ ...current, checkIn: "", checkOut: "" }));
        setMobileDateField("checkIn");
    };

    const handleDateChange = (field: "checkIn" | "checkOut", nextDate: string) => {
        setDraftState((current) => {
            if (field === "checkIn") {
                const nextCheckOut = !current.checkOut || current.checkOut <= nextDate ? addDaysToIso(nextDate, 1) : current.checkOut;
                return { ...current, checkIn: nextDate, checkOut: nextCheckOut };
            }

            return { ...current, checkOut: nextDate };
        });

        if (field === "checkIn") {
            setMobileDateField("checkOut");
            if (openField === "checkIn") {
                setOpenField("checkOut");
            }
        } else {
            setOpenField(null);
        }
    };

    const handleSearch = () => {
        const sanitizedState = sanitizeBookingSearchState(draftState);
        const nextParams = buildBookingSearchParams(sanitizedState);
        nextParams.delete("page");

        setDraftState(sanitizedState);
        setOpenField(null);
        setMobileSheetOpen(false);

        const nextSearch = nextParams.toString();
        navigate({ pathname: APP_ROUTES.search, search: nextSearch ? `?${nextSearch}` : "" });
    };

    const currentDateValue = mobileDateField === "checkIn" ? draftState.checkIn : draftState.checkOut;
    const currentDateMin = mobileDateField === "checkIn" ? todayIso : draftState.checkIn || todayIso;

    if (forceHidden) return null;

    return (
        <>
            <div className={`${shouldPin ? "fixed left-0 top-14 z-40 w-full md:top-20" : "relative -mt-20 md:-mt-32"} px-3 transition-[transform,opacity] duration-300 md:px-6 ${shouldShow ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-4 opacity-0"}`}>
                <div className={`mx-auto ${inferredVariant === "listing" ? "max-w-[74rem]" : "max-w-[64rem]"}`}>
                    <div className={inferredVariant === "home" && !shouldPin ? "rounded-[32px] bg-white px-4 py-4 shadow-[0_28px_80px_-48px_rgba(15,23,42,0.35)] md:px-6 md:py-6" : ""}>
                        {shouldShowIntro ? (
                            <div className="pb-6 text-center md:pb-8">
                                <h1 className="text-3xl font-bold text-cyan-600 sm:text-4xl md:text-5xl">Chào buổi {greeting}!</h1>
                                <p className="mt-3 text-base text-gray-600 sm:text-lg">Trân trọng được chào đón bạn tại thành phố biển Vũng Tàu</p>
                            </div>
                        ) : null}

                        <div className={`flex items-start gap-3 ${desktopAside ? "md:items-center" : ""}`}>
                            <div className="min-w-0 flex-1">
                                <div ref={shellRef} className="rounded-full border border-slate-200 bg-white/95 p-2 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.28)] backdrop-blur">
                                    <button type="button" onClick={() => setMobileSheetOpen(true)} className="flex w-full items-center gap-3 px-2 py-1.5 text-left md:hidden" aria-label="Mở bộ tìm kiếm">
                                        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-500"><FaSearch size={14} /></span>
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate text-sm font-semibold text-gray-900">{draftState.location || "Địa điểm, ngày, khách"}</span>
                                            <span className="block truncate text-xs text-gray-500">{`${formatSearchDateRange(draftState.checkIn, draftState.checkOut)} • ${buildGuestSummary(draftState.guests, "1 khách")}`}</span>
                                        </span>
                                        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-cyan-600 text-white shadow-sm"><FaSearch size={13} /></span>
                                    </button>

                                    <div className="hidden grid-cols-[minmax(0,1.35fr)_1px_minmax(0,1fr)_1px_minmax(0,1fr)_1px_minmax(0,1.1fr)_auto] items-center gap-2 md:grid">
                                        <SearchFieldButton label="Địa điểm" value={draftState.location} placeholder="Bạn muốn ở đâu?" icon={<FaMapMarkerAlt size={14} />} isActive={openField === "location"} onClick={() => setOpenField((current) => (current === "location" ? null : "location"))} ariaLabel="Chọn địa điểm" buttonRef={locationButtonRef} />
                                        <span className="h-10 w-px bg-slate-200" />
                                        <SearchFieldButton label="Nhận phòng" value={draftState.checkIn ? formatSearchDate(draftState.checkIn) : ""} placeholder="Thêm ngày" icon={<FaCalendarAlt size={14} />} isActive={openField === "checkIn"} onClick={() => setOpenField((current) => (current === "checkIn" ? null : "checkIn"))} ariaLabel="Chọn ngày nhận phòng" buttonRef={checkInButtonRef} />
                                        <span className="h-10 w-px bg-slate-200" />
                                        <SearchFieldButton label="Trả phòng" value={draftState.checkOut ? formatSearchDate(draftState.checkOut) : ""} placeholder="Thêm ngày" icon={<FaCalendarAlt size={14} />} isActive={openField === "checkOut"} onClick={() => setOpenField((current) => (current === "checkOut" ? null : "checkOut"))} ariaLabel="Chọn ngày trả phòng" buttonRef={checkOutButtonRef} />
                                        <span className="h-10 w-px bg-slate-200" />
                                        <SearchFieldButton label="Khách" value={hasCustomGuestState ? buildGuestSummary(draftState.guests) : `${getGuestCount(draftState.guests)} khách`} placeholder="Thêm khách" icon={<FaUsers size={14} />} isActive={openField === "guests"} onClick={() => setOpenField((current) => (current === "guests" ? null : "guests"))} ariaLabel="Chọn số lượng khách" buttonRef={guestsButtonRef} />
                                        <button type="button" onClick={handleSearch} aria-label="Tìm kiếm nơi lưu trú" className="inline-flex h-12 min-w-[118px] items-center justify-center gap-2 rounded-full bg-cyan-600 px-4 text-sm font-semibold text-white shadow-[0_18px_35px_-22px_rgba(8,145,178,0.9)] transition-all hover:-translate-y-0.5 hover:bg-cyan-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-200 active:translate-y-0">
                                            <FaSearch size={13} />
                                            <span>Tìm kiếm</span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {desktopAside ? <div className="hidden md:block">{desktopAside}</div> : null}
                        </div>
                    </div>
                </div>
            </div>

            <SearchPopover ref={popoverRef} isOpen={openField === "location"} anchorEl={activeAnchor} align="start" className="w-[min(400px,calc(100vw-2rem))]">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_32px_80px_-44px_rgba(15,23,42,0.38)]">
                    <p className="text-sm font-semibold text-gray-900">Bạn muốn ở đâu?</p>
                    <p className="mt-1 text-xs text-gray-500">Tìm theo tên villa, địa chỉ hoặc khu vực nổi bật.</p>
                    <input ref={locationInputRef} type="text" value={draftState.location} onChange={(event) => setDraftState((current) => ({ ...current, location: event.target.value }))} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); handleSearch(); } }} placeholder="Ví dụ: Vũng Tàu, Phan Chu Trinh..." className="mt-4 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200" />
                </div>
            </SearchPopover>

            <SearchPopover ref={popoverRef} isOpen={openField === "checkIn" || openField === "checkOut"} anchorEl={activeAnchor} align="center" className="w-[min(860px,calc(100vw-2rem))]">
                <DatePickerPanel isOpen selectedDate={openField === "checkOut" ? draftState.checkOut : draftState.checkIn} minDate={openField === "checkOut" ? draftState.checkIn || todayIso : todayIso} onSelectDate={(nextDate) => handleDateChange(openField === "checkOut" ? "checkOut" : "checkIn", nextDate)} onClear={clearDates} variant="inline" />
            </SearchPopover>

            <SearchPopover ref={popoverRef} isOpen={openField === "guests"} anchorEl={activeAnchor} align="end" className="w-[min(380px,calc(100vw-2rem))]">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_32px_80px_-44px_rgba(15,23,42,0.38)]">
                    <p className="text-sm font-semibold text-gray-900">Bạn đi cùng ai?</p>
                    <p className="mt-1 text-xs text-gray-500">Số lượng khách giúp chúng tôi gợi ý chỗ nghỉ phù hợp hơn.</p>
                    <div className="mt-5 space-y-4">
                        {guestFieldConfigs.map((field) => {
                            const currentValue = draftState.guests[field.key];
                            const disableMinus = currentValue <= field.min;
                            const disablePlus = currentValue >= field.max;

                            return (
                                <div key={field.key} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900">{field.label}</p>
                                        <p className="text-xs text-gray-500">{field.description}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button type="button" onClick={() => updateGuests(field.key, -1, field.min, field.max)} disabled={disableMinus} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 text-gray-600 transition-colors hover:border-cyan-300 hover:text-cyan-700 disabled:cursor-not-allowed disabled:opacity-35" aria-label={`Giảm ${field.label}`}><FaMinus size={10} /></button>
                                        <span className="w-6 text-center text-sm font-semibold text-gray-900">{currentValue}</span>
                                        <button type="button" onClick={() => updateGuests(field.key, 1, field.min, field.max)} disabled={disablePlus} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 text-gray-600 transition-colors hover:border-cyan-300 hover:text-cyan-700 disabled:cursor-not-allowed disabled:opacity-35" aria-label={`Tăng ${field.label}`}><FaPlus size={10} /></button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </SearchPopover>

            {mobileSheetOpen ? (
                <div className="fixed inset-0 z-[80] md:hidden">
                    <div className="absolute inset-0 bg-black/45" onClick={() => setMobileSheetOpen(false)} role="presentation" />
                    <div className="absolute inset-x-0 bottom-0 max-h-[92vh] overflow-y-auto rounded-t-[32px] bg-white px-4 pb-24 pt-4 shadow-2xl">
                        <button type="button" onClick={() => setMobileSheetOpen(false)} aria-label="Đóng bộ tìm kiếm" className="mx-auto mb-4 block h-1.5 w-12 rounded-full bg-gray-300" />

                        <div className="space-y-4">
                            <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-gray-500">Địa điểm</p>
                                <input type="text" value={draftState.location} onChange={(event) => setDraftState((current) => ({ ...current, location: event.target.value }))} placeholder="Ví dụ: Vũng Tàu, Bãi Sau..." className="mt-3 w-full rounded-xl border border-gray-200 px-4 py-3 text-base text-gray-800 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200" />
                            </section>

                            <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                                <div className="grid grid-cols-2 gap-2">
                                    <button type="button" onClick={() => setMobileDateField("checkIn")} className={`rounded-xl border px-3 py-3 text-left transition ${mobileDateField === "checkIn" ? "border-cyan-500 bg-cyan-50 text-cyan-700" : "border-gray-200 bg-white text-gray-700"}`}>
                                        <p className="text-xs font-semibold uppercase tracking-[0.12em]">Nhận phòng</p>
                                        <p className="mt-2 text-sm font-semibold">{draftState.checkIn ? formatSearchDate(draftState.checkIn) : "Thêm ngày"}</p>
                                    </button>
                                    <button type="button" onClick={() => setMobileDateField("checkOut")} className={`rounded-xl border px-3 py-3 text-left transition ${mobileDateField === "checkOut" ? "border-cyan-500 bg-cyan-50 text-cyan-700" : "border-gray-200 bg-white text-gray-700"}`}>
                                        <p className="text-xs font-semibold uppercase tracking-[0.12em]">Trả phòng</p>
                                        <p className="mt-2 text-sm font-semibold">{draftState.checkOut ? formatSearchDate(draftState.checkOut) : "Thêm ngày"}</p>
                                    </button>
                                </div>
                                <div className="mt-4">
                                    <DatePickerPanel isOpen selectedDate={mobileDateField === "checkIn" ? draftState.checkIn : draftState.checkOut} minDate={mobileDateField === "checkIn" ? todayIso : draftState.checkIn || todayIso} onSelectDate={(nextDate) => handleDateChange(mobileDateField, nextDate)} onClear={clearDates} variant="inline" />
                                </div>
                            </section>

                            <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-gray-500">Khách</p>
                                <div className="mt-4 space-y-4">
                                    {guestFieldConfigs.map((field) => {
                                        const currentValue = draftState.guests[field.key];
                                        const disableMinus = currentValue <= field.min;
                                        const disablePlus = currentValue >= field.max;

                                        return (
                                            <div key={field.key} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
                                                <div>
                                                    <p className="font-semibold text-gray-900">{field.label}</p>
                                                    <p className="text-sm text-gray-500">{field.description}</p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <button type="button" onClick={() => updateGuests(field.key, -1, field.min, field.max)} disabled={disableMinus} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 text-gray-600 disabled:cursor-not-allowed disabled:opacity-35" aria-label={`Giảm ${field.label}`}><FaMinus size={10} /></button>
                                                    <span className="w-6 text-center font-semibold text-gray-900">{currentValue}</span>
                                                    <button type="button" onClick={() => updateGuests(field.key, 1, field.min, field.max)} disabled={disablePlus} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 text-gray-600 disabled:cursor-not-allowed disabled:opacity-35" aria-label={`Tăng ${field.label}`}><FaPlus size={10} /></button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>
                        </div>

                        <div className="sticky bottom-0 mt-6 border-t border-gray-100 bg-white pb-2 pt-4">
                            <div className="flex items-center gap-3">
                                <button type="button" onClick={resetSearch} className="inline-flex h-12 flex-1 items-center justify-center rounded-xl border border-gray-200 px-4 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50">Xóa tất cả</button>
                                <button type="button" onClick={handleSearch} className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-cyan-700"><FaSearch size={13} />Tìm kiếm</button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}
        </>
    );
};

export default SearchBar;
