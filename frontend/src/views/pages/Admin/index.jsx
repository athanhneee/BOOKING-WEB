import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiCheckCircle, FiClipboard, FiDollarSign, FiUsers } from "react-icons/fi";
import { APP_ROUTES } from "../../../config/routes";
import { getAdminBookingsReport, getAdminHostsReport, getAdminListingsReport, getAdminRevenueReport } from "../../../services/adminService";
import { getAdminUsers } from "../../../services/userService";
import { getPendingListings } from "../../../services/adminService";
import { formatCurrency, pageWrapperClass } from "../Host/sharedStyles";

const today = new Date();
const from = new Date();
from.setDate(today.getDate() - 29);
const rangeQuery = { from: from.toISOString().slice(0, 10), to: today.toISOString().slice(0, 10), group: "day" };

const AdminOverview = () => {
    const [stats, setStats] = useState({ users: 0, pendingListings: 0, grossRevenue: 0, bookings: 0, hosts: 0, activeListings: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            setError("");
            try {
                const [users, pendingListings, revenue, bookings, listings, hosts] = await Promise.all([
                    getAdminUsers({ page: 1, limit: 1 }),
                    getPendingListings({ page: 1, limit: 1 }),
                    getAdminRevenueReport(rangeQuery),
                    getAdminBookingsReport(rangeQuery),
                    getAdminListingsReport(rangeQuery),
                    getAdminHostsReport(rangeQuery),
                ]);

                setStats({
                    users: users.pagination?.totalItems ?? users.items?.length ?? 0,
                    pendingListings: pendingListings.pagination?.totalItems ?? pendingListings.items?.length ?? 0,
                    grossRevenue: revenue.totals?.grossRevenue ?? 0,
                    bookings: bookings.totals?.totalBookings ?? 0,
                    hosts: hosts.totals?.totalHosts ?? 0,
                    activeListings: listings.totals?.activeListings ?? 0,
                });
            } catch (fetchError) {
                setError(fetchError instanceof Error ? fetchError.message : "Không thể tải tổng quan admin.");
            } finally {
                setLoading(false);
            }
        };

        void load();
    }, []);

    const cards = [
        { label: "Tổng người dùng", value: stats.users, icon: FiUsers, link: APP_ROUTES.adminUsers },
        { label: "Bài chờ duyệt", value: stats.pendingListings, icon: FiClipboard, link: APP_ROUTES.adminModeration },
        { label: "Doanh thu 30 ngày", value: formatCurrency(stats.grossRevenue), icon: FiDollarSign, link: APP_ROUTES.adminOverview },
        { label: "Booking 30 ngày", value: stats.bookings, icon: FiCheckCircle, link: APP_ROUTES.adminOverview },
        { label: "Host mới 30 ngày", value: stats.hosts, icon: FiUsers, link: APP_ROUTES.adminUsers },
        { label: "Listing active 30 ngày", value: stats.activeListings, icon: FiClipboard, link: APP_ROUTES.adminModeration },
    ];

    return (
        <div className={pageWrapperClass}>
            <div className="mx-auto max-w-7xl space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Tổng quan hệ thống</h1>
                   
                </div>

                {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div> : null}

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {cards.map((card) => {
                        const Icon = card.icon;
                        return (
                            <Link key={card.label} to={card.link} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                                <div className="flex items-center justify-between gap-4">
                                    <div><p className="text-sm font-medium text-gray-500">{card.label}</p><p className="mt-3 text-3xl font-bold text-gray-900">{loading ? "..." : card.value}</p></div>
                                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-cyan-50 text-cyan-700"><Icon size={20} /></span>
                                </div>
                            </Link>
                        );
                    })}
                </div>

                
            </div>
        </div>
    );
};

export default AdminOverview;