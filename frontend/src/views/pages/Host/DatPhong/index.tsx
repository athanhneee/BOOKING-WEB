import { useCallback, useEffect, useMemo, useState } from "react";
import { FiCheckCircle, FiClock, FiRefreshCw, FiXCircle } from "react-icons/fi";
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
                    shouldShowInHostBookings(booking) &&
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

                {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div> : null}

                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    {summary.map((item) => (
                        <article key={item.label} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
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

                <div className="flex flex-wrap gap-2 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
                    {filters.map((item) => (
                        <button key={item.value} type="button" onClick={() => setFilter(item.value)} className={`rounded-2xl px-3 py-2 text-xs font-medium sm:px-4 sm:text-sm ${filter === item.value ? "bg-cyan-50 text-cyan-600" : "text-gray-500 hover:bg-gray-50"}`}>
                            {item.label}
                        </button>
                    ))}
                </div>

                <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
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
                                                                className="flex items-center justify-center gap-1.5 whitespace-nowrap rounded-2xl border border-rose-200 px-4 py-2 text-sm font-medium text-rose-600 shadow-sm transition-all hover:bg-rose-50 active:scale-95 disabled:opacity-50"
                                                            >
                                                                <FiXCircle size={16} /> {cancelLabel}
                                                            </button>
                                                        ) : null}
                                                        {!canConfirm && !canCheckIn && !canCheckOut && !canCancel ? (
                                                            <span className="px-2 py-2 text-sm font-medium text-slate-400 whitespace-nowrap">Không có thao tác</span>
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
        </div>
    );
};

export default DatPhong;
