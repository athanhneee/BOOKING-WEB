import { useMemo, useRef, useState, type CSSProperties } from "react";
import { FaCalendarAlt, FaChevronLeft, FaChevronRight } from "react-icons/fa";

type DatePickerPanelProps = {
    isOpen: boolean;
    selectedDate: string;
    minDate: string;
    selectedNightOffset?: number;
    onSelectDate: (nextDate: string) => void;
    onNightOffsetChange?: (nextOffset: number) => void;
    onClear?: () => void;
    className?: string;
    style?: CSSProperties;
    variant?: "popover" | "inline";
};

type ExactnessOption = {
    label: string;
    nights: number;
};

type FlexDurationOption = "Cuối tuần" | "1 tuần" | "1 tháng";
type PanelMode = "exact" | "flex";

const weekdayLabels = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const exactnessOptions: ExactnessOption[] = [
    { label: "Ngày chính xác", nights: 0 },
    { label: "± 1 ngày", nights: 1 },
    { label: "± 2 ngày", nights: 2 },
    { label: "± 3 ngày", nights: 3 },
    { label: "± 7 ngày", nights: 7 },
    { label: "± 14 ngày", nights: 14 },
];
const flexibleDurationOptions: FlexDurationOption[] = ["Cuối tuần", "1 tuần", "1 tháng"];

const toIsoDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const parseIsoDate = (isoDate: string): Date | null => {
    if (!isoDate) {
        return null;
    }

    const parsed = new Date(`${isoDate}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) {
        return null;
    }

    return parsed;
};

const asMonthStart = (date: Date): Date => new Date(date.getFullYear(), date.getMonth(), 1);

const addMonths = (baseMonth: Date, amount: number): Date =>
    new Date(baseMonth.getFullYear(), baseMonth.getMonth() + amount, 1);

const monthKey = (month: Date): number => month.getFullYear() * 12 + month.getMonth();

const buildMonthCells = (monthStart: Date): Array<string | null> => {
    const firstWeekDay = (monthStart.getDay() + 6) % 7;
    const daysInMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate();
    const cells: Array<string | null> = [];

    for (let index = 0; index < firstWeekDay; index += 1) {
        cells.push(null);
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
        cells.push(toIsoDate(new Date(monthStart.getFullYear(), monthStart.getMonth(), day)));
    }

    while (cells.length < 42) {
        cells.push(null);
    }

    return cells;
};

const formatMonthTitle = (monthStart: Date): string =>
    `Tháng ${monthStart.getMonth() + 1} năm ${monthStart.getFullYear()}`;

const formatSelectedSummary = (selectedDate: string, selectedNightOffset: number): string => {
    const parsed = parseIsoDate(selectedDate);
    if (parsed) {
        const baseLabel = new Intl.DateTimeFormat("vi-VN", {
            weekday: "short",
            day: "2-digit",
            month: "2-digit",
        }).format(parsed);

        return selectedNightOffset > 0 ? `${baseLabel} · ± ${selectedNightOffset} ngày` : baseLabel;
    }

    if (selectedNightOffset > 0) {
        return `± ${selectedNightOffset} ngày`;
    }

    return "Chưa chọn ngày";
};

const DatePickerPanel = ({
    isOpen,
    selectedDate,
    minDate,
    selectedNightOffset = 0,
    onSelectDate,
    onNightOffsetChange,
    onClear,
    className,
    style,
    variant = "popover",
}: DatePickerPanelProps) => {
    const isInline = variant === "inline";
    const todayIso = useMemo(() => toIsoDate(new Date()), []);
    const minDateValue = useMemo(() => parseIsoDate(minDate) ?? new Date(), [minDate]);
    const minMonth = useMemo(() => asMonthStart(minDateValue), [minDateValue]);
    const [mode, setMode] = useState<PanelMode>("exact");
    const [flexDuration, setFlexDuration] = useState<FlexDurationOption>("Cuối tuần");
    const flexScrollerRef = useRef<HTMLDivElement | null>(null);

    const initialMonth = useMemo(() => {
        const selected = parseIsoDate(selectedDate);
        if (selected) {
            return asMonthStart(selected);
        }

        return minMonth;
    }, [selectedDate, minMonth]);

    const [currentMonth, setCurrentMonth] = useState<Date>(initialMonth);
    const canMovePrevious = monthKey(addMonths(currentMonth, -1)) >= monthKey(minMonth);
    const hasClearableSelection = Boolean(selectedDate) || selectedNightOffset > 0;
    const clearSummary = useMemo(
        () => formatSelectedSummary(selectedDate, selectedNightOffset),
        [selectedDate, selectedNightOffset],
    );

    const flexibleMonths = useMemo(() => {
        const base = asMonthStart(minDateValue);
        return Array.from({ length: 12 }, (_, index) => addMonths(base, index));
    }, [minDateValue]);

    const scrollFlexibleMonths = () => {
        if (!flexScrollerRef.current) {
            return;
        }

        flexScrollerRef.current.scrollBy({
            left: 420,
            behavior: "smooth",
        });
    };

    const placementClass = className ?? "left-1/2 -translate-x-[40%]";
    const containerClass = isInline
        ? "relative z-0 w-full rounded-[26px] border border-gray-200 bg-[#f5f5f5] p-4 shadow-sm md:p-6"
        : `absolute top-[calc(100%+12px)] z-50 w-[min(860px,calc(100vw-2rem))] max-w-[95vw] transform-gpu rounded-[32px] border border-gray-200 bg-[#f5f5f5] p-6 shadow-2xl transition-[transform,opacity] duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform ${placementClass} ${isOpen ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-2 opacity-0"}`;

    const renderMonth = (monthStart: Date) => {
        const cells = buildMonthCells(monthStart);

        return (
            <div>
                <h3 className="mb-4 text-center text-2xl font-bold text-gray-800">{formatMonthTitle(monthStart)}</h3>

                <div className="mb-3 grid grid-cols-7 text-center text-sm font-semibold text-gray-500">
                    {weekdayLabels.map((weekday) => (
                        <span key={`${monthStart.toISOString()}-${weekday}`}>{weekday}</span>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-y-1 text-center">
                    {cells.map((isoDate, index) => {
                        if (!isoDate) {
                            return (
                                <span key={`${monthStart.toISOString()}-empty-${index}`} className="h-11 w-11" />
                            );
                        }

                        const parsed = parseIsoDate(isoDate);
                        const day = parsed ? parsed.getDate() : "";
                        const isDisabled = isoDate < minDate;
                        const isSelected = isoDate === selectedDate;
                        const isToday = isoDate === todayIso;

                        return (
                            <button
                                key={`${monthStart.toISOString()}-${isoDate}`}
                                type="button"
                                disabled={isDisabled}
                                onClick={() => onSelectDate(isoDate)}
                                className={`mx-auto h-11 w-11 rounded-full text-lg font-medium transition-all duration-[320ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${isSelected
                                    ? "bg-gray-900 text-white"
                                    : isDisabled
                                        ? "cursor-not-allowed text-gray-300"
                                        : isToday
                                            ? "border border-gray-300 text-gray-900 hover:bg-gray-200"
                                            : "text-gray-900 hover:bg-gray-200"
                                    }`}
                            >
                                {day}
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className={containerClass} style={style}>
            <div className="mb-8 flex justify-center">
                <div className={`flex max-w-full rounded-full bg-gray-300 p-1 ${isInline ? "w-full" : "w-96"}`}>
                    <button
                        type="button"
                        onClick={() => setMode("exact")}
                        className={`w-1/2 rounded-full py-2 text-base font-semibold transition-all duration-[320ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${mode === "exact" ? "bg-white text-gray-900" : "text-gray-700"}`}
                    >
                        Ngày
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode("flex")}
                        className={`w-1/2 rounded-full py-2 text-base font-semibold transition-all duration-[320ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${mode === "flex" ? "bg-white text-gray-900" : "text-gray-700"}`}
                    >
                        Linh hoạt
                    </button>
                </div>
            </div>

            {mode === "exact" ? (
                <>
                    <div className="mb-6 flex items-start gap-3">
                        <button
                            type="button"
                            onClick={() => setCurrentMonth((current) => addMonths(current, -1))}
                            disabled={!canMovePrevious}
                            className="mt-16 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-200 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label="Tháng trước"
                        >
                            <FaChevronLeft />
                        </button>

                        <div className="grid flex-1 grid-cols-1 gap-8 lg:grid-cols-2">
                            {renderMonth(currentMonth)}
                            {renderMonth(addMonths(currentMonth, 1))}
                        </div>

                        <button
                            type="button"
                            onClick={() => setCurrentMonth((current) => addMonths(current, 1))}
                            className="mt-16 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-200 hover:text-gray-900"
                            aria-label="Tháng sau"
                        >
                            <FaChevronRight />
                        </button>
                    </div>

                    {onNightOffsetChange ? (
                        <div className="flex flex-wrap gap-2">
                            {exactnessOptions.map((option) => {
                                const isActive = selectedNightOffset === option.nights;
                                return (
                                    <button
                                        key={option.label}
                                        type="button"
                                        onClick={() => onNightOffsetChange(option.nights)}
                                        className={`rounded-full border px-5 py-2 text-sm font-medium transition-all duration-[320ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${isActive
                                            ? "border-gray-900 bg-white text-gray-900"
                                            : "border-gray-300 bg-transparent text-gray-700 hover:border-gray-400"
                                            }`}
                                    >
                                        {option.label}
                                    </button>
                                );
                            })}
                        </div>
                    ) : null}
                </>
            ) : (
                <div className="pb-2">
                    <div className="mb-10 text-center">
                        <h3 className="mb-4 text-[24px] font-bold leading-tight text-gray-900 md:text-[28px]">Bạn muốn ở trong bao lâu?</h3>
                        <div className="flex flex-wrap justify-center gap-3">
                            {flexibleDurationOptions.map((option) => (
                                <button
                                    key={option}
                                    type="button"
                                    onClick={() => setFlexDuration(option)}
                                    className={`rounded-full border px-7 py-2.5 text-[18px] font-medium leading-none transition-all duration-[320ms] ease-[cubic-bezier(0.22,1,0.36,1)] md:text-[20px] ${flexDuration === option
                                        ? "border-gray-900 bg-white text-gray-900"
                                        : "border-gray-300 bg-transparent text-gray-700 hover:border-gray-400"
                                        }`}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="mb-6 text-center">
                        <h3 className="text-[24px] font-bold leading-tight text-gray-900 md:text-[28px]">Bạn muốn đi khi nào?</h3>
                    </div>

                    <div className="relative">
                        <div
                            ref={flexScrollerRef}
                            className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                        >
                            {flexibleMonths.map((monthStart) => {
                                const label = `Tháng ${monthStart.getMonth() + 1}`;
                                const year = monthStart.getFullYear();
                                const monthIso = toIsoDate(monthStart);
                                const isActive = selectedDate.startsWith(monthIso.slice(0, 7));

                                return (
                                    <button
                                        key={monthIso}
                                        type="button"
                                        onClick={() => onSelectDate(monthIso)}
                                        className={`min-w-[190px] rounded-[26px] border px-6 py-9 text-center transition-all duration-[320ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${isActive
                                            ? "border-gray-900 bg-white"
                                            : "border-gray-300 bg-transparent hover:border-gray-400"
                                            }`}
                                    >
                                        <FaCalendarAlt className="mx-auto mb-4 text-4xl text-gray-500" />
                                        <p className="text-[22px] font-bold leading-none text-gray-900 md:text-[24px]">{label}</p>
                                        <p className="mt-2 text-[20px] font-medium leading-none text-gray-900 md:text-[22px]">{year}</p>
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            type="button"
                            onClick={scrollFlexibleMonths}
                            className="absolute right-0 top-1/2 z-10 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-800 shadow transition-[transform,background-color] duration-[320ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-105 hover:bg-gray-50"
                            aria-label="Xem các tháng tiếp theo"
                        >
                            <FaChevronRight />
                        </button>
                    </div>
                </div>
            )}

            {onClear ? (
                <div className="mt-6 flex items-center justify-between gap-4 border-t border-gray-200 pt-4">
                    <div className="text-left">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">Lựa chọn</p>
                        <p className="mt-1 text-sm font-semibold text-gray-900">{clearSummary}</p>
                    </div>

                    <button
                        type="button"
                        onClick={onClear}
                        disabled={!hasClearableSelection}
                        className="shrink-0 rounded-full px-1 py-2 text-sm font-semibold text-gray-800 underline decoration-2 underline-offset-4 transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        Xóa tất cả
                    </button>
                </div>
            ) : null}
        </div>
    );
};

export default DatePickerPanel;
