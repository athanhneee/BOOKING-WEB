import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FiCheckCircle, FiClock, FiExternalLink, FiEye, FiRefreshCw, FiX, FiXCircle } from "react-icons/fi";
import { APP_ROUTES } from "../../../../config/routes";
import type { ApiBooking } from "../../../../models/entities/Booking";
import {
    cancelHostBooking,
    checkInHostBooking,
    checkOutHostBooking,
    confirmHostBooking,
    getHostBookings,
} from "../../../../services/hostService";
import {
    bookingMatchesDisplayStatus,
    bookingStatusToneClassNames,
    getBookingDisplayStatus,
    getBookingStatusActions,
} from "../../../../utils/bookingStatus";
import { PageHeader } from "../shared";
import { formatCurrency, formatDate, pageWrapperClass, primaryButtonClass, reloadButtonClass, secondaryButtonClass, tableClassName } from "../sharedStyles";

type BookingFilter =
    | "all"
    | "pending_payment"
    | "payment_expired"
    | "paid"
    | "confirmed"
    | "checked_in"
    | "checked_out"
    | "completed"
    | "cancelled";

const filters: Array<{ label: string; value: BookingFilter }> = [
    { label: "Tất cả", value: "all" },
    { label: "Chờ thanh toán", value: "pending_payment" },
    { label: "Quá hạn thanh toán", value: "payment_expired" },
    { label: "Thanh toán thành công", value: "paid" },
    { label: "Đã xác nhận", value: "confirmed" },
    { label: "Đã nhận phòng", value: "checked_in" },
    { label: "Đã trả phòng", value: "checked_out" },
    { label: "Hoàn tất", value: "completed" },
    { label: "Đã hủy", value: "cancelled" },
];

const getBookingAmount = (booking: ApiBooking) => Number(booking.totalAmount || booking.totalPrice || 0);
const hostRejectedReason = "HOST_REJECTED";
const shouldShowInHostBookings = () => true;

