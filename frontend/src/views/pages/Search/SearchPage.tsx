import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { FiSliders } from "react-icons/fi";
import { useSearchParams } from "react-router-dom";
import Pagination from "../../components/common/Pagination";
import SearchBar from "../../components/search/SearchBar";
import { getPopularDestinations } from "../../../services/listingService";
import {
    buildGuestSummary,
    filterStaysByBookingSearch,
    formatSearchDateRange,
    parseBookingSearchParams,
} from "../../components/search/searchState";
import StayGrid from "../../components/stays/StayGrid";
import StayFilterModal from "../../components/stays/filter/StayFilterModal";
import { applyStayFiltersToSearchParams, parseStayFiltersFromSearchParams } from "../../components/stays/filter/filterUrlState";
import {
    countActiveFilters,
    createDefaultStayFilters,
    filterAndSortStays,
    getStayPriceBounds,
} from "../../components/stays/filter/stayFilterUtils";
import type { StayFilterState } from "../../components/stays/filter/types";

const ITEMS_PER_PAGE = 18;
const MOBILE_HEADER_OFFSET = 56;
const DESKTOP_HEADER_OFFSET = 80;

const parsePage = (value: string | null, totalPages: number) => {
    const parsed = Number.parseInt(value ?? "1", 10);
    if (Number.isNaN(parsed) || parsed < 1) return 1;
    return Math.min(parsed, totalPages);
};

const SearchPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [barHeight, setBarHeight] = useState(80);
    const [headerOffset, setHeaderOffset] = useState(() =>
        typeof window !== "undefined" && window.innerWidth >= 768 ? DESKTOP_HEADER_OFFSET : MOBILE_HEADER_OFFSET,
    );

    const searchBarRef = useRef<HTMLDivElement | null>(null);
    const resultsRef = useRef<HTMLElement | null>(null);
    const firstRenderRef = useRef(true);

    const stays = useMemo(() => getPopularDestinations(), []);
    const priceBounds = useMemo(() => getStayPriceBounds(stays), [stays]);
    const defaultFilters = useMemo(() => createDefaultStayFilters(priceBounds), [priceBounds]);
    const bookingSearchState = useMemo(() => parseBookingSearchParams(searchParams), [searchParams]);
    const appliedFilters = useMemo(
        () => parseStayFiltersFromSearchParams(searchParams, defaultFilters, priceBounds),
        [defaultFilters, priceBounds, searchParams],
    );

    const searchMatchedDestinations = useMemo(
        () => filterStaysByBookingSearch(stays, bookingSearchState),
        [bookingSearchState, stays],
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

    useLayoutEffect(() => {
        const updateStickyLayout = () => {
            setBarHeight(searchBarRef.current?.offsetHeight ?? 80);
            setHeaderOffset(window.innerWidth >= 768 ? DESKTOP_HEADER_OFFSET : MOBILE_HEADER_OFFSET);
        };

        updateStickyLayout();
        window.addEventListener("resize", updateStickyLayout);

        return () => window.removeEventListener("resize", updateStickyLayout);
    }, []);

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
        const nextParams = applyStayFiltersToSearchParams(searchParams, nextFilters, defaultFilters);
        nextParams.delete("page");
        setSearchParams(nextParams, { replace: true });
    };

    const renderFilterButton = (className = "") => (
        <button
            type="button"
            onClick={() => setIsFilterOpen(true)}
            className={`inline-flex h-14 items-center gap-2.5 rounded-full border border-slate-200 bg-white px-5 text-sm font-semibold text-zinc-700 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-200 hover:text-cyan-700 hover:shadow-md ${className}`}
        >
            <FiSliders size={17} />
            <span>Bộ lọc</span>
            {activeFilterCount > 0 ? (
                <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-cyan-500 px-1.5 text-xs font-bold text-white">
                    {activeFilterCount}
                </span>
            ) : null}
        </button>
    );

    return (
        <div className="min-h-screen bg-[#f7f8fb] pt-14 md:pt-20">
            <div ref={searchBarRef} className="sticky top-14 z-40 px-4 py-3 md:top-20">
                <div className="mx-auto max-w-5xl">
                    <SearchBar variant="listing" desktopAside={renderFilterButton()} />
                </div>
            </div>

            <main
                ref={resultsRef}
                style={{ scrollMarginTop: `${headerOffset + barHeight + 24}px` }}
                className="relative z-0 mx-auto max-w-5xl px-4 pb-12 pt-6"
            >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-3">
                        <div>
                            <h1 className="text-3xl font-semibold tracking-tight text-gray-900">Tìm chỗ nghỉ</h1>
                            <p className="mt-2 text-sm leading-6 text-gray-500 sm:text-base">
                                Villa, homestay, căn hộ — đặt ngay, nhận phòng liền
                            </p>
                        </div>

                        {hasSearchCriteria ? (
                            <p className="text-sm leading-6 text-gray-500">
                                {bookingSearchState.location ? `Khu vực: ${bookingSearchState.location}` : "Toàn bộ khu vực"}
                                {" • "}
                                {formatSearchDateRange(bookingSearchState.checkIn, bookingSearchState.checkOut)}
                                {" • "}
                                {buildGuestSummary(bookingSearchState.guests, "1 khách")}
                            </p>
                        ) : null}

                        <div className="flex flex-wrap gap-2">
                            <span className="rounded-full border border-cyan-100 bg-cyan-50 px-3 py-1.5 text-sm font-semibold text-cyan-700">
                                Villa được yêu thích
                            </span>
                            <span className="rounded-full border border-teal-100 bg-teal-50 px-3 py-1.5 text-sm font-semibold text-teal-700">
                                Giá tốt theo lịch của bạn
                            </span>
                            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-semibold text-slate-600">
                                Nhận phòng nhanh
                            </span>
                        </div>
                    </div>

                    <div className="md:hidden">{renderFilterButton("self-start")}</div>
                </div>

                <div className="mt-6">
                    <StayGrid stays={currentItems} />
                </div>

                <div className="mt-10 border-t border-gray-100 pt-6">
                    <Pagination page={currentPage} totalPages={totalPages} onChange={handlePageChange} />
                </div>
            </main>

            <StayFilterModal
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                stays={stays}
                value={appliedFilters}
                bounds={priceBounds}
                onApply={handleApplyFilters}
            />
        </div>
    );
};

export default SearchPage;
