import { useMemo, useRef, useState } from "react";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { popularDestinations } from "../../../config/popularDestinations";
import PopularDestinationCard from "./PopularDestinationCard";

const GRID_PAGE_SIZE = 6;

const buildPagedSlice = <T,>(items: T[], pageIndex: number, pageSize: number): T[] => {
    if (items.length === 0 || pageSize <= 0) {
        return [];
    }

    const start = pageIndex * pageSize;
    const end = start + pageSize;
    return items.slice(start, end);
};

const PopularDestinationsSection = () => {
    const trackRef = useRef<HTMLDivElement | null>(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const [pageIndex, setPageIndex] = useState(0);

    const totalPages = Math.ceil(popularDestinations.length / GRID_PAGE_SIZE);
    const hasNextPage = pageIndex < totalPages - 1;
    const hasPreviousPage = pageIndex > 0;

    const expandedItems = useMemo(() => {
        return buildPagedSlice(popularDestinations, pageIndex, GRID_PAGE_SIZE);
    }, [pageIndex]);

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

    const handleOpenOrNext = () => {
        if (!isExpanded) {
            setIsExpanded(true);
            setPageIndex(0);
            return;
        }

        if (hasNextPage) {
            setPageIndex((current) => current + 1);
        }
    };

    const handleBack = () => {
        if (hasPreviousPage) {
            setPageIndex((current) => current - 1);
        }
    };

    const handleCollapse = () => {
        setIsExpanded(false);
        setPageIndex(0);
    };

    const nextButtonLabel = !isExpanded
        ? "Xem thêm"
        : hasNextPage
            ? "Xem tiếp"
            : "";

    return (
        <section className="bg-[#efefef] py-14 sm:py-16 md:py-20 lg:py-24">
            <div className="mx-auto w-full max-w-[74rem] px-4 md:px-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="w-full text-center text-3xl font-bold tracking-tight text-zinc-900 sm:text-2xl md:text-4xl lg:text-5xl">
                        ĐIỂM ĐẾN ĐƯỢC YÊU THÍCH
                    </h2>

                    <div className={`items-center justify-center gap-2 sm:justify-end ${isExpanded ? "hidden" : "flex"}`}>
                        <button
                            type="button"
                            onClick={() => handleSlide("left")}
                            aria-label="Xem villa truoc"
                            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-800 transition-colors hover:bg-zinc-100"
                        >
                            <FaArrowLeft />
                        </button>
                        <button
                            type="button"
                            onClick={() => handleSlide("right")}
                            aria-label="Xem villa tiep theo"
                            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-800 transition-colors hover:bg-zinc-100"
                        >
                            <FaArrowRight />
                        </button>
                    </div>
                </div>

                <div
                    className={`mt-8 overflow-hidden transition-[max-height,opacity,transform] duration-[620ms] ease-[cubic-bezier(0.22,0.61,0.36,1)] ${isExpanded ? "pointer-events-none max-h-0 -translate-y-2 opacity-0" : "max-h-[960px] translate-y-0 opacity-100"
                        }`}
                >
                    <div
                        ref={trackRef}
                        className="flex gap-6 overflow-x-auto scroll-smooth pb-1 pt-1 snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                    >
                        {popularDestinations.map((destination) => (
                            <div
                                key={destination.id}
                                data-destination-card
                                className="w-[86%] shrink-0 snap-center sm:w-[47%] sm:snap-start lg:w-[31%] xl:w-[23.5%]"
                            >
                                <PopularDestinationCard destination={destination} />
                            </div>
                        ))}
                    </div>
                </div>

                <div
                    className={`mt-8 grid overflow-hidden transition-[grid-template-rows,opacity,transform] duration-[620ms] ease-[cubic-bezier(0.22,0.61,0.36,1)] ${isExpanded ? "pointer-events-auto grid-rows-[1fr] translate-y-0 opacity-100" : "pointer-events-none grid-rows-[0fr] -translate-y-2 opacity-0"
                        }`}
                >
                    <div className="min-h-0 overflow-hidden">
                        <div className="rounded-3xl border border-zinc-200 bg-white p-4 sm:p-6 md:p-7">
                            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <h3 className="text-center text-lg font-semibold text-zinc-900 sm:text-xl">
                                    Danh sách điểm đến được yêu thích
                                </h3>
                                <div className="flex items-center justify-center gap-2 sm:justify-end">
                                    <button
                                        type="button"
                                        onClick={handleBack}
                                        disabled={!hasPreviousPage}
                                        aria-label="Xem trang truoc"
                                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-800 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        <FaArrowLeft />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleOpenOrNext}
                                        disabled={!hasNextPage}
                                        aria-label="Xem trang tiep theo"
                                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-800 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        <FaArrowRight />
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                {expandedItems.map((destination) => (
                                    <PopularDestinationCard key={destination.id} destination={destination} />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
                    <button
                        type="button"
                        onClick={handleOpenOrNext}
                        disabled={isExpanded && !hasNextPage}
                        className="inline-flex items-center justify-center gap-2 rounded-full border border-zinc-300 bg-white px-8 py-3 text-base font-semibold text-zinc-900 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        {nextButtonLabel}
                        <FaArrowRight />
                    </button>

                    {isExpanded && hasPreviousPage ? (
                        <button
                            type="button"
                            onClick={handleBack}
                            className="inline-flex items-center justify-center gap-2 rounded-full border border-zinc-300 bg-white px-6 py-3 text-base font-semibold text-zinc-700 transition-colors hover:bg-zinc-100"
                        >
                            Quay lại
                            <FaArrowLeft />
                        </button>
                    ) : null}

                    {isExpanded ? (
                        <button
                            type="button"
                            onClick={handleCollapse}
                            className="inline-flex items-center justify-center rounded-full border border-zinc-300 bg-white px-6 py-3 text-base font-semibold text-zinc-700 transition-colors hover:bg-zinc-100"
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
