import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
    FiArrowLeft,
    FiCalendar,
    FiCheckCircle,
    FiHome,
    FiLoader,
    FiMapPin,
    FiTrash2,
    FiUsers,
    FiX,
} from "react-icons/fi";
import { LuShoppingCart } from "react-icons/lu";

import { APP_ROUTES } from "../../../config/routes";
import { clearBookingQueue, readBookingQueueItems, removeBookingQueueItem, type BookingQueueItem } from "../../../features/bookingQueue/bookingQueueStorage";
import { createBulkBookings } from "../../../services/bookingService";
import { createPayment } from "../../../services/paymentService";
import { getCurrentUser } from "../../../store/authStore";
import type { ApiBooking } from "../../../models/entities/Booking";

// ─── helpers ─────────────────────────────────────────────────────────────────

const formatPrice = (price: number, currency = "VND") =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency, maximumFractionDigits: 0 }).format(price);

const formatDate = (iso: string) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const calcNights = (checkIn: string, checkOut: string) => {
    if (!checkIn || !checkOut) return 0;
    const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
    return Math.max(1, Math.round(diff / 86_400_000));
};

type ItemError = {
    itemIndex: number | null;
    title: string;
    message: string;
};

const getBulkItemIndexFromPath = (path?: string) => {
    const match = path?.match(/items(?:\[(\d+)])?(?:\.(\d+))?/);
    const rawIndex = match?.[1] ?? match?.[2];
    const index = rawIndex === undefined ? NaN : Number(rawIndex);

    return Number.isInteger(index) && index >= 0 ? index : null;
};

const getBulkItemErrors = (err: unknown, items: BookingQueueItem[]): ItemError[] => {
    const apiErrors = (err as { errors?: Array<{ path?: string; msg?: string }> })?.errors;

    if (!Array.isArray(apiErrors) || apiErrors.length === 0) {
        return [];
    }

    return apiErrors.map((detail) => {
        const itemIndex = getBulkItemIndexFromPath(detail.path);
        const item = itemIndex === null ? null : items[itemIndex];

        return {
            itemIndex,
            title: item?.title ?? "Một đặt phòng",
            message: detail.msg ?? "Không thể tạo đặt phòng",
        };
    });
};

// ─── The "current" booking passed via navigation state ────────────────────────

type CurrentBookingState = {
    listingId: number;
    title: string;
    imageUrl: string;
    basePrice: number;
    location: string;
    checkIn: string;
    checkOut: string;
    guests: number;
    guestSummary?: string;
    couponCode?: string;
};

// ─── Cart Item Card ───────────────────────────────────────────────────────────

type CartItemCardProps = {
    item: BookingQueueItem;
    isCurrentBooking?: boolean;
    onRemove?: (listingId: string) => void;
};

