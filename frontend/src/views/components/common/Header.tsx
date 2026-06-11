import { useEffect, useMemo, useState } from "react";
import { LuMenu, LuX } from "react-icons/lu";
import { Link, useLocation } from "react-router-dom";
import logo from "../../../assets/img/logo_mau.svg";
import { APP_ROUTES } from "../../../config/routes";
import { createGuestMenuProfile, getAccountProfileForUser } from "../../../features/account/accountProfileStorage";
import useScrollVisibility from "../../../hooks/useScrollVisibility";
import { getHostApplicationMe, type HostApplicationStatus } from "../../../services/hostService";
import { getCurrentUser, isAdminUser } from "../../../store/authStore";
import AccountMenu from "../navbar/AccountMenu";
import NotificationBell from "../notifications/NotificationBell";

const navLinks = [
    { to: APP_ROUTES.home, label: "Trang chủ" },
    { to: APP_ROUTES.search, label: "Nơi lưu trú" },
    { to: APP_ROUTES.blog, label: "Blog" },
    { to: APP_ROUTES.contact, label: "Liên hệ" },
];

const Header = () => {
    const show = useScrollVisibility({ threshold: 12, topOffset: 64, hideStartRatio: 0.5 });
    const location = useLocation();
    const currentUser = getCurrentUser();
    const isAdmin = isAdminUser(currentUser);
    const [hostApplicationStatus, setHostApplicationStatus] = useState<HostApplicationStatus>(null);
    const [useDarkText, setUseDarkText] = useState(location.pathname !== APP_ROUTES.home);
    const [mobileMenuPath, setMobileMenuPath] = useState<string | null>(null);
    const [profileRevision, setProfileRevision] = useState(0);

    useEffect(() => {
        const updateTextMode = () => {
            const isHome = location.pathname === APP_ROUTES.home;
            setUseDarkText(!isHome || window.scrollY > 80);
        };

        updateTextMode();
        window.addEventListener("scroll", updateTextMode, { passive: true });

        return () => {
            window.removeEventListener("scroll", updateTextMode);
        };
    }, [location.pathname]);

    useEffect(() => {
        const handleProfileUpdate = () => setProfileRevision((current) => current + 1);

        window.addEventListener("account-profile-updated", handleProfileUpdate);
        return () => window.removeEventListener("account-profile-updated", handleProfileUpdate);
    }, []);

    useEffect(() => {
        let cancelled = false;

        const loadHostStatus = async () => {
            if (!currentUser) {
                setHostApplicationStatus(null);
                return;
            }

            if (isAdmin) {
                setHostApplicationStatus(null);
                return;
            }

            if (currentUser.role === "host") {
                setHostApplicationStatus("approved");
                return;
            }

            try {
                const result = await getHostApplicationMe();
                if (!cancelled) {
                    setHostApplicationStatus(result.hostApplicationStatus ?? result.status ?? null);
                }
            } catch {
                if (!cancelled) {
                    setHostApplicationStatus(null);
                }
            }
        };

        void loadHostStatus();

        return () => {
            cancelled = true;
        };
    }, [currentUser, isAdmin]);

    const desktopLinkClass = useDarkText
        ? "transition-colors hover:text-cyan-800"
        : "transition-colors hover:text-cyan-200";

    const mobileButtonClass = useDarkText
        ? "border-slate-300 bg-white/85 text-slate-900"
        : "border-white/40 bg-black/20 text-white backdrop-blur [text-shadow:0_1px_2px_rgba(0,0,0,0.75)]";

    const mobileOpen = mobileMenuPath === location.pathname;
    const isVisible = show || mobileOpen;
    const accountMenuUser = useMemo(() => {
        void profileRevision; // Consume dependency to ensure re-evaluation
        return currentUser ? getAccountProfileForUser(currentUser) : createGuestMenuProfile();
    }, [currentUser, profileRevision]);

    const hostAction =
        isAdmin
            ? { label: "Khu vực admin", to: APP_ROUTES.adminOverview }
            : hostApplicationStatus === "approved"
                ? { label: "Khu vực host", to: APP_ROUTES.ownerDashboard }
                : hostApplicationStatus === "pending"
                    ? { label: "Đang xét duyệt host", to: APP_ROUTES.hostStatus }
                    : hostApplicationStatus === "rejected"
                        ? { label: "Gửi lại hồ sơ host", to: APP_ROUTES.hostStatus }
                        : { label: "Trở thành host", to: APP_ROUTES.hostLanding };

    const renderBecomeHostLink = (mobile = false) => {
        if (isAdmin) {
            return null;
        }

        if (hostApplicationStatus === "approved") {
            return null;
        }

        if (hostApplicationStatus === "pending") {
            return (
                <Link to={APP_ROUTES.hostStatus} className={mobile ? "rounded-xl px-4 py-3" : undefined}>
                    <span className="inline-flex items-center rounded-full border border-yellow-200 bg-yellow-50 px-3 py-1 text-sm font-medium text-yellow-700">
                        ⏳ Đang xét duyệt
                    </span>
                </Link>
            );
        }

        if (hostApplicationStatus === "rejected") {
            return (
                <Link
                    to={APP_ROUTES.hostStatus}
                    className={
                        mobile
                            ? "rounded-xl px-4 py-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 hover:text-red-700"
                            : "text-sm font-medium text-red-600 transition-colors hover:text-red-700"
                    }
                >
                    Gửi lại hồ sơ
                </Link>
            );
        }

        return (
            <Link
                to={APP_ROUTES.hostLanding}
                className={
                    mobile
                        ? "rounded-xl px-4 py-3 text-sm font-medium text-cyan-800 transition-all duration-200 hover:bg-cyan-300/10"
                        : `hidden min-h-11 items-center justify-center rounded-xl border px-4 py-2 text-sm font-medium transition-all duration-200 md:inline-flex ${useDarkText
                            ? "border-cyan-300/50 bg-white text-cyan-800 hover:bg-cyan-300/10"
                            : "border-white/30 bg-white/12 text-white backdrop-blur hover:bg-white/18"
                        }`
                }
            >
                Trở thành host
            </Link>
        );
    };

    const renderMobileWishlistLink = () => {
        if (!currentUser) {
            return null;
        }

        return (
            <Link
                to={APP_ROUTES.accountWishlist}
                className="rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 hover:bg-slate-50"
                onClick={() => setMobileMenuPath(null)}
            >
                Danh sách yêu thích
            </Link>
        );
    };

    return (
        <header
            className={`fixed left-0 top-0 z-50 w-full py-3 transition-transform duration-[520ms] ease-[cubic-bezier(0.22,0.61,0.36,1)] will-change-transform md:py-4 ${isVisible ? "translate-y-0" : "pointer-events-none -translate-y-[110%]"
                }`}
        >
            <div className="container mx-auto flex items-center justify-between px-4 md:px-6">
                <Link to={APP_ROUTES.home}>
                    <img src={logo} alt="Minh Thanh Villa" className="h-8 object-contain md:h-9" />
                </Link>

                <nav
                    className={`hidden items-center space-x-8 text-base font-medium md:flex ${useDarkText ? "text-slate-900" : "text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.75)]"
                        }`}
                >
                    {navLinks.map(({ to, label }) => {
                        const isActive = location.pathname === to;

                        return (
                            <Link
                                key={to}
                                to={to}
                                className={`${desktopLinkClass} ${isActive ? "text-cyan-600" : ""}`}
                            >
                                {label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="flex items-center gap-2 md:gap-3">
                    {renderBecomeHostLink()}

                    {currentUser ? <NotificationBell /> : null}

                    <AccountMenu
                        key={location.pathname}
                        user={accountMenuUser}
                        isAuthenticated={Boolean(currentUser)}
                        hostAction={hostAction}
                    />

                    <button
                        type="button"
                        aria-label="Mở menu điều hướng"
                        onClick={() =>
                            setMobileMenuPath((current) => (current === location.pathname ? null : location.pathname))
                        }
                        className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition-colors md:hidden ${mobileButtonClass}`}
                    >
                        {mobileOpen ? <LuX size={18} /> : <LuMenu size={18} />}
                    </button>
                </div>
            </div>

            {mobileOpen && (
                <div className="px-4 pt-3 md:hidden">
                    <div className="mx-auto max-w-7xl rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-md backdrop-blur">
                        <nav className="flex flex-col text-slate-900">
                            {navLinks.map(({ to, label }) => (
                                <Link
                                    key={to}
                                    to={to}
                                    className="rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 hover:bg-slate-50"
                                    onClick={() => setMobileMenuPath(null)}
                                >
                                    {label}
                                </Link>
                            ))}

                            {renderMobileWishlistLink()}
                            {hostApplicationStatus === "pending" ? null : renderBecomeHostLink(true)}

                            <div className="mt-1 border-t border-gray-100 pt-1">
                                {currentUser ? (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setMobileMenuPath(null);
                                            import("../../../services/authService").then(({ logout: doLogout }) => {
                                                doLogout();
                                                window.location.href = APP_ROUTES.login;
                                            });
                                        }}
                                        className="w-full rounded-xl px-4 py-3 text-left text-sm font-medium text-red-600 transition-all duration-200 hover:bg-red-50"
                                    >
                                        Đăng xuất
                                    </button>
                                ) : (
                                    <Link
                                        to={APP_ROUTES.login}
                                        className="block rounded-xl px-4 py-3 text-sm font-semibold text-cyan-600 transition-all duration-200 hover:bg-cyan-50"
                                        onClick={() => setMobileMenuPath(null)}
                                    >
                                        Đăng nhập
                                    </Link>
                                )}
                            </div>
                        </nav>
                    </div>
                </div>
            )}
        </header>
    );
};

export default Header;