const DatPhong = () => {
    const [filter, setFilter] = useState<BookingFilter>("all");
    const [bookings, setBookings] = useState<ApiBooking[]>([]);
    const [summaryBookings, setSummaryBookings] = useState<ApiBooking[]>([]);
    const [statusNow, setStatusNow] = useState(() => new Date());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [actionId, setActionId] = useState<number | null>(null);
    const [detailBooking, setDetailBooking] = useState<ApiBooking | null>(null);

    const fetchBookings = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const result = await getHostBookings({ status: "all", page: 1, limit: 100 });

            setSummaryBookings(result.items ?? []);
            setBookings(result.items ?? []);
        } catch (fetchError) {
            setError(fetchError instanceof Error ? fetchError.message : "Không thể tải danh sách đặt phòng.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void fetchBookings();
    }, [fetchBookings]);

    useEffect(() => {
        const timer = window.setInterval(() => setStatusNow(new Date()), 60_000);
        return () => window.clearInterval(timer);
    }, []);

    const visibleBookings = useMemo(
        () =>
            bookings.filter(
                (booking) =>
                    shouldShowInHostBookings() &&
                    bookingMatchesDisplayStatus(booking, filter, { role: "host", now: statusNow }),
            ),
        [bookings, filter, statusNow],
    );
    const summaryVisibleBookings = useMemo(() => summaryBookings.filter(shouldShowInHostBookings), [summaryBookings]);

    const summary = useMemo(() => {
        const displayStatuses = summaryVisibleBookings.map((booking) => getBookingDisplayStatus(booking, { role: "host", now: statusNow }).normalizedStatus);
        const revenueStatuses = new Set(["paid", "confirmed", "checked_in", "checked_out", "completed", "payout_pending", "payout_paid"]);
        const totalRevenue = summaryVisibleBookings
            .filter((_booking, index) => revenueStatuses.has(displayStatuses[index]))
            .reduce((sum, booking) => sum + getBookingAmount(booking), 0);

        return [
            { label: "Tổng đơn", value: String(summaryVisibleBookings.length), icon: <FiClock /> },
            { label: "Chờ thanh toán", value: String(displayStatuses.filter((status) => status === "pending_payment").length), icon: <FiClock /> },
            { label: "Quá hạn thanh toán", value: String(displayStatuses.filter((status) => status === "payment_expired").length), icon: <FiXCircle /> },
            { label: "Doanh thu dự kiến", value: formatCurrency(totalRevenue), icon: <FiCheckCircle /> },
        ];
    }, [summaryVisibleBookings, statusNow]);

    const runAction = async (bookingId: number, action: () => Promise<unknown>) => {
        setActionId(bookingId);
        setError("");

        try {
            await action();
            await fetchBookings();
        } catch (actionError) {
            setError(actionError instanceof Error ? actionError.message : "Không thể cập nhật booking.");
        } finally {
            setActionId(null);
        }
    };

    return (
        <div className={pageWrapperClass}>
            <div className="mx-auto max-w-7xl space-y-6">
                <PageHeader
                    title="Đặt phòng"
                    subtitle="Danh sách booking của các chỗ nghỉ bạn quản lý."
                    actions={
                        <button
                            type="button"
                            onClick={fetchBookings}
                            className={reloadButtonClass}
                        >
                            <FiRefreshCw className="shrink-0" />
                            Tải lại
                        </button>
                    }
                />

                {error ? <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div> : null}

                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    {summary.map((item) => (
                        <article key={item.label} className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-sm text-gray-500">{item.label}</p>
                                    <p className="mt-2 text-2xl font-bold text-gray-900">{item.value}</p>
                                </div>
                                <span className="rounded-full bg-cyan-50 p-3 text-cyan-600">{item.icon}</span>
                            </div>
                        </article>
                    ))}
                </div>

                <div className="flex flex-wrap gap-2 rounded-3xl border border-gray-100 bg-white p-3 shadow-sm">
                    {filters.map((item) => (
                        <button key={item.value} type="button" onClick={() => setFilter(item.value)} className={`rounded-3xl px-3 py-2 text-xs font-medium sm:px-4 sm:text-sm ${filter === item.value ? "bg-cyan-50 text-cyan-600" : "text-gray-500 hover:bg-gray-50"}`}>
                            {item.label}
                        </button>
                    ))}
                </div>

                <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className={`${tableClassName} text-left text-sm`}>
                            <thead className="bg-gray-50 text-gray-500">
                                <tr>
                                    <th className="px-4 py-3 font-medium">Booking</th>
                                    <th className="px-4 py-3 font-medium">Chỗ nghỉ</th>
                                    <th className="px-4 py-3 font-medium">Ngày</th>
                                    <th className="px-4 py-3 font-medium">Khách</th>
                                    <th className="px-4 py-3 font-medium">Tổng tiền</th>
                                    <th className="px-4 py-3 font-medium">Trạng thái</th>
                                    <th className="px-4 py-3 font-medium">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-10">
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="mb-3 h-6 w-6 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent"></div>
                                                <span className="text-sm font-medium text-slate-500">Đang tải booking...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : visibleBookings.length === 0 ? (
                                    <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-500">Chưa có booking phù hợp.</td></tr>
                                ) : (
                                    visibleBookings.map((booking) => {
                                        const isBusy = actionId === booking.bookingId;
                                        const displayStatus = getBookingDisplayStatus(booking, { role: "host", now: statusNow });
                                        const actions = getBookingStatusActions(booking, { role: "host", today: statusNow });
                                        const canConfirm = actions.canConfirm;
                                        const canCheckIn = actions.canCheckIn;
                                        const canCheckOut = actions.canCheckOut;
                                        const canCancel = actions.canCancel;
                                        const cancelLabel = displayStatus.normalizedStatus === "paid"
                                            ? "Từ chối"
                                            : "Hủy";

                                        return (
                                            <tr key={booking.bookingId}>
                                                <td className="px-4 py-4 font-semibold text-gray-900">#{booking.bookingId}</td>
                                                <td className="px-4 py-4 text-gray-600">{booking.listing?.title ?? booking.listingTitle ?? `Listing #${booking.listingId}`}</td>
                                                <td className="px-4 py-4 text-gray-600">{formatDate(booking.checkInDate)} - {formatDate(booking.checkOutDate)}</td>
                                                <td className="px-4 py-4 text-gray-600">{booking.guests ?? booking.guestCount ?? booking.guestsCount} khách</td>
                                                <td className="px-4 py-4 text-gray-600">{formatCurrency(getBookingAmount(booking))}</td>
                                                <td className="px-4 py-4">
                                                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${bookingStatusToneClassNames[displayStatus.tone]}`}>
                                                        {displayStatus.label}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 text-right">
                                                    <div className="flex flex-wrap items-center justify-end gap-2">
                                                        <button type="button" onClick={() => setDetailBooking(booking)} className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-3xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition-all hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700 active:scale-95">
                                                            <FiEye size={15} /> Chi tiết
                                                        </button>
                                                        {canConfirm ? <button disabled={isBusy} type="button" onClick={() => runAction(booking.bookingId, () => confirmHostBooking(booking.bookingId))} className={`${primaryButtonClass} whitespace-nowrap`}>Xác nhận</button> : null}
                                                        {canCheckIn ? <button disabled={isBusy} type="button" onClick={() => runAction(booking.bookingId, () => checkInHostBooking(booking.bookingId))} className={`${secondaryButtonClass} whitespace-nowrap`}>Check-in</button> : null}
                                                        {canCheckOut ? <button disabled={isBusy} type="button" onClick={() => runAction(booking.bookingId, () => checkOutHostBooking(booking.bookingId))} className={`${secondaryButtonClass} whitespace-nowrap`}>Check-out</button> : null}
                                                        {canCancel ? (
                                                            <button
                                                                disabled={isBusy}
                                                                type="button"
                                                                onClick={() => {
                                                                    const note = window.prompt(`Lý do ${cancelLabel.toLowerCase()} booking?`, hostRejectedReason) || hostRejectedReason;
                                                                    void runAction(booking.bookingId, () => cancelHostBooking(booking.bookingId, note));
                                                                }}
                                                                className="flex items-center justify-center gap-1.5 whitespace-nowrap rounded-3xl border border-rose-200 px-4 py-2 text-sm font-medium text-rose-600 shadow-sm transition-all hover:bg-rose-50 active:scale-95 disabled:opacity-50"
                                                            >
                                                                <FiXCircle size={16} /> {cancelLabel}
                                                            </button>
                                                        ) : null}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {detailBooking ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 sm:p-4" onClick={() => setDetailBooking(null)}>
                    <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-5 shadow-xl sm:p-6" onClick={(event) => event.stopPropagation()}>
                        {(() => {
                            const detailStatus = getBookingDisplayStatus(detailBooking, { role: "host", now: statusNow });
                            const nights = detailBooking.nights ?? detailBooking.totalNights ?? detailBooking.priceBreakdown?.totalNights ?? 0;
                            const guestCount = detailBooking.guests ?? detailBooking.guestCount ?? detailBooking.guestsCount ?? 1;
                            const surcharge = detailBooking.priceBreakdown?.surchargeAmount ?? 0;
                            const extraGuestFee = detailBooking.extraGuestFeeAmount ?? detailBooking.priceBreakdown?.extraGuestFeeAmount ?? 0;
                            const rows: Array<{ label: string; value: number; muted?: boolean }> = [
                                { label: "Tạm tính", value: detailBooking.subtotalAmount ?? 0 },
                                { label: "Phí dọn dẹp", value: detailBooking.cleaningFeeAmount ?? 0 },
                                { label: "Phụ thu", value: surcharge },
                                { label: "Phụ phí khách thêm", value: extraGuestFee },
                                { label: "Phí dịch vụ", value: detailBooking.serviceFeeAmount ?? 0 },
                                { label: "Giảm giá", value: -(detailBooking.discountAmount ?? 0), muted: true },
                            ];

                            return (
                                <>
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-900">Chi tiết đặt phòng #{detailBooking.bookingId}</h2>
                                            <span className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${bookingStatusToneClassNames[detailStatus.tone]}`}>
                                                {detailStatus.label}
                                            </span>
                                        </div>
                                        <button type="button" onClick={() => setDetailBooking(null)} aria-label="Đóng" className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-800">
                                            <FiX size={18} />
                                        </button>
                                    </div>

                                    <div className="mt-5 rounded-3xl border border-slate-100 bg-slate-50/60 p-4">
                                        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Chỗ nghỉ</p>
                                        <p className="mt-1 font-semibold text-gray-900">{detailBooking.listing?.title ?? detailBooking.listingTitle ?? `Listing #${detailBooking.listingId}`}</p>
                                        {detailBooking.listing ? (
                                            <p className="mt-0.5 text-sm text-gray-500">
                                                {[detailBooking.listing.addressLine, detailBooking.listing.district, detailBooking.listing.city].filter(Boolean).join(", ")}
                                            </p>
                                        ) : null}
                                        <Link
                                            to={APP_ROUTES.villaDetail(String(detailBooking.listingId))}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-cyan-600 hover:text-cyan-700 hover:underline"
                                        >
                                            Xem trang chỗ nghỉ <FiExternalLink size={13} />
                                        </Link>
                                    </div>

                                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                                        {[
                                            { label: "Nhận phòng", value: formatDate(detailBooking.checkInDate) },
                                            { label: "Trả phòng", value: formatDate(detailBooking.checkOutDate) },
                                            { label: "Số đêm", value: `${nights} đêm` },
                                            { label: "Số khách", value: `${guestCount} khách` },
                                        ].map((item) => (
                                            <div key={item.label} className="rounded-2xl border border-slate-100 bg-white p-3">
                                                <p className="text-xs text-slate-500">{item.label}</p>
                                                <p className="mt-1 text-sm font-semibold text-gray-900">{item.value}</p>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-4 space-y-2 rounded-3xl border border-slate-100 p-4">
                                        {rows
                                            .filter((row) => row.value !== 0)
                                            .map((row) => (
                                                <div key={row.label} className="flex items-center justify-between text-sm">
                                                    <span className="text-slate-500">{row.label}</span>
                                                    <span className={`font-medium ${row.muted ? "text-emerald-600" : "text-gray-800"}`}>{formatCurrency(row.value)}</span>
                                                </div>
                                            ))}
                                        <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-base font-bold text-gray-900">
                                            <span>Tổng cộng</span>
                                            <span className="text-cyan-600">{formatCurrency(getBookingAmount(detailBooking))}</span>
                                        </div>
                                    </div>

                                    {detailBooking.bookingNote ? (
                                        <div className="mt-4 rounded-3xl border border-slate-100 bg-slate-50/60 p-4">
                                            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Ghi chú của khách</p>
                                            <p className="mt-1 text-sm text-gray-700">{detailBooking.bookingNote}</p>
                                        </div>
                                    ) : null}

                                    <p className="mt-4 text-right text-xs text-slate-400">Đặt lúc {formatDate(detailBooking.createdAt)}</p>
                                </>
                            );
                        })()}
                    </div>
                </div>
            ) : null}
        </div>
    );
};

export default DatPhong;
