import { Link } from "react-router-dom";
import { FiCheckCircle, FiClipboard, FiLock, FiUsers } from "react-icons/fi";
import { APP_ROUTES } from "../../../config/routes";
import Badge from "../../components/ui/Badge";
import { useAdminOutletContext } from "../../layouts/AdminLayout.jsx";
import { formatDate, getInitials, pageWrapperClass } from "../Host/sharedStyles";

const activityDotClass = (action) => {
    if (action.includes("Khóa")) {
        return "bg-red-500";
    }

    if (action.includes("Phê duyệt")) {
        return "bg-teal-500";
    }

    if (action.includes("Từ chối")) {
        return "bg-orange-400";
    }

    if (action.includes("Đổi mật khẩu")) {
        return "bg-cyan-500";
    }

    if (action.includes("Thay đổi quyền")) {
        return "bg-violet-500";
    }

    return "bg-gray-300";
};

const AdminOverview = () => {
    const { users, listings, logs } = useAdminOutletContext();

    const pendingUsers = users.filter((user) => user.status === "pending");
    const pendingListings = [...listings]
        .filter((listing) => listing.status === "pending")
        .sort((first, second) => second.submittedAt.localeCompare(first.submittedAt))
        .slice(0, 3);
    const approvedCount = listings.filter((listing) => listing.status === "approved").length;
    const lockedCount = users.filter((user) => user.status === "locked").length;
    const pendingCount = listings.filter((listing) => listing.status === "pending").length;
    const newUsersThisMonth = users.filter((user) => user.joinDate.startsWith("2026-03")).length;

    return (
        <div className={pageWrapperClass}>
            <div className="mx-auto max-w-7xl space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Tổng quan hệ thống</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Theo dõi nhanh số người dùng, bài đăng chờ xử lý và hoạt động quản trị gần đây.
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <article className="rounded-2xl bg-gradient-to-br from-teal-600 to-cyan-500 p-6 text-white shadow-sm">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <p className="text-sm font-medium text-white/80">Tổng người dùng</p>
                                <p className="mt-3 text-3xl font-bold">{users.length}</p>
                            </div>
                            <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
                                <FiUsers size={20} />
                            </span>
                        </div>
                        <p className="mt-3 text-sm text-white/85">+{newUsersThisMonth} người dùng mới tháng này</p>
                    </article>

                    <article className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Chờ kiểm duyệt</p>
                                <p className="mt-3 text-3xl font-bold text-gray-900">{pendingCount}</p>
                            </div>
                            <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-cyan-50 text-cyan-700">
                                <FiClipboard size={20} />
                            </span>
                        </div>
                        <p className="mt-3 text-sm text-gray-500">bài đăng cần xử lý</p>
                    </article>

                    <article className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Tài khoản bị khóa</p>
                                <p className="mt-3 text-3xl font-bold text-gray-900">{lockedCount}</p>
                            </div>
                            <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
                                <FiLock size={20} />
                            </span>
                        </div>
                        <p className="mt-3 text-sm text-gray-500">cần xem xét</p>
                    </article>

                    <article className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Bài đăng đã duyệt</p>
                                <p className="mt-3 text-3xl font-bold text-gray-900">{approvedCount}</p>
                            </div>
                            <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-teal-50 text-teal-700">
                                <FiCheckCircle size={20} />
                            </span>
                        </div>
                        <p className="mt-3 text-sm text-gray-500">đang hiển thị</p>
                    </article>
                </div>

                <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,1fr)]">
                    <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">Hoạt động gần đây</h2>
                            <p className="mt-1 text-sm text-gray-500">Ghi nhận mọi hành động quan trọng từ trang quản trị.</p>
                        </div>

                        <div className="mt-6 space-y-4">
                            {logs.slice(0, 6).map((log) => (
                                <div key={log.id} className="flex gap-4 rounded-xl border border-gray-100 p-4">
                                    <span className={`mt-1 h-3 w-3 shrink-0 rounded-full ${activityDotClass(log.action)}`} />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-gray-900">
                                            {log.adminName} đã {log.action.toLowerCase()} với {log.targetUser}
                                        </p>
                                        {log.reason ? <p className="mt-1 text-sm italic text-gray-500">Lý do: {log.reason}</p> : null}
                                        <p className="mt-2 text-xs text-gray-400">{log.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">Người dùng chờ duyệt</h2>
                                <p className="mt-1 text-sm text-gray-500">Các tài khoản host mới cần kiểm tra nhanh.</p>
                            </div>
                            <Link
                                to={APP_ROUTES.adminUsers}
                                className="inline-flex items-center justify-center rounded-xl border border-cyan-200 px-4 py-2 text-sm font-medium text-cyan-600 transition-colors hover:bg-cyan-50"
                            >
                                Xem tất cả
                            </Link>
                        </div>

                        <div className="mt-6 space-y-4">
                            {pendingUsers.length > 0 ? (
                                pendingUsers.map((user) => (
                                    <div key={user.id} className="flex items-center gap-3 rounded-xl border border-gray-100 p-4">
                                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-teal-600 text-sm font-semibold text-white">
                                            {getInitials(user.name)}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-medium text-gray-900">{user.name}</p>
                                            <p className="mt-1 text-sm text-gray-500">Tham gia {formatDate(user.joinDate)}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge status={user.role} />
                                            <Link
                                                to={APP_ROUTES.adminUsers}
                                                className="inline-flex items-center justify-center rounded-xl border border-cyan-200 px-3 py-2 text-sm font-medium text-cyan-600 transition-colors hover:bg-cyan-50"
                                            >
                                                Xem
                                            </Link>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="rounded-2xl bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
                                    Hiện không có người dùng nào chờ duyệt.
                                </div>
                            )}
                        </div>
                    </section>
                </div>

                <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">Bài đăng chờ kiểm duyệt</h2>
                            <p className="mt-1 text-sm text-gray-500">Ưu tiên xử lý các bài đăng mới gửi gần đây.</p>
                        </div>
                        <Link
                            to={APP_ROUTES.adminModeration}
                            className="inline-flex items-center justify-center rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-cyan-600"
                        >
                            Đến trang kiểm duyệt
                        </Link>
                    </div>

                    <div className="mt-6 space-y-4">
                        {pendingListings.map((listing) => (
                            <div
                                key={listing.id}
                                className="flex flex-col gap-4 rounded-2xl border border-gray-100 p-4 md:flex-row md:items-center"
                            >
                                <img
                                    src={listing.images[0]}
                                    alt={listing.title}
                                    className="h-20 w-full rounded-xl object-cover md:h-16 md:w-24"
                                />
                                <div className="min-w-0 flex-1">
                                    <p className="font-semibold text-gray-900">{listing.title}</p>
                                    <p className="mt-1 text-sm text-gray-500">
                                        {listing.hostName} • Gửi ngày {formatDate(listing.submittedAt)}
                                    </p>
                                </div>
                                <Link
                                    to={APP_ROUTES.adminModeration}
                                    className="inline-flex items-center justify-center rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-cyan-600"
                                >
                                    Kiểm duyệt ngay
                                </Link>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default AdminOverview;
