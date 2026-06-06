import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { ArrowRightLeft, Calendar, Search, Sparkles } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import ListingCard from "../../../components/listings/ListingCard";
import { APP_ROUTES } from "../../../config/routes";
import {
    searchAiListings,
    type AiListingSearchItem,
    type AiSearchMode,
} from "../../../services/api/semanticSearchApi";

const LAST_AI_SEARCH_QUERY_KEY = "lastAiSearchQuery";
const AI_SEARCH_LIMIT = 12;

const suggestionChips = [
    "Villa gần biển có hồ bơi",
    "Homestay giá rẻ cho nhóm bạn",
    "Chỗ nghỉ yên tĩnh cho gia đình",
    "Căn hộ có bếp và máy giặt",
    "Gần trung tâm, có chỗ đậu xe",
    "Villa bãi sau trống 15/6",
    "Villa sang trọng cuối tuần này",
    "Nhà nguyên căn cho 10 người tháng 7",
];

type DateIntent = {
    label: string;
    checkIn?: string;
    checkOut?: string;
};

type AiSearchLocationState = {
    initialQuery?: string;
};

const getSessionQuery = () => {
    if (typeof window === "undefined") {
        return "";
    }

    return window.sessionStorage.getItem(LAST_AI_SEARCH_QUERY_KEY) ?? "";
};

const DATE_LABEL_MAP: Record<string, string> = {
    today: "Hôm nay",
    tomorrow: "Ngày mai",
    this_weekend: "Cuối tuần này",
    next_weekend: "Cuối tuần sau",
    next_week: "Tuần tới",
    next_month: "Tháng sau",
    specific_date: "Ngày được chọn",
};

const formatShortDate = (iso: string) => {
    const d = new Date(`${iso}T00:00:00`);
    if (Number.isNaN(d.getTime())) return iso;
    return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(d);
};

