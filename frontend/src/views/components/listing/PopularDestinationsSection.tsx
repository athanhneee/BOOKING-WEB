import { useEffect, useMemo, useRef, useState } from "react";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { popularDestinations } from "../../../config/popularDestinations";
import PopularDestinationCard from "./PopularDestinationCard";

const GRID_PAGE_SIZE = 6;
const SCROLL_TO_TOP_MS = 420;

type SlideDirection = "forward" | "backward";

type PopularDestinationsSectionProps = {
    onExpandedChange?: (expanded: boolean) => void;
    onSearchBarHiddenChange?: (hidden: boolean) => void;
};

const parsePageIndex = (value: string | null, maxPage: number): number => {
    if (!value) {
        return 0;
    }

    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed) || parsed < 0) {
        return 0;
    }

    return Math.min(parsed, maxPage);
};

const buildPagedSlice = <T,>(items: T[], pageIndex: number, pageSize: number): T[] => {
    if (items.length === 0 || pageSize <= 0) {
        return [];
    }

    const start = pageIndex * pageSize;
    const end = start + pageSize;
    return items.slice(start, end);
};

const PopularDestinationsSection = ({
    onExpandedChange,
    onSearchBarHiddenChange,
}: PopularDestinationsSectionProps) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();
    const sectionRef = useRef<HTMLElement | null>(null);
    const trackRef = useRef<HTMLDivElement | null>(null);
    const expandedPanelRef = useRef<HTMLDivElement | null>(null);
    const gridTopRef = useRef<HTMLDivElement | null>(null);
    const slideFrameRef = useRef<number | null>(null);
    const scrollTimerRef = useRef<number | null>(null);

    const maxPage = Math.max(0, Math.ceil(popularDestinations.length / GRID_PAGE_SIZE) - 1);
    const initialExpanded = searchParams.get("popularExpanded") === "1";
    const initialPage = parsePageIndex(searchParams.get("popularPage"), maxPage);

    const [isExpanded, setIsExpanded] = useState(initialExpanded);
    const [pageIndex, setPageIndex] = useState(initialPage);
    const [isGridSliding, setIsGridSliding] = useState(false);
    const [isGridPreparing, setIsGridPreparing] = useState(false);
    const [isGridTransitionEnabled, setIsGridTransitionEnabled] = useState(false);
    const [isSearchBarHidden, setIsSearchBarHidden] = useState(false);
    const [slideDirection, setSlideDirection] = useState<SlideDirection>("forward");
    const [slideTargetIndex, setSlideTargetIndex] = useState<number | null>(null);
    const [slideOffsetClass, setSlideOffsetClass] = useState<"translate-x-0" | "-translate-x-1/2">("translate-x-0");

    const totalPages = Math.ceil(popularDestinations.length / GRID_PAGE_SIZE);
    const safePageIndex = Math.min(pageIndex, Math.max(0, totalPages - 1));
    const hasNextPage = safePageIndex < totalPages - 1;
    const hasPreviousPage = safePageIndex > 0;
    const isGridBusy = isGridSliding || isGridPreparing;

    const currentItems = useMemo(() => {
        return buildPagedSlice(popularDestinations, safePageIndex, GRID_PAGE_SIZE);
    }, [safePageIndex]);

    const targetItems = useMemo(() => {
        if (slideTargetIndex === null) {
            return currentItems;
        }

        return buildPagedSlice(popularDestinations, slideTargetIndex, GRID_PAGE_SIZE);
    }, [currentItems, slideTargetIndex]);

    useEffect(() => {
        onExpandedChange?.(isExpanded);
    }, [isExpanded, onExpandedChange]);

    useEffect(() => {
        onSearchBarHiddenChange?.(isSearchBarHidden);
    }, [isSearchBarHidden, onSearchBarHiddenChange]);

    useEffect(() => {
        return () => {
            onExpandedChange?.(false);
            onSearchBarHiddenChange?.(false);

            if (slideFrameRef.current !== null) {
                window.cancelAnimationFrame(slideFrameRef.current);
            }

            if (scrollTimerRef.current !== null) {
                window.clearTimeout(scrollTimerRef.current);
            }
        };
    }, [onExpandedChange, onSearchBarHiddenChange]);

    useEffect(() => {
        if (isExpanded) {
            return;
        }

        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsSearchBarHidden(false);
    }, [isExpanded]);

    useEffect(() => {
        if (!isExpanded || !isSearchBarHidden) {
            return;
        }

        const handlePointerDown = (event: PointerEvent) => {
            if (!sectionRef.current) {
                return;
            }

            if (!sectionRef.current.contains(event.target as Node)) {
                setIsSearchBarHidden(false);
            }
        };

        document.addEventListener("pointerdown", handlePointerDown);

        return () => {
            document.removeEventListener("pointerdown", handlePointerDown);
        };
    }, [isExpanded, isSearchBarHidden]);

    useEffect(() => {
        const currentExpandedParam = searchParams.get("popularExpanded") === "1";
        const currentPageParam = parsePageIndex(searchParams.get("popularPage"), Math.max(0, totalPages - 1));

        if (currentExpandedParam === isExpanded && (!isExpanded || currentPageParam === safePageIndex)) {
            return;
        }

        const next = new URLSearchParams(searchParams);

        if (isExpanded) {
            next.set("popularExpanded", "1");
            next.set("popularPage", String(safePageIndex));
        } else {
            next.delete("popularExpanded");
            next.delete("popularPage");
            next.delete("popularRestore");
        }

        setSearchParams(next, { replace: true });
    }, [isExpanded, safePageIndex, searchParams, setSearchParams, totalPages]);

    const scrollGridToTop = (behavior: ScrollBehavior): void => {
        const target = gridTopRef.current || expandedPanelRef.current;
        if (!target) {
            return;
        }

        target.scrollIntoView({ behavior, block: "start" });
    };

    useEffect(() => {
        if (!isExpanded || searchParams.get("popularRestore") !== "1") {
            return;
        }

        scrollGridToTop("auto");

        const next = new URLSearchParams(searchParams);
        next.delete("popularRestore");
        setSearchParams(next, { replace: true });
    }, [isExpanded, searchParams, setSearchParams]);

    const handleSlide = (direction: "left" | "right") => {
        const track = trackRef.current;
        if (!track) {
            return;
        }

        const firstCard = track.querySelector<HTMLElement>("[data-destination-card]");
        const cardStep = firstCard ? firstCard.clientWidth + 24 : track.clientWidth * 0.9;
        const moveBy = direction === "right" ? cardStep * 2 : -cardStep * 2;
        const maxScrollLeft = track.scrollWidth - track.clientWidth;
        const isAtStart = track.scrollLeft <= 8;
        const isAtEnd = track.scrollLeft >= maxScrollLeft - 8;

        if (direction === "right" && isAtEnd) {
            track.scrollTo({ left: 0, behavior: "smooth" });
            return;
        }

        if (direction === "left" && isAtStart) {
            track.scrollTo({ left: maxScrollLeft, behavior: "smooth" });
            return;
        }

        track.scrollBy({ left: moveBy, behavior: "smooth" });
    };

    const startGridSlide = (nextPageIndex: number, direction: SlideDirection) => {
        if (isGridBusy || nextPageIndex === safePageIndex) {
            return;
        }

        setIsGridSliding(true);
        setIsGridTransitionEnabled(false);
        setSlideDirection(direction);
        setSlideTargetIndex(nextPageIndex);
        setSlideOffsetClass(direction === "forward" ? "translate-x-0" : "-translate-x-1/2");

        if (slideFrameRef.current !== null) {
            window.cancelAnimationFrame(slideFrameRef.current);
        }

        slideFrameRef.current = window.requestAnimationFrame(() => {
            slideFrameRef.current = window.requestAnimationFrame(() => {
                setIsGridTransitionEnabled(true);
                setSlideOffsetClass(direction === "forward" ? "-translate-x-1/2" : "translate-x-0");
            });
        });
    };

    const navigateWithScrollToTop = (nextPageIndex: number, direction: SlideDirection) => {
        if (isGridBusy || nextPageIndex === safePageIndex) {
            return;
        }

        const target = gridTopRef.current || expandedPanelRef.current;
        const isMobileViewport = window.matchMedia("(max-width: 767.98px)").matches;
        const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        if (!target || prefersReducedMotion) {
            if (isMobileViewport) {
                scrollGridToTop("auto");
            }

            startGridSlide(nextPageIndex, direction);
            return;
        }

        const targetTop = target.getBoundingClientRect().top;
        const shouldScrollToTop = isMobileViewport || targetTop < 72;

        if (!shouldScrollToTop) {
            startGridSlide(nextPageIndex, direction);
            return;
        }

        setIsGridPreparing(true);
        scrollGridToTop("smooth");

        if (scrollTimerRef.current !== null) {
            window.clearTimeout(scrollTimerRef.current);
        }

        scrollTimerRef.current = window.setTimeout(() => {
            setIsGridPreparing(false);
            startGridSlide(nextPageIndex, direction);
        }, SCROLL_TO_TOP_MS);
    };

    const handleOpenOrNext = () => {
        if (!isExpanded) {
            setIsExpanded(true);
            setPageIndex(0);
            setIsSearchBarHidden(true);
            return;
        }

        if (hasNextPage) {
            navigateWithScrollToTop(safePageIndex + 1, "forward");
        }
    };

    const handleBack = () => {
        if (hasPreviousPage) {
            navigateWithScrollToTop(safePageIndex - 1, "backward");
        }
    };

    const handleCollapse = () => {
        if (isGridBusy) {
            return;
        }

        setIsExpanded(false);
        setPageIndex(0);
        setIsSearchBarHidden(false);
        setSlideTargetIndex(null);
        setSlideOffsetClass("translate-x-0");
    };

    const handleGridSlideEnd = () => {
        if (!isGridSliding || slideTargetIndex === null) {
            return;
        }

        const isMobileViewport = window.matchMedia("(max-width: 767.98px)").matches;
        if (isMobileViewport) {
            scrollGridToTop("auto");
        }

        setPageIndex(slideTargetIndex);
        setSlideTargetIndex(null);
        setIsGridSliding(false);
        setIsGridTransitionEnabled(false);
        setSlideOffsetClass("translate-x-0");
    };

    const handleOpenDetail = (villaId: string) => {
        const nextParams = new URLSearchParams(searchParams);

        if (isExpanded) {
            nextParams.set("popularExpanded", "1");
            nextParams.set("popularPage", String(safePageIndex));
            nextParams.set("popularRestore", "1");
            setSearchParams(nextParams, { replace: true });
        }

        const returnQuery = nextParams.toString();
        const returnTo = `${location.pathname}${returnQuery ? `?${returnQuery}` : ""}`;
        sessionStorage.setItem("popular_return_to", returnTo);

        navigate(`/villa/${villaId}`, {
            state: { returnTo },
        });
    };

    const nextButtonLabel = !isExpanded ? "Xem thêm villa" : hasNextPage ? "Xem tiếp" : "";

    const renderGrid = (items: typeof popularDestinations, keyPrefix: string) => (
        <div className="grid grid-cols-1 gap-4 min-[520px]:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
            {items.map((destination) => (
                <PopularDestinationCard
                    key={`${keyPrefix}-${destination.id}`}
                    destination={destination}
                    onClick={() => handleOpenDetail(destination.id)}
                />
            ))}
        </div>
    );

    return (
        <section ref={sectionRef} className="bg-[#efefef] py-12 sm:py-16 md:py-20 lg:py-24">
            <div className="mx-auto w-full max-w-[74rem] px-4 md:px-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="w-full text-center text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl md:text-4xl lg:text-5xl">
                        ĐIỂM ĐẾN ĐƯỢC YÊU THÍCH
                    </h2>

                    <div className={`items-center justify-center gap-2 sm:justify-end ${isExpanded ? "hidden" : "flex"}`}>
                        <button
                            type="button"
                            onClick={() => handleSlide("left")}
                            aria-label="Xem villa trước"
                            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-800 transition-colors hover:bg-zinc-100"
                        >
                            <FaArrowLeft />
                        </button>
                        <button
                            type="button"
                            onClick={() => handleSlide("right")}
                            aria-label="Xem villa tiếp theo"
                            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-800 transition-colors hover:bg-zinc-100"
                        >
                            <FaArrowRight />
                        </button>
                    </div>
                </div>

                <div
                    className={`mt-6 overflow-hidden transition-[max-height,opacity,transform] duration-[560ms] ease-[cubic-bezier(0.22,0.61,0.36,1)] ${isExpanded ? "pointer-events-none max-h-0 -translate-y-2 opacity-0" : "max-h-[960px] translate-y-0 opacity-100"
                        }`}
                >
                    <div
                        ref={trackRef}
                        className="flex gap-4 overflow-x-auto scroll-smooth pb-1 pt-1 snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden sm:gap-6"
                    >
                        {popularDestinations.map((destination) => (
                            <div
                                key={destination.id}
                                data-destination-card
                                className="w-[88%] shrink-0 snap-center min-[520px]:w-[74%] sm:w-[47%] sm:snap-start lg:w-[31%] xl:w-[23.5%]"
                            >
                                <PopularDestinationCard destination={destination} onClick={() => handleOpenDetail(destination.id)} />
                            </div>
                        ))}
                    </div>
                </div>

                <div
                    className={`mt-6 grid overflow-hidden transition-[grid-template-rows,opacity,transform] duration-[560ms] ease-[cubic-bezier(0.22,0.61,0.36,1)] ${isExpanded
                        ? "pointer-events-auto grid-rows-[1fr] translate-y-0 opacity-100"
                        : "pointer-events-none grid-rows-[0fr] -translate-y-2 opacity-0"
                        }`}
                >
                    <div className="min-h-0 overflow-hidden">
                        <div ref={expandedPanelRef} className="rounded-2xl border border-zinc-200 bg-white p-3 sm:p-5 md:p-7">
                            <div ref={gridTopRef} className="h-0 scroll-mt-24" />

                            <div className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:items-center sm:justify-between">
                                <h3 className="text-center text-base font-semibold text-zinc-900 sm:text-lg md:text-xl">
                                    Danh sách điểm đến được yêu thích
                                </h3>
                                <div className="flex items-center justify-center gap-2 sm:justify-end">
                                    <button
                                        type="button"
                                        onClick={handleBack}
                                        disabled={!hasPreviousPage || isGridBusy}
                                        aria-label="Xem trang trước"
                                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-800 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        <FaArrowLeft />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleOpenOrNext}
                                        disabled={!hasNextPage || isGridBusy}
                                        aria-label="Xem trang tiếp theo"
                                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-800 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        <FaArrowRight />
                                    </button>
                                </div>
                            </div>

                            <div className="relative overflow-hidden">
                                {isGridSliding && slideTargetIndex !== null ? (
                                    <div
                                        className={`flex w-[200%] ${slideOffsetClass} ${isGridTransitionEnabled
                                            ? "transition-transform duration-[520ms] ease-[cubic-bezier(0.22,0.61,0.36,1)]"
                                            : "transition-none"
                                            } will-change-transform motion-reduce:transition-none`}
                                        onTransitionEnd={handleGridSlideEnd}
                                    >
                                        {slideDirection === "forward" ? (
                                            <>
                                                <div className="w-1/2 pr-2 sm:pr-3">{renderGrid(currentItems, "current")}</div>
                                                <div className="w-1/2 pl-2 sm:pl-3">{renderGrid(targetItems, "target")}</div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="w-1/2 pr-2 sm:pr-3">{renderGrid(targetItems, "target")}</div>
                                                <div className="w-1/2 pl-2 sm:pl-3">{renderGrid(currentItems, "current")}</div>
                                            </>
                                        )}
                                    </div>
                                ) : (
                                    <div className="transition-opacity duration-200 ease-out">{renderGrid(currentItems, "static")}</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:mt-10 sm:flex-row sm:flex-wrap sm:items-center">
                    <button
                        type="button"
                        onClick={handleOpenOrNext}
                        disabled={(isExpanded && !hasNextPage) || isGridBusy}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-6 py-3 text-base font-semibold text-zinc-900 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto sm:px-8"
                    >
                        {nextButtonLabel}
                        <FaArrowRight />
                    </button>

                    {isExpanded && hasPreviousPage ? (
                        <button
                            type="button"
                            onClick={handleBack}
                            disabled={isGridBusy}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-6 py-3 text-base font-semibold text-zinc-700 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
                        >
                            Quay lại
                            <FaArrowLeft />
                        </button>
                    ) : null}

                    {isExpanded ? (
                        <button
                            type="button"
                            onClick={handleCollapse}
                            disabled={isGridBusy}
                            className="inline-flex w-full items-center justify-center rounded-xl border border-zinc-300 bg-white px-6 py-3 text-base font-semibold text-zinc-700 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
                        >
                            Thu gọn
                        </button>
                    ) : null}
                </div>
            </div>
        </section>
    );
};

export default PopularDestinationsSection;
