import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiMapPin, FiUsers, FiHome, FiArrowLeft, FiAlertCircle } from "react-icons/fi";
import { LuHeart, LuHeartOff, LuSparkles } from "react-icons/lu";

import { APP_ROUTES } from "../../../config/routes";
import { getWishlist, removeWishlistListing, type WishlistItem } from "../../../services/wishlistService";
import { getCurrentUser } from "../../../store/authStore";


const formatPrice = (price: number, currency = "VND") =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency, maximumFractionDigits: 0 }).format(price);

const getPropertyTypeLabel = (type: string) => {
    const map: Record<string, string> = {
        villa: "Villa",
        apartment: "Căn hộ",
        hotel: "Khách sạn",
        homestay: "Homestay",
    };
    return map[type] ?? type;
};

const SkeletonCard = () => (
    <div className="animate-pulse overflow-hidden rounded-2xl bg-white shadow-[0_2px_12px_-4px_rgba(15,23,42,0.08)]">
        <div className="h-52 bg-slate-200" />
        <div className="p-4 space-y-3">
            <div className="h-5 w-3/4 rounded-lg bg-slate-200" />
            <div className="h-4 w-1/2 rounded-lg bg-slate-200" />
            <div className="h-4 w-2/3 rounded-lg bg-slate-200" />
            <div className="flex justify-between pt-2">
                <div className="h-6 w-24 rounded-lg bg-slate-200" />
                <div className="h-9 w-28 rounded-xl bg-slate-200" />
            </div>
        </div>
    </div>
);

const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-rose-50">
            <LuHeart size={40} className="text-rose-400" />
        </div>
        <h2 className="mb-2 text-2xl font-bold text-slate-900">Chưa có nơi yêu thích</h2>
        <p className="mb-8 max-w-sm text-slate-500">
            Nhấn vào trái tim ❤️ trên bất kỳ căn nào để lưu vào danh sách yêu thích của bạn.
        </p>
        <Link
            to={APP_ROUTES.search}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-700 px-6 py-3 font-semibold text-white shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg"
        >
            <LuSparkles size={18} />
            Khám phá nơi lưu trú
        </Link>
    </div>
);

type WishlistCardProps = {
    item: WishlistItem;
    onRemove: (listingId: number) => void;
    isRemoving: boolean;
};

const WishlistCard = ({ item, onRemove, isRemoving }: WishlistCardProps) => {
    const listing = item.listing;
    if (!listing) return null;

    const location = [listing.district, listing.city].filter(Boolean).join(", ");
    const imageUrl = listing.coverImage?.url ?? listing.images?.[0]?.url ?? listing.imageUrl ?? "";

    return (
        <div
            className={`group relative overflow-hidden rounded-2xl bg-white shadow-[0_2px_12px_-4px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_24px_-8px_rgba(15,23,42,0.15)] ${
                isRemoving ? "opacity-50 scale-95" : ""
            }`}
        >
            {/* Remove button */}
            <button
                type="button"
                onClick={() => onRemove(item.listingId)}
                disabled={isRemoving}
                aria-label="Xóa khỏi yêu thích"
                className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur-sm transition-all hover:scale-110 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
            >
                {isRemoving ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-rose-400 border-t-transparent" />
                ) : (
                    <LuHeartOff size={16} className="text-rose-500" />
                )}
            </button>

            {/* Image */}
            <Link to={APP_ROUTES.villaDetail(String(item.listingId))} className="block">
                <div className="relative h-52 overflow-hidden bg-slate-100">
                    {imageUrl ? (
                        <img
                            src={imageUrl}
                            alt={listing.title}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                    ) : (
                        <div className="flex h-full items-center justify-center">
                            <FiHome size={40} className="text-slate-300" />
                        </div>
                    )}
                    <div className="absolute bottom-2 left-2 rounded-full bg-white/90 px-2 py-0.5 text-xs font-medium text-slate-700 backdrop-blur-sm">
                        {getPropertyTypeLabel(listing.propertyType)}
                    </div>
                </div>
            </Link>

            {/* Content */}
            <div className="p-4">
                <Link to={APP_ROUTES.villaDetail(String(item.listingId))}>
                    <h3 className="mb-1 line-clamp-1 text-base font-semibold text-slate-900 transition-colors hover:text-cyan-700">
                        {listing.title}
                    </h3>
                </Link>

                <div className="mb-2 flex items-center gap-1 text-sm text-slate-500">
                    <FiMapPin size={13} className="shrink-0 text-cyan-600" />
                    <span className="line-clamp-1">{location}</span>
                </div>

                <div className="mb-3 flex items-center gap-3 text-sm text-slate-500">
                    <span className="flex items-center gap-1">
                        <FiUsers size={13} />
                        {listing.maxGuests} khách
                    </span>
                    <span>·</span>
                    <span>{listing.bedrooms} phòng ngủ</span>
                    <span>·</span>
                    <span>{listing.bathrooms} WC</span>
                </div>

                <div className="flex items-center justify-between">
                    <div>
                        <span className="text-lg font-bold text-slate-900">
                            {formatPrice(listing.basePrice, listing.currency)}
                        </span>
                        <span className="text-sm text-slate-500"> /đêm</span>
                    </div>
                    <Link
                        to={APP_ROUTES.villaDetail(String(item.listingId))}
                        className="rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                    >
                        Xem chi tiết
                    </Link>
                </div>
            </div>
        </div>
    );
};