const AiSearchPage = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const locationState = location.state as AiSearchLocationState | null;

    const initialQuery = useMemo(
        () => (locationState?.initialQuery || getSessionQuery()).trim(),
        [locationState?.initialQuery],
    );

    const didAutoSearchRef = useRef(false);

    const [query, setQuery] = useState(initialQuery);
    const [lastSubmittedQuery, setLastSubmittedQuery] = useState("");
    const [items, setItems] = useState<AiListingSearchItem[]>([]);
    const [mode, setMode] = useState<AiSearchMode | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [hasSearched, setHasSearched] = useState(false);
    const [dateIntent, setDateIntent] = useState<DateIntent | null>(null);

    const runSearch = useCallback(async (rawQuery: string) => {
        const nextQuery = rawQuery.trim();

        if (!nextQuery) {
            setError("Nhập nội dung bạn muốn tìm bằng AI.");
            setItems([]);
            setMode(null);
            setHasSearched(false);
            setDateIntent(null);
            return;
        }

        setQuery(nextQuery);
        setLastSubmittedQuery(nextQuery);
        setIsLoading(true);
        setError("");
        setHasSearched(true);

        try {
            const result = await searchAiListings({
                query: nextQuery,
                limit: AI_SEARCH_LIMIT,
            });

            setItems(result.items);
            setMode(result.mode);

            // Extract date intent from parsedFilters
            const parsedDateIntent = result.searchMeta?.parsedFilters?.dateIntent ?? null;
            setDateIntent(parsedDateIntent);

            if (typeof window !== "undefined") {
                window.sessionStorage.setItem(LAST_AI_SEARCH_QUERY_KEY, nextQuery);
            }
        } catch (searchError) {
            setItems([]);
            setMode(null);
            setDateIntent(null);
            setError(searchError instanceof Error ? searchError.message : "Không thể tìm kiếm AI lúc này.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!initialQuery || didAutoSearchRef.current) {
            return;
        }

        didAutoSearchRef.current = true;
        void runSearch(initialQuery);
    }, [initialQuery, runSearch]);

    useEffect(() => {
        const handleAiSearchSubmit = (event: Event) => {
            const detail = (event as CustomEvent<{ query?: string }>).detail;

            if (detail?.query) {
                void runSearch(detail.query);
            }
        };

        window.addEventListener("ai-search-submit", handleAiSearchSubmit);

        return () => {
            window.removeEventListener("ai-search-submit", handleAiSearchSubmit);
        };
    }, [runSearch]);

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        void runSearch(query);
    };

    const handleChipClick = (chip: string) => {
        setQuery(chip);
        void runSearch(chip);
    };

    return (
        <div className="min-h-screen bg-[#f7f8fb] pt-24">
            <main className="mx-auto max-w-6xl px-4 pb-16">
                <section className="rounded-[36px] border border-slate-100 bg-white/60 p-5 shadow-sm backdrop-blur md:p-7">
                    <span className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-bold text-cyan-600 shadow-sm">
                        <Sparkles size={17} />
                        Tìm kiếm AI
                    </span>

                    <div className="mt-6">
                        <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-4xl md:text-5xl">
                            Tìm kiếm AI
                        </h1>
                    </div>

                    <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-3 md:flex-row md:items-center">
                        <div className="relative min-w-0 flex-1">
                            <Search
                                size={20}
                                className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-slate-400"
                            />

                            <input
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                                maxLength={500}
                                placeholder="Ví dụ: villa gần biển có hồ bơi cho 10 người"
                                className="h-16 w-full rounded-full border border-slate-200 bg-white pl-14 pr-5 text-base font-medium text-slate-900 shadow-[0_8px_24px_rgba(15,23,42,0.08)] outline-none transition placeholder:text-slate-400 focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-cyan-500 px-6 text-base font-bold text-white shadow-[0_10px_24px_rgba(8,145,178,0.28)] transition hover:-translate-y-0.5 hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-70 sm:h-16 sm:px-8 md:min-w-[150px]"
                        >
                            <Sparkles size={20} />
                            {isLoading ? "Đang tìm..." : "Tìm AI"}
                        </button>
                    </form>

                    <div className="mt-5 flex flex-wrap gap-3">
                        {suggestionChips.map((chip) => (
                            <button
                                key={chip}
                                type="button"
                                onClick={() => handleChipClick(chip)}
                                disabled={isLoading}
                                className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                                {chip}
                            </button>
                        ))}
                    </div>
                </section>

                <section className="mt-8 rounded-[36px] border border-slate-100 bg-white/60 p-5 shadow-sm backdrop-blur md:p-7">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        {/* Date intent detected banner */}
                        {dateIntent?.checkIn ? (
                            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-700">
                                <Calendar size={16} />
                                <span>
                                    {DATE_LABEL_MAP[dateIntent.label] ?? dateIntent.label}:{" "}
                                    <strong>{formatShortDate(dateIntent.checkIn)}</strong>
                                    {dateIntent.checkOut ? ` – ${formatShortDate(dateIntent.checkOut)}` : ""}
                                </span>
                                <span className="ml-1 text-xs text-cyan-500">· Tự điền vào lịch</span>
                            </div>
                        ) : null}

                        <button
                            type="button"
                            onClick={() => navigate(APP_ROUTES.search)}
                            className="inline-flex h-14 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-6 text-sm font-bold text-slate-800 shadow-[0_8px_20px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5 hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700"
                        >
                            <ArrowRightLeft size={18} />
                            Chuyển sang tìm kiếm thường
                        </button>
                    </div>

                    <div className="mt-7">
                        {isLoading ? (
                            <div className="rounded-[32px] border border-slate-200 bg-white p-10 text-center text-sm font-bold text-slate-500 shadow-sm">
                                Đang tìm chỗ nghỉ phù hợp...
                            </div>
                        ) : error ? (
                            <div className="rounded-[32px] border border-rose-200 bg-rose-50 p-10 text-center text-sm font-bold text-rose-700 shadow-sm">
                                {error}
                            </div>
                        ) : hasSearched && items.length === 0 ? (
                            <div className="rounded-[32px] border border-slate-200 bg-white p-10 text-center text-sm font-bold text-slate-500 shadow-sm">
                                Không tìm thấy chỗ nghỉ phù hợp.
                            </div>
                        ) : items.length > 0 ? (
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                {items.map((listing) => (
                                    <div
                                        key={listing.listingId}
                                        className="overflow-hidden rounded-[28px] border border-slate-100 bg-white shadow-sm"
                                    >
                                        <ListingCard
                                            listing={listing}
                                            checkIn={dateIntent?.checkIn}
                                            checkOut={dateIntent?.checkOut}
                                        />
                                        {listing.matchedReasons?.length ? (
                                            <div className="space-y-2 border-t border-slate-100 p-4">
                                                {listing.matchedReasons.slice(0, 3).map((reason) => (
                                                    <p
                                                        key={reason}
                                                        className="rounded-xl bg-cyan-50 px-3 py-2 text-xs font-semibold text-cyan-800"
                                                    >
                                                        {reason}
                                                    </p>
                                                ))}
                                            </div>
                                        ) : null}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-[32px] border border-dashed border-slate-300 bg-white p-10 text-center text-sm font-semibold text-slate-500 shadow-sm">
                                Nhập nhu cầu của bạn để bắt đầu tìm kiếm AI.
                            </div>
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
};

export default AiSearchPage;
