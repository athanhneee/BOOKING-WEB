import { useMemo, useState, type CSSProperties, type MouseEvent } from "react";
import { FaCalendarAlt, FaChevronRight } from "react-icons/fa";
import { cn } from "../../../../utils";

type DatePickerPanelProps = {
    isOpen: boolean;
    selectedDate: string;
    minDate: string;
    rangeStartDate?: string;
    rangeEndDate?: string;
    activeField?: "checkIn" | "checkOut";
    selectedNightOffset?: number;
    /** ISO dates (YYYY-MM-DD) that are booked/unavailable — cannot be selected */
    bookedDates?: string[];
    onSelectDate: (nextDate: string) => void;
    onNightOffsetChange?: (nextOffset: number) => void;
    onClear?: () => void;
    className?: string;
    style?: CSSProperties;
    variant?: "popover" | "inline";
};

type CalendarMode = "day" | "month" | "flexible";
type FlexDurationOption = "Cuối tuần" | "1 tuần" | "1 tháng";
type ExactnessOption = { label: string; nights: number };

const exactnessOptions: ExactnessOption[] = [
    { label: "Chính xác", nights: 0 },
    { label: "+/- 1 ngày", nights: 1 },
    { label: "+/- 2 ngày", nights: 2 },
    { label: "+/- 3 ngày", nights: 3 },
    { label: "+/- 7 ngày", nights: 7 },
    { label: "+/- 14 ngày", nights: 14 },
];

const weekdayLabels = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const flexibleDurationOptions: FlexDurationOption[] = ["Cuối tuần", "1 tuần", "1 tháng"];

const toIsoDate = (date: Date) => {
    const normalizedDate = new Date(date);
    normalizedDate.setHours(12, 0, 0, 0);

    const year = normalizedDate.getFullYear();
    const month = `${normalizedDate.getMonth() + 1}`.padStart(2, "0");
    const day = `${normalizedDate.getDate()}`.padStart(2, "0");

    return `${year}-${month}-${day}`;
};

