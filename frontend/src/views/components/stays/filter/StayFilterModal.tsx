import { useEffect, useMemo, useState } from "react";
import { FiSliders, FiX } from "react-icons/fi";
import { LuCircleCheckBig } from "react-icons/lu";
import Modal from "../../ui/Modal";
import CounterFilter from "./CounterFilter";
import FilterChipGroup from "./FilterChipGroup";
import FilterSection from "./FilterSection";
import PriceRangeFilter from "./PriceRangeFilter";
import {
    counterFilterItems,
    stayAmenityOptions,
    stayCategoryOptions,
    stayHighlightOptions,
    stayPolicyOptions,
    stayQuickChoiceOptions,
    staySortOptions,
} from "./filterOptions";
import { countActiveFilters, createDefaultStayFilters } from "./stayFilterUtils";
import type { PriceBounds, StayFilterState, StaySortOption } from "./types";

type StayFilterModalProps = {
    isOpen: boolean;
    onClose: () => void;
    value: StayFilterState;
    bounds: PriceBounds;
    onApply: (nextFilters: StayFilterState) => void;
};

const StayFilterModal = ({ isOpen, onClose, value, bounds, onApply }: StayFilterModalProps) => {
    const defaultFilters = useMemo(() => createDefaultStayFilters(bounds), [bounds]);
    const [draftFilters, setDraftFilters] = useState<StayFilterState>(value);

    useEffect(() => {
        if (isOpen) {
            const frame = window.requestAnimationFrame(() => {
                setDraftFilters(value);
            });

            return () => window.cancelAnimationFrame(frame);
        }
    }, [isOpen, value]);

    const activeCount = countActiveFilters(draftFilters, defaultFilters);

    const updateCounter = (key: keyof Pick<StayFilterState, "guests" | "bedrooms" | "beds" | "bathrooms">, nextValue: number) => {
        setDraftFilters((current) => ({
            ...current,
            [key]: nextValue,
        }));
    };

    const toggleMultiValue = <T extends string,>(key: keyof StayFilterState, valueToToggle: T) => {
        setDraftFilters((current) => {
            const existingValues = current[key] as T[];
            const nextValues = existingValues.includes(valueToToggle)
                ? existingValues.filter((item) => item !== valueToToggle)
                : [...existingValues, valueToToggle];

            return {
                ...current,
                [key]: nextValues,
            };
        });
    };

    const handleSortChange = (sortValue: StaySortOption) => {
        setDraftFilters((current) => ({
            ...current,
            sortBy: current.sortBy === sortValue ? null : sortValue,
        }));
    };

    const handleClearAll = () => {
        setDraftFilters(defaultFilters);
    };

    const handleApply = () => {
        onApply(draftFilters);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} panelClassName="sm:h-[90vh] sm:max-h-[90vh]">
            <div className="flex-shrink-0 border-b border-slate-100 px-4 py-4 sm:px-8 sm:py-6">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-100 bg-cyan-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-600">
                            <FiSliders />
                            Bộ lọc
                        </div>
                        <h2 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">Tìm nơi lưu trú phù hợp với nhu cầu của bạn</h2>
                        <p className="mt-2 text-sm leading-6 text-zinc-500">
                            Chọn loại chỗ nghỉ, khoảng giá, tiện nghi và chính sách đặt phòng.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-zinc-600 transition hover:border-cyan-200 hover:text-cyan-600"
                        aria-label="Đóng bộ lọc"
                    >
                        <FiX size={18} />
                    </button>
                </div>

                {activeCount > 0 ? (
                    <div className="mt-4 inline-flex rounded-full border border-cyan-100 bg-cyan-50 px-3 py-1.5 text-sm font-semibold text-cyan-600">
                        Đang áp dụng {activeCount} lựa chọn
                    </div>
                ) : null}
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-6 pt-5 sm:px-8 sm:pb-8">
                <FilterSection title="Loại nơi lưu trú" description="Bạn có thể chọn một hoặc nhiều loại chỗ nghỉ phù hợp với chuyến đi.">
                    <FilterChipGroup
                        options={stayCategoryOptions}
                        selectedValues={draftFilters.categories}
                        onToggle={(valueToToggle) => toggleMultiValue("categories", valueToToggle)}
                        columnsClassName="grid-cols-2 lg:grid-cols-3"
                    />
                </FilterSection>

                <FilterSection title="Khoảng giá" description="Chọn khoảng ngân sách theo giá mỗi đêm.">
                    <PriceRangeFilter
                        bounds={bounds}
                        minValue={draftFilters.priceMin}
                        maxValue={draftFilters.priceMax}
                        onChange={({ min, max }) =>
                            setDraftFilters((current) => ({
                                ...current,
                                priceMin: min,
                                priceMax: max,
                            }))
                        }
                    />
                </FilterSection>

                <FilterSection title="Số khách và phòng" description="Thiết lập số lượng tối thiểu cho nhu cầu lưu trú của bạn.">
                    <CounterFilter items={counterFilterItems} value={draftFilters} onChange={updateCounter} />
                </FilterSection>

                <FilterSection title="Tiện nghi" description="Chỉ hiển thị các nơi lưu trú có đủ tiện nghi bạn quan tâm.">
                    <FilterChipGroup
                        options={stayAmenityOptions}
                        selectedValues={draftFilters.amenities}
                        onToggle={(valueToToggle) => toggleMultiValue("amenities", valueToToggle)}
                    />
                </FilterSection>

                <FilterSection title="Đặc điểm nổi bật" description="Ưu tiên các chỗ nghỉ được yêu thích, mới đăng hoặc đang có ưu đãi.">
                    <FilterChipGroup
                        options={stayHighlightOptions}
                        selectedValues={draftFilters.highlights}
                        onToggle={(valueToToggle) => toggleMultiValue("highlights", valueToToggle)}
                    />
                </FilterSection>

                <FilterSection title="Chính sách đặt phòng" description="Lọc theo mức độ linh hoạt và tốc độ xác nhận phòng.">
                    <FilterChipGroup
                        options={stayPolicyOptions}
                        selectedValues={draftFilters.policies}
                        onToggle={(valueToToggle) => toggleMultiValue("policies", valueToToggle)}
                    />
                </FilterSection>

                <FilterSection title="Lựa chọn nhanh" description="Những gợi ý phổ biến dành cho nhóm gia đình hoặc các chuyến đi ngắn ngày.">
                    <FilterChipGroup
                        options={stayQuickChoiceOptions}
                        selectedValues={draftFilters.quickChoices}
                        onToggle={(valueToToggle) => toggleMultiValue("quickChoices", valueToToggle)}
                    />
                </FilterSection>

                <FilterSection title="Sắp xếp" description="Chọn cách ưu tiên hiển thị kết quả phù hợp với nhu cầu của bạn.">
                    <div className="grid gap-2.5 sm:grid-cols-2">
                        {staySortOptions.map((option) => {
                            const isSelected = draftFilters.sortBy === option.value;
                            const Icon = option.icon;

                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => handleSortChange(option.value)}
                                    className={`flex w-full items-start gap-3 rounded-xl border-2 p-4 text-left transition-all duration-150 ${isSelected
                                        ? "border-cyan-500 bg-cyan-50"
                                        : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                                        }`}
                                >
                                    <div
                                        className={`flex-shrink-0 rounded-xl p-2 transition-colors ${isSelected ? "bg-cyan-100 text-cyan-500" : "bg-gray-100 text-gray-500"
                                            }`}
                                    >
                                        <Icon size={16} />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <p className={`text-sm font-semibold ${isSelected ? "text-cyan-600" : "text-gray-800"}`}>
                                            {option.label}
                                        </p>
                                        <p className="mt-0.5 text-xs leading-relaxed text-gray-400">
                                            {option.description}
                                        </p>
                                    </div>

                                    {isSelected ? (
                                        <LuCircleCheckBig size={16} className="mt-0.5 flex-shrink-0 text-cyan-500" />
                                    ) : null}
                                </button>
                            );
                        })}
                    </div>
                </FilterSection>
            </div>

            <div className="flex-shrink-0 border-t border-slate-100 bg-white px-4 py-4 shadow-[0_-12px_32px_-28px_rgba(15,23,42,0.28)] sm:px-8">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <button
                        type="button"
                        onClick={handleClearAll}
                        className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-zinc-700 transition hover:border-cyan-200 hover:text-cyan-600"
                    >
                        Xóa tất cả
                    </button>

                    <button
                        type="button"
                        onClick={handleApply}
                        className="inline-flex items-center justify-center rounded-xl bg-cyan-500 px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_35px_-20px_rgba(8,145,178,0.8)] transition hover:bg-cyan-500"
                    >
                        Áp dụng bộ lọc
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default StayFilterModal;
