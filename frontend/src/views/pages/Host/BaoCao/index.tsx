import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { bookings, monthlyRevenue, properties } from "../../../../data/mockData.ts";
import { PageHeader } from "../shared";
import { formatCompactCurrency, formatCurrency, pageWrapperClass, secondaryButtonClass, tableClassName } from "../sharedStyles";

const rangeTabs = ["Tháng này", "Tháng trước", "3 tháng", "1 năm", "Tùy chỉnh"];
const pieColors = ["#00B4B4", "#FF6B6B", "#FDBA74", "#818CF8"];

const BaoCao = () => {
    const [range, setRange] = useState("Tháng này");

    const occupancyData = properties.map((property) => ({ name: property.name, occupancy: property.occupancy, revenue: property.revenueMonth }));
    const typeRevenue = Object.values(
        properties.reduce<Record<string, { name: string; value: number }>>((acc, property) => {
            acc[property.type] = { name: property.type, value: (acc[property.type]?.value ?? 0) + property.revenueMonth };
            return acc;
        }, {}),
    );
    const weeklyBookings = ["Tuần 1", "Tuần 2", "Tuần 3", "Tuần 4"].map((label, index) => ({ name: label, bookings: 4 + index * 2 }));

    const summaryRows = useMemo(
        () =>
            properties.map((property) => ({
                ...property,
                avgNights: (
                    bookings.filter((booking) => booking.propertyId === property.id).reduce((sum, booking) => sum + booking.nights, 0) /
                        Math.max(1, bookings.filter((booking) => booking.propertyId === property.id).length)
                ).toFixed(1),
            })),
        [],
    );

    return (
        <div className={pageWrapperClass}>
            <div className="mx-auto max-w-7xl space-y-6">
                <PageHeader
                    title="Báo cáo"
                    subtitle="Xem nhanh xu hướng doanh thu, công suất và hiệu quả theo từng chỗ nghỉ."
                    actions={
                        <>
                            <button type="button" className={secondaryButtonClass}>Xuất PDF</button>
                            <button type="button" className={secondaryButtonClass}>Xuất Excel</button>
                        </>
                    }
                />

                <div className="flex flex-wrap gap-2 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
                    {rangeTabs.map((item) => (
                        <button key={item} type="button" onClick={() => setRange(item)} className={`rounded-xl px-4 py-2.5 text-sm font-medium ${range === item ? "bg-cyan-300/15 text-cyan-700" : "text-gray-500 hover:bg-gray-50"}`}>
                            {item}
                        </button>
                    ))}
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-gray-900">Doanh thu theo tháng</h2>
                        <div className="mt-6 h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={monthlyRevenue}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                    <XAxis dataKey="month" />
                                    <YAxis tickFormatter={(value) => formatCompactCurrency(value)} />
                                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                    <Line type="monotone" dataKey="revenue" stroke="#0891b2" strokeWidth={3} dot={{ r: 4 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-gray-900">Tỷ lệ lấp đầy theo chỗ nghỉ</h2>
                        <div className="mt-6 h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={occupancyData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                    <XAxis dataKey="name" hide />
                                    <YAxis />
                                    <Tooltip formatter={(value: number) => `${value}%`} />
                                    <Legend />
                                    <Bar dataKey="occupancy" fill="#06b6d4" name="Lấp đầy (%)" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-gray-900">Phân bổ doanh thu theo loại</h2>
                        <div className="mt-6 h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={typeRevenue} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={3}>
                                        {typeRevenue.map((entry, index) => <Cell key={entry.name} fill={pieColors[index % pieColors.length]} />)}
                                    </Pie>
                                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-gray-900">Lượt đặt phòng theo tuần</h2>
                        <div className="mt-6 h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={weeklyBookings}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="bookings" stroke="#0e7490" strokeWidth={3} dot={{ r: 4 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-gray-900">Tổng hợp theo chỗ nghỉ</h2>
                    <div className="mt-4 overflow-hidden rounded-2xl border border-gray-100">
                        <table className={`${tableClassName} text-left text-sm`}>
                            <thead className="bg-gray-50 text-gray-500">
                                <tr>
                                    {["Chỗ nghỉ", "Lấp đầy", "Doanh thu", "TB đêm/đặt", "Đánh giá TB"].map((column) => <th key={column} className="px-4 py-3 font-medium">{column}</th>)}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {summaryRows.map((row) => (
                                    <tr key={row.id}>
                                        <td className="px-4 py-4 font-medium text-gray-900">{row.name}</td>
                                        <td className="px-4 py-4 text-gray-500">{row.occupancy}%</td>
                                        <td className="px-4 py-4 text-gray-500">{formatCurrency(row.revenueMonth)}</td>
                                        <td className="px-4 py-4 text-gray-500">{row.avgNights}</td>
                                        <td className="px-4 py-4 text-gray-500">{row.rating}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BaoCao;
