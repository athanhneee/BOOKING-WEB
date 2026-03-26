import { useMemo, useState } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { Link } from "react-router-dom";
import { bookings, properties } from "../../../../data/mockData.ts";
import Badge from "../../../components/ui/Badge";
import { APP_ROUTES } from "../../../../config/routes";
import { FilterTabs, PageHeader } from "../shared";
import { formatDate, pageWrapperClass } from "../sharedStyles";

const dayLabels = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const statusColors = {
    "dang-luu-tru": "bg-cyan-700",
    "sap-nhan": "bg-cyan-500",
    "sap-tra": "bg-orange-500",
    "da-tra": "bg-gray-400",
} as const;

const startOfMonthGrid = (date: Date) => {
    const first = new Date(date.getFullYear(), date.getMonth(), 1);
    const start = new Date(first);
    const day = (first.getDay() + 6) % 7;
    start.setDate(first.getDate() - day);
    return start;
};

const toDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const LichLuuTru = () => {
    const [month, setMonth] = useState(new Date(2026, 2, 1));
    const [propertyId, setPropertyId] = useState(properties[0]?.id ?? "");
    const [activeBookingId, setActiveBookingId] = useState<string | null>(null);

    const calendarDays = useMemo(() => {
        const start = startOfMonthGrid(month);
        return Array.from({ length: 42 }, (_, index) => {
            const next = new Date(start);
            next.setDate(start.getDate() + index);
            return next;
        });
    }, [month]);

    const propertyBookings = bookings.filter((booking) => booking.propertyId === propertyId);
    const today = "2026-03-24";
    const todayCheckins = propertyBookings.filter((booking) => booking.checkIn === today);
    const todayCheckouts = propertyBookings.filter((booking) => booking.checkOut === today);

    return (
        <div className={pageWrapperClass}>
            <div className="mx-auto max-w-7xl space-y-6">
                <PageHeader title="Lịch lưu trú" subtitle="Xem nhanh booking theo từng ngày để phối hợp nhận phòng và trả phòng." />

                <FilterTabs
                    options={properties.map((property) => ({ label: property.name, value: property.id }))}
                    value={propertyId}
                    onChange={setPropertyId}
                />

                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
                    <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                        <div className="mb-6 flex items-center justify-between">
                            <button type="button" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200"><FiChevronLeft /></button>
                            <h2 className="text-lg font-semibold text-gray-900">
                                {new Intl.DateTimeFormat("vi-VN", { month: "long", year: "numeric" }).format(month)}
                            </h2>
                            <button type="button" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200"><FiChevronRight /></button>
                        </div>

                        <div className="grid grid-cols-7 gap-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-400">
                            {dayLabels.map((label) => <div key={label}>{label}</div>)}
                        </div>

                        <div className="mt-3 grid grid-cols-7 gap-3">
                            {calendarDays.map((date) => {
                                const dateKey = toDateString(date);
                                const dayBookings = propertyBookings.filter((booking) => booking.checkIn <= dateKey && booking.checkOut >= dateKey).slice(0, 2);
                                const inCurrentMonth = date.getMonth() === month.getMonth();

                                return (
                                    <div key={dateKey} className={`min-h-[120px] rounded-2xl border p-3 ${inCurrentMonth ? "border-gray-100 bg-white" : "border-gray-100 bg-gray-50/70"}`}>
                                        <div className="text-sm font-medium text-gray-500">{date.getDate()}</div>
                                        <div className="mt-3 space-y-2">
                                            {dayBookings.map((booking) => (
                                                <button key={booking.id} type="button" onClick={() => setActiveBookingId(activeBookingId === booking.id ? null : booking.id)} className={`relative w-full rounded-full px-3 py-2 text-left text-xs font-medium text-white ${statusColors[booking.status]}`}>
                                                    <span className="block truncate">{booking.guestName}</span>
                                                    {activeBookingId === booking.id ? (
                                                        <div className="absolute left-0 top-full z-10 mt-2 w-60 rounded-2xl border border-gray-100 bg-white p-4 text-left text-gray-700 shadow-xl">
                                                            <p className="font-semibold text-gray-900">{booking.guestName}</p>
                                                            <p className="mt-1 text-sm text-gray-500">{formatDate(booking.checkIn)} - {formatDate(booking.checkOut)}</p>
                                                            <div className="mt-3"><Badge status={booking.status} /></div>
                                                            <Link to={APP_ROUTES.hostBookings} className="mt-4 inline-flex text-sm font-medium text-cyan-700">
                                                                Xem chi tiết
                                                            </Link>
                                                        </div>
                                                    ) : null}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mt-6 flex flex-wrap gap-4 text-sm text-gray-500">
                            <div className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-cyan-700" /> Đang ở</div>
                            <div className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-cyan-500" /> Sắp nhận</div>
                            <div className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-orange-500" /> Sắp trả</div>
                        </div>
                    </section>

                    <aside className="space-y-6">
                        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                            <h2 className="text-lg font-semibold text-gray-900">Hôm nay</h2>
                            <div className="mt-5 space-y-5">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Nhận phòng hôm nay</p>
                                    <div className="mt-3 space-y-3">
                                        {todayCheckins.map((booking) => <div key={booking.id} className="rounded-2xl bg-cyan-300/12 p-4"><p className="font-medium text-gray-900">{booking.guestName}</p><p className="mt-1 text-sm text-gray-500">{booking.code}</p></div>)}
                                        {!todayCheckins.length ? <p className="text-sm text-gray-400">Không có lịch nhận phòng.</p> : null}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Trả phòng hôm nay</p>
                                    <div className="mt-3 space-y-3">
                                        {todayCheckouts.map((booking) => <div key={booking.id} className="rounded-2xl bg-orange-50 p-4"><p className="font-medium text-gray-900">{booking.guestName}</p><p className="mt-1 text-sm text-gray-500">{booking.code}</p></div>)}
                                        {!todayCheckouts.length ? <p className="text-sm text-gray-400">Không có lịch trả phòng.</p> : null}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
};

export default LichLuuTru;
