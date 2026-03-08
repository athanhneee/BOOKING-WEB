import { useEffect, useMemo, useRef, useState } from "react";
import { FaMapMarkerAlt, FaSearch, FaTimes } from "react-icons/fa";
import useScrollVisibility from "../../../hooks/useScrollVisibility";
import Checkin from "./booking/Checkin";
import Checkout from "./booking/Checkout";
import DatePickerPanel from "./booking/DatePickerPanel";
import Guest, { type GuestSelection } from "./booking/Guest";

type OpenField = "location" | "checkin" | "checkout" | "guest" | null;
type MobileSection = "location" | "time" | "guest";
type MobileDateField = "checkin" | "checkout";

type MobileGuestControl = {
    key: keyof GuestSelection;
    label: string;
    description: string;
    min: number;
    max: number;
};

const defaultGuestSelection: GuestSelection = {
    adults: 1,
    children: 0,
    infants: 0,
    pets: 0,
};

const mobileGuestControls: MobileGuestControl[] = [
    { key: "adults", label: "Người lớn", description: "Từ 13 tuổi trở lên", min: 1, max: 16 },
    { key: "children", label: "Trẻ em", description: "Từ 2-12 tuổi", min: 0, max: 8 },
    { key: "infants", label: "Em bé", description: "Dưới 2 tuổi", min: 0, max: 5 },
    { key: "pets", label: "Thú cưng", description: "Mang theo thú cưng", min: 0, max: 5 },
];

