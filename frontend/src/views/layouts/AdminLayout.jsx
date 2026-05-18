import { FiBell, FiClipboard, FiGrid, FiLogOut, FiMenu, FiShield, FiUsers, FiX } from "react-icons/fi";
import { Link, Navigate, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import logo from "../../assets/img/logo_mau.svg";
import { APP_ROUTES } from "../../config/routes";
import { clearCurrentUser, getCurrentUser, isAdminUser } from "../../store/authStore";
import { cn } from "../../utils";
import { useState } from "react";

const adminNavItems = [
    { id: "tong-quan", label: "Tổng quan", to: APP_ROUTES.adminOverview, icon: FiGrid },
    { id: "nguoi-dung", label: "Người dùng", to: APP_ROUTES.adminUsers, icon: FiUsers },
    { id: "kiem-duyet", label: "Kiểm duyệt", to: APP_ROUTES.adminModeration, icon: FiClipboard },
    { id: "phan-quyen", label: "Phân quyền", to: APP_ROUTES.adminRoles, icon: FiShield },
];

const pageMeta = [
    { path: APP_ROUTES.adminOverview, title: "Tổng quan Admin", subtitle: "Dữ liệu tổng quan " },
    { path: APP_ROUTES.adminUsers, title: "Quản lý người dùng", subtitle: "Tìm kiếm, khóa/mở khóa và cập nhật vai trò người dùng." },
    { path: APP_ROUTES.adminModeration, title: "Kiểm duyệt bài đăng", subtitle: "Duyệt hoặc từ chối listing đang chờ duyệt." },
    { path: APP_ROUTES.adminRoles, title: "Phân quyền hệ thống", subtitle: "Cập nhật role người dùng bằng API admin users." },
];

const AdminLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const currentAdmin = getCurrentUser();

    if (!isAdminUser(currentAdmin)) {
        return <Navigate to={APP_ROUTES.login} replace />;
    }

    const activeMeta = pageMeta.find((item) => item.path === location.pathname) ?? pageMeta[0];

    const handleLogout = () => {
        clearCurrentUser();
        navigate(APP_ROUTES.login, { replace: true });
    };

    return (
        <div className="min-h-screen bg-[#F7F8FA] text-gray-900">
            <div className="flex min-h-screen">
                {sidebarOpen ? <button type="button" className="fixed inset-0 z-30 bg-slate-950/35 lg:hidden" onClick={() => setSidebarOpen(false)} aria-label="Đóng menu admin" /> : null}

                <aside className={cn("fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-gray-200 bg-white px-4 py-5 shadow-xl transition-transform duration-300 lg:static lg:translate-x-0 lg:shadow-none", sidebarOpen ? "translate-x-0" : "-translate-x-full")}>
                    <div className="flex items-start justify-between gap-3">
                        <Link to={APP_ROUTES.adminOverview} className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50"><img src={logo} alt="minh thanh villa" className="h-8 w-8 object-contain" /></div>
                            <div><p className="text-sm font-bold text-teal-800">minh thanh villa</p><span className="mt-1 inline-flex rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600">Admin Panel</span></div>
                        </Link>
                        <button type="button" onClick={() => setSidebarOpen(false)} aria-label="Đóng sidebar admin" className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50 lg:hidden"><FiX size={18} /></button>
                    </div>

                    <nav className="mt-8 space-y-2">
                        {adminNavItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <NavLink key={item.id} to={item.to} end={item.to === APP_ROUTES.adminOverview} onClick={() => setSidebarOpen(false)} className={({ isActive }) => cn("flex items-center gap-3 rounded-xl border-l-2 px-3 py-3 text-sm transition-colors", isActive ? "border-teal-600 bg-cyan-50 font-semibold text-teal-700" : "border-transparent text-gray-600 hover:bg-gray-50")}>
                                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-600"><Icon size={18} /></span>
                                    <span>{item.label}</span>
                                </NavLink>
                            );
                        })}
                    </nav>

                    <div className="mt-auto rounded-2xl border border-gray-100 bg-gray-50 p-4">
                        <p className="text-sm font-semibold text-gray-900">{currentAdmin.name}</p>
                        <p className="mt-1 text-sm text-gray-500">{currentAdmin.email}</p>
                        <button type="button" onClick={handleLogout} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-white"><FiLogOut size={16} />Đăng xuất</button>
                    </div>
                </aside>

                <div className="flex min-w-0 flex-1 flex-col">
                    <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/95 backdrop-blur">
                        <div className="flex flex-wrap items-center gap-4 px-4 py-4 sm:px-6">
                            <button type="button" onClick={() => setSidebarOpen(true)} className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 text-gray-600 transition-colors hover:bg-gray-50 lg:hidden" aria-label="Mở menu admin"><FiMenu size={18} /></button>
                            <div className="min-w-[220px] flex-1"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">Admin Center</p><h1 className="mt-1 text-xl font-bold text-gray-900 sm:text-2xl">{activeMeta.title}</h1><p className="mt-1 text-sm text-gray-500">{activeMeta.subtitle}</p></div>
                            <button type="button" aria-label="Thông báo quản trị" className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition-colors hover:bg-gray-50"><FiBell size={18} /></button>
                        </div>
                    </header>
                    <main className="min-w-0 flex-1"><Outlet /></main>
                </div>
            </div>
        </div>
    );
};

export default AdminLayout;
