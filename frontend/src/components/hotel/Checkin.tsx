import { useMemo } from "react";
import { FaCalendarAlt, FaTimes } from "react-icons/fa";
import DatePickerPanel from "./DatePickerPanel";

type CheckinProps = {
    value: string;
    isOpen: boolean;
    nightOffset: number;
    onOpen: () => void;
    onChange: (nextDate: string) => void;
    onNightOffsetChange: (nextOffset: number) => void;
    className?: string;
    panelClassName?: string;
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
    className,
    panelClassName,
    onClose,
}: CheckinProps) => {
    const today = useMemo(() => formatIsoDate(new Date()), []);
    const displayValue = useMemo(() => formatDisplayDate(value), [value]);

    return (
        <div className={`relative min-w-0 ${className ?? "flex-1"}`.trim()}>
            <button
                type="button"
                onClick={onOpen}
                className={`flex h-full w-full items-center gap-3 rounded-full px-3 py-2 text-left transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${isOpen ? "bg-gray-100 pr-10" : "hover:bg-gray-50"}`}
                aria-expanded={isOpen}
                aria-label={"Ch\u1ecdn ng\u00e0y nh\u1eadn ph\u00f2ng"}
            >
                <FaCalendarAlt className="text-gray-400" />
                <div className="min-w-0 text-left">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-700">{"Nh\u1eadn ph\u00f2ng"}</p>
                    <p className={`truncate text-sm ${value ? "font-semibold text-gray-900" : "text-gray-500"}`}>
                        {displayValue}
                    </p>
                </div>
            </button>

            {isOpen && onClose ? (
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute right-2 top-1/2 z-10 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-800"
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
                    className={panelClassName}
                />
            ) : null}
        </div>
    );
};

export default Checkin;

