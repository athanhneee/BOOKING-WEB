import { useEffect, useState } from "react";
import type { CounterFilterItem, StayFilterState } from "./types";

const COUNTER_MAX = 99;

type CounterRowProps = {
    item: CounterFilterItem;
    value: number;
    onChange: (key: CounterFilterItem["key"], nextValue: number) => void;
};

const clampCounter = (next: number) => Math.min(COUNTER_MAX, Math.max(0, next));

const CounterRow = ({ item, value, onChange }: CounterRowProps) => {
    const [draft, setDraft] = useState(String(value));
    const [isFocused, setIsFocused] = useState(false);

    // Keep the editable field in sync with external updates (+/- buttons, "Xóa tất cả"),
    // but never clobber what the user is actively typing.
    useEffect(() => {
        if (!isFocused) {
            setDraft(String(value));
        }
    }, [value, isFocused]);

    const handleInputChange = (raw: string) => {
        const digits = raw.replace(/\D/g, "").slice(0, 2);
        setDraft(digits);
        onChange(item.key, digits === "" ? 0 : clampCounter(Number(digits)));
    };

    const handleBlur = () => {
        setIsFocused(false);
        if (draft === "") {
            setDraft("0");
            onChange(item.key, 0);
        }
    };

    return (
        <div className="flex items-center justify-between gap-4 rounded-3xl border border-slate-100 bg-slate-50/70 px-4 py-4">
            <div>
                <p className="text-sm font-semibold text-zinc-900">{item.label}</p>
                <p className="mt-1 text-sm text-zinc-500">{item.description}</p>
            </div>

            <div className="flex items-center gap-3">
                <button
                    type="button"
                    aria-label={`Giảm ${item.label.toLowerCase()}`}
                    onClick={() => onChange(item.key, clampCounter(value - 1))}
                    disabled={value <= 0}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-lg font-semibold text-zinc-700 transition hover:border-cyan-200 hover:text-cyan-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:text-zinc-700"
                >
                    -
                </button>

                <input
                    type="text"
                    inputMode="numeric"
                    aria-label={item.label}
                    value={draft}
                    onChange={(event) => handleInputChange(event.target.value)}
                    onFocus={(event) => {
                        setIsFocused(true);
                        event.target.select();
                    }}
                    onBlur={handleBlur}
                    className="h-10 w-12 rounded-2xl border border-transparent bg-transparent text-center text-base font-semibold text-zinc-900 outline-none transition focus:border-cyan-200 focus:bg-white focus:ring-2 focus:ring-cyan-100"
                />

                <button
                    type="button"
                    aria-label={`Tăng ${item.label.toLowerCase()}`}
                    onClick={() => onChange(item.key, clampCounter(value + 1))}
                    disabled={value >= COUNTER_MAX}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-lg font-semibold text-zinc-700 transition hover:border-cyan-200 hover:text-cyan-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:text-zinc-700"
                >
                    +
                </button>
            </div>
        </div>
    );
};

type CounterFilterProps = {
    items: CounterFilterItem[];
    value: StayFilterState;
    onChange: (key: CounterFilterItem["key"], nextValue: number) => void;
};

const CounterFilter = ({ items, value, onChange }: CounterFilterProps) => {
    return (
        <div className="space-y-4">
            {items.map((item) => (
                <CounterRow key={item.key} item={item} value={value[item.key]} onChange={onChange} />
            ))}
        </div>
    );
};

export default CounterFilter;
