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
        <section className="bg-white py-12 sm:py-14">
            <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <div className="inline-flex items-center rounded-full bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-700">
                            AI gợi ý
                        </div>
                        <h2 className="mt-3 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
                            Chỗ ở khác gần đó
                        </h2>
                    </div>

                    <div className="flex shrink-0 items-center gap-3">
                        <span className="hidden text-sm font-medium text-zinc-700 sm:inline">
                            {page + 1} / {totalPages}
                        </span>
                        <button
                            type="button"
                            onClick={() => scrollByStep("previous")}
                            disabled={page === 0}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-700 shadow-sm transition hover:border-cyan-200 hover:text-cyan-700 disabled:cursor-not-allowed disabled:opacity-35"
                            aria-label="Xem đề xuất trước"
                        >
                            <FaChevronLeft />
                        </button>
                        <button
                            type="button"
                            onClick={() => scrollByStep("next")}
                            disabled={page >= totalPages - 1}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-700 shadow-sm transition hover:border-cyan-200 hover:text-cyan-700 disabled:cursor-not-allowed disabled:opacity-35"
                            aria-label="Xem đề xuất tiếp theo"
                        >
                            <FaChevronRight />
                        </button>
                    </div>
                </div>

                <div
                    ref={railRef}
                    className="mt-6 flex snap-x gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                >
                    {recommendations.map(({ listing, reason }) => (
                        <button
                            key={listing.id}
                            type="button"
                            onClick={() => openListing(listing.id)}
                            className="group w-[178px] shrink-0 snap-start text-left sm:w-[210px]"
                        >
                            <div className="relative aspect-[1.05] overflow-hidden rounded-xl bg-slate-100">
                                {listing.imageUrl ? (
                                    <img
                                        src={listing.imageUrl}
                                        alt={listing.name}
                                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                        loading="lazy"
                                    />
                                ) : null}
                                <span className="absolute left-3 top-3 max-w-[calc(100%-1.5rem)] truncate rounded-full bg-white/92 px-2.5 py-1 text-[11px] font-bold text-cyan-700 shadow-sm">
                                    {reason}
                                </span>
                            </div>

                            <div className="mt-3 min-w-0">
                                <h3 className="h-10 overflow-hidden text-sm font-semibold leading-5 text-zinc-900">
                                    {listing.name}
                                </h3>
                                <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500">
                                    <span>{currencyFormatter.format(listing.pricePerNight)}</span>
                                    <span className="h-1 w-1 rounded-full bg-zinc-300" />
                                    <span className="inline-flex items-center gap-1">
                                        <FaStar className="text-[10px] text-zinc-500" />
                                        {listing.rating.toFixed(1)}
                                    </span>
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