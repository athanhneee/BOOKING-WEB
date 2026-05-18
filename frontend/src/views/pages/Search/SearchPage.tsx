import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { FiSliders } from "react-icons/fi";
import { useSearchParams } from "react-router-dom";
import Pagination from "../../components/common/Pagination";
import SearchBar from "../../components/search/SearchBar";
import { getListings, semanticSearchListingsMapped } from "../../../services/listingService";
import type { PopularDestination } from "../../../models/entities/Listing";
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

    const [stays, setStays] = useState<PopularDestination[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [pagination, setPagination] = useState({
        page: 1,
        limit: ITEMS_PER_PAGE,
        totalItems: 0,
        totalPages: 1,
    });
    const priceBounds = useMemo(() => getStayPriceBounds(stays), [stays]);
    const defaultFilters = useMemo(() => createDefaultStayFilters(priceBounds), [priceBounds]);
    const bookingSearchState = useMemo(() => parseBookingSearchParams(searchParams), [searchParams]);
    const requestedPage = Number.parseInt(searchParams.get("page") ?? "1", 10);
    const apiPage = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;

    useEffect(() => {
        let ignore = false;

        const loadListings = async () => {
            setIsLoading(true);
            setError("");

            try {
                const totalGuests = bookingSearchState.guests.adults + bookingSearchState.guests.children;
                const trimmedLocation = bookingSearchState.location.trim();

                const result = trimmedLocation
                    ? await semanticSearchListingsMapped({
                        query: trimmedLocation,
                        city: "Vũng Tàu",
                        checkIn: bookingSearchState.checkIn || undefined,
                        checkOut: bookingSearchState.checkOut || undefined,
                        guests: totalGuests > 0 ? totalGuests : undefined,
                        page: apiPage,
                        limit: ITEMS_PER_PAGE,
                    })
                    : await getListings({
                        city: "Vũng Tàu",
                        checkIn: bookingSearchState.checkIn || undefined,
                        checkOut: bookingSearchState.checkOut || undefined,
                        guests: totalGuests > 0 ? totalGuests : undefined,
                        page: apiPage,
                        limit: ITEMS_PER_PAGE,
                    });

                if (ignore) return;

                setStays(result.items);
                setPagination(result.pagination);
            } catch (loadError) {
                if (ignore) return;

                setError(loadError instanceof Error ? loadError.message : "Không tải được danh sách chỗ nghỉ.");
            } finally {
                if (!ignore) {
                    setIsLoading(false);
                }
            }
        };

        void loadListings();

        return () => {
            ignore = true;
        };
    }, [
        apiPage,
        bookingSearchState.location,
        bookingSearchState.checkIn,
        bookingSearchState.checkOut,
        bookingSearchState.guests.adults,
        bookingSearchState.guests.children,
    ]);


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

    const totalPages = pagination.totalPages;
    const currentPage = parsePage(searchParams.get("page"), totalPages);
    const currentItems = filteredDestinations;
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
                                Villa, Homestay, căn hộ tại Vũng Tàu
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
                    {isLoading ? (
                        <div className="rounded-2xl bg-white p-8 text-center text-sm font-semibold text-gray-500 shadow-sm">
                            Đang tải danh sách chỗ nghỉ...
                        </div>
                    ) : error ? (
                        <div className="rounded-2xl border border-rose-100 bg-rose-50 p-8 text-center text-sm font-semibold text-rose-600">
                            {error}
                        </div>
                    ) : currentItems.length === 0 ? (
                        <div className="rounded-2xl bg-white p-8 text-center text-sm font-semibold text-gray-500 shadow-sm">
                            Không tìm thấy chỗ nghỉ phù hợp.
                        </div>
                    ) : (
                        <StayGrid stays={currentItems} />
                    )}
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