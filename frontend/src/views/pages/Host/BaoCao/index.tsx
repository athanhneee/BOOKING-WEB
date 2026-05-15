import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getHostRevenueReport, type HostRevenueReport } from "../../../../services/hostService";
import { PageHeader } from "../shared";
import { formatCompactCurrency, formatCurrency, pageWrapperClass, secondaryButtonClass, tableClassName } from "../sharedStyles";

type RangeKey = "30d" | "90d" | "year";

const getRange = (range: RangeKey) => {
    const to = new Date();
    const from = new Date();

    if (range === "90d") from.setDate(to.getDate() - 89);
    else if (range === "year") from.setFullYear(to.getFullYear() - 1);
    else from.setDate(to.getDate() - 29);

    return {
        from: from.toISOString().slice(0, 10),
        to: to.toISOString().slice(0, 10),
        group: range === "year" ? "month" : "day",
    } as const;
};

const emptyReport: HostRevenueReport = {
    range: { from: "", to: "" },
    group: "day",
    totals: { grossRevenue: 0, platformRevenue: 0, hostRevenue: 0, bookingCount: 0, paymentCount: 0 },
    series: [],
};

const BaoCao = () => {
    const [range, setRange] = useState<RangeKey>("30d");
    const [report, setReport] = useState<HostRevenueReport>(emptyReport);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadReport = async () => {
            setLoading(true);
            setError("");

            try {
                const query = getRange(range);
                const result = await getHostRevenueReport(query);
                setReport(result);
            } catch (fetchError) {
                setError(fetchError instanceof Error ? fetchError.message : "Không thể tải báo cáo doanh thu.");
                setReport(emptyReport);
            } finally {
                setLoading(false);
            }
        };

        void loadReport();
    }, [range]);

    const chartData = useMemo(
        () =>
            report.series.map((item) => ({
                period: item.period,
                hostRevenue: item.hostRevenue,
                grossRevenue: item.grossRevenue,
                bookings: item.bookingCount,
            })),
        [report],
    );

    return (
        <div className={pageWrapperClass}>
            <div className="mx-auto max-w-7xl space-y-6">
                <PageHeader
                    title="Báo cáo doanh thu"
                    subtitle="Dữ liệu lấy trực tiếp từ /api/host/reports/revenue, không còn dùng monthlyRevenue/properties mock."
                    actions={
                        <div className="flex flex-wrap gap-2">
                            {([
                                ["30d", "30 ngày"],
                                ["90d", "90 ngày"],
                                ["year", "1 năm"],
                            ] as Array<[RangeKey, string]>).map(([value, label]) => (
                                <button key={value} type="button" onClick={() => setRange(value)} className={`${secondaryButtonClass} ${range === value ? "border-cyan-500 bg-cyan-50 text-cyan-700" : ""}`}>
                                    {label}
                                </button>
                            ))}
                        </div>
                    }
                />

                {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div> : null}

                <div className="grid gap-4 md:grid-cols-4">
                    <article className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"><p className="text-sm text-gray-500">Doanh thu gộp</p><p className="mt-2 text-2xl font-bold text-gray-900">{formatCurrency(report.totals.grossRevenue)}</p></article>
                    <article className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"><p className="text-sm text-gray-500">Doanh thu host</p><p className="mt-2 text-2xl font-bold text-gray-900">{formatCurrency(report.totals.hostRevenue)}</p></article>
                    <article className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"><p className="text-sm text-gray-500">Phí nền tảng</p><p className="mt-2 text-2xl font-bold text-gray-900">{formatCurrency(report.totals.platformRevenue)}</p></article>
                    <article className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"><p className="text-sm text-gray-500">Số booking</p><p className="mt-2 text-2xl font-bold text-gray-900">{report.totals.bookingCount}</p></article>
                </div>

                <div className="grid gap-6 xl:grid-cols-2">
                    <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-gray-900">Doanh thu host theo kỳ</h2>
                        <div className="mt-6 h-80">
                            {loading ? (
                                <div className="flex h-full items-center justify-center text-sm text-gray-500">Đang tải biểu đồ...</div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                        <XAxis dataKey="period" />
                                        <YAxis tickFormatter={(value) => formatCompactCurrency(Number(value))} />
                                        <Tooltip formatter={(value) => formatCurrency(Number(value ?? 0))} />
                                        <Line type="monotone" dataKey="hostRevenue" name="Doanh thu host" stroke="#0891b2" strokeWidth={3} />
                                    </LineChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </section>

                    <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-gray-900">Số booking theo kỳ</h2>
                        <div className="mt-6 h-80">
                            {loading ? (
                                <div className="flex h-full items-center justify-center text-sm text-gray-500">Đang tải biểu đồ...</div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                        <XAxis dataKey="period" />
                                        <YAxis />
                                        <Tooltip />
                                        <Bar dataKey="bookings" name="Booking" fill="#06b6d4" radius={[6, 6, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </section>
                </div>

                <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-gray-900">Chi tiết theo kỳ</h2>
                    <div className="mt-4 overflow-hidden rounded-2xl border border-gray-100">
                        <table className={`${tableClassName} text-left text-sm`}>
                            <thead className="bg-gray-50 text-gray-500"><tr><th className="px-4 py-3">Kỳ</th><th className="px-4 py-3">Booking</th><th className="px-4 py-3">Doanh thu gộp</th><th className="px-4 py-3">Phí nền tảng</th><th className="px-4 py-3">Doanh thu host</th></tr></thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {chartData.length === 0 ? <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">Chưa có dữ liệu.</td></tr> : report.series.map((row) => (
                                    <tr key={row.period}><td className="px-4 py-4 font-medium text-gray-900">{row.period}</td><td className="px-4 py-4 text-gray-600">{row.bookingCount}</td><td className="px-4 py-4 text-gray-600">{formatCurrency(row.grossRevenue)}</td><td className="px-4 py-4 text-gray-600">{formatCurrency(row.platformRevenue)}</td><td className="px-4 py-4 text-gray-600">{formatCurrency(row.hostRevenue)}</td></tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default BaoCao;