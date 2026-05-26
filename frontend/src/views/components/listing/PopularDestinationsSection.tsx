import { useEffect, useMemo, useState } from "react";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import type { PopularDestination } from "../../../models/entities/Listing";
import { getPopularDestinations } from "../../../services/listingService";
import PopularDestinationCard from "./PopularDestinationCard";

const GRID_PAGE_SIZE = 6;

type PopularDestinationsSectionProps = {
    onExpandedChange?: (expanded: boolean) => void;
    onSearchBarHiddenChange?: (hidden: boolean) => void;
};

const buildPagedSlice = <T,>(items: T[], pageIndex: number, pageSize: number): T[] => {
    if (items.length === 0 || pageSize <= 0) {
        return [];
    }

    const start = pageIndex * pageSize;
    return items.slice(start, start + pageSize);
};

const PopularDestinationsSection = ({
    onExpandedChange,
    onSearchBarHiddenChange,
}: PopularDestinationsSectionProps) => {
    const navigate = useNavigate();
    const [destinations, setDestinations] = useState<PopularDestination[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [isExpanded, setIsExpanded] = useState(false);
    const [pageIndex, setPageIndex] = useState(0);

    useEffect(() => {
        let cancelled = false;

        const loadDestinations = async () => {
            setLoading(true);
            setError("");

            try {
                const items = await getPopularDestinations();
                if (!cancelled) {
                    setDestinations(items);
                }
            } catch (loadError) {
                if (!cancelled) {
                    setError(loadError instanceof Error ? loadError.message : "Không thể tải danh sách chỗ nghỉ.");
                    setDestinations([]);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        void loadDestinations();

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        onExpandedChange?.(isExpanded);
        onSearchBarHiddenChange?.(isExpanded);

        return () => {
            onExpandedChange?.(false);
            onSearchBarHiddenChange?.(false);
        };
    }, [isExpanded, onExpandedChange, onSearchBarHiddenChange]);

    const totalPages = Math.max(1, Math.ceil(destinations.length / GRID_PAGE_SIZE));
    const safePageIndex = Math.min(pageIndex, totalPages - 1);
    const currentItems = useMemo(
        () => buildPagedSlice(destinations, safePageIndex, GRID_PAGE_SIZE),
        [destinations, safePageIndex],
    );
    const featuredItems = useMemo(() => destinations.slice(0, 8), [destinations]);

    const openDetail = (listingId: string) => navigate(`/villa/${listingId}`);

    const goNext = () => {
        if (!isExpanded) {
            setIsExpanded(true);
            setPageIndex(0);
            return;
        }

        setPageIndex((current) => Math.min(current + 1, totalPages - 1));
    };

    const goPrevious = () => setPageIndex((current) => Math.max(current - 1, 0));

    if (loading) {
        return (
            <section className="bg-[#efefef] py-12 sm:py-16 md:py-20 lg:py-24">
                <div className="mx-auto w-full max-w-[74rem] px-4 text-center text-sm font-medium text-zinc-500 md:px-6">
                    Đang tải chỗ nghỉ ...
                </div>
            </section>
        );
    }

    return (
        <section className="bg-[#efefef] py-12 sm:py-16 md:py-20 lg:py-24">
            <div className="mx-auto w-full max-w-[74rem] px-4 md:px-6">
                <h2 className="w-full text-center text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl md:text-4xl lg:text-5xl">
                    ĐIỂM ĐẾN ĐƯỢC YÊU THÍCH
                </h2>

                {error ? (
                    <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-center text-sm font-medium text-rose-700">
                        {error}
                    </div>
                ) : null}

                {!error && destinations.length === 0 ? (
                    <div className="mt-6 rounded-2xl border border-dashed border-zinc-300 bg-white px-5 py-12 text-center text-sm font-medium text-zinc-500">
                        Chưa có chỗ nghỉ đã duyệt. Hãy đăng nhập host để tạo phòng, sau đó Admin duyệt để hiển thị tại đây.
                    </div>
                ) : null}

                {!isExpanded && featuredItems.length > 0 ? (
                    <div className="mt-6 flex gap-4 overflow-x-auto pb-1 pt-1 snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden sm:gap-6">
                        {featuredItems.map((destination) => (
                            <div
                                key={destination.id}
                                className="w-[88%] shrink-0 snap-center min-[520px]:w-[74%] sm:w-[47%] sm:snap-start lg:w-[31%] xl:w-[23.5%]"
                            >
                                <PopularDestinationCard destination={destination} onClick={() => openDetail(destination.id)} />
                            </div>
                        ))}
                    </div>
                ) : null}

                {isExpanded ? (
                    <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-3 sm:p-5 md:p-7">
                        <div className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:items-center sm:justify-between">
                            <h3 className="text-center text-base font-semibold text-zinc-900 sm:text-lg md:text-xl">
                                Danh sách chỗ nghỉ đã duyệt
                            </h3>
                            <p className="text-center text-sm font-medium text-zinc-500 sm:text-right">
                                Trang {safePageIndex + 1} / {totalPages}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-4 min-[520px]:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
                            {currentItems.map((destination) => (
                                <PopularDestinationCard
                                    key={destination.id}
                                    destination={destination}
                                    onClick={() => openDetail(destination.id)}
                                />
                            ))}
                        </div>
                    </div>
                ) : null}

                {destinations.length > 0 ? (
                    <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:mt-10 sm:flex-row sm:flex-wrap sm:items-center">
                        {isExpanded ? (
                            <button
                                type="button"
                                onClick={goPrevious}
                                disabled={safePageIndex === 0}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-6 py-3 text-base font-semibold text-zinc-700 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
                            >
                                <FaArrowLeft />
                                Quay lại
                            </button>
                        ) : null}

                        <button
                            type="button"
                            onClick={goNext}
                            disabled={isExpanded && safePageIndex >= totalPages - 1}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-6 py-3 text-base font-semibold text-zinc-900 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto sm:px-8"
                        >
                            {!isExpanded ? "Xem thêm villa" : "Xem tiếp"}
                            <FaArrowRight />
                        </button>

                        {isExpanded ? (
                            <button
                                type="button"
                                onClick={() => {
                                    setIsExpanded(false);
                                    setPageIndex(0);
                                }}
                                className="inline-flex w-full items-center justify-center rounded-xl border border-zinc-300 bg-white px-6 py-3 text-base font-semibold text-zinc-700 transition-colors hover:bg-zinc-100 sm:w-auto"
                            >
                                Thu gọn
                            </button>
                        ) : null}
                    </div>
                ) : null}
            </div>
        </section>
    );
};

export default PopularDestinationsSection;