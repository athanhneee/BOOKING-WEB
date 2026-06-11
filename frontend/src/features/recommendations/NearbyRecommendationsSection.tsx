import { useEffect, useMemo, useRef, useState } from "react";
import { FaChevronLeft, FaChevronRight, FaStar } from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";
import type { PopularDestination } from "../../models/entities/Listing";
import { APP_ROUTES } from "../../config/routes";
import type { BookingSearchState } from "../../views/components/search/searchState";
import { getListings } from "../../services/listingService";
import { getAiNearbyRecommendations } from "./listingRecommendations";

type NearbyRecommendationsSectionProps = {
    currentListing: PopularDestination;
    searchState: BookingSearchState;
};

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
});

const ITEMS_PER_STEP = 4;

const NearbyRecommendationsSection = ({ currentListing, searchState }: NearbyRecommendationsSectionProps) => {
    const navigate = useNavigate();
    const location = useLocation();
    const railRef = useRef<HTMLDivElement | null>(null);
    const [candidates, setCandidates] = useState<PopularDestination[]>([]);

    useEffect(() => {
        let cancelled = false;

        const loadCandidates = async () => {
            try {
                const result = await getListings({
                    city: "Vũng Tàu",
                    limit: 12,
                    sort: "rating_desc",
                });

                if (!cancelled) {
                    setCandidates(result.items);
                }
            } catch {
                if (!cancelled) {
                    setCandidates([]);
                }
            }
        };

        void loadCandidates();

        return () => {
            cancelled = true;
        };
    }, [currentListing.id]);

    const recommendations = useMemo(
        () => getAiNearbyRecommendations(currentListing, searchState, candidates),
        [candidates, currentListing, searchState],
    );
    const totalPages = Math.max(1, Math.ceil(recommendations.length / ITEMS_PER_STEP));
    const [page, setPage] = useState(0);

    if (recommendations.length === 0) {
        return null;
    }

    const scrollByStep = (direction: "previous" | "next") => {
        const nextPage = direction === "next"
            ? Math.min(page + 1, totalPages - 1)
            : Math.max(page - 1, 0);

        setPage(nextPage);
        railRef.current?.scrollTo({
            left: nextPage * Math.max(railRef.current.clientWidth - 56, 280),
            behavior: "smooth",
        });
    };

    const openListing = (listingId: string) => {
        navigate(
            {
                pathname: APP_ROUTES.villaDetail(listingId),
                search: location.search,
            },
            {
                state: {
                    returnTo: `${location.pathname}${location.search}`,
                },
            },
        );
    };

    return (
        <section className="bg-gradient-to-b from-slate-50/80 to-white py-12 sm:py-16">
            <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex items-end justify-between gap-4">
                    <div>
                        <span className="text-sm font-semibold uppercase tracking-widest text-cyan-600">
                            Đề xuất cho bạn
                        </span>
                        <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                            Chỗ ở khác gần đó
                        </h2>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                        <span className="mr-1 hidden text-sm font-medium text-slate-500 sm:inline">
                            {page + 1} / {totalPages}
                        </span>
                        <button
                            type="button"
                            onClick={() => scrollByStep("previous")}
                            disabled={page === 0}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-600 shadow-[0_2px_8px_rgba(15,23,42,0.08)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(15,23,42,0.12)] hover:text-cyan-600 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:translate-y-0 disabled:hover:shadow-[0_2px_8px_rgba(15,23,42,0.08)]"
                            aria-label="Xem đề xuất trước"
                        >
                            <FaChevronLeft size={13} />
                        </button>
                        <button
                            type="button"
                            onClick={() => scrollByStep("next")}
                            disabled={page >= totalPages - 1}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-600 shadow-[0_2px_8px_rgba(15,23,42,0.08)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(15,23,42,0.12)] hover:text-cyan-600 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:translate-y-0 disabled:hover:shadow-[0_2px_8px_rgba(15,23,42,0.08)]"
                            aria-label="Xem đề xuất tiếp theo"
                        >
                            <FaChevronRight size={13} />
                        </button>
                    </div>
                </div>

                {/* Carousel */}
                <div
                    ref={railRef}
                    className="mt-8 flex snap-x gap-5 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                >
                    {recommendations.map(({ listing, reason }) => (
                        <button
                            key={listing.id}
                            type="button"
                            onClick={() => openListing(listing.id)}
                            className="group w-[240px] shrink-0 snap-start text-left sm:w-[260px]"
                        >
                            <div className="overflow-hidden rounded-2xl bg-white shadow-[0_2px_12px_-4px_rgba(15,23,42,0.08)] transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_8px_24px_-8px_rgba(15,23,42,0.15)]">
                                {/* Image */}
                                <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                                    {listing.imageUrl ? (
                                        <img
                                            src={listing.imageUrl}
                                            alt={listing.name}
                                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
                                            loading="lazy"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center text-sm font-medium text-slate-400">
                                            Chưa có ảnh
                                        </div>
                                    )}
                                    <span className="absolute left-3 top-3 max-w-[calc(100%-1.5rem)] truncate rounded-full bg-white/95 px-3 py-1.5 text-[11px] font-bold text-cyan-700 shadow-sm backdrop-blur-sm">
                                        {reason}
                                    </span>
                                </div>

                                {/* Content */}
                                <div className="p-4">
                                    <h3 className="line-clamp-2 text-sm font-semibold leading-5 text-slate-900">
                                        {listing.name}
                                    </h3>
                                    <div className="mt-3 flex items-center justify-between gap-2">
                                        <span className="text-sm font-bold text-cyan-700">
                                            {currencyFormatter.format(listing.pricePerNight)}
                                        </span>
                                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                                            <FaStar className="text-[10px] text-amber-400" />
                                            {listing.rating.toFixed(1)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default NearbyRecommendationsSection;