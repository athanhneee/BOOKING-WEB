import { useEffect, useMemo, useState } from "react";
import {
    bulkUpdateHostListingCalendar,
    getHostListingCalendar,
    getMyHostListings,
    type HostCalendarDay,
    type HostListingSummary,
} from "../../../../services/hostService";
import { PageHeader } from "../shared";
import { formatCurrency, pageWrapperClass, primaryButtonClass, secondaryButtonClass } from "../sharedStyles";

const today = new Date();
const currentMonth = today.getMonth() + 1;
const currentYear = today.getFullYear();

const LichLuuTru = () => {
    const [listings, setListings] = useState<HostListingSummary[]>([]);
    const [listingId, setListingId] = useState<number | "">("");
    const [month, setMonth] = useState(currentMonth);
    const [year, setYear] = useState(currentYear);
    const [days, setDays] = useState<HostCalendarDay[]>([]);
    const [selectedDates, setSelectedDates] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadListings = async () => {
            setError("");
            try {
                const result = await getMyHostListings({ page: 1, limit: 50 });
                setListings(result.items ?? []);
                setListingId((current) => current || result.items?.[0]?.listingId || "");
            } catch (fetchError) {
                setError(fetchError instanceof Error ? fetchError.message : "Không thể tải chỗ nghỉ.");
            }
        };

        void loadListings();
    }, []);

    useEffect(() => {
        const loadCalendar = async () => {
            if (!listingId) {
                setLoading(false);
                return;
            }

            setLoading(true);
            setError("");

            try {
                const result = await getHostListingCalendar(listingId, { month, year });
                setDays(result.days ?? []);
                setSelectedDates([]);
            } catch (fetchError) {
                setError(fetchError instanceof Error ? fetchError.message : "Không thể tải lịch lưu trú.");
            } finally {
                setLoading(false);
            }
        };

        void loadCalendar();
    }, [listingId, month, year]);

    const selectedSet = useMemo(() => new Set(selectedDates), [selectedDates]);

    /** Map date → day for quick lookup in event handlers */
    const dayMap = useMemo(() => new Map(days.map((d) => [d.date, d])), [days]);

    const toggleDate = (date: string) => {
        const day = dayMap.get(date);
        if (day?.isPast || day?.isBooked || day?.canEdit === false) return;

        setSelectedDates((current) => (current.includes(date) ? current.filter((item) => item !== date) : [...current, date]));
    };

    /** Count of selected dates that are actually editable */
    const editableSelectedCount = useMemo(
        () => selectedDates.filter((date) => { const d = dayMap.get(date); return d && !d.isPast && !d.isBooked && d.canEdit !== false; }).length,
        [selectedDates, dayMap],
    );

    const updateSelected = async (isAvailable: boolean) => {
        if (!listingId || selectedDates.length === 0) return;

        // Filter to only editable dates
        const editableDates = selectedDates.filter((date) => {
            const d = dayMap.get(date);
            return d && !d.isPast && !d.isBooked && d.canEdit !== false;
        });

        if (editableDates.length === 0) {
            setError("Không thể cập nhật ngày đã qua.");
            return;
        }

        setSaving(true);
        setError("");

        try {
            await bulkUpdateHostListingCalendar(listingId, {
                dates: editableDates,
                isAvailable,
                isBlockedByHost: !isAvailable,
            });
            const result = await getHostListingCalendar(listingId, { month, year });
            setDays(result.days ?? []);
            setSelectedDates([]);
        } catch (updateError) {
            setError(updateError instanceof Error ? updateError.message : "Không thể cập nhật lịch.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className={pageWrapperClass}>
            <div className="mx-auto max-w-7xl space-y-6">
                <PageHeader title="Lịch lưu trú" />

                {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div> : null}

                <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                        <label className="space-y-2 sm:col-span-2">
                            <span className="text-sm font-medium text-gray-700">Chọn chỗ nghỉ</span>
                            <select value={listingId} onChange={(event) => setListingId(Number(event.target.value) || "")} className="w-full rounded-xl border border-gray-200 px-3 py-2.5">
                                {listings.map((listing) => <option key={listing.listingId} value={listing.listingId}>{listing.title}</option>)}
                            </select>
                        </label>
                        <label className="space-y-2">
                            <span className="text-sm font-medium text-gray-700">Tháng</span>
                            <input type="number" min={1} max={12} value={month} onChange={(event) => setMonth(Number(event.target.value))} className="w-full rounded-xl border border-gray-200 px-3 py-2.5" />
                        </label>
                        <label className="space-y-2">
                            <span className="text-sm font-medium text-gray-700">Năm</span>
                            <input type="number" min={2026} max={2030} value={year} onChange={(event) => setYear(Number(event.target.value))} className="w-full rounded-xl border border-gray-200 px-3 py-2.5" />
                        </label>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-3">
                        <button type="button" disabled={saving || editableSelectedCount === 0} onClick={() => updateSelected(true)} className={primaryButtonClass}>Mở {editableSelectedCount} ngày</button>
                        <button type="button" disabled={saving || editableSelectedCount === 0} onClick={() => updateSelected(false)} className={secondaryButtonClass}>Đóng {editableSelectedCount} ngày</button>
                        <button type="button" onClick={() => setSelectedDates([])} className={secondaryButtonClass}>Bỏ chọn</button>
                    </div>
                </section>

                {/* Legend */}
                <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded-full bg-emerald-200 border border-emerald-400"></span>Đang mở</span>
                    <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded-full bg-blue-200 border border-blue-400"></span>Đã có khách</span>
                    <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded-full bg-rose-100 border border-rose-300"></span>Đang đóng</span>
                    <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded-full bg-gray-200 border border-gray-300"></span>Đã qua</span>
                </div>

                <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="mb-3 h-6 w-6 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent"></div>
                            <span className="text-sm font-medium text-slate-500">Đang tải lịch...</span>
                        </div>
                    ) : days.length === 0 ? (
                        <div className="py-12 text-center text-sm text-gray-500">Chưa có dữ liệu lịch cho tháng này.</div>
                    ) : (
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 xl:grid-cols-7">
                            {days.map((day) => {
                                const selected = selectedSet.has(day.date);
                                const closed = !day.isAvailable || day.isBlockedByHost;
                                const booked = Boolean(day.isBooked);
                                const past = Boolean(day.isPast);
                                const disabled = past || booked;

                                let stateClass = "border-gray-100 bg-white hover:border-cyan-200";
                                if (selected) stateClass = "border-cyan-500 bg-cyan-50";
                                else if (past) stateClass = "border-gray-200 bg-gray-100 cursor-not-allowed opacity-60";
                                else if (booked) stateClass = "border-blue-300 bg-blue-50 cursor-not-allowed";
                                else if (closed) stateClass = "border-rose-100 bg-rose-50";

                                let statusLabel = closed ? "Đang đóng" : "Đang mở";
                                let statusColor = closed ? "text-rose-600" : "text-emerald-600";
                                if (booked) { statusLabel = "Đã có khách"; statusColor = "text-blue-600"; }
                                if (past && !booked) { statusLabel = "Đã qua"; statusColor = "text-gray-400"; }

                                return (
                                    <button
                                        key={day.date}
                                        type="button"
                                        disabled={disabled}
                                        onClick={() => !disabled && toggleDate(day.date)}
                                        title={past ? "Ngày đã qua — không thể chỉnh lịch" : booked ? "Ngày này đã có khách đặt — không thể thay đổi" : undefined}
                                        className={`rounded-2xl border p-3 text-left transition sm:p-4 ${stateClass}`}
                                    >
                                        <p className="font-semibold text-gray-900">{day.date.slice(-2)}/{String(month).padStart(2, "0")}</p>
                                        <p className={`mt-2 text-xs font-medium ${statusColor}`}>{statusLabel}</p>
                                        <p className="mt-2 text-sm text-gray-500">{formatCurrency(Number(day.price ?? day.defaultPrice ?? 0))}</p>
                                        <p className="mt-1 text-xs text-gray-400">Tối thiểu {day.minNights ?? day.defaultMinNights ?? 1} đêm</p>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};

export default LichLuuTru;
