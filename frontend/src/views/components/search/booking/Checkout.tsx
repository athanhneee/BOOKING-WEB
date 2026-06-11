import { useMemo, type CSSProperties, type Ref } from "react";
import { FaCalendarAlt, FaTimes } from "react-icons/fa";
import DatePickerPanel from "./DatePickerPanel";

type CheckoutProps = {
    value: string;
    checkinDate: string;
    isOpen: boolean;
    onOpen: () => void;
    onChange: (nextDate: string) => void;
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

const Checkout = ({
    value,
    checkinDate,
    isOpen,
    onOpen,
    onChange,
    onClear,
    className,
    panelClassName,
    panelStyle,
    containerRef,
    onClose,
}: CheckoutProps) => {
    const today = useMemo(() => formatIsoDate(new Date()), []);
    const displayValue = useMemo(() => formatDisplayDate(value), [value]);
    const minDate = checkinDate || today;

    return (
        <div ref={containerRef} className={`relative min-w-0 ${className ?? "flex-1"}`.trim()}>
            <button
                type="button"
                onClick={onOpen}
                className={`flex h-full w-full items-center gap-3 rounded-full px-4 py-3 text-left transition-[background-color,transform,box-shadow,padding] duration-[320ms] ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.995] ${isOpen ? "bg-cyan-300/10 pr-10 shadow-[inset_0_0_0_1px_rgba(8,145,178,0.18)]" : "hover:bg-slate-50/80"}`}
                aria-expanded={isOpen}
                aria-label={"Ch\u1ecdn ng\u00e0y tr\u1ea3 ph\u00f2ng"}
            >
                <FaCalendarAlt className={`${isOpen ? "text-cyan-600" : "text-gray-400"}`} />
                <div className="min-w-0 text-left">
                    <p className="text-[11px] font-semibold tracking-[0.08em] text-slate-500">{"Tr\u1ea3 ph\u00f2ng"}</p>
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
                    aria-label="Đóng trả phòng"
                >
                    <FaTimes className="text-xs" />
                </button>
            ) : null}

            <DatePickerPanel
                key={`checkout-${isOpen ? "open" : "closed"}-${checkinDate}-${value}-${minDate}`}
                isOpen={isOpen}
                selectedDate={value}
                minDate={minDate}
                onSelectDate={onChange}
                onClear={onClear}
                className={panelClassName ?? "left-1/2 -translate-x-1/2"}
                style={panelStyle}
            />
        </div>
    );
};

export default Checkout;
