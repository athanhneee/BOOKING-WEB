import { useMemo } from "react";
import { FaTimes, FaUser } from "react-icons/fa";

export type GuestSelection = {
    adults: number;
    children: number;
    infants: number;
    pets: number;
};

type GuestProps = {
    value: GuestSelection;
    isOpen: boolean;
    onOpen: () => void;
    onChange: (nextValue: GuestSelection) => void;
    className?: string;
    popupClassName?: string;
    onClose?: () => void;
};

type GuestFieldConfig = {
    key: keyof GuestSelection;
    label: string;
    description: string;
    min: number;
    max: number;
};

const guestFieldConfigs: GuestFieldConfig[] = [
    {
        key: "adults",
        label: "Người lớn",
        description: "Từ 13 tuổi trở lên",
        min: 1,
        max: 16,
    },
    {
        key: "children",
        label: "Trẻ em",
        description: "Từ 2-12 tuổi",
        min: 0,
        max: 8,
    },
    {
        key: "infants",
        label: "Em bé",
        description: "Dưới 2 tuổi",
        min: 0,
        max: 5,
    },
    {
        key: "pets",
        label: "Thú cưng",
        description: "Mang theo thú cưng",
        min: 0,
        max: 5,
    },
];

const summaryFromGuest = (selection: GuestSelection): string => {
    const stayingGuests = selection.adults + selection.children;

    if (stayingGuests <= 0) {
        return "Thêm khách";
    }

    const fragments: string[] = [`${stayingGuests} khách`];

    if (selection.infants > 0) {
        fragments.push(`${selection.infants} em bé`);
    }

    if (selection.pets > 0) {
        fragments.push(`${selection.pets} thú cưng`);
    }

    return fragments.join(", ");
};

const Guest = ({ value, isOpen, onOpen, onChange, className, popupClassName, onClose }: GuestProps) => {
    const summary = useMemo(() => summaryFromGuest(value), [value]);

    const handleAdjust = (key: keyof GuestSelection, delta: number, min: number, max: number) => {
        const next = value[key] + delta;

        if (next < min || next > max) {
            return;
        }

        onChange({
            ...value,
            [key]: next,
        });
    };

    return (
        <div className={`relative min-w-0 ${className ?? "flex-1"}`.trim()}>
            <button
                type="button"
                onClick={onOpen}
                className={`flex h-full w-full items-center gap-3 rounded-full px-4 py-3 text-left transition-[background-color,transform,box-shadow,padding] duration-[320ms] ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.995] ${isOpen ? "bg-cyan-300/10 pr-10 shadow-[inset_0_0_0_1px_rgba(8,145,178,0.18)]" : "hover:bg-slate-50/80"}`}
                aria-expanded={isOpen}
                aria-label="Chọn số lượng khách"
            >
                <FaUser className={isOpen ? "text-cyan-600" : "text-gray-400"} />
                <div className="min-w-0 text-left">
                    <p className="text-[11px] font-semibold tracking-[0.08em] text-slate-500">Khách</p>
                    <p className={`truncate text-sm ${summary === "Thêm khách" ? "text-gray-500" : "font-semibold text-gray-900"}`}>
                        {summary}
                    </p>
                </div>
            </button>

            {isOpen && onClose ? (
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute right-2 top-1/2 z-10 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-gray-500 transition-[background-color,color,transform] duration-200 hover:bg-gray-200 hover:text-gray-800"
                    aria-label="Đóng khách"
                >
                    <FaTimes className="text-xs" />
                </button>
            ) : null}

            <div
                className={`absolute left-1/2 top-[calc(100%+12px)] z-50 w-[min(380px,calc(100vw-2rem))] -translate-x-1/2 transform-gpu rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_32px_70px_-42px_rgba(15,23,42,0.42)] origin-top transition-all duration-200 ease-out will-change-transform ${popupClassName ?? ""} ${isOpen ? "translate-y-0 scale-100 opacity-100 pointer-events-auto" : "pointer-events-none -translate-y-1 scale-[0.98] opacity-0"}`}
            >
                <p className="text-sm font-semibold text-gray-900">Bạn đi cùng ai?</p>
                <p className="mt-1 text-xs text-gray-500">Tối đa 16 khách, chưa tính em bé và thú cưng.</p>

                <div className="mt-5 space-y-4">
                    {guestFieldConfigs.map((config) => {
                        const currentValue = value[config.key];
                        const disableMinus = currentValue <= config.min;
                        const disablePlus = currentValue >= config.max;

                        return (
                            <div key={config.key} className="grid grid-cols-[minmax(190px,1fr)_auto] items-center gap-4">
                                <div className="text-left">
                                    <p className="text-sm font-semibold text-gray-900">{config.label}</p>
                                    <p className="text-xs text-gray-500">{config.description}</p>
                                </div>

                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => handleAdjust(config.key, -1, config.min, config.max)}
                                        className="h-8 w-8 rounded-full border border-gray-300 text-base leading-none text-gray-600 transition hover:border-cyan-400 hover:text-cyan-800 disabled:cursor-not-allowed disabled:opacity-40"
                                        disabled={disableMinus}
                                        aria-label={`Giảm ${config.label}`}
                                    >
                                        -
                                    </button>
                                    <span className="w-5 text-center text-sm font-semibold text-gray-900">{currentValue}</span>
                                    <button
                                        type="button"
                                        onClick={() => handleAdjust(config.key, 1, config.min, config.max)}
                                        className="h-8 w-8 rounded-full border border-gray-300 text-base leading-none text-gray-600 transition hover:border-cyan-400 hover:text-cyan-800 disabled:cursor-not-allowed disabled:opacity-40"
                                        disabled={disablePlus}
                                        aria-label={`Tăng ${config.label}`}
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
    );
};

export default Guest;
