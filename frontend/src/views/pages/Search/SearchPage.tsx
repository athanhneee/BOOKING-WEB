import { useEffect, useMemo, useRef, useState } from "react";
import { FiSliders } from "react-icons/fi";
import { useSearchParams } from "react-router-dom";
import { popularDestinations } from "../../../config/popularDestinations";
import Pagination from "../../components/common/Pagination";
import SearchBar from "../../components/search/SearchBar";
import {
    buildGuestSummary,
    filterStaysByBookingSearch,
    formatSearchDateRange,
    parseBookingSearchParams,
} from "../../components/search/searchState";
import StayGrid from "../../components/stays/StayGrid";
import StayFilterModal from "../../components/stays/filter/StayFilterModal";
import {
    countActiveFilters,
    createDefaultStayFilters,
    filterAndSortStays,
    getStayPriceBounds,
} from "../../components/stays/filter/stayFilterUtils";
import type { StayFilterState } from "../../components/stays/filter/types";

const ITEMS_PER_PAGE = 18;

const parsePage = (value: string | null, totalPages: number) => {
    const parsed = Number.parseInt(value ?? "1", 10);
    if (Number.isNaN(parsed) || parsed < 1) return 1;
    return Math.min(parsed, totalPages);
};

const SearchPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const resultsRef = useRef<HTMLElement | null>(null);
    const firstRenderRef = useRef(true);

    const priceBounds = useMemo(() => getStayPriceBounds(popularDestinations), []);
    const defaultFilters = useMemo(() => createDefaultStayFilters(priceBounds), [priceBounds]);
    const [appliedFilters, setAppliedFilters] = useState<StayFilterState>(defaultFilters);
    const bookingSearchState = useMemo(() => parseBookingSearchParams(searchParams), [searchParams]);

    const searchMatchedDestinations = useMemo(
        () => filterStaysByBookingSearch(popularDestinations, bookingSearchState),
        [bookingSearchState],
    );

    const filteredDestinations = useMemo(
        () => filterAndSortStays(searchMatchedDestinations, appliedFilters),
        [appliedFilters, searchMatchedDestinations],
    );

    const totalPages = Math.max(1, Math.ceil(filteredDestinations.length / ITEMS_PER_PAGE));
    const currentPage = parsePage(searchParams.get("page"), totalPages);
    const currentItems = filteredDestinations.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
    const activeFilterCount = countActiveFilters(appliedFilters, defaultFilters);
    const hasSearchCriteria =
        Boolean(bookingSearchState.location) ||
        Boolean(bookingSearchState.checkIn) ||
        Boolean(bookingSearchState.checkOut);

    useEffect(() => {
        const currentParam = searchParams.get("page");
        if (String(currentPage) === currentParam || (currentPage === 1 && currentParam === null)) return;

        const nextParams = new URLSearchParams(searchParams);
        if (currentPage === 1) nextParams.delete("page");
        else nextParams.set("page", String(currentPage));
        setSearchParams(nextParams, { replace: true });
    }, [currentPage, searchParams, setSearchParams]);

    useEffect(() => {
        if (firstRenderRef.current) {
            firstRenderRef.current = false;
            return;
        }

        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, [currentPage]);

    const handlePageChange = (page: number) => {
        if (page < 1 || page > totalPages || page === currentPage) return;

        const nextParams = new URLSearchParams(searchParams);
        if (page === 1) nextParams.delete("page");
        else nextParams.set("page", String(page));

        setSearchParams(nextParams);
    };

    const handleApplyFilters = (nextFilters: StayFilterState) => {
        setAppliedFilters(nextFilters);
        const nextParams = new URLSearchParams(searchParams);
        nextParams.delete("page");
        setSearchParams(nextParams, { replace: true });
    };

    const renderFilterButton = (className = "") => (
        <button
            type="button"
            onClick={() => setIsFilterOpen(true)}
            className={`inline-flex h-14 items-center gap-2.5 rounded-full border border-slate-200 bg-white px-5 text-sm font-semibold text-zinc-700 shadow-[0_18px_35px_-24px_rgba(15,23,42,0.35)] transition hover:-translate-y-0.5 hover:border-cyan-200 hover:text-cyan-700 hover:shadow-[0_22px_42px_-24px_rgba(8,145,178,0.4)] ${className}`}
        >
            <FiSliders size={17} />
            <span>Bộ lọc</span>
            {activeFilterCount > 0 ? (
                <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-cyan-600 px-1.5 text-xs font-bold text-white">
                    {activeFilterCount}
                </span>
            ) : null}
        </button>
    );

    return (
        <div className="bg-[#efefef]">
            <SearchBar variant="listing" forceVisible desktopAside={renderFilterButton()} />

            <section ref={resultsRef} className="relative overflow-hidden px-4 pb-20 pt-36 sm:px-6 md:px-8 md:pt-40">
                <div className="pointer-events-none absolute left-[-5rem] top-28 h-56 w-56 rounded-full bg-cyan-200/45 blur-3xl" />
                <div className="pointer-events-none absolute right-[-4rem] top-12 h-64 w-64 rounded-full bg-sky-200/45 blur-3xl" />

                <div className="relative mx-auto max-w-[74rem]">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_35px_90px_-58px_rgba(15,23,42,0.38)] sm:p-6 lg:p-8">
                        <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 md:flex-row md:items-center md:justify-between">
                            <div className="space-y-3">
                                <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">Danh sách nơi lưu trú</h1>

                                {hasSearchCriteria ? (
                                    <p className="text-sm leading-6 text-zinc-500">
                                        {bookingSearchState.location ? `Khu vực: ${bookingSearchState.location}` : "Toàn bộ khu vực"}
                                        {" • "}
                                        {formatSearchDateRange(bookingSearchState.checkIn, bookingSearchState.checkOut)}
                                        {" • "}
                                        {buildGuestSummary(bookingSearchState.guests, "1 khách")}
                                    </p>
                                ) : null}

                                <div className="flex flex-wrap gap-2">
                                    <span className="rounded-full border border-cyan-100 bg-cyan-50 px-3 py-1.5 text-sm font-semibold text-cyan-700">Villa được yêu thích</span>
                                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-semibold text-zinc-600">Nơi lưu trú nổi bật</span>
                                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-semibold text-zinc-600">Giá tốt</span>
                                </div>
                            </div>

                            <div className="md:hidden">{renderFilterButton("self-start")}</div>
                        </div>

                        <div className="mt-6">
                            <StayGrid stays={currentItems} />
                        </div>

                        <div className="mt-10 border-t border-slate-100 pt-6">
                            <Pagination page={currentPage} totalPages={totalPages} onChange={handlePageChange} />
                        </div>
                    </div>
                </div>
            </section>

            <StayFilterModal
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                stays={popularDestinations}
                value={appliedFilters}
                bounds={priceBounds}
                onApply={handleApplyFilters}
            />
        </div>
    );
};

export default SearchPage;
