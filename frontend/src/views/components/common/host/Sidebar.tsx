import { FiArrowRight, FiCompass, FiMenu, FiX } from "react-icons/fi";
import { Link, NavLink } from "react-router-dom";
import logo from "../../../../assets/img/logo_mau.svg";
import { APP_ROUTES } from "../../../../config/routes";
import { cn } from "../../../../utils";
import type { SidebarMenuItem } from "./types";

interface SidebarProps {
    items: SidebarMenuItem[];
    isOpen: boolean;
    onClose: () => void;
}

const Sidebar = ({ items, isOpen, onClose }: SidebarProps) => {
    return (
        <>
            {isOpen ? (
                <button
                    type="button"
                    className="fixed inset-0 z-30 bg-slate-950/35 lg:hidden"
                    onClick={onClose}
                    aria-label="Đóng menu"
                />
            ) : null}

            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-[var(--color-border)] bg-white px-4 py-5 shadow-xl transition-transform duration-300 lg:static lg:translate-x-0 lg:shadow-none",
                    isOpen ? "translate-x-0" : "-translate-x-full",
                )}
            >
                <div className="flex items-center justify-between gap-3">
                    <Link to={APP_ROUTES.ownerDashboard} className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl">
                            <img src={logo} alt="minhthanhvilla" className="h-8 w-8 object-contain" />
                        </div>

                        <div>
                            <p className="text-xs font-semibold tracking-[0.16em] text-cyan-700">minhthanhvilla</p>
                            <h1 className="text-lg font-semibold text-gray-900">Bảng điều khiển host</h1>
                        </div>
                    </Link>

                    <button
                        type="button"
                        aria-label="Đóng sidebar"
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50 lg:hidden"
                        onClick={onClose}
                    >
                        <FiX size={18} />
                    </button>
                </div>

                <nav className="mt-8 space-y-2">
                    {items.map((item) => {
                        const Icon = item.icon;

                        return (
                            <NavLink
                                key={item.id}
                                to={item.to}
                                onClick={onClose}
                                className={({ isActive }) =>
                                    cn(
                                        "group flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition-colors",
                                        isActive
                                            ? "bg-cyan-300/15 text-cyan-800 font-semibold rounded-xl"
                                            : "text-gray-600 hover:bg-gray-50 rounded-xl",
                                    )
                                }
                            >
                                {({ isActive }) => (
                                    <>
                                        <span
                                            className={cn(
                                                "inline-flex h-10 w-10 items-center justify-center rounded-xl border transition-colors",
                                                isActive
                                                    ? "border-cyan-300/30 bg-white text-cyan-700"
                                                    : "border-transparent bg-gray-100 text-gray-500",
                                            )}
                                        >
                                            <Icon size={18} />
                                        </span>
                                        <span>{item.label}</span>
                                    </>
                                )}
                            </NavLink>
                        );
                    })}
                </nav>

                <div className="mt-auto space-y-3">
                    <Link
                        to={APP_ROUTES.search}
                        onClick={onClose}
                        className="group block rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-colors hover:border-cyan-300 hover:bg-cyan-50"
                    >
                        <div className="flex items-start gap-3">
                            <span className="inline-flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-cyan-50 text-cyan-700 transition-colors group-hover:bg-white">
                                <FiCompass size={18} />
                            </span>

                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-gray-900">Chuyển sang chế độ du lịch</p>
                                <p className="mt-1 text-sm leading-6 text-gray-600">
                                    Tìm nơi lưu trú, xem chuyến đi và đặt phòng .
                                </p>
                            </div>

                            <FiArrowRight className="mt-1 flex-none text-gray-400 transition-colors group-hover:text-cyan-700" size={16} />
                        </div>
                    </Link>

                    <div className="rounded-2xl border border-cyan-300/25 bg-cyan-300/10 p-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                            <FiMenu className="text-cyan-700" />
                            Gợi ý hôm nay
                        </div>
                        <p className="mt-2 text-sm leading-6 text-gray-600">
                            Kiểm tra các đơn sắp nhận phòng và những giao dịch.
                        </p>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
