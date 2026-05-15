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
                const result = await getMyHostListings({ page: 1, limit: 100 });
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

    const toggleDate = (date: string) => {
        setSelectedDates((current) => (current.includes(date) ? current.filter((item) => item !== date) : [...current, date]));
    };

    const updateSelected = async (isAvailable: boolean) => {
        if (!listingId || selectedDates.length === 0) return;

        setSaving(true);
        setError("");

        try {
            await bulkUpdateHostListingCalendar(listingId, {
                dates: selectedDates,
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
                <PageHeader title="Lịch lưu trú" subtitle="Cập nhật ngày mở/đóng phòng bằng API /api/host/listings/:listingId/calendar." />

                {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div> : null}

                <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                    <div className="grid gap-4 md:grid-cols-4">
                        <label className="space-y-2 md:col-span-2">
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
                            <input type="number" min={2024} max={2100} value={year} onChange={(event) => setYear(Number(event.target.value))} className="w-full rounded-xl border border-gray-200 px-3 py-2.5" />
                        </label>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-3">
                        <button type="button" disabled={saving || selectedDates.length === 0} onClick={() => updateSelected(true)} className={primaryButtonClass}>Mở {selectedDates.length} ngày</button>
                        <button type="button" disabled={saving || selectedDates.length === 0} onClick={() => updateSelected(false)} className={secondaryButtonClass}>Đóng {selectedDates.length} ngày</button>
                        <button type="button" onClick={() => setSelectedDates([])} className={secondaryButtonClass}>Bỏ chọn</button>
                    </div>
                </section>

                <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                    {loading ? (
                        <div className="py-12 text-center text-sm text-gray-500">Đang tải lịch...</div>
                    ) : days.length === 0 ? (
                        <div className="py-12 text-center text-sm text-gray-500">Chưa có dữ liệu lịch cho tháng này.</div>
                    ) : (
                        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-7">
                            {days.map((day) => {
                                const selected = selectedSet.has(day.date);
                                const closed = !day.isAvailable || day.isBlockedByHost;

                                return (
                                    <button
                                        key={day.date}
                                        type="button"
                                        onClick={() => toggleDate(day.date)}
                                        className={`rounded-2xl border p-4 text-left transition ${selected ? "border-cyan-500 bg-cyan-50" : closed ? "border-rose-100 bg-rose-50" : "border-gray-100 bg-white hover:border-cyan-200"}`}
                                    >
                                        <p className="font-semibold text-gray-900">{day.date.slice(-2)}/{String(month).padStart(2, "0")}</p>
                                        <p className={`mt-2 text-xs font-medium ${closed ? "text-rose-600" : "text-emerald-600"}`}>{closed ? "Đang đóng" : "Đang mở"}</p>
                                        <p className="mt-2 text-sm text-gray-500">{formatCurrency(Number(day.priceOverride ?? day.price ?? 0))}</p>
                                        <p className="mt-1 text-xs text-gray-400">Tối thiểu {day.minNightsOverride ?? day.minNights ?? 1} đêm</p>
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