const parseIsoDate = (isoDate: string) => {
    if (!isoDate) return null;

    const parsed = new Date(`${isoDate}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) {
        return null;
    }

    parsed.setHours(0, 0, 0, 0);
    return parsed;
};

function formatMonthYear(year: number, month: number) {
    const date = new Date(year, month, 1);
    const label = date.toLocaleDateString("vi-VN", {
        month: "long",
        year: "numeric",
    });

    return label.charAt(0).toUpperCase() + label.slice(1);
}

function formatDateDisplay(date: Date | null) {
    if (!date) return "";

    return date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
}

function isSameDay(firstDate: Date | null, secondDate: Date | null) {
    if (!firstDate || !secondDate) return false;

    return (
        firstDate.getFullYear() === secondDate.getFullYear() &&
        firstDate.getMonth() === secondDate.getMonth() &&
        firstDate.getDate() === secondDate.getDate()
    );
}

function buildDays(year: number, month: number) {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    let startOffset = firstDay.getDay() - 1;

    if (startOffset < 0) {
        startOffset = 6;
    }

    const days: Array<Date | null> = [];
    for (let index = 0; index < startOffset; index += 1) {
        days.push(null);
    }

    for (let day = 1; day <= lastDay.getDate(); day += 1) {
        days.push(new Date(year, month, day));
    }

    return days;
}

const getMonthSeed = (value?: string) => parseIsoDate(value ?? "") ?? new Date();

const handleMouseSelect = (event: MouseEvent, callback: () => void) => {
    event.preventDefault();
    event.stopPropagation();
    callback();
};

type CalendarMonthProps = {
    year: number;
    month: number;
    today: Date;
    minSelectableDate: Date;
    checkIn: Date | null;
    checkOut: Date | null;
    activeField: "checkIn" | "checkOut";
    hoveredDate: Date | null;
    /** First booked date after checkIn (limits selectable checkout range) */
    firstBookedAfterCheckIn: Date | null;
    bookedDatesSet: Set<string>;
    onDateSelect: (date: Date) => void;
    onDateHover: (date: Date | null) => void;
    showPrev: boolean;
    showNext: boolean;
    onPrev: () => void;
    onNext: () => void;
};

function CalendarMonth({
    year,
    month,
    today,
    minSelectableDate,
    checkIn,
    checkOut,
    activeField,
    hoveredDate,
    firstBookedAfterCheckIn,
    bookedDatesSet,
    onDateSelect,
    onDateHover,
    showPrev,
    showNext,
    onPrev,
    onNext,
}: CalendarMonthProps) {
    const days = buildDays(year, month);

    const getEndDate = () => {
        if (checkOut) {
            return checkOut;
        }

        if (activeField === "checkOut" && hoveredDate && checkIn && hoveredDate > checkIn) {
            return hoveredDate;
        }

        return null;
    };

    const endDate = getEndDate();

    const getCellState = (date: Date | null) => {
        if (!date) return "empty";

        const iso = toIsoDate(date);

        // Past / before min date
        if (date < minSelectableDate) return "disabled";

        // Selected range endpoints (take priority over booked)
        if (isSameDay(date, checkIn)) return "start";
        if (isSameDay(date, checkOut)) return "end";

        // Booked / unavailable date
        if (bookedDatesSet.has(iso)) return "booked";

        // When picking checkout, dates after the first booked night are also disabled
        if (
            activeField === "checkOut" &&
            checkIn &&
            firstBookedAfterCheckIn &&
            date > firstBookedAfterCheckIn
        ) {
            return "disabled";
        }

        // In-range highlight
        if (checkIn && endDate && date > checkIn && date < endDate) return "range";

        if (isSameDay(date, today)) return "today";

        // Checkout mode: dates before or equal to checkIn are unselectable
        if (activeField === "checkOut" && checkIn && date <= checkIn) return "disabled";

        return "normal";
    };

    const weeks: Array<Array<Date | null>> = [];
    for (let index = 0; index < days.length; index += 7) {
        weeks.push(days.slice(index, index + 7));
    }

    return (
        <div className="min-w-0 flex-1">
            <div className="mb-6 flex items-center justify-between">
                {showPrev ? (
                    <button
                        type="button"
                        onMouseDown={(event) => handleMouseSelect(event, onPrev)}
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-lg font-light text-gray-500 transition-all duration-150 hover:border-gray-400 hover:bg-gray-50 hover:text-gray-800"
                    >
                        ‹
                    </button>
                ) : (
                    <div className="w-9" />
                )}

                <h3 className="text-base font-semibold tracking-tight text-gray-900">
                    {formatMonthYear(year, month)}
                </h3>

                {showNext ? (
                    <button
                        type="button"
                        onMouseDown={(event) => handleMouseSelect(event, onNext)}
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-lg font-light text-gray-500 transition-all duration-150 hover:border-gray-400 hover:bg-gray-50 hover:text-gray-800"
                    >
                        ›
                    </button>
                ) : (
                    <div className="w-9" />
                )}
            </div>

            <div className="mb-2 grid grid-cols-7">
                {weekdayLabels.map((dayLabel) => (
                    <div key={dayLabel} className="pb-2 text-center text-xs font-semibold text-gray-400">
                        {dayLabel}
                    </div>
                ))}
            </div>

            <div className="space-y-1">
                {weeks.map((week, weekIndex) => (
                    <div key={`${year}-${month}-week-${weekIndex}`} className="grid grid-cols-7">
                        {week.map((date, dayIndex) => {
                            const state = getCellState(date);
                            const isRange = state === "range";
                            const isStart = state === "start";
                            const isEnd = state === "end";
                            const isBooked = state === "booked";
                            const hasEnd = Boolean(endDate);

                            let cellBgClass = "";
                            if (isRange) {
                                cellBgClass = "range-cell-bg bg-cyan-50";
                            }
                            if (isStart && hasEnd) {
                                cellBgClass = "range-cell-bg bg-gradient-to-r from-transparent to-cyan-50";
                            }
                            if (isEnd && checkIn) {
                                cellBgClass = "range-cell-bg bg-gradient-to-l from-transparent to-cyan-50";
                            }

                            let buttonClassName =
                                "cal-date-btn relative z-10 flex h-10 w-10 items-center justify-center rounded-full text-sm transition-all duration-150";

                            if (state === "disabled") {
                                buttonClassName += " cursor-not-allowed text-gray-300";
                            } else if (isBooked) {
                                // Booked: strikethrough, warm red-gray, can't click
                                buttonClassName +=
                                    " cursor-not-allowed text-rose-300 line-through decoration-rose-300/60";
                            } else if (state === "start" || state === "end") {
                                buttonClassName +=
                                    " selected cursor-pointer bg-cyan-500 font-semibold text-white shadow-sm hover:bg-cyan-500";
                            } else if (state === "today") {
                                buttonClassName +=
                                    " cursor-pointer font-semibold text-gray-900 ring-2 ring-cyan-400 hover:bg-cyan-50";
                            } else if (state === "range") {
                                buttonClassName +=
                                    " cursor-pointer text-gray-800 hover:bg-cyan-100 hover:text-cyan-800";
                            } else if (state === "normal") {
                                buttonClassName +=
                                    " cursor-pointer text-gray-800 hover:bg-cyan-50 hover:text-cyan-700";
                            } else {
                                buttonClassName += " invisible";
                            }

                            return (
                                <div
                                    key={`${year}-${month}-${weekIndex}-${dayIndex}`}
                                    className={cn(
                                        "relative flex h-10 items-center justify-center transition-colors duration-100",
                                        cellBgClass,
                                    )}
                                >
                                    {date ? (
                                        <button
                                            type="button"
                                            disabled={state === "disabled" || isBooked}
                                            title={isBooked ? "Ngày đã được đặt" : undefined}
                                            onMouseDown={(event) =>
                                                handleMouseSelect(event, () => {
                                                    if (state !== "disabled" && !isBooked) {
                                                        onDateSelect(date);
                                                    }
                                                })
                                            }
                                            onMouseEnter={() => {
                                                if (state !== "disabled" && !isBooked) {
                                                    onDateHover(date);
                                                }
                                            }}
                                            onMouseLeave={() => onDateHover(null)}
                                            className={buttonClassName}
                                        >
                                            {date.getDate()}
                                        </button>
                                    ) : null}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
}

const DatePickerPanel = ({
    isOpen,
    selectedDate,
    minDate,
    rangeStartDate = "",
    rangeEndDate = "",
    activeField = "checkIn",
    selectedNightOffset = 0,
    bookedDates,
    onSelectDate,
    onNightOffsetChange,
    onClear,
    className,
    style,
    variant = "popover",
}: DatePickerPanelProps) => {
    const isInline = variant === "inline";
    const activeDate = useMemo(() => parseIsoDate(selectedDate), [selectedDate]);
    const today = useMemo(() => {
        const nextToday = new Date();
        nextToday.setHours(0, 0, 0, 0);
        return nextToday;
    }, []);
    const minSelectableDate = useMemo(() => parseIsoDate(minDate) ?? today, [minDate, today]);
    const checkIn = useMemo(
        () => parseIsoDate(rangeStartDate) ?? (activeField === "checkIn" ? activeDate : null),
        [activeDate, activeField, rangeStartDate],
    );
    const checkOut = useMemo(
        () => parseIsoDate(rangeEndDate) ?? (activeField === "checkOut" ? activeDate : null),
        [activeDate, activeField, rangeEndDate],
    );

    // Build a Set for O(1) lookup
    const bookedDatesSet = useMemo(() => new Set(bookedDates ?? []), [bookedDates]);

    // When picking checkout: find the first booked date strictly AFTER checkIn.
    // Guests can check out on a booked day (the next guest arrives that day), so
    // dates AFTER firstBookedAfterCheckIn are disabled.
    const firstBookedAfterCheckIn = useMemo(() => {
        if (!checkIn || activeField !== "checkOut") return null;

        const checkInIso = toIsoDate(checkIn);
        let earliest: Date | null = null;

        for (const iso of bookedDatesSet) {
            if (iso > checkInIso) {
                const d = parseIsoDate(iso);
                if (d && (!earliest || d < earliest)) {
                    earliest = d;
                }
            }
        }

        return earliest;
    }, [checkIn, activeField, bookedDatesSet]);

    const [calendarMode, setCalendarMode] = useState<CalendarMode>("day");
    const [hoveredDate, setHoveredDate] = useState<Date | null>(null);
    const [flexDuration, setFlexDuration] = useState<FlexDurationOption>("Cuối tuần");
    const [baseMonth, setBaseMonth] = useState(() => {
        const seed = getMonthSeed(rangeStartDate || selectedDate || minDate);
        return { year: seed.getFullYear(), month: seed.getMonth() };
    });

    const leftYear = baseMonth.year;
    const leftMonth = baseMonth.month;
    const rightDate = new Date(baseMonth.year, baseMonth.month + 1, 1);
    const rightYear = rightDate.getFullYear();
    const rightMonth = rightDate.getMonth();

    const clearSummary = useMemo(() => {
        if (!checkIn && !checkOut) {
            return "Chưa chọn ngày";
        }

        if (checkIn && !checkOut && activeField === "checkOut") {
            return "Đang chọn ngày trả phòng";
        }

        if (checkIn && !checkOut) {
            return "Đang chọn ngày nhận phòng";
        }

        return `${formatDateDisplay(checkIn)} → ${formatDateDisplay(checkOut)}`;
    }, [activeField, checkIn, checkOut]);

    const flexibleMonths = useMemo(() => {
        const seed = new Date(baseMonth.year, baseMonth.month, 1);
        return Array.from({ length: 8 }, (_, index) => new Date(seed.getFullYear(), seed.getMonth() + index, 1));
    }, [baseMonth.month, baseMonth.year]);

    const containerClassName = cn(
        "calendar-panel w-full bg-white",
        isInline
            ? "rounded-[28px] border border-gray-200 p-5 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.24)]"
            : "rounded-3xl border border-gray-200 p-7",
        !isInline && !isOpen && "pointer-events-none opacity-0",
        className,
    );

    if (!isOpen && !isInline) {
        return null;
    }

    const sharedMonthProps = {
        today,
        minSelectableDate,
        checkIn,
        checkOut,
        activeField,
        hoveredDate,
        firstBookedAfterCheckIn,
        bookedDatesSet,
        onDateHover: setHoveredDate,
    };

    return (
        <div className={containerClassName} style={style} onMouseDown={(event) => event.stopPropagation()}>
            <div className="mb-7 flex justify-center">
                <div className="flex gap-1 rounded-full bg-gray-100 p-1">
                    {[
                        { key: "day", label: "Ngày" },
                        { key: "month", label: "Tháng" },
                        { key: "flexible", label: "Linh hoạt" },
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            type="button"
                            onMouseDown={(event) =>
                                handleMouseSelect(event, () => setCalendarMode(tab.key as CalendarMode))
                            }
                            className={cn(
                                "rounded-full px-6 py-2.5 text-sm font-medium transition-all duration-200 ease-out",
                                calendarMode === tab.key
                                    ? "bg-white font-semibold text-gray-900 shadow-sm"
                                    : "text-gray-500 hover:bg-white/60 hover:text-gray-700",
                            )}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {calendarMode === "day" ? (
                <div key={`${baseMonth.year}-${baseMonth.month}`} className="month-grid-enter grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
                    <CalendarMonth
                        {...sharedMonthProps}
                        year={leftYear}
                        month={leftMonth}
                        onDateSelect={(date) => onSelectDate(toIsoDate(date))}
                        showPrev
                        showNext={false}
                        onPrev={() => {
                            const previousMonth = new Date(baseMonth.year, baseMonth.month - 1, 1);
                            setBaseMonth({ year: previousMonth.getFullYear(), month: previousMonth.getMonth() });
                        }}
                        onNext={() => undefined}
                    />
                    <CalendarMonth
                        {...sharedMonthProps}
                        year={rightYear}
                        month={rightMonth}
                        onDateSelect={(date) => onSelectDate(toIsoDate(date))}
                        showPrev={false}
                        showNext
                        onPrev={() => undefined}
                        onNext={() => {
                            const nextMonth = new Date(baseMonth.year, baseMonth.month + 1, 1);
                            setBaseMonth({ year: nextMonth.getFullYear(), month: nextMonth.getMonth() });
                        }}
                    />
                </div>
            ) : calendarMode === "month" ? (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {flexibleMonths.map((monthStart) => {
                        const monthIso = toIsoDate(monthStart);
                        const isActive = (rangeStartDate || selectedDate).startsWith(monthIso.slice(0, 7));

                        return (
                            <button
                                key={monthIso}
                                type="button"
                                onMouseDown={(event) => handleMouseSelect(event, () => onSelectDate(monthIso))}
                                className={cn(
                                    "rounded-[24px] border px-5 py-7 text-center transition-all",
                                    isActive
                                        ? "border-cyan-300 bg-cyan-50 text-cyan-700"
                                        : "border-gray-200 bg-white text-gray-700 hover:border-cyan-200 hover:bg-cyan-50/60",
                                )}
                            >
                                <FaCalendarAlt className="mx-auto mb-4 text-3xl" />
                                <p className="text-lg font-semibold">{formatMonthYear(monthStart.getFullYear(), monthStart.getMonth())}</p>
                            </button>
                        );
                    })}
                </div>
            ) : (
                <div className="pb-2">
                    <div className="mb-8 text-center">
                        <h3 className="text-2xl font-semibold tracking-tight text-gray-900">Bạn muốn ở trong bao lâu?</h3>
                        <div className="mt-4 flex flex-wrap justify-center gap-3">
                            {flexibleDurationOptions.map((option) => (
                                <button
                                    key={option}
                                    type="button"
                                    onMouseDown={(event) => handleMouseSelect(event, () => setFlexDuration(option))}
                                    className={cn(
                                        "rounded-full border px-6 py-2.5 text-sm font-semibold transition-all",
                                        flexDuration === option
                                            ? "border-cyan-500 bg-cyan-500 text-white"
                                            : "border-gray-300 bg-white text-gray-700 hover:border-cyan-300 hover:text-cyan-700",
                                    )}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        {flexibleMonths.map((monthStart) => {
                            const monthIso = toIsoDate(monthStart);
                            const isActive = (rangeStartDate || selectedDate).startsWith(monthIso.slice(0, 7));

                            return (
                                <button
                                    key={`${monthIso}-flex`}
                                    type="button"
                                    onMouseDown={(event) => handleMouseSelect(event, () => onSelectDate(monthIso))}
                                    className={cn(
                                        "flex min-h-[156px] flex-col items-center justify-center rounded-[24px] border px-5 py-6 text-center transition-all",
                                        isActive
                                            ? "border-cyan-300 bg-cyan-50 text-cyan-700"
                                            : "border-gray-200 bg-white text-gray-700 hover:border-cyan-200 hover:bg-cyan-50/60",
                                    )}
                                >
                                    <FaCalendarAlt className="mb-4 text-3xl" />
                                    <p className="text-lg font-semibold">{formatMonthYear(monthStart.getFullYear(), monthStart.getMonth())}</p>
                                    <span className="mt-2 inline-flex items-center gap-2 text-xs font-medium text-gray-500">
                                        {flexDuration}
                                        <FaChevronRight className="text-[10px]" />
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-5">
                <div className="flex items-center gap-6">
                    <div>
                        <p className="mb-0.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">Lựa chọn</p>
                        <p className="text-sm font-semibold text-gray-900">{clearSummary}</p>
                    </div>
                    {bookedDatesSet.size > 0 ? (
                        <div className="flex items-center gap-1.5">
                            <span className="inline-block h-3 w-3 rounded bg-rose-100 ring-1 ring-rose-200" />
                            <span className="text-xs text-gray-400">Đã được đặt</span>
                        </div>
                    ) : null}
                </div>

                {onClear ? (
                    <button
                        type="button"
                        onMouseDown={(event) => handleMouseSelect(event, onClear)}
                        className="text-sm font-semibold text-gray-600 underline underline-offset-2 transition-colors duration-150 hover:text-gray-900"
                    >
                        Xóa tất cả
                    </button>
                ) : null}
            </div>

            {onNightOffsetChange ? (
                <div className="mt-5 flex flex-wrap gap-2 border-t border-gray-100 pt-5">
                    {exactnessOptions.map((option) => (
                        <button
                            key={option.label}
                            type="button"
                            onMouseDown={(event) =>
                                handleMouseSelect(event, () => onNightOffsetChange(option.nights))
                            }
                            className={cn(
                                "rounded-full border px-4 py-2 text-sm font-medium transition-all",
                                selectedNightOffset === option.nights
                                    ? "border-cyan-300 bg-cyan-50 text-cyan-700"
                                    : "border-gray-300 bg-white text-gray-700 hover:border-cyan-200 hover:text-cyan-700",
                            )}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            ) : null}
        </div>
    );
};

export default DatePickerPanel;
