import { useMemo } from "react";
import type { PriceBounds } from "./types";

type PriceRangeFilterProps = {
    bounds: PriceBounds;
    minValue: number;
    maxValue: number;
    onChange: (nextValues: { min: number; max: number }) => void;
};

const STEP = 500000;

const PriceRangeFilter = ({ bounds, minValue, maxValue, onChange }: PriceRangeFilterProps) => {
    const currencyFormatter = useMemo(
        () =>
            new Intl.NumberFormat("vi-VN", {
                style: "currency",
                currency: "VND",
                maximumFractionDigits: 0,
            }),
        [],
    );

    const range = Math.max(bounds.max - bounds.min, 1);
    const startPercent = ((minValue - bounds.min) / range) * 100;
    const endPercent = ((maxValue - bounds.min) / range) * 100;

    const clampMin = (value: number) => Math.max(bounds.min, Math.min(value, maxValue - STEP));
    const clampMax = (value: number) => Math.min(bounds.max, Math.max(value, minValue + STEP));

    return (
        <div className="space-y-5">
            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5">
                <div className="relative h-8">
                    <div className="absolute left-0 right-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-slate-200" />
                    <div
                        className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-cyan-600"
                        style={{ left: `${startPercent}%`, width: `${Math.max(endPercent - startPercent, 0)}%` }}
                    />

                    <input
                        type="range"
                        min={bounds.min}
                        max={bounds.max}
                        step={STEP}
                        value={minValue}
                        onChange={(event) => onChange({ min: clampMin(Number(event.target.value)), max: maxValue })}
                        className="pointer-events-none absolute inset-0 h-8 w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-cyan-600 [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-4 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-cyan-600 [&::-moz-range-thumb]:shadow-md"
                    />

                    <input
                        type="range"
                        min={bounds.min}
                        max={bounds.max}
                        step={STEP}
                        value={maxValue}
                        onChange={(event) => onChange({ min: minValue, max: clampMax(Number(event.target.value)) })}
                        className="pointer-events-none absolute inset-0 h-8 w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-cyan-600 [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-4 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-cyan-600 [&::-moz-range-thumb]:shadow-md"
                    />
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <label className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">Giá tối thiểu</span>
                        <input
                            type="number"
                            min={bounds.min}
                            max={bounds.max}
                            step={STEP}
                            value={minValue}
                            onChange={(event) => onChange({ min: clampMin(Number(event.target.value || bounds.min)), max: maxValue })}
                            className="mt-2 w-full border-none bg-transparent text-lg font-semibold text-zinc-900 outline-none"
                        />
                    </label>

                    <label className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">Giá tối đa</span>
                        <input
                            type="number"
                            min={bounds.min}
                            max={bounds.max}
                            step={STEP}
                            value={maxValue}
                            onChange={(event) => onChange({ min: minValue, max: clampMax(Number(event.target.value || bounds.max)) })}
                            className="mt-2 w-full border-none bg-transparent text-lg font-semibold text-zinc-900 outline-none"
                        />
                    </label>
                </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-zinc-500">
                <span>VNĐ / đêm</span>
                <span>
                    {currencyFormatter.format(minValue)} - {currencyFormatter.format(maxValue)}
                </span>
            </div>

            <p className="text-sm leading-6 text-zinc-500">Giá mỗi đêm, chưa bao gồm phí dịch vụ và thuế nếu có.</p>
        </div>
    );
};

export default PriceRangeFilter;