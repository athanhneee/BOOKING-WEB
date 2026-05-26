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
    bookingStatusToneClassNames,
    canShowBookingCheckIn,
    canShowBookingCheckOut,
    canShowBookingConfirm,
    canShowHostBookingCancel,
    getBookingDisplayStatus,
} from "../../../../utils/bookingStatus";
import { PageHeader } from "../shared";
import { formatCurrency, formatDate, pageWrapperClass, primaryButtonClass, secondaryButtonClass, tableClassName } from "../sharedStyles";

type BookingFilter =
    | "all"
    | "pending_payment"
    | "pending_host"
    | "paid"
    | "confirmed"
    | "checked_in"
    | "completed"
    | "cancelled"
    | "expired";

const filters: Array<{ label: string; value: BookingFilter }> = [
    { label: "Tất cả", value: "all" },
    { label: "Chờ thanh toán", value: "pending_payment" },
    { label: "Chờ host xác nhận", value: "pending_host" },
    { label: "Thanh toán thành công", value: "paid" },
    { label: "Đã xác nhận", value: "confirmed" },
    { label: "Đang lưu trú", value: "checked_in" },
    { label: "Hoàn tất", value: "completed" },
    { label: "Quá hạn", value: "expired" },
    { label: "Đã hủy", value: "cancelled" },
];

const getBookingAmount = (booking: ApiBooking) => Number(booking.totalAmount || booking.totalPrice || 0);

const DatPhong = () => {
    const [filter, setFilter] = useState<BookingFilter>("all");
    const [bookings, setBookings] = useState<ApiBooking[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [actionId, setActionId] = useState<number | null>(null);

    const fetchBookings = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const result = await getHostBookings({ status: filter, page: 1, limit: 100 });
            setBookings(result.items ?? []);
        } catch (fetchError) {
            setError(fetchError instanceof Error ? fetchError.message : "Không thể tải danh sách đặt phòng.");
        } finally {
            setLoading(false);
        }
    }, [filter]);

    useEffect(() => {
        void fetchBookings();
    }, [fetchBookings]);

    const summary = useMemo(() => {
        const displayStatuses = bookings.map((booking) => getBookingDisplayStatus(booking).normalizedStatus);
        const totalRevenue = bookings
            .filter((_booking, index) => ["paid", "confirmed", "checked_in", "completed"].includes(displayStatuses[index]))
            .reduce((sum, booking) => sum + getBookingAmount(booking), 0);

        return [
            { label: "Tổng đơn", value: String(bookings.length), icon: <FiClock /> },
            { label: "Chờ thanh toán", value: String(displayStatuses.filter((status) => status === "pending_payment").length), icon: <FiClock /> },
            { label: "Thanh toán thành công", value: String(displayStatuses.filter((status) => status === "paid").length), icon: <FiCheckCircle /> },
            { label: "Doanh thu dự kiến", value: formatCurrency(totalRevenue), icon: <FiCheckCircle /> },
        ];
    }, [bookings]);

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
                    actions={<button type="button" onClick={fetchBookings} className={secondaryButtonClass}><FiRefreshCw className="mr-2 inline" />Tải lại</button>}
                />

                {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div> : null}

                <div className="grid gap-4 md:grid-cols-4">
                    {summary.map((item) => (
                        <article key={item.label} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-sm text-gray-500">{item.label}</p>
                                    <p className="mt-2 text-2xl font-bold text-gray-900">{item.value}</p>
                                </div>
                                <span className="rounded-full bg-cyan-50 p-3 text-cyan-700">{item.icon}</span>
                            </div>
                        </article>
                    ))}
                </div>

                <div className="flex flex-wrap gap-2 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
                    {filters.map((item) => (
                        <button key={item.value} type="button" onClick={() => setFilter(item.value)} className={`rounded-xl px-4 py-2 text-sm font-medium ${filter === item.value ? "bg-cyan-50 text-cyan-700" : "text-gray-500 hover:bg-gray-50"}`}>
                            {item.label}
                        </button>
                    ))}
                </div>

                <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
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
                                <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-500">Đang tải booking...</td></tr>
                            ) : bookings.length === 0 ? (
                                <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-500">Chưa có booking phù hợp.</td></tr>
                            ) : (
                                bookings.map((booking) => {
                                    const isBusy = actionId === booking.bookingId;
                                    const displayStatus = getBookingDisplayStatus(booking);
                                    const canConfirm = canShowBookingConfirm(booking);
                                    const canCheckIn = canShowBookingCheckIn(booking);
                                    const canCheckOut = canShowBookingCheckOut(booking);
                                    const canCancel = canShowHostBookingCancel(booking);

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
                                            <td className="px-4 py-4">
                                                <div className="flex flex-wrap gap-2">
                                                    {canConfirm ? <button disabled={isBusy} type="button" onClick={() => runAction(booking.bookingId, () => confirmHostBooking(booking.bookingId))} className={primaryButtonClass}>Xác nhận</button> : null}
                                                    {canCheckIn ? <button disabled={isBusy} type="button" onClick={() => runAction(booking.bookingId, () => checkInHostBooking(booking.bookingId))} className={secondaryButtonClass}>Check-in</button> : null}
                                                    {canCheckOut ? <button disabled={isBusy} type="button" onClick={() => runAction(booking.bookingId, () => checkOutHostBooking(booking.bookingId))} className={secondaryButtonClass}>Check-out</button> : null}
                                                    {canCancel ? (
                                                        <button
                                                            disabled={isBusy}
                                                            type="button"
                                                            onClick={() => {
                                                                const reason = window.prompt("Lý do hủy/từ chối booking?") || "host hủy hoặc từ chối booking";
                                                                void runAction(booking.bookingId, () => cancelHostBooking(booking.bookingId, reason));
                                                            }}
                                                            className="rounded-xl border border-rose-200 px-4 py-2.5 text-sm text-rose-600 transition-colors hover:bg-rose-50"
                                                        >
                                                            <FiXCircle className="mr-1 inline" /> Hủy/Từ chối
                                                        </button>
                                                    ) : null}
                                                    {!canConfirm && !canCheckIn && !canCheckOut && !canCancel ? (
                                                        <span className="px-1 py-2.5 text-sm text-gray-400">Không có thao tác</span>
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
    );
};

export default DatPhong;
