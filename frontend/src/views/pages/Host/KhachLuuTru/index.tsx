import { useEffect, useMemo, useState } from "react";
import type { ApiBooking } from "../../../../models/entities/Booking";
import { getHostBookings } from "../../../../services/hostService";
import { bookingStatusToneClassNames, getBookingDisplayStatus } from "../../../../utils/bookingStatus";
import { PageHeader } from "../shared";
import { formatDate, maskEmail, pageWrapperClass, tableClassName } from "../sharedStyles";

const KhachLuuTru = () => {
    const [bookings, setBookings] = useState<ApiBooking[]>([]);
    const [statusNow, setStatusNow] = useState(() => new Date());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedListingId, setSelectedListingId] = useState<number | "all">("all");

    useEffect(() => {
        const loadBookings = async () => {
            setLoading(true);
            setError("");

            try {
                const result = await getHostBookings({ page: 1, limit: 100 });
                setBookings(result.items ?? []);
            } catch (fetchError) {
                setError(fetchError instanceof Error ? fetchError.message : "Không thể tải danh sách khách lưu trú.");
            } finally {
                setLoading(false);
            }
        };

        void loadBookings();
    }, []);

    useEffect(() => {
        const timer = window.setInterval(() => setStatusNow(new Date()), 60_000);
        return () => window.clearInterval(timer);
    }, []);

    const listingOptions = useMemo(() => {
        const seen = new Map<number, string>();

        for (const booking of bookings) {
            const id = booking.listingId;

            if (!seen.has(id)) {
                seen.set(id, booking.listing?.title ?? booking.listingTitle ?? `Listing #${id}`);
            }
        }

        return Array.from(seen.entries())
            .map(([id, title]) => ({ id, title }))
            .sort((a, b) => a.title.localeCompare(b.title));
    }, [bookings]);

    const guests = useMemo(
        () =>
            bookings
                .filter((booking) => selectedListingId === "all" || booking.listingId === selectedListingId)
                .map((booking) => {
                    const displayStatus = getBookingDisplayStatus(booking, { role: "host", now: statusNow });

                    return {
                        id: booking.bookingId,
                        name: `Khách booking #${booking.bookingId}`,
                        email: `guest-${booking.guestUserId}@private.local`,
                        listing: booking.listing?.title ?? booking.listingTitle ?? `Listing #${booking.listingId}`,
                        dates: `${formatDate(booking.checkInDate)} - ${formatDate(booking.checkOutDate)}`,
                        guestCount: booking.guests ?? booking.guestCount ?? booking.guestsCount ?? 1,
                        statusLabel: displayStatus.label,
                        statusTone: displayStatus.tone,
                    };
                }),
        [bookings, statusNow, selectedListingId],
    );

    return (
        <div className={pageWrapperClass}>
            <div className="mx-auto max-w-7xl space-y-6">
                <PageHeader title="Khách lưu trú" subtitle="" />

                {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div> : null}

                <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                    <label htmlFor="listing-filter" className="text-sm font-medium text-gray-700">Lọc theo chỗ nghỉ:</label>
                    <select
                        id="listing-filter"
                        value={selectedListingId}
                        onChange={(event) => {
                            const value = event.target.value;
                            setSelectedListingId(value === "all" ? "all" : Number(value));
                        }}
                        className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 shadow-sm transition-colors hover:border-cyan-300 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                    >
                        <option value="all">Tất cả chỗ nghỉ ({bookings.length})</option>
                        {listingOptions.map((listing) => (
                            <option key={listing.id} value={listing.id}>{listing.title}</option>
                        ))}
                    </select>
                    {selectedListingId !== "all" ? (
                        <button
                            type="button"
                            onClick={() => setSelectedListingId("all")}
                            className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-medium text-gray-500 transition-colors hover:border-cyan-300 hover:text-cyan-600"
                        >
                            Xóa bộ lọc
                        </button>
                    ) : null}
                    <span className="ml-auto text-sm text-gray-400">
                        {guests.length} kết quả
                    </span>
                </div>

                <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                    <table className={`${tableClassName} text-left text-sm`}>
                        <thead className="bg-gray-50 text-gray-500">
                            <tr><th className="px-4 py-3">Khách</th><th className="px-4 py-3">Chỗ nghỉ</th><th className="px-4 py-3">Ngày lưu trú</th><th className="px-4 py-3">Số khách</th><th className="px-4 py-3">Trạng thái</th></tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-10">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="mb-3 h-6 w-6 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent"></div>
                                            <span className="text-sm font-medium text-slate-500">Đang tải...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : null}
                            {!loading && guests.length === 0 ? <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-500">Chưa có khách lưu trú.</td></tr> : null}
                            {guests.map((guest) => (
                                <tr key={guest.id}>
                                    <td className="px-4 py-4"><p className="font-semibold text-gray-900">{guest.name}</p><p className="mt-1 text-xs text-gray-500">{maskEmail(guest.email)}</p></td>
                                    <td className="px-4 py-4 text-gray-600">{guest.listing}</td>
                                    <td className="px-4 py-4 text-gray-600">{guest.dates}</td>
                                    <td className="px-4 py-4 text-gray-600">{guest.guestCount}</td>
                                    <td className="px-4 py-4"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${bookingStatusToneClassNames[guest.statusTone]}`}>{guest.statusLabel}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default KhachLuuTru;
