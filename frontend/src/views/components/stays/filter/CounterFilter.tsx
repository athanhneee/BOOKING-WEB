import type { CounterFilterItem, StayFilterState } from "./types";

type CounterFilterProps = {
    items: CounterFilterItem[];
    value: StayFilterState;
    onChange: (key: CounterFilterItem["key"], nextValue: number) => void;
};

const CounterFilter = ({ items, value, onChange }: CounterFilterProps) => {
    return (
        <div className="space-y-4">
            {items.map((item) => {
                const currentValue = value[item.key];

                return (
                    <div key={item.key} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-4">
                        <div>
                            <p className="text-sm font-semibold text-zinc-900">{item.label}</p>
                            <p className="mt-1 text-sm text-zinc-500">{item.description}</p>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => onChange(item.key, Math.max(0, currentValue - 1))}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-lg font-semibold text-zinc-700 transition hover:border-cyan-200 hover:text-cyan-600"
                            >
                                -
                            </button>

                            <span className="w-8 text-center text-base font-semibold text-zinc-900">{currentValue}</span>

                            <button
                                type="button"
                                onClick={() => onChange(item.key, currentValue + 1)}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-lg font-semibold text-zinc-700 transition hover:border-cyan-200 hover:text-cyan-600"
                            >
                                +
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default CounterFilter;
