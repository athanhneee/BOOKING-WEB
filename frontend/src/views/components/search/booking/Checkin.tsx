import { useMemo, type CSSProperties, type Ref } from "react";
import { FaCalendarAlt, FaTimes } from "react-icons/fa";
import DatePickerPanel from "./DatePickerPanel";

type CheckinProps = {
    value: string;
    isOpen: boolean;
    nightOffset: number;
    onOpen: () => void;
    onChange: (nextDate: string) => void;
    onNightOffsetChange: (nextOffset: number) => void;
    onClear?: () => void;
    className?: string;
    panelClassName?: string;
    panelStyle?: CSSProperties;
    containerRef?: Ref<HTMLDivElement>;
    onClose?: () => void;
};

const formatIsoDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const formatDisplayDate = (isoDate: string): string => {
    if (!isoDate) {
        return "Th\u00eam ng\u00e0y";
    }

    const parsed = new Date(`${isoDate}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) {
        return "Th\u00eam ng\u00e0y";
    }

    return new Intl.DateTimeFormat("vi-VN", {
        weekday: "short",
        day: "2-digit",
        month: "2-digit",
    }).format(parsed);
};

const Checkin = ({
    value,
    isOpen,
    nightOffset,
    onOpen,
    onChange,
    onNightOffsetChange,
    onClear,
    className,
    panelClassName,
    panelStyle,
    containerRef,
    onClose,
}: CheckinProps) => {
    const today = useMemo(() => formatIsoDate(new Date()), []);
    const displayValue = useMemo(() => formatDisplayDate(value), [value]);

    return (
        <div ref={containerRef} className={`relative min-w-0 ${className ?? "flex-1"}`.trim()}>
            <button
                type="button"
                onClick={onOpen}
                className={`flex h-full w-full items-center gap-3 rounded-full px-3 py-2 text-left transition-[background-color,transform,box-shadow,padding] duration-[320ms] ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.995] ${isOpen ? "bg-gray-100 pr-10 shadow-[inset_0_0_0_1px_rgba(15,23,42,0.04)]" : "hover:bg-gray-50"}`}
                aria-expanded={isOpen}
                aria-label={"Ch\u1ecdn ng\u00e0y nh\u1eadn ph\u00f2ng"}
            >
                <FaCalendarAlt className="text-gray-400" />
                <div className="min-w-0 text-left">
                    <p className="text-[11px] font-semibold text-gray-700">{"Nh\u1eadn ph\u00f2ng"}</p>
                    <p className={`truncate text-sm ${value ? "font-semibold text-gray-900" : "text-gray-500"}`}>
                        {displayValue}
                    </p>
                </div>
            </button>

            {isOpen && onClose ? (
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute right-2 top-1/2 z-10 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-gray-500 transition-[background-color,color,transform] duration-200 hover:bg-gray-200 hover:text-gray-800"
                    aria-label="Đóng nhận phòng"
                >
                    <FaTimes className="text-xs" />
                </button>
            ) : null}

            {isOpen ? (
                <DatePickerPanel
                    isOpen={isOpen}
                    selectedDate={value}
                    minDate={today}
                    selectedNightOffset={nightOffset}
                    onSelectDate={onChange}
                    onNightOffsetChange={onNightOffsetChange}
                    onClear={onClear}
                    className={panelClassName ?? "left-1/2 -translate-x-[42%]"}
                    style={panelStyle}
                />
            ) : null}
        </div>
    );
};

export default Checkin;
