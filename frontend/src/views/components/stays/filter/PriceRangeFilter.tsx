import { useMemo } from "react";
import type { PriceBounds } from "./types";

type PriceRangeFilterProps = {
    bounds: PriceBounds;
    minValue: number | null;
    maxValue: number | null;
    onChange: (nextValues: { min: number | null; max: number | null }) => void;
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

    const effectiveMinValue = minValue ?? bounds.min;
    const effectiveMaxValue = maxValue ?? bounds.max;
    const range = Math.max(bounds.max - bounds.min, 1);
    const startPercent = ((effectiveMinValue - bounds.min) / range) * 100;
    const endPercent = ((effectiveMaxValue - bounds.min) / range) * 100;

    const clampMin = (value: number) => Math.max(bounds.min, Math.min(value, effectiveMaxValue - STEP));
    const clampMax = (value: number) => Math.min(bounds.max, Math.max(value, effectiveMinValue + STEP));
    const normalizeSelection = (nextMin: number, nextMax: number) => ({
        min: nextMin <= bounds.min ? null : nextMin,
        max: nextMax >= bounds.max ? null : nextMax,
    });

    return (
        <div className="space-y-5">
            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5">
                <div className="relative h-8">
                    <div className="absolute left-0 right-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-slate-200" />
                    <div
                        className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-cyan-500"
                        style={{ left: `${startPercent}%`, width: `${Math.max(endPercent - startPercent, 0)}%` }}
                    />

                    <input
                        type="range"
                        min={bounds.min}
                        max={bounds.max}
                        step={STEP}
                        value={effectiveMinValue}
                        onChange={(event) =>
                            onChange(normalizeSelection(clampMin(Number(event.target.value)), effectiveMaxValue))
                        }
                        className="pointer-events-none absolute inset-0 h-8 w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-cyan-500 [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-4 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-cyan-500 [&::-moz-range-thumb]:shadow-md"
                    />

                    <input
                        type="range"
                        min={bounds.min}
                        max={bounds.max}
                        step={STEP}
                        value={effectiveMaxValue}
                        onChange={(event) =>
                            onChange(normalizeSelection(effectiveMinValue, clampMax(Number(event.target.value))))
                        }
                        className="pointer-events-none absolute inset-0 h-8 w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-cyan-500 [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-4 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-cyan-500 [&::-moz-range-thumb]:shadow-md"
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
                            value={effectiveMinValue}
                            onChange={(event) =>
                                onChange(normalizeSelection(clampMin(Number(event.target.value || bounds.min)), effectiveMaxValue))
                            }
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
                            value={effectiveMaxValue}
                            onChange={(event) =>
                                onChange(normalizeSelection(effectiveMinValue, clampMax(Number(event.target.value || bounds.max))))
                            }
                            className="mt-2 w-full border-none bg-transparent text-lg font-semibold text-zinc-900 outline-none"
                        />
                    </label>
                </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-zinc-500">
                <span>VNĐ / đêm</span>
                <span>
                    {minValue === null && maxValue === null
                        ? "Tất cả mức giá"
                        : `${currencyFormatter.format(effectiveMinValue)} - ${currencyFormatter.format(effectiveMaxValue)}`}
                </span>
            </div>

            <p className="text-sm leading-6 text-zinc-500">
                Giá mỗi đêm, chưa bao gồm phí dịch vụ và thuế nếu có.
            </p>
        </div>
    );
};

export default PriceRangeFilter;