const CartItemCard = ({ item, isCurrentBooking, onRemove }: CartItemCardProps) => {
    const nights = calcNights(item.checkIn ?? "", item.checkOut ?? "");
    const totalEstimate = nights > 0 ? item.basePrice * nights : item.basePrice;

    return (
        <div
            className={`relative overflow-hidden rounded-2xl border bg-white shadow-sm ${isCurrentBooking
                    ? "border-cyan-400 ring-2 ring-cyan-100"
                    : "border-slate-100"
                }`}
        >
            {isCurrentBooking && (
                <div className="absolute right-3 top-3 rounded-full bg-cyan-600 px-2 py-0.5 text-xs font-semibold text-white">
                    Đặt mới
                </div>
            )}

            <div className="flex gap-4 p-4">
                {/* Image */}
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                    {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center">
                            <FiHome size={24} className="text-slate-300" />
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                    <h3 className="mb-1 line-clamp-1 font-semibold text-slate-900">{item.title}</h3>
                    <div className="mb-1 flex items-center gap-1 text-sm text-slate-500">
                        <FiMapPin size={12} className="text-cyan-600" />
                        <span className="line-clamp-1">{item.location}</span>
                    </div>

                    {item.checkIn && item.checkOut && (
                        <div className="mb-1 flex items-center gap-1 text-sm text-slate-500">
                            <FiCalendar size={12} />
                            <span>
                                {formatDate(item.checkIn)} → {formatDate(item.checkOut)}
                            </span>
                            <span className="text-slate-400">({nights} đêm)</span>
                        </div>
                    )}

                    {item.guests && (
                        <div className="flex items-center gap-1 text-sm text-slate-500">
                            <FiUsers size={12} />
                            <span>{item.guestSummary ?? `${item.guests} khách`}</span>
                        </div>
                    )}
                </div>

                {/* Remove button (only for queue items, not current booking) */}
                {!isCurrentBooking && onRemove && (
                    <button
                        type="button"
                        onClick={() => onRemove(item.listingId)}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
                        aria-label="Xóa khỏi giỏ"
                    >
                        <FiTrash2 size={15} />
                    </button>
                )}
            </div>

            {/* Price row */}
            <div className="border-t border-slate-50 bg-slate-50/60 px-4 py-2.5 flex items-center justify-between">
                <span className="text-sm text-slate-500">
                    {nights > 0
                        ? `${formatPrice(item.basePrice)} × ${nights} đêm`
                        : `${formatPrice(item.basePrice)}/đêm`}
                </span>
                <span className="font-bold text-slate-900">{formatPrice(totalEstimate)}</span>
            </div>
        </div>
    );
};

// ─── Booking Result Card ──────────────────────────────────────────────────────

type BookingResultCard = {
    booking: ApiBooking;
    title: string;
    imageUrl: string;
    onPay: (bookingId: number) => void;
    isPaying: boolean;
    isPaid: boolean;
};

const BookingResultCard = ({ booking, title, imageUrl, onPay, isPaying, isPaid }: BookingResultCard) => (
    <div className={`flex items-center gap-4 rounded-2xl border p-4 ${isPaid ? "border-emerald-200 bg-emerald-50" : "border-slate-100 bg-white"}`}>
        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-slate-100">
            {imageUrl ? (
                <img src={imageUrl} alt={title} className="h-full w-full object-cover" />
            ) : (
                <div className="flex h-full w-full items-center justify-center">
                    <FiHome size={20} className="text-slate-300" />
                </div>
            )}
        </div>
        <div className="min-w-0 flex-1">
            <p className="line-clamp-1 font-semibold text-slate-900">{title}</p>
            <p className="text-sm text-slate-500">#{booking.bookingId} · {formatPrice(Number(booking.totalAmount))}</p>
        </div>
        {isPaid ? (
            <div className="flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white">
                <FiCheckCircle size={13} />
                Đang thanh toán
            </div>
        ) : (
            <button
                type="button"
                onClick={() => onPay(booking.bookingId)}
                disabled={isPaying}
                className="flex items-center gap-1.5 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-cyan-600 disabled:opacity-50"
            >
                {isPaying ? <FiLoader size={14} className="animate-spin" /> : null}
                Thanh toán
            </button>
        )}
    </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

type Phase = "review" | "creating" | "payment";

const MultiBookingPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const currentUser = getCurrentUser();

    // Current booking passed from ListingDetailPage via navigate state
    const currentBookingState = location.state as CurrentBookingState | null;

    const [queueItems, setQueueItems] = useState<BookingQueueItem[]>(() =>
        readBookingQueueItems().filter((i) => i.listingId !== String(currentBookingState?.listingId)),
    );
    const [phase, setPhase] = useState<Phase>("review");
    const [createdBookings, setCreatedBookings] = useState<Array<{ booking: ApiBooking; item: BookingQueueItem | CurrentBookingState }>>([]);
    const [payingBookingId, setPayingBookingId] = useState<number | null>(null);
    const [paidBookingIds, setPaidBookingIds] = useState<Set<number>>(new Set());
    const [error, setError] = useState<string | null>(null);
    const [itemErrors, setItemErrors] = useState<ItemError[]>([]);

    // Redirect if not logged in
    useEffect(() => {
        if (!currentUser) {
            navigate(APP_ROUTES.login + "?redirectTo=" + encodeURIComponent(APP_ROUTES.multiBooking));
        }
    }, [currentUser, navigate]);

    // Redirect if no current booking
    useEffect(() => {
        if (!currentBookingState) {
            navigate(-1);
        }
    }, [currentBookingState, navigate]);

    const allItems = useMemo(() => {
        if (!currentBookingState) return queueItems;
        const currentAsQueueItem: BookingQueueItem = {
            listingId: String(currentBookingState.listingId),
            title: currentBookingState.title,
            imageUrl: currentBookingState.imageUrl,
            basePrice: currentBookingState.basePrice,
            location: currentBookingState.location,
            checkIn: currentBookingState.checkIn,
            checkOut: currentBookingState.checkOut,
            guests: currentBookingState.guests,
            guestSummary: currentBookingState.guestSummary,
        };
        return [currentAsQueueItem, ...queueItems];
    }, [currentBookingState, queueItems]);

    const totalEstimate = useMemo(() =>
        allItems.reduce((sum, item) => {
            const nights = calcNights(item.checkIn ?? "", item.checkOut ?? "");
            return sum + (nights > 0 ? item.basePrice * nights : item.basePrice);
        }, 0),
        [allItems],
    );

    const handleRemoveQueueItem = useCallback((listingId: string) => {
        removeBookingQueueItem(listingId);
        setQueueItems((prev) => prev.filter((i) => i.listingId !== listingId));
    }, []);

    const handleConfirm = async () => {
        if (!currentBookingState) return;
        setError(null);
        setItemErrors([]);
        setPhase("creating");

        const itemsToBook = allItems;

        const missingItems = itemsToBook
            .map((item, index) => ({ item, index }))
            .filter(({ item }) => !item.checkIn || !item.checkOut || !item.guests);

        if (missingItems.length > 0) {
            setError("Một số đặt phòng thiếu ngày hoặc số khách.");
            setItemErrors(missingItems.map(({ item, index }) => ({
                itemIndex: index,
                title: item.title,
                message: "Vui lòng quay lại và chọn đủ ngày, số khách.",
            })));
            setPhase("review");
            return;
        }

        try {
            const response = await createBulkBookings({
                items: itemsToBook.map((item) => {
                    const isCurrentBooking = item.listingId === String(currentBookingState.listingId);
                    const couponCode = isCurrentBooking ? currentBookingState.couponCode : undefined;

                    return {
                        listingId: Number(item.listingId),
                        checkIn: item.checkIn!,
                        checkOut: item.checkOut!,
                        guests: item.guests!,
                        couponCode,
                    };
                }),
            });
            const results = response.items.map((booking, index) => ({
                booking,
                item: itemsToBook[index],
            }));

            clearBookingQueue();
            setQueueItems([]);
            setCreatedBookings(results);
            setPhase("payment");
        } catch (err: unknown) {
            const bulkErrors = getBulkItemErrors(err, itemsToBook);
            const msg = (err as { message?: string })?.message ?? "Đặt phòng thất bại";

            setError(bulkErrors.length > 0 ? "Không thể tạo nhóm đặt phòng." : msg);
            setItemErrors(bulkErrors);
            setPhase("review");
        }
    };

    const handlePay = async (bookingId: number) => {
        setPayingBookingId(bookingId);
        try {
            const payment = await createPayment({ bookingId, method: "vnpay" });
            setPaidBookingIds((prev) => new Set([...prev, bookingId]));

            if (payment.paymentUrl) {
                window.location.href = payment.paymentUrl;
            }
        } catch (err: unknown) {
            const msg = (err as { message?: string })?.message ?? "Lỗi thanh toán";
            setError(`Thanh toán booking #${bookingId} thất bại: ${msg}`);
        } finally {
            setPayingBookingId(null);
        }
    };

    if (!currentBookingState) return null;

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <div className="border-b border-slate-100 bg-white">
                <div className="container mx-auto max-w-3xl px-4 py-5 md:px-6">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="mb-4 flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-slate-700"
                    >
                        <FiArrowLeft size={16} />
                        Quay lại
                    </button>

                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-100">
                            <LuShoppingCart size={22} className="text-cyan-600" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900">
                                {phase === "payment" ? "Xác nhận thanh toán" : "Xác nhận đặt phòng"}
                            </h1>
                            <p className="text-sm text-slate-500">
                                {allItems.length} căn · Tổng ước tính {formatPrice(totalEstimate)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto max-w-3xl px-4 py-6 md:px-6">
                {error && (
                    <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        <FiX size={16} className="mt-0.5 shrink-0" />
                        <div className="min-w-0">
                            <div>{error}</div>
                            {itemErrors.length > 0 && (
                                <ul className="mt-2 space-y-1">
                                    {itemErrors.map((itemError, index) => (
                                        <li key={`${itemError.itemIndex ?? "all"}-${index}`}>
                                            <span className="font-semibold">{itemError.title}:</span>{" "}
                                            {itemError.message}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                )}

                {/* ── REVIEW PHASE ── */}
                {phase === "review" && (
                    <>
                        <div className="mb-4 space-y-3">
                            {/* Current booking (top) */}
                            <CartItemCard
                                item={{
                                    listingId: String(currentBookingState.listingId),
                                    title: currentBookingState.title,
                                    imageUrl: currentBookingState.imageUrl,
                                    basePrice: currentBookingState.basePrice,
                                    location: currentBookingState.location,
                                    checkIn: currentBookingState.checkIn,
                                    checkOut: currentBookingState.checkOut,
                                    guests: currentBookingState.guests,
                                    guestSummary: currentBookingState.guestSummary,
                                }}
                                isCurrentBooking
                            />

                            {/* Queue items */}
                            {queueItems.map((item) => (
                                <CartItemCard
                                    key={item.listingId}
                                    item={item}
                                    onRemove={handleRemoveQueueItem}
                                />
                            ))}
                        </div>

                        {/* Total summary */}
                        <div className="mb-6 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                            <div className="mb-3 flex items-center justify-between text-sm text-slate-600">
                                <span>Số lượng căn</span>
                                <span className="font-medium">{allItems.length} căn</span>
                            </div>
                            <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                                <span className="font-semibold text-slate-900">Tổng ước tính</span>
                                <span className="text-xl font-bold text-slate-900">{formatPrice(totalEstimate)}</span>
                            </div>
                            <p className="mt-2 text-xs text-slate-400">
                                * Giá trên là ước tính, chưa bao gồm phí dọn phòng và phí dịch vụ.
                                Giá chính xác sẽ hiển thị trong trang thanh toán từng căn.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={handleConfirm}
                            className="w-full rounded-2xl bg-gradient-to-r from-cyan-600 to-cyan-600 py-4 text-base font-bold text-white shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
                        >
                            Xác nhận & Tạo {allItems.length} đặt phòng
                        </button>
                    </>
                )}

                {/* ── CREATING PHASE ── */}
                {phase === "creating" && (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-cyan-50">
                            <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-600 border-t-transparent"></div>
                        </div>
                        <h2 className="mb-2 text-xl font-bold text-slate-900">Đang tạo đặt phòng...</h2>
                        <p className="text-slate-500">Vui lòng không đóng trang này</p>
                    </div>
                )}

                {/* ── PAYMENT PHASE ── */}
                {phase === "payment" && (
                    <>
                        <div className="mb-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                            <FiCheckCircle size={16} />
                            Đã tạo {createdBookings.length} đặt phòng thành công! Tiến hành thanh toán từng căn.
                        </div>

                        <div className="mb-6 space-y-3">
                            {createdBookings.map(({ booking, item }) => (
                                <BookingResultCard
                                    key={booking.bookingId}
                                    booking={booking}
                                    title={item.title}
                                    imageUrl={item.imageUrl}
                                    onPay={handlePay}
                                    isPaying={payingBookingId === booking.bookingId}
                                    isPaid={paidBookingIds.has(booking.bookingId)}
                                />
                            ))}
                        </div>

                        <Link
                            to={APP_ROUTES.accountTrips}
                            className="block w-full rounded-2xl border border-slate-200 bg-white py-3.5 text-center text-sm font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50"
                        >
                            Xem chuyến đi của tôi
                        </Link>
                    </>
                )}
            </div>
        </div>
    );
};

export default MultiBookingPage;
