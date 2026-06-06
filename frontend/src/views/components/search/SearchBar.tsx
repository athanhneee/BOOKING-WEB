import { useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import { FaMinus, FaPlus } from "react-icons/fa";
import { FiCalendar, FiSearch, FiUsers } from "react-icons/fi";
import { HiOutlineMapPin, HiOutlineSparkles } from "react-icons/hi2";
import { Sparkles, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { APP_ROUTES } from "../../../config/routes";
import {
    LOCATION_GROUP_SUGGESTIONS,
    MAP_SEARCH_LABEL,
    MAP_SEARCH_RADIUS_METERS,
    VUNG_TAU_DEFAULT_COORDINATES,
    isLatLngInVungTauBounds,
    type LocationGroupName,
} from "../../../data/vungTauLocationGroups";
import { addSearchHistoryItem } from "../../../features/searchHistory/searchHistoryStorage";
import useScrollVisibility from "../../../hooks/useScrollVisibility";
import { cn } from "../../../utils";
import LocationMapPicker, { type MapSearchPosition } from "./LocationMapPicker";
import SearchPopover from "./SearchPopover";
import DatePickerPanel from "./booking/DatePickerPanel";
import type { GuestSelection } from "./booking/Guest";
import {
    buildBookingSearchParams,
    buildGuestSummary,
    createDefaultBookingSearchState,
    defaultGuestSelection,
    formatSearchDate,
    formatSearchDateRange,
    guestFieldConfigs,
    normalizeSearchText,
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

type SearchSuggestion = {
    id: string;
    title: string;
    description: string;
    value: string;
    kind: "map" | "locationGroup";
    locationGroup?: LocationGroupName;
    icon: ReactNode;
    accentClassName: string;
};

const DEFAULT_MAP_SEARCH_POSITION: MapSearchPosition = {
    lat: VUNG_TAU_DEFAULT_COORDINATES.latitude,
    lng: VUNG_TAU_DEFAULT_COORDINATES.longitude,
};

const AI_SEARCH_SUGGESTIONS = [
    "Villa gần biển có hồ bơi riêng", "Cho 10-15 người có BBQ ạ, gần biển đi bộ ", "Villa view biển có loa karaoke ",
];

const AI_EMPTY_HINT = "Thử nhập: Villa gần biển có hồ bơi cho 10 người";

const getTimeOfDay = (date = new Date()) => {
    const hour = date.getHours();

    if (hour < 11) return "Sáng";
    if (hour < 14) return "Trưa";
    if (hour < 18) return "Chiều";
    return "Tối";
};

const createSearchSyncKey = (pathname: string, search: string, variant: SearchBarVariant) =>
    pathname === APP_ROUTES.search || pathname === APP_ROUTES.searchLegacy
        ? `search:${buildBookingSearchParams(parseBookingSearchParams(search)).toString()}`
        : `${variant}:${pathname}`;

const isSearchRoutePath = (pathname: string) =>
    pathname === APP_ROUTES.search || pathname === APP_ROUTES.searchLegacy;

const createLocationSuggestions = (): SearchSuggestion[] => {
    const accents = [
        "bg-sky-100 text-sky-600",
        "bg-cyan-100 text-cyan-500",
        "bg-rose-100 text-rose-500",
        "bg-emerald-100 text-emerald-600",
        "bg-amber-100 text-amber-600",
    ];

    const icons = [
        <HiOutlineMapPin key="map-search" size={20} />,
        <HiOutlineSparkles key="bai-sau" size={20} />,
        <HiOutlineMapPin key="bai-truoc" size={20} />,
        <HiOutlineSparkles key="long-cung" size={20} />,
        <HiOutlineMapPin key="ho-tram" size={20} />,
    ];

    const locations: Array<Omit<SearchSuggestion, "icon" | "accentClassName">> = [
        {
            id: "map-search",
            title: "Tìm kiếm bằng bản đồ",
            description: "Chọn vị trí trên bản đồ, tìm quanh 800m",
            value: MAP_SEARCH_LABEL,
            kind: "map",
        },
        ...LOCATION_GROUP_SUGGESTIONS.map((suggestion) => ({
            ...suggestion,
            value: suggestion.title,
            kind: "locationGroup" as const,
            locationGroup: suggestion.title,
        })),
    ];

    return locations.map((location, index) => ({
        ...location,
        icon: icons[index] ?? icons[0],
        accentClassName: accents[index % accents.length],
    }));
};

const Divider = ({ visible, className }: { visible: boolean; className?: string }) =>
    visible ? (
        <span
            className={cn(
                "pointer-events-none absolute right-0 top-1/2 h-9 w-px -translate-y-1/2 bg-slate-200/80",
                className,
            )}
        />
    ) : null;

type DesktopFieldProps = {
    label: string;
    value: string;
    placeholder: string;
    icon: ReactNode;
    isActive: boolean;
    onClick: () => void;
    buttonRef?: RefObject<HTMLButtonElement | null>;
    showDivider?: boolean;
    tone?: "default" | "hero";
};

const DesktopField = ({
    label,
    value,
    placeholder,
    icon,
    isActive,
    onClick,
    buttonRef,
    showDivider = false,
    tone = "default",
}: DesktopFieldProps) => (
    <div className="relative min-w-0">
        <button
            ref={buttonRef}
            type="button"
            onMouseDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
            }}
            onClick={(event) => {
                event.stopPropagation();
                onClick();
            }}
            aria-expanded={isActive}
            className={cn(
                "search-field-btn flex w-full items-center gap-3 rounded-full px-5 py-3 text-left transition-all duration-200",
                isActive
                    ? tone === "hero"
                        ? "bg-white shadow-[0_16px_32px_-24px_rgba(15,23,42,0.32)] ring-1 ring-cyan-300"
                        : "bg-white shadow-md ring-2 ring-cyan-300"
                    : tone === "hero"
                        ? "hover:bg-slate-50/80"
                        : "hover:bg-gray-50",
            )}
        >
            <span className="shrink-0 text-lg text-gray-400">{icon}</span>
            <span className="min-w-0 flex-1">
                <span className="block text-xs font-semibold text-gray-800">{label}</span>
                <span className={cn("mt-0.5 block truncate text-sm", value ? "text-gray-700" : "text-gray-400")}>
                    {value || placeholder}
                </span>
            </span>
        </button>
        <Divider visible={showDivider && !isActive} className={tone === "hero" ? "bg-slate-200/70" : undefined} />
    </div>
);

const SearchBarInner = ({
    inferredVariant,
    initialDraftState,
    forceHidden = false,
    forceVisible = false,
    desktopAside,
}: SearchBarProps & {
    inferredVariant: SearchBarVariant;
    initialDraftState: BookingSearchState;
}) => {
    const navigate = useNavigate();
    const location = useLocation();
    const isScrollVisible = useScrollVisibility({ threshold: 12, topOffset: 64, hideStartRatio: 0.5 });
    const todayIso = useMemo(() => toIsoDate(new Date()), []);
    const locationSuggestions = useMemo(() => createLocationSuggestions(), []);
    const [openField, setOpenField] = useState<OpenField>(null);
    const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
    const [mapPickerOpen, setMapPickerOpen] = useState(false);
    const [mobileDateField, setMobileDateField] = useState<"checkIn" | "checkOut">("checkIn");
    const [draftState, setDraftState] = useState(initialDraftState);
    const [aiOverlayOpen, setAiOverlayOpen] = useState(false);
    const [aiQuery, setAiQuery] = useState("");
    const [mapPosition, setMapPosition] = useState<MapSearchPosition>(() => {
        const lat = Number(initialDraftState.mapLat);
        const lng = Number(initialDraftState.mapLng);
        const initialPosition = { lat, lng };

        return isLatLngInVungTauBounds(initialPosition)
            ? initialPosition
            : DEFAULT_MAP_SEARCH_POSITION;
    });
    const [timeOfDay, setTimeOfDay] = useState(() => getTimeOfDay());
    const [aiSearchError, setAiSearchError] = useState("");
    const [isPinnedByScroll, setIsPinnedByScroll] = useState(() =>
        typeof window !== "undefined" ? window.scrollY > 320 : false,
    );

    const shellRef = useRef<HTMLDivElement | null>(null);
    const popoverRef = useRef<HTMLDivElement | null>(null);
    const aiOverlayRef = useRef<HTMLFormElement | null>(null);
    const aiInputRef = useRef<HTMLInputElement | null>(null);
    const locationInputRef = useRef<HTMLInputElement | null>(null);
    const locationFieldRef = useRef<HTMLDivElement | null>(null);
    const checkInButtonRef = useRef<HTMLButtonElement | null>(null);
    const checkOutButtonRef = useRef<HTMLButtonElement | null>(null);
    const guestsButtonRef = useRef<HTMLButtonElement | null>(null);
    const closeCalendarTimeoutRef = useRef<number | null>(null);

    const isListing = inferredVariant === "listing";

    useEffect(() => {
        if (isListing || forceVisible) {
            return;
        }

        const handleScroll = () => setIsPinnedByScroll(window.scrollY > 320);
        window.addEventListener("scroll", handleScroll, { passive: true });

        return () => window.removeEventListener("scroll", handleScroll);
    }, [forceVisible, isListing]);

    useEffect(() => {
        const updateTimeOfDay = () => setTimeOfDay(getTimeOfDay());
        updateTimeOfDay();

        const timer = window.setInterval(updateTimeOfDay, 60000);
        return () => window.clearInterval(timer);
    }, []);

    useEffect(() => {
        if (openField !== "location") {
            return;
        }

        const frame = window.requestAnimationFrame(() => locationInputRef.current?.focus());
        return () => window.cancelAnimationFrame(frame);
    }, [openField]);

    useEffect(() => {
        if (!aiOverlayOpen) {
            return;
        }

        const frame = window.requestAnimationFrame(() => aiInputRef.current?.focus());
        return () => window.cancelAnimationFrame(frame);
    }, [aiOverlayOpen]);

    useEffect(() => {
        if (!openField && !mobileSheetOpen && !aiOverlayOpen) {
            return;
        }

        const handleMouseDown = (event: MouseEvent) => {
            const target = event.target as Node;
            if (
                shellRef.current?.contains(target) ||
                popoverRef.current?.contains(target) ||
                aiOverlayRef.current?.contains(target)
            ) {
                return;
            }

            setOpenField(null);
            setAiOverlayOpen(false);
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setOpenField(null);
                setMobileSheetOpen(false);
                setAiOverlayOpen(false);
            }
        };

        document.addEventListener("mousedown", handleMouseDown);
        window.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("mousedown", handleMouseDown);
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [aiOverlayOpen, mobileSheetOpen, openField]);

    useEffect(() => {
        if (!mobileSheetOpen) {
            return;
        }

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [mobileSheetOpen]);

    useEffect(
        () => () => {
            if (closeCalendarTimeoutRef.current !== null) {
                window.clearTimeout(closeCalendarTimeoutRef.current);
            }
        },
        [],
    );

    const filteredSuggestions = useMemo(() => {
        const query = normalizeSearchText(draftState.location);

        if (!query) {
            return locationSuggestions;
        }

        return locationSuggestions.filter((item) =>
            normalizeSearchText(`${item.title} ${item.description} ${item.value}`).includes(query),
        );
    }, [draftState.location, locationSuggestions]);

    const shouldPin = !isListing && (forceVisible || isPinnedByScroll || openField !== null || mobileSheetOpen);
    const shouldShow = isListing || forceVisible || isScrollVisible || openField !== null || mobileSheetOpen;
    const shouldShowIntro = inferredVariant === "home" && !shouldPin;
    const isHeroIntro = shouldShowIntro;
    const hasCustomGuests =
        draftState.guests.adults !== defaultGuestSelection.adults ||
        draftState.guests.children !== defaultGuestSelection.children ||
        draftState.guests.infants !== defaultGuestSelection.infants ||
        draftState.guests.pets !== defaultGuestSelection.pets;

    const heroShellClass = isHeroIntro
        ? "rounded-[28px] border border-slate-200/80 bg-white px-2 py-2 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.24)] md:rounded-full"
        : "rounded-full border border-gray-100 bg-white px-2 py-2 shadow-2xl";

    const heroFieldActiveClass = isHeroIntro
        ? "bg-white shadow-[0_16px_32px_-24px_rgba(15,23,42,0.32)] ring-1 ring-cyan-300"
        : "bg-white shadow-md ring-2 ring-cyan-300";

    const heroFieldIdleClass = isHeroIntro ? "hover:bg-slate-50/80" : "hover:bg-gray-50";

    const searchButtonClass = isHeroIntro
        ? "ml-1 inline-flex h-14 w-14 items-center justify-center rounded-full bg-cyan-500 text-white shadow-[0_18px_32px_-18px_rgba(6,182,212,0.62)] transition-all duration-200 hover:bg-cyan-500 hover:shadow-[0_20px_36px_-18px_rgba(8,145,178,0.6)]"
        : "ml-1 inline-flex h-14 w-14 items-center justify-center rounded-full bg-cyan-500 text-white shadow-md transition-all duration-200 hover:bg-cyan-500 hover:shadow-lg";

    const activeAnchorRef = (
        openField === "location"
            ? locationFieldRef
            : openField === "checkIn"
                ? checkInButtonRef
                : openField === "checkOut"
                    ? checkOutButtonRef
                    : guestsButtonRef
    ) as RefObject<HTMLElement | null>;

    const updateGuests = (key: keyof GuestSelection, delta: number, min: number, max: number) =>
        setDraftState((current) => {
            const nextValue = current.guests[key] + delta;
            if (nextValue < min || nextValue > max) {
                return current;
            }

            return {
                ...current,
                guests: {
                    ...current.guests,
                    [key]: nextValue,
                },
            };
        });

    const resetSearch = () => {
        setDraftState(createDefaultBookingSearchState());
        setOpenField(null);
        setMobileDateField("checkIn");
    };

    const clearDates = () => {
        setDraftState((current) => ({
            ...current,
            checkIn: "",
            checkOut: "",
        }));
        setOpenField("checkIn");
        setMobileDateField("checkIn");
    };

    const handleDateChange = (field: "checkIn" | "checkOut", nextDate: string) => {
        if (closeCalendarTimeoutRef.current !== null) {
            window.clearTimeout(closeCalendarTimeoutRef.current);
            closeCalendarTimeoutRef.current = null;
        }

        if (field === "checkIn") {
            setDraftState((current) => ({
                ...current,
                checkIn: nextDate,
                checkOut: "",
            }));
            setMobileDateField("checkOut");
            setOpenField("checkOut");
            return;
        }

        let shouldCloseDesktop = false;

        setDraftState((current) => {
            if (!current.checkIn || nextDate <= current.checkIn) {
                return {
                    ...current,
                    checkIn: nextDate,
                    checkOut: "",
                };
            }

            shouldCloseDesktop = true;
            return {
                ...current,
                checkOut: nextDate,
            };
        });

        if (shouldCloseDesktop) {
            if (mobileSheetOpen) {
                return;
            }

            closeCalendarTimeoutRef.current = window.setTimeout(() => {
                setOpenField(null);
                closeCalendarTimeoutRef.current = null;
            }, 400);
        } else {
            setMobileDateField("checkOut");
            setOpenField("checkOut");
        }
    };

    const setLocationText = (value: string) =>
        setDraftState((current) => ({
            ...current,
            q: value,
            location: value,
            locationGroup: "",
            mapLat: "",
            mapLng: "",
            mapRadius: "",
        }));

    const clearLocation = () => setLocationText("");

    const submitSearchState = (state: BookingSearchState) => {
        const nextState = sanitizeBookingSearchState(state);
        const nextParams = buildBookingSearchParams(nextState);
        nextParams.delete("page");

        setDraftState(nextState);
        setOpenField(null);
        setMobileSheetOpen(false);
        setMapPickerOpen(false);
        addSearchHistoryItem(nextState);

        navigate({
            pathname: APP_ROUTES.search,
            search: nextParams.toString() ? `?${nextParams}` : "",
        });
    };

    const handleSearch = () => {
        submitSearchState(draftState);
    };

    const handleLocationSuggestionSelect = (item: SearchSuggestion) => {
        if (item.kind === "map") {
            setOpenField(null);
            setMobileSheetOpen(false);
            setMapPickerOpen(true);
            return;
        }

        setDraftState((current) => ({
            ...current,
            q: "",
            location: item.title,
            locationGroup: item.locationGroup ?? "",
            mapLat: "",
            mapLng: "",
            mapRadius: "",
        }));
        setOpenField(null);
    };

    const handleMapSearchConfirm = (position: MapSearchPosition) => {
        const nextState: BookingSearchState = {
            ...draftState,
            q: "",
            location: MAP_SEARCH_LABEL,
            locationGroup: "",
            mapLat: position.lat.toFixed(6),
            mapLng: position.lng.toFixed(6),
            mapRadius: String(MAP_SEARCH_RADIUS_METERS),
        };

        setMapPosition(position);
        submitSearchState(nextState);
    };

    const openAiOverlay = () => {
        setAiSearchError("");
        setOpenField(null);
        setMobileSheetOpen(false);
        setAiOverlayOpen(true);
    };

    const closeAiOverlay = () => {
        setAiOverlayOpen(false);
        setAiSearchError("");
    };

    const handleAiQueryChange = (value: string) => {
        setAiQuery(value);
        if (aiSearchError) {
            setAiSearchError("");
        }
    };

    const handleAiSuggestionClick = (suggestion: string) => {
        setAiQuery(suggestion);
        setAiSearchError("");
        aiInputRef.current?.focus();
    };

    const submitAiSearch = () => {
        const keyword = aiQuery.trim();

        if (!keyword) {
            setAiSearchError(AI_EMPTY_HINT);
            aiInputRef.current?.focus();
            return;
        }

        setAiSearchError("");
        setOpenField(null);
        setMobileSheetOpen(false);
        setAiOverlayOpen(false);

        if (location.pathname === APP_ROUTES.aiSearch) {
            window.dispatchEvent(new CustomEvent("ai-search-submit", { detail: { query: keyword } }));
            return;
        }

        navigate(APP_ROUTES.aiSearch, {
            state: {
                initialQuery: keyword,
            },
        });
    };

    if (forceHidden) {
        return null;
    }

    return (
        <>
            <div
                className={cn(
                    isListing
                        ? "relative w-full"
                        : shouldPin
                            ? "fixed left-0 top-14 z-40 w-full md:top-20"
                            : "relative -mt-28 md:-mt-40",
                    !isListing && "px-4 transition-[transform,opacity] duration-300 md:px-6",
                    !isListing &&
                    (shouldShow ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-4 opacity-0"),
                )}
            >
                <div className={cn("mx-auto", isListing ? "max-w-none" : shouldShowIntro ? "max-w-5xl" : "max-w-4xl")}>
                    <div
                        className={cn(
                            shouldShowIntro &&
                            "rounded-[34px] border border-white/80 bg-white/96 px-4 py-5 shadow-[0_32px_84px_-56px_rgba(15,23,42,0.32)] md:rounded-[40px] md:px-7 md:py-7",
                        )}
                    >
                        {shouldShowIntro ? (
                            <div className="mb-5 text-center md:mb-7">
                                <p className="text-[1.65rem] font-semibold leading-[0.95] tracking-[-0.045em] text-cyan-500 sm:text-[2.2rem] md:text-[3.15rem]">
                                    {`Chào buổi ${timeOfDay}!`}
                                </p>
                                <p className="mx-auto mt-2 max-w-[44rem] text-sm leading-6 text-slate-600 sm:mt-3 md:text-[1.125rem] md:leading-7">
                                    Trân trọng được chào đón bạn tại thành phố biển Vũng Tàu
                                </p>
                            </div>
                        ) : null}

                        <div className="relative isolate">
                            <div
                                className={cn(
                                    "flex items-center gap-4 transition-[opacity,transform] duration-200",
                                    desktopAside ? "xl:items-center" : "",
                                )}
                            >
                                <div className="relative min-w-0 flex-1">
                                    <div
                                        ref={shellRef}
                                        className={cn(
                                            heroShellClass,
                                            "transition-[opacity,transform] duration-300 ease-out",
                                            aiOverlayOpen && "pointer-events-none scale-[0.985] opacity-0",
                                        )}
                                    >
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setOpenField(null);
                                                setMobileSheetOpen(true);
                                            }}
                                            className="flex w-full items-center gap-3 px-2 py-1.5 text-left md:hidden"
                                            aria-label="Mở bộ tìm kiếm"
                                        >
                                            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-gray-500 shadow-sm">
                                                <FiSearch size={16} />
                                            </span>
                                            <span className="min-w-0 flex-1">
                                                <span className="block truncate text-sm font-semibold text-gray-900">
                                                    {draftState.location || "Địa điểm, ngày, khách"}
                                                </span>
                                                <span className="mt-0.5 block truncate text-xs text-gray-500">
                                                    {`${formatSearchDateRange(draftState.checkIn, draftState.checkOut)} • ${buildGuestSummary(draftState.guests, "1 khách")}`}
                                                </span>
                                            </span>
                                            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-cyan-500 text-white shadow-md">
                                                <FiSearch size={16} />
                                            </span>
                                        </button>

                                        <div className="hidden grid-cols-[minmax(0,1.24fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] items-center md:grid">
                                            <div className="relative min-w-0">
                                                <div
                                                    ref={locationFieldRef}
                                                    role="button"
                                                    tabIndex={0}
                                                    onMouseDown={(event) => {
                                                        event.preventDefault();
                                                        event.stopPropagation();
                                                    }}
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        setMobileSheetOpen(false);
                                                        setOpenField((current) =>
                                                            current === "location" ? null : "location",
                                                        );
                                                    }}
                                                    onKeyDown={(event) => {
                                                        if (event.key === "Enter" || event.key === " ") {
                                                            event.preventDefault();
                                                            setOpenField("location");
                                                        }
                                                    }}
                                                    className={cn(
                                                        "search-field-btn flex cursor-text items-center gap-3 rounded-full px-5 py-3 transition-all duration-200",
                                                        openField === "location"
                                                            ? heroFieldActiveClass
                                                            : heroFieldIdleClass,
                                                    )}
                                                >
                                                    <span className="shrink-0 text-lg text-gray-400">
                                                        <HiOutlineMapPin size={22} />
                                                    </span>
                                                    <span className="min-w-0 flex-1">
                                                        <span className="block text-xs font-semibold text-gray-800">
                                                            Địa điểm
                                                        </span>
                                                        {openField === "location" ? (
                                                            <input
                                                                ref={locationInputRef}
                                                                type="text"
                                                                value={draftState.location}
                                                                onChange={(event) => setLocationText(event.target.value)}
                                                                onClick={(event) => event.stopPropagation()}
                                                                onKeyDown={(event) => {
                                                                    if (event.key === "Enter") {
                                                                        event.preventDefault();
                                                                        handleSearch();
                                                                    }
                                                                }}
                                                                placeholder="Tìm kiếm điểm đến"
                                                                className="mt-0.5 block w-full border-none bg-transparent p-0 text-sm text-gray-700 outline-none placeholder:text-gray-400"
                                                            />
                                                        ) : (
                                                            <span
                                                                className={cn(
                                                                    "mt-0.5 block truncate text-sm",
                                                                    draftState.location ? "text-gray-700" : "text-gray-400",
                                                                )}
                                                            >
                                                                {draftState.location || "Tìm kiếm điểm đến"}
                                                            </span>
                                                        )}
                                                    </span>
                                                </div>
                                                <Divider visible={openField !== "location"} />
                                            </div>

                                            <DesktopField
                                                label="Nhận phòng"
                                                value={draftState.checkIn ? formatSearchDate(draftState.checkIn) : ""}
                                                placeholder="Thêm ngày"
                                                icon={<FiCalendar size={20} />}
                                                isActive={openField === "checkIn"}
                                                tone={isHeroIntro ? "hero" : "default"}
                                                onClick={() => {
                                                    setMobileSheetOpen(false);
                                                    setOpenField((current) => (current === "checkIn" ? null : "checkIn"));
                                                }}
                                                buttonRef={checkInButtonRef}
                                                showDivider={openField !== "checkIn"}
                                            />

                                            <DesktopField
                                                label="Trả phòng"
                                                value={draftState.checkOut ? formatSearchDate(draftState.checkOut) : ""}
                                                placeholder="Thêm ngày"
                                                icon={<FiCalendar size={20} />}
                                                isActive={openField === "checkOut"}
                                                tone={isHeroIntro ? "hero" : "default"}
                                                onClick={() => {
                                                    setMobileSheetOpen(false);
                                                    setOpenField((current) => (current === "checkOut" ? null : "checkOut"));
                                                }}
                                                buttonRef={checkOutButtonRef}
                                                showDivider={openField !== "checkOut"}
                                            />

                                            <DesktopField
                                                label="Khách"
                                                value={hasCustomGuests ? buildGuestSummary(draftState.guests) : ""}
                                                placeholder="Thêm khách"
                                                icon={<FiUsers size={20} />}
                                                isActive={openField === "guests"}
                                                tone={isHeroIntro ? "hero" : "default"}
                                                onClick={() => {
                                                    setMobileSheetOpen(false);
                                                    setOpenField((current) => (current === "guests" ? null : "guests"));
                                                }}
                                                buttonRef={guestsButtonRef}
                                            />

                                            <button
                                                type="button"
                                                onMouseDown={(event) => event.stopPropagation()}
                                                onClick={handleSearch}
                                                className={searchButtonClass}
                                                aria-label="Tìm kiếm"
                                            >
                                                <FiSearch size={20} />
                                            </button>
                                        </div>
                                    </div>

                                    <form
                                        ref={aiOverlayRef}
                                        onSubmit={(event) => {
                                            event.preventDefault();
                                            submitAiSearch();
                                        }}
                                        aria-hidden={!aiOverlayOpen}
                                        className={cn(
                                            "absolute inset-x-0 top-0 z-30 origin-top transition-[opacity,transform] duration-300 ease-out will-change-transform motion-reduce:translate-y-0 motion-reduce:scale-100 motion-reduce:transition-none",
                                            aiOverlayOpen
                                                ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
                                                : "pointer-events-none -translate-y-2 scale-[0.97] opacity-0",
                                        )}
                                    >
                                        <div className={cn(heroShellClass, "flex items-center gap-2")}>
                                            <div
                                                className={cn(
                                                    "flex min-w-0 flex-1 cursor-text items-center gap-3 rounded-full px-5 py-3 transition-all duration-200",
                                                    isHeroIntro
                                                        ? "bg-white shadow-[0_16px_32px_-24px_rgba(15,23,42,0.32)] ring-1 ring-cyan-300"
                                                        : "bg-white shadow-md ring-2 ring-cyan-300",
                                                )}
                                                onClick={() => aiInputRef.current?.focus()}
                                            >
                                                <span className="shrink-0 text-lg text-cyan-500">
                                                    <Sparkles size={22} />
                                                </span>

                                                <span className="min-w-0 flex-1">
                                                    <span className="block text-xs font-semibold text-gray-500">
                                                        Tìm kiếm
                                                    </span>
                                                    <input
                                                        ref={aiInputRef}
                                                        type="text"
                                                        value={aiQuery}
                                                        onChange={(event) => handleAiQueryChange(event.target.value)}
                                                        placeholder="Thử tìm kiếm một nội dung"
                                                        maxLength={500}
                                                        tabIndex={aiOverlayOpen ? 0 : -1}
                                                        className="mt-0.5 block w-full border-none bg-transparent p-0 text-sm  text-gray-500 outline-none placeholder:text-gray-700"
                                                    />
                                                </span>

                                                {aiQuery ? (
                                                    <button
                                                        type="button"
                                                        tabIndex={aiOverlayOpen ? 0 : -1}
                                                        onClick={(event) => {
                                                            event.stopPropagation();
                                                            handleAiQueryChange("");
                                                            aiInputRef.current?.focus();
                                                        }}
                                                        aria-label="Xóa nội dung tìm kiếm AI"
                                                        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-4 focus:ring-slate-100"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                ) : null}
                                            </div>

                                            <button
                                                type="submit"
                                                tabIndex={aiOverlayOpen ? 0 : -1}
                                                aria-label="Tìm kiếm"
                                                className={searchButtonClass}
                                            >
                                                <FiSearch size={20} />
                                            </button>

                                            <button
                                                type="button"
                                                tabIndex={aiOverlayOpen ? 0 : -1}
                                                onClick={closeAiOverlay}
                                                aria-label="Đóng tìm kiếm AI"
                                                className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition-all duration-200 hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-4 focus:ring-slate-100"
                                            >
                                                <X size={18} />
                                            </button>
                                        </div>

                                        {aiSearchError ? (
                                            <p className="mt-3 rounded-full border border-cyan-100 bg-white px-4 py-2 text-center text-sm font-medium text-slate-500 shadow-sm">
                                                {aiSearchError}
                                            </p>
                                        ) : null}

                                        <div className="mt-3 flex flex-wrap gap-2.5 rounded-[28px] border border-cyan-100/80 bg-white/95 p-3 shadow-[0_24px_60px_-36px_rgba(8,145,178,0.4)] backdrop-blur">
                                            {AI_SEARCH_SUGGESTIONS.map((suggestion) => (
                                                <button
                                                    key={suggestion}
                                                    type="button"
                                                    tabIndex={aiOverlayOpen ? 0 : -1}
                                                    onClick={() => handleAiSuggestionClick(suggestion)}
                                                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700 focus:outline-none focus:ring-4 focus:ring-cyan-100"
                                                >
                                                    {suggestion}
                                                </button>
                                            ))}
                                        </div>
                                    </form>
                                </div>

                                <button
                                    type="button"
                                    onMouseDown={(event) => event.stopPropagation()}
                                    onClick={openAiOverlay}
                                    aria-expanded={aiOverlayOpen}
                                    className={cn(
                                        "h-14 shrink-0 items-center justify-center gap-2 rounded-full border border-cyan-200 bg-white px-4 text-sm font-semibold text-cyan-700 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-300 hover:bg-cyan-50 hover:shadow-md sm:px-5",
                                        aiOverlayOpen ? "hidden md:inline-flex" : "inline-flex",
                                    )}
                                >
                                    <Sparkles size={17} />
                                    <span className="hidden sm:inline">Tìm AI</span>
                                    <span className="sm:hidden">AI</span>
                                </button>

                                {desktopAside ? <div className="hidden md:block">{desktopAside}</div> : null}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <SearchPopover
                ref={popoverRef}
                isOpen={openField === "location"}
                anchorRef={activeAnchorRef}
                align="start"
                offset={14}
                className="w-[min(500px,calc(100vw-2rem))]"
            >
                <div className="overflow-hidden rounded-[30px] border border-black/5 bg-white/98 p-5 shadow-[0_36px_85px_-46px_rgba(15,23,42,0.38)]">
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                            <p className="text-base font-semibold text-gray-900">Điểm đến được đề xuất</p>
                        </div>

                        {draftState.location ? (
                            <button
                                type="button"
                                onClick={() => clearLocation()}
                                className="shrink-0 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-50"
                            >
                                Xóa
                            </button>
                        ) : null}
                    </div>

                    <div className="space-y-1">
                        {filteredSuggestions.length > 0 ? (
                            filteredSuggestions.slice(0, 6).map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => handleLocationSuggestionSelect(item)}
                                    className="flex w-full items-center gap-4 rounded-[24px] px-3 py-3 text-left transition-colors hover:bg-gray-50"
                                >
                                    <span
                                        className={cn(
                                            "flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px]",
                                            item.accentClassName,
                                        )}
                                    >
                                        {item.icon}
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate text-base font-semibold text-gray-900">
                                            {item.title}
                                        </span>
                                        <span className="mt-1 block truncate text-sm text-gray-500">
                                            {item.description}
                                        </span>
                                    </span>
                                </button>
                            ))
                        ) : (
                            <div className="rounded-[24px] border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
                                Không có gợi ý phù hợp, bạn vẫn có thể bấm tìm kiếm để xem kết quả.
                            </div>
                        )}
                    </div>
                </div>
            </SearchPopover>

            <SearchPopover
                ref={popoverRef}
                isOpen={openField === "checkIn" || openField === "checkOut"}
                anchorRef={shellRef as RefObject<HTMLElement | null>}
                align="center"
                offset={12}
                className="w-[min(860px,calc(100vw-2rem))]"
            >
                <DatePickerPanel
                    key={`${openField}-${draftState.checkIn}-${draftState.checkOut}`}
                    isOpen
                    selectedDate={openField === "checkOut" ? draftState.checkOut : draftState.checkIn}
                    minDate={openField === "checkOut" ? draftState.checkIn || todayIso : todayIso}
                    rangeStartDate={draftState.checkIn}
                    rangeEndDate={draftState.checkOut}
                    activeField={openField === "checkOut" ? "checkOut" : "checkIn"}
                    onSelectDate={(nextDate) =>
                        handleDateChange(openField === "checkOut" ? "checkOut" : "checkIn", nextDate)
                    }
                    onClear={clearDates}
                    variant="popover"
                />
            </SearchPopover>

            <SearchPopover
                ref={popoverRef}
                isOpen={openField === "guests"}
                anchorRef={activeAnchorRef}
                align="end"
                offset={14}
                className="w-[min(390px,calc(100vw-2rem))]"
            >
                <div className="rounded-[30px] border border-black/5 bg-white p-5 shadow-[0_36px_85px_-46px_rgba(15,23,42,0.38)]">
                    <p className="text-base font-semibold text-gray-900">Bạn đi cùng ai?</p>
                    <p className="mt-1 text-sm text-gray-500">Tối đa 16 khách, chưa tính em bé và thú cưng.</p>

                    <div className="mt-5 space-y-4">
                        {guestFieldConfigs.map((field) => {
                            const currentValue = draftState.guests[field.key];
                            const disableMinus = currentValue <= field.min;
                            const disablePlus = currentValue >= field.max;

                            return (
                                <div
                                    key={field.key}
                                    className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4"
                                >
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900">{field.label}</p>
                                        <p className="text-xs text-gray-500">{field.description}</p>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={() => updateGuests(field.key, -1, field.min, field.max)}
                                            disabled={disableMinus}
                                            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 text-gray-600 transition-colors hover:border-cyan-300 hover:text-cyan-700 disabled:cursor-not-allowed disabled:opacity-35"
                                            aria-label={`Giảm ${field.label}`}
                                        >
                                            <FaMinus size={10} />
                                        </button>
                                        <span className="w-6 text-center text-sm font-semibold text-gray-900">
                                            {currentValue}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => updateGuests(field.key, 1, field.min, field.max)}
                                            disabled={disablePlus}
                                            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 text-gray-600 transition-colors hover:border-cyan-300 hover:text-cyan-700 disabled:cursor-not-allowed disabled:opacity-35"
                                            aria-label={`Tăng ${field.label}`}
                                        >
                                            <FaPlus size={10} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </SearchPopover>

            {mobileSheetOpen ? (
                <div className="fixed inset-0 z-[80] md:hidden">
                    <div
                        className="absolute inset-0 bg-black/45"
                        onClick={() => setMobileSheetOpen(false)}
                        role="presentation"
                    />

                    <div className="absolute inset-x-0 bottom-0 max-h-[92vh] overflow-y-auto rounded-t-[32px] bg-[#f7f6f3] px-4 pb-24 pt-4 shadow-2xl">
                        <button
                            type="button"
                            onClick={() => setMobileSheetOpen(false)}
                            aria-label="Đóng bộ tìm kiếm"
                            className="mx-auto mb-4 block h-1.5 w-12 rounded-full bg-gray-300"
                        />

                        <div className="space-y-4">
                            <section className="rounded-[28px] border border-white/80 bg-white p-4 shadow-sm">
                                <p className="text-sm font-semibold text-gray-900">Địa điểm</p>
                                <input
                                    type="text"
                                    value={draftState.location}
                                    onChange={(event) => setLocationText(event.target.value)}
                                    placeholder="Tìm kiếm điểm đến"
                                    className="mt-3 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-base text-gray-800 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
                                />

                                <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                                    {locationSuggestions.map((item) => (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={() => handleLocationSuggestionSelect(item)}
                                            className="inline-flex shrink-0 items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700"
                                        >
                                            <span
                                                className={cn(
                                                    "flex h-7 w-7 items-center justify-center rounded-full",
                                                    item.accentClassName,
                                                )}
                                            >
                                                {item.icon}
                                            </span>
                                            {item.title}
                                        </button>
                                    ))}
                                </div>
                            </section>

                            <section className="rounded-[28px] border border-white/80 bg-white p-4 shadow-sm">
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setMobileDateField("checkIn")}
                                        className={cn(
                                            "rounded-2xl border px-3 py-3 text-left transition",
                                            mobileDateField === "checkIn"
                                                ? "border-cyan-500 bg-cyan-50 text-cyan-700"
                                                : "border-gray-200 bg-white text-gray-700",
                                        )}
                                    >
                                        <p className="text-xs font-semibold uppercase tracking-[0.12em]">Nhận phòng</p>
                                        <p className="mt-2 text-sm font-semibold">
                                            {draftState.checkIn ? formatSearchDate(draftState.checkIn) : "Thêm ngày"}
                                        </p>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setMobileDateField("checkOut")}
                                        className={cn(
                                            "rounded-2xl border px-3 py-3 text-left transition",
                                            mobileDateField === "checkOut"
                                                ? "border-cyan-500 bg-cyan-50 text-cyan-700"
                                                : "border-gray-200 bg-white text-gray-700",
                                        )}
                                    >
                                        <p className="text-xs font-semibold uppercase tracking-[0.12em]">Trả phòng</p>
                                        <p className="mt-2 text-sm font-semibold">
                                            {draftState.checkOut ? formatSearchDate(draftState.checkOut) : "Thêm ngày"}
                                        </p>
                                    </button>
                                </div>

                                <div className="mt-4">
                                    <DatePickerPanel
                                        key={`mobile-${mobileDateField}-${draftState.checkIn}-${draftState.checkOut}`}
                                        isOpen
                                        selectedDate={
                                            mobileDateField === "checkIn" ? draftState.checkIn : draftState.checkOut
                                        }
                                        minDate={mobileDateField === "checkIn" ? todayIso : draftState.checkIn || todayIso}
                                        rangeStartDate={draftState.checkIn}
                                        rangeEndDate={draftState.checkOut}
                                        activeField={mobileDateField}
                                        onSelectDate={(nextDate) => handleDateChange(mobileDateField, nextDate)}
                                        onClear={clearDates}
                                        variant="inline"
                                    />
                                </div>
                            </section>

                            <section className="rounded-[28px] border border-white/80 bg-white p-4 shadow-sm">
                                <p className="text-sm font-semibold text-gray-900">Khách</p>

                                <div className="mt-4 space-y-4">
                                    {guestFieldConfigs.map((field) => {
                                        const currentValue = draftState.guests[field.key];
                                        const disableMinus = currentValue <= field.min;
                                        const disablePlus = currentValue >= field.max;

                                        return (
                                            <div
                                                key={field.key}
                                                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4"
                                            >
                                                <div>
                                                    <p className="font-semibold text-gray-900">{field.label}</p>
                                                    <p className="text-sm text-gray-500">{field.description}</p>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            updateGuests(field.key, -1, field.min, field.max)
                                                        }
                                                        disabled={disableMinus}
                                                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 text-gray-600 disabled:cursor-not-allowed disabled:opacity-35"
                                                        aria-label={`Giảm ${field.label}`}
                                                    >
                                                        <FaMinus size={10} />
                                                    </button>
                                                    <span className="w-6 text-center font-semibold text-gray-900">
                                                        {currentValue}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            updateGuests(field.key, 1, field.min, field.max)
                                                        }
                                                        disabled={disablePlus}
                                                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 text-gray-600 disabled:cursor-not-allowed disabled:opacity-35"
                                                        aria-label={`Tăng ${field.label}`}
                                                    >
                                                        <FaPlus size={10} />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>
                        </div>

                        <div className="sticky bottom-0 mt-6 border-t border-gray-200 bg-[#f7f6f3] pb-2 pt-4">
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={resetSearch}
                                    className="inline-flex h-12 flex-1 items-center justify-center rounded-2xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                                >
                                    Xóa tất cả
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSearch}
                                    className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-cyan-500 px-4 text-sm font-semibold text-white transition-colors hover:bg-cyan-500"
                                >
                                    <FiSearch size={16} />
                                    Tìm kiếm
                                </button>
                                <button
                                    type="button"
                                    onClick={openAiOverlay}
                                    className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl border border-cyan-200 bg-white px-4 text-sm font-semibold text-cyan-700 transition-colors hover:bg-cyan-50"
                                >
                                    <Sparkles size={16} />
                                    Tìm AI
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}

            <LocationMapPicker
                isOpen={mapPickerOpen}
                value={mapPosition}
                radiusMeters={MAP_SEARCH_RADIUS_METERS}
                onChange={setMapPosition}
                onClose={() => setMapPickerOpen(false)}
                onConfirm={handleMapSearchConfirm}
            />
        </>
    );
};

const SearchBar = ({ variant, forceHidden = false, forceVisible = false, desktopAside }: SearchBarProps) => {
    const location = useLocation();
    const inferredVariant = variant ?? (isSearchRoutePath(location.pathname) ? "listing" : "home");

    const initialDraftState = useMemo(
        () =>
            isSearchRoutePath(location.pathname)
                ? parseBookingSearchParams(location.search)
                : createDefaultBookingSearchState(),
        [location.pathname, location.search],
    );

    const syncKey = useMemo(
        () => createSearchSyncKey(location.pathname, location.search, inferredVariant),
        [inferredVariant, location.pathname, location.search],
    );

    return (
        <SearchBarInner
            key={syncKey}
            inferredVariant={inferredVariant}
            initialDraftState={initialDraftState}
            forceHidden={forceHidden}
            forceVisible={forceVisible}
            desktopAside={desktopAside}
        />
    );
};

export default SearchBar;
