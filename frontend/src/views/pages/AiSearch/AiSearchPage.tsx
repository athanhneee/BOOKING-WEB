import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { ArrowRightLeft, Search, Sparkles } from "lucide-react";
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
];

type AiSearchLocationState = {
    initialQuery?: string;
};

const getSessionQuery = () => {
    if (typeof window === "undefined") {
        return "";
    }

    return window.sessionStorage.getItem(LAST_AI_SEARCH_QUERY_KEY) ?? "";
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

    const runSearch = useCallback(async (rawQuery: string) => {
        const nextQuery = rawQuery.trim();

        if (!nextQuery) {
            setError("Nhập nội dung bạn muốn tìm bằng ");
            setItems([]);
            setMode(null);
            setHasSearched(false);
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
            window.sessionStorage.setItem(LAST_AI_SEARCH_QUERY_KEY, nextQuery);
        } catch (searchError) {
            setItems([]);
            setMode(null);
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
        return () => window.removeEventListener("ai-search-submit", handleAiSearchSubmit);
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
                <section className="border-b border-slate-200 pb-8">
                    <span className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-sm font-semibold text-cyan-700">
                        <Sparkles size={16} />
                        Tìm kiếm AI
                    </span>

                    <div className="mt-5 max-w-3xl">
                        <h1 className="text-3xl font-semibold text-slate-950 md:text-4xl">Tìm kiếm AI</h1>

                    </div>

                    <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3 md:flex-row">
                        <div className="relative min-w-0 flex-1">
                            <Search
                                size={18}
                                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                            />
                            <input
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                                maxLength={500}
                                placeholder="Ví dụ: villa gần biển có hồ bơi cho 10 người"
                                className="h-14 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-base text-slate-900 shadow-sm outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-cyan-600 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            <Sparkles size={17} />
                            {isLoading ? "Đang tìm..." : "Tìm AI"}
                        </button>
                    </form>

                    <div className="mt-4 flex flex-wrap gap-2">
                        {suggestionChips.map((chip) => (
                            <button
                                key={chip}
                                type="button"
                                onClick={() => handleChipClick(chip)}
                                className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700"
                            >
                                {chip}
                            </button>
                        ))}
                    </div>
                </section>

                <section className="pt-8">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <div className="flex flex-wrap items-center gap-3">
                                <h2 className="text-xl font-semibold text-slate-950">Kết quả</h2>

                                {mode ? (
                                    <span
                                        className={`rounded-full px-3 py-1 text-xs font-bold ${mode === "semantic"
                                            ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                                            : "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                                            }`}
                                    >
                                        {mode === "semantic" ? "Semantic AI" : "Fallback keyword"}
                                    </span>
                                ) : null}
                            </div>

                            {lastSubmittedQuery ? (
                                <p className="mt-1 text-sm text-slate-500">"{lastSubmittedQuery}"</p>
                            ) : null}
                        </div>

                        <button
                            type="button"
                            onClick={() => navigate(APP_ROUTES.search)}
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-cyan-200 hover:text-cyan-700"
                        >
                            <ArrowRightLeft size={16} />
                            Chuyển sang tìm kiếm thường
                        </button>
                    </div>



                    <div className="mt-6">
                        {isLoading ? (
                            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm font-semibold text-slate-500 shadow-sm">
                                Đang tìm chỗ nghỉ phù hợp...
                            </div>
                        ) : error ? (
                            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center text-sm font-semibold text-rose-700">
                                {error}
                            </div>
                        ) : hasSearched && items.length === 0 ? (
                            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm font-semibold text-slate-500 shadow-sm">
                                Không tìm thấy chỗ nghỉ phù hợp.
                            </div>
                        ) : items.length > 0 ? (
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                {items.map((listing) => (
                                    <ListingCard key={listing.listingId} listing={listing} />
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm font-medium text-slate-500">
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