const WishlistPage = () => {
    const navigate = useNavigate();
    const currentUser = getCurrentUser();
    const currentUserId = currentUser?.id ?? null;
    const [items, setItems] = useState<WishlistItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [removingIds, setRemovingIds] = useState<Set<number>>(new Set());
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);

    useEffect(() => {
        if (!currentUserId) {
            navigate(APP_ROUTES.login + "?redirectTo=" + encodeURIComponent(APP_ROUTES.accountWishlist));
            return;
        }

        const fetchWishlist = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const result = await getWishlist();
                setItems(result.items.filter((item) => item.listing !== null));
                if (result.invalidListingIds?.length > 0) {
                    setNotice("Một số nơi lưu trú đã lưu hiện không còn khả dụng và đã được loại khỏi danh sách.");
                }
            } catch {
                setError("Không thể tải danh sách yêu thích. Vui lòng thử lại.");
            } finally {
                setIsLoading(false);
            }
        };

        void fetchWishlist();
    }, [currentUserId, navigate]);

    const handleRemove = useCallback(async (listingId: number) => {
        setRemovingIds((prev) => new Set([...prev, listingId]));
        try {
            await removeWishlistListing(listingId);
            setItems((prev) => prev.filter((item) => item.listingId !== listingId));
        } catch {
            // silent fail — item stays visible
        } finally {
            setRemovingIds((prev) => {
                const next = new Set(prev);
                next.delete(listingId);
                return next;
            });
        }
    }, []);

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <div className="bg-white border-b border-slate-100">
                <div className="container mx-auto max-w-6xl px-4 py-6 md:px-6">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="mb-4 flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-slate-700"
                    >
                        <FiArrowLeft size={16} />
                        Quay lại
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-100">
                            <LuHeart size={22} className="text-rose-500" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">Danh sách yêu thích</h1>
                            {!isLoading && (
                                <p className="text-sm text-slate-500">
                                    {items.length > 0
                                        ? `${items.length} nơi lưu trú đã lưu`
                                        : "Chưa có nơi nào được lưu"}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="container mx-auto max-w-6xl px-4 py-8 md:px-6">
                {error && (
                    <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                    </div>
                )}
                
                {notice && (
                    <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 flex items-center gap-2">
                        <FiAlertCircle className="shrink-0" size={16} />
                        {notice}
                    </div>
                )}

                {isLoading ? (
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <SkeletonCard key={i} />
                        ))}
                    </div>
                ) : items.length === 0 ? (
                    <EmptyState />
                ) : (
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {items.map((item) => (
                            <WishlistCard
                                key={item.wishlistId}
                                item={item}
                                onRemove={handleRemove}
                                isRemoving={removingIds.has(item.listingId)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default WishlistPage;