const formatMobileDate = (isoDate: string): string => {
    if (!isoDate) {
        return "";
    }

    const parsed = new Date(`${isoDate}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) {
        return "";
    }

    return new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
    }).format(parsed);
};

const toIsoDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const addDaysToIso = (isoDate: string, days: number): string => {
    const base = new Date(`${isoDate}T00:00:00`);
    base.setDate(base.getDate() + days);
    return toIsoDate(base);
};

const buildGuestSummary = (selection: GuestSelection): string => {
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

const SearchBar = () => {
    const [greeting, setGreeting] = useState<string>("");
    const [isPinned, setIsPinned] = useState(false);
    const [locationQuery, setLocationQuery] = useState("");
    const [checkinDate, setCheckinDate] = useState("");
    const [checkoutDate, setCheckoutDate] = useState("");
    const [nightOffset, setNightOffset] = useState(0);
    const [guestSelection, setGuestSelection] = useState<GuestSelection>(defaultGuestSelection);
    const [openField, setOpenField] = useState<OpenField>(null);
    const [isMobileSheetMounted, setIsMobileSheetMounted] = useState(false);
    const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);
    const [mobileSection, setMobileSection] = useState<MobileSection>("location");
    const [mobileDateField, setMobileDateField] = useState<MobileDateField>("checkin");
    const show = useScrollVisibility({ threshold: 12, topOffset: 64, hideStartRatio: 0.5 });
    const todayIso = useMemo(() => toIsoDate(new Date()), []);
    const pinnedRef = useRef(false);
    const rafRef = useRef<number | null>(null);
    const fieldWrapperRef = useRef<HTMLDivElement | null>(null);
    const mobileSheetCloseTimerRef = useRef<number | null>(null);

    useEffect(() => {
        const hour = new Date().getHours();

        if (hour < 12) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setGreeting("Sáng");
        } else if (hour < 18) {
            setGreeting("Chiều");
        } else {
            setGreeting("Tối");
        }
    }, []);

    useEffect(() => {
        const pinAt = 340;
        const unpinAt = 240;

        const updatePinnedState = () => {
            const currentY = window.scrollY;
            const nextPinned = pinnedRef.current ? currentY > unpinAt : currentY > pinAt;

            if (nextPinned !== pinnedRef.current) {
                pinnedRef.current = nextPinned;
                setIsPinned(nextPinned);
            }
        };

        const handleScroll = () => {
            if (rafRef.current !== null) {
                return;
            }

            rafRef.current = window.requestAnimationFrame(() => {
                updatePinnedState();
                rafRef.current = null;
            });
        };

        updatePinnedState();
        window.addEventListener("scroll", handleScroll, { passive: true });

        return () => {
            window.removeEventListener("scroll", handleScroll);
            if (rafRef.current !== null) {
                window.cancelAnimationFrame(rafRef.current);
            }
        };
    }, []);

    useEffect(() => {
        const handlePointerDown = (event: MouseEvent) => {
            if (!fieldWrapperRef.current || !openField) {
                return;
            }

            if (!fieldWrapperRef.current.contains(event.target as Node)) {
                setOpenField(null);
            }
        };

        document.addEventListener("mousedown", handlePointerDown);

        return () => {
            document.removeEventListener("mousedown", handlePointerDown);
        };
    }, [openField]);

    useEffect(() => {
        if (!isMobileSheetMounted) {
            return;
        }

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [isMobileSheetMounted]);

    useEffect(() => {
        return () => {
            if (mobileSheetCloseTimerRef.current !== null) {
                window.clearTimeout(mobileSheetCloseTimerRef.current);
            }
        };
    }, []);

    const openDesktopField = (field: Exclude<OpenField, null>) => {
        setOpenField((current) => (current === field ? null : field));
    };

    const closeDesktopField = () => {
        setOpenField(null);
    };

    const handleNightOffsetChange = (nextOffset: number) => {
        setNightOffset(nextOffset);

        if (checkinDate && nextOffset > 0) {
            setCheckoutDate(addDaysToIso(checkinDate, nextOffset));
            closeDesktopField();
        }
    };

    const handleCheckinChange = (nextDate: string) => {
        if (nightOffset > 0) {
            setCheckinDate(nextDate);
            setCheckoutDate(addDaysToIso(nextDate, nightOffset));
            closeDesktopField();
            return;
        }

        if (!checkinDate || checkoutDate) {
            setCheckinDate(nextDate);
            setCheckoutDate("");
            return;
        }

        if (nextDate < checkinDate) {
            setCheckinDate(nextDate);
            setCheckoutDate("");
            return;
        }

        setCheckoutDate(nextDate);
        closeDesktopField();
    };

    const handleCheckoutChange = (nextDate: string) => {
        if (!checkinDate) {
            setCheckinDate(nextDate);

            if (nightOffset > 0) {
                setCheckoutDate(addDaysToIso(nextDate, nightOffset));
            } else {
                setCheckoutDate("");
            }
            return;
        }

        if (nextDate < checkinDate) {
            setCheckinDate(nextDate);
            setCheckoutDate("");
            return;
        }

        setCheckoutDate(nextDate);
        closeDesktopField();
    };

    const handleAdjustMobileGuest = (key: keyof GuestSelection, delta: number, min: number, max: number) => {
        const next = guestSelection[key] + delta;
        if (next < min || next > max) {
            return;
        }

        setGuestSelection({
            ...guestSelection,
            [key]: next,
        });
    };

    const resetAll = () => {
        setLocationQuery("");
        setCheckinDate("");
        setCheckoutDate("");
        setNightOffset(0);
        setGuestSelection(defaultGuestSelection);
    };

    const openMobileSearch = () => {
        if (mobileSheetCloseTimerRef.current !== null) {
            window.clearTimeout(mobileSheetCloseTimerRef.current);
            mobileSheetCloseTimerRef.current = null;
        }

        setMobileSection("location");
        setMobileDateField("checkin");
        setIsMobileSheetMounted(true);
        window.requestAnimationFrame(() => {
            setIsMobileSheetOpen(true);
        });
    };

    const closeMobileSearch = () => {
        setIsMobileSheetOpen(false);

        if (mobileSheetCloseTimerRef.current !== null) {
            window.clearTimeout(mobileSheetCloseTimerRef.current);
        }

        mobileSheetCloseTimerRef.current = window.setTimeout(() => {
            setIsMobileSheetMounted(false);
            mobileSheetCloseTimerRef.current = null;
        }, 1400);
    };

    const mobileDateText = useMemo(() => {
        if (checkinDate && checkoutDate) {
            return `${formatMobileDate(checkinDate)} - ${formatMobileDate(checkoutDate)}`;
        }

        if (checkinDate) {
            return `Từ ${formatMobileDate(checkinDate)}`;
        }

        if (checkoutDate) {
            return `Đến ${formatMobileDate(checkoutDate)}`;
        }

        return "Chọn ngày";
    }, [checkinDate, checkoutDate]);

    const isDefaultGuestState = useMemo(() => {
        return (
            guestSelection.adults === 1 &&
            guestSelection.children === 0 &&
            guestSelection.infants === 0 &&
            guestSelection.pets === 0
        );
    }, [guestSelection]);

    const mobileGuestText = useMemo(() => buildGuestSummary(guestSelection), [guestSelection]);
    const mobileGuestDisplay = isDefaultGuestState ? "Thêm khách" : mobileGuestText;
    const activeMobileDate = mobileDateField === "checkin" ? checkinDate : checkoutDate;
    const activeMobileMinDate = mobileDateField === "checkin" ? todayIso : checkinDate || todayIso;

    const handleMobileDateSelect = (nextDate: string) => {
        if (mobileDateField === "checkin") {
            handleCheckinChange(nextDate);
            return;
        }

        handleCheckoutChange(nextDate);
    };

    const shouldPin = isPinned || openField !== null || isMobileSheetMounted;
    const shouldShow = show || openField !== null || isMobileSheetMounted;
    const shouldShowIntro = !shouldPin;
    const shouldExpandDesktopSearch = openField === "guest";
    const displayLocation = locationQuery || "Tìm kiếm điểm đến";
    const rootMotionClass = "duration-[760ms]";
    const headingMotionClass = "duration-[760ms]";
    const desktopFieldClass = (field: Exclude<OpenField, null>): string => {
        if (!openField) {
            return "flex-[0.94]";
        }

        return openField === field ? "flex-[1.16]" : "flex-[0.82]";
    };

    return (
        <>
            <div
                className={`${shouldPin ? "fixed left-0 top-14 w-full md:top-20" : "relative -mt-20 md:-mt-32"} z-40 flex transform-gpu justify-center px-3 transition-[transform,opacity] ${rootMotionClass} ease-[cubic-bezier(0.22,0.61,0.36,1)] will-change-[transform,opacity] md:px-0 ${shouldShow ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-4 opacity-0"}`}
            >
                <div
                    className={`w-full max-w-[64rem] text-center ${shouldPin ? "bg-transparent p-0 shadow-none" : "rounded-3xl bg-white p-3 shadow-xl sm:p-4 md:p-6"}`}
                >
                    <div
                        className={`overflow-hidden transition-[max-height,transform,opacity] ${headingMotionClass} ease-[cubic-bezier(0.16,1,0.3,1)] ${shouldShowIntro ? "max-h-52 translate-y-0 opacity-100" : "max-h-0 -translate-y-4 opacity-0"}`}
                    >
                        <h1 className="mb-3 text-center text-3xl font-bold text-cyan-600 sm:text-4xl md:mb-4 md:text-5xl">
                            Chào buổi {greeting}!
                        </h1>

                        <p className="mb-6 text-center text-base text-gray-600 sm:text-lg md:mb-10">
                            Trân trọng được chào đón bạn tại thành phố biển Vũng Tàu
                        </p>
                    </div>

                    <div ref={fieldWrapperRef} className="rounded-full border bg-white">
                        <button
                            type="button"
                            className="flex w-full items-center gap-3 px-4 py-3 text-left md:hidden"
                            onClick={openMobileSearch}
                        >
                            <FaMapMarkerAlt className="text-gray-400" />

                            <div className="flex-1">
                                <p className="text-sm font-semibold text-gray-900">Địa điểm, ngày, khách</p>
                                <p className="truncate text-xs text-gray-500">{mobileDateText} . {mobileGuestText}</p>
                            </div>

                            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-600 text-white">
                                <FaSearch />
                            </span>
                        </button>

                        <div className="hidden min-h-[60px] items-stretch justify-between gap-0.5 px-2 py-1.5 md:flex">
                            <div className={`relative min-w-0 transition-[flex] duration-[760ms] ease-[cubic-bezier(0.22,0.61,0.36,1)] ${desktopFieldClass("location")}`}>
                                <button
                                    type="button"
                                    onClick={() => openDesktopField("location")}
                                    className={`flex h-full w-full items-center gap-3 rounded-full px-3 py-2 text-left transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${openField === "location" ? "bg-gray-100 pr-10" : "hover:bg-gray-50"}`}
                                >
                                    <FaMapMarkerAlt className="text-gray-400" />
                                    <div className="min-w-0 text-left">
                                        <p className="text-[11px] font-semibold text-gray-700">Địa điểm</p>
                                        <p className={`truncate text-sm ${locationQuery ? "font-semibold text-gray-900" : "text-gray-500"}`}>{displayLocation}</p>
                                    </div>
                                </button>

                                {openField === "location" ? (
                                    <button
                                        type="button"
                                        onClick={closeDesktopField}
                                        className="absolute right-2 top-1/2 z-10 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-800"
                                        aria-label="Đóng địa điểm"
                                    >
                                        <FaTimes className="text-xs" />
                                    </button>
                                ) : null}

                                <div className={`absolute left-8 top-[calc(100%+10px)] z-50 w-[min(400px,calc(100vw-3rem))] transform-gpu rounded-3xl border border-gray-200 bg-white p-5 shadow-2xl transition-[transform,opacity] duration-[980ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${openField === "location" ? "translate-y-0 scale-100 opacity-100" : "pointer-events-none -translate-y-3 scale-[0.97] opacity-0"}`}>
                                    <p className="text-sm font-semibold text-gray-900">Bạn muốn đi đâu?</p>
                                    <input
                                        type="text"
                                        value={locationQuery}
                                        onChange={(event) => setLocationQuery(event.target.value)}
                                        placeholder="Tìm kiếm điểm đến"
                                        className="mt-3 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                                    />
                                </div>
                            </div>

                            <div className="my-3 w-px bg-gray-200" />

                            <Checkin
                                value={checkinDate}
                                isOpen={openField === "checkin"}
                                nightOffset={nightOffset}
                                onOpen={() => openDesktopField("checkin")}
                                onChange={handleCheckinChange}
                                onNightOffsetChange={handleNightOffsetChange}
                                onClose={closeDesktopField}
                                className={`transition-[flex] duration-[760ms] ease-[cubic-bezier(0.22,0.61,0.36,1)] ${desktopFieldClass("checkin")}`}
                                panelClassName="left-[calc(-100%+0.5rem)] -translate-x-0 w-[min(820px,calc(100vw-3rem))]"
                            />

                            <div className="my-3 w-px bg-gray-200" />

                            <Checkout
                                value={checkoutDate}
                                checkinDate={checkinDate}
                                isOpen={openField === "checkout"}
                                onOpen={() => openDesktopField("checkout")}
                                onChange={handleCheckoutChange}
                                onClose={closeDesktopField}
                                className={`transition-[flex] duration-[760ms] ease-[cubic-bezier(0.22,0.61,0.36,1)] ${desktopFieldClass("checkout")}`}
                                panelClassName="left-auto right-[calc(-100%-0.5rem)] -translate-x-0 w-[min(820px,calc(100vw-3rem))]"
                            />

                            <div className="my-3 w-px bg-gray-200" />

                            <Guest
                                value={guestSelection}
                                isOpen={openField === "guest"}
                                onOpen={() => openDesktopField("guest")}
                                onChange={setGuestSelection}
                                onClose={closeDesktopField}
                                className={`transition-[flex] duration-[760ms] ease-[cubic-bezier(0.22,0.61,0.36,1)] ${desktopFieldClass("guest")}`}
                                popupClassName="left-auto right-[-3.5rem] -translate-x-0"
                            />

                            <button
                                type="button"
                                className={`ml-2.5 flex h-11 items-center overflow-hidden rounded-full bg-cyan-600 text-white transition-all duration-[860ms] ease-[cubic-bezier(0.16,1,0.3,1)] will-change-[width,transform,opacity] ${
                                    shouldExpandDesktopSearch ? "w-36 justify-start px-4" : "w-11 justify-center px-0"
                                }`}
                                aria-label="Search"
                                onClick={closeDesktopField}
                            >
                                <FaSearch className="shrink-0 translate-y-px" />
                                <span
                                    className={`whitespace-nowrap pl-2 text-sm font-semibold transition-[opacity,transform,max-width] duration-[780ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
                                        shouldExpandDesktopSearch
                                            ? "max-w-[100px] translate-x-0 opacity-100"
                                            : "max-w-0 -translate-x-2 opacity-0"
                                    }`}
                                >
                                    Search
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {isMobileSheetMounted ? (
                <div className="fixed inset-0 z-[80] md:hidden">
                <div
                    className={`absolute inset-0 bg-black/45 transition-opacity duration-[1000ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${isMobileSheetOpen ? "opacity-100" : "opacity-0"}`}
                    onClick={closeMobileSearch}
                    role="presentation"
                />

                <div
                    className={`absolute inset-x-0 bottom-0 top-0 overflow-y-auto overscroll-y-contain rounded-t-[36px] bg-[#efefef] px-4 pb-32 pt-4 shadow-2xl transform-gpu transition-[transform,opacity] duration-[1300ms] ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform ${isMobileSheetOpen ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}
                    style={{ WebkitOverflowScrolling: "touch" }}
                >
                    <button
                        type="button"
                        className="mx-auto mb-4 block h-1.5 w-12 rounded-full bg-gray-300"
                        aria-label="Đóng tìm kiếm"
                        onClick={closeMobileSearch}
                    />

                    <section className="rounded-[34px] border border-gray-200 bg-white p-5 shadow-sm">
                        <h2 className="text-3xl font-bold text-gray-900">Địa điểm</h2>

                        <div className="mt-5 rounded-2xl border border-gray-300 bg-white px-4 py-3">
                            <div className="flex items-center gap-3">
                                <FaSearch className="text-gray-500" />
                                <input
                                    value={locationQuery}
                                    onChange={(event) => setLocationQuery(event.target.value)}
                                    placeholder="Tìm kiếm điểm đến..."
                                    className="w-full bg-transparent text-xl text-gray-700 outline-none placeholder:text-gray-400"
                                />
                            </div>
                        </div>

                        <div className="mt-4 rounded-2xl bg-gray-50 px-4 py-3 text-left text-sm text-gray-500">
                            Nhập điểm đến để bắt đầu tìm kiếm.
                        </div>
                    </section>

                    <button
                        type="button"
                        onClick={() => setMobileSection((current) => (current === "time" ? "location" : "time"))}
                        className="mt-4 flex w-full items-center justify-between rounded-3xl border border-gray-200 bg-white px-5 py-4 text-left shadow-sm"
                    >
                        <span className="text-2xl text-gray-500">Thời gian</span>
                        <span className="text-2xl font-semibold text-gray-900">{checkinDate || checkoutDate ? mobileDateText : "Thêm ngày"}</span>
                    </button>

                    <div className={`mt-3 grid transition-[grid-template-rows,opacity] duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${mobileSection === "time" ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                        <div className="overflow-hidden">
                            <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">
                                <div className="mb-4 grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setMobileDateField("checkin")}
                                        className={`rounded-2xl border px-3 py-3 text-left transition ${mobileDateField === "checkin" ? "border-gray-900 bg-gray-900 text-white" : "border-gray-300 bg-white text-gray-800"}`}
                                    >
                                        <p className={`text-xs ${mobileDateField === "checkin" ? "text-white/80" : "text-gray-500"}`}>Nhận phòng</p>
                                        <p className="mt-1 text-sm font-semibold">{checkinDate ? formatMobileDate(checkinDate) : "Thêm ngày"}</p>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setMobileDateField("checkout")}
                                        className={`rounded-2xl border px-3 py-3 text-left transition ${mobileDateField === "checkout" ? "border-gray-900 bg-gray-900 text-white" : "border-gray-300 bg-white text-gray-800"}`}
                                    >
                                        <p className={`text-xs ${mobileDateField === "checkout" ? "text-white/80" : "text-gray-500"}`}>Trả phòng</p>
                                        <p className="mt-1 text-sm font-semibold">{checkoutDate ? formatMobileDate(checkoutDate) : "Thêm ngày"}</p>
                                    </button>
                                </div>

                                <DatePickerPanel
                                    isOpen
                                    selectedDate={activeMobileDate}
                                    minDate={activeMobileMinDate}
                                    selectedNightOffset={nightOffset}
                                    onSelectDate={handleMobileDateSelect}
                                    onNightOffsetChange={handleNightOffsetChange}
                                    variant="inline"
                                />
                            </div>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => setMobileSection((current) => (current === "guest" ? "location" : "guest"))}
                        className="mt-4 flex w-full items-center justify-between rounded-3xl border border-gray-200 bg-white px-5 py-4 text-left shadow-sm"
                    >
                        <span className="text-2xl text-gray-500">Khách</span>
                        <span className="text-2xl font-semibold text-gray-900">{mobileGuestDisplay}</span>
                    </button>

                    <div className={`mt-3 grid transition-[grid-template-rows,opacity] duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${mobileSection === "guest" ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                        <div className="overflow-hidden">
                            <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">
                            {mobileGuestControls.map((control) => {
                                const currentValue = guestSelection[control.key];
                                const disableMinus = currentValue <= control.min;
                                const disablePlus = currentValue >= control.max;

                                return (
                                    <div key={control.key} className="grid grid-cols-[1fr_auto] items-center gap-4 py-3">
                                        <div>
                                            <p className="text-base font-semibold text-gray-900">{control.label}</p>
                                            <p className="text-sm text-gray-500">{control.description}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => handleAdjustMobileGuest(control.key, -1, control.min, control.max)}
                                                disabled={disableMinus}
                                                className="h-8 w-8 rounded-full border border-gray-300 text-gray-700 disabled:opacity-40"
                                            >
                                                -
                                            </button>
                                            <span className="w-5 text-center text-sm font-semibold text-gray-900">{currentValue}</span>
                                            <button
                                                type="button"
                                                onClick={() => handleAdjustMobileGuest(control.key, 1, control.min, control.max)}
                                                disabled={disablePlus}
                                                className="h-8 w-8 rounded-full border border-gray-300 text-gray-700 disabled:opacity-40"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                            </div>
                        </div>
                    </div>
                </div>

                <div className={`absolute inset-x-0 bottom-0 border-t border-gray-200 bg-white px-4 py-4 transition-[transform,opacity] duration-[1300ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${isMobileSheetOpen ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}>
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={resetAll}
                            className="flex-1 rounded-2xl border border-transparent px-4 py-4 text-left text-xl font-semibold text-gray-800 underline decoration-2 underline-offset-4"
                        >
                            Xóa tất cả
                        </button>
                        <button
                            type="button"
                            onClick={closeMobileSearch}
                            className="flex-1 rounded-2xl bg-gray-900 px-4 py-4 text-xl font-semibold text-white"
                        >
                            Tiếp theo
                        </button>
                    </div>
                </div>
                </div>
            ) : null}
        </>
    );
};

export default SearchBar;
