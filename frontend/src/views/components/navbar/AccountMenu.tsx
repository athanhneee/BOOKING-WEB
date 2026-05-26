import { useEffect, useRef, useState } from "react";
import type { IconType } from "react-icons";
import {
    LuCircleHelp,
    LuHeart,
    LuHouse,
    LuLogIn,
    LuLogOut,
    LuMenu,
    LuMessageSquare,
    LuPlane,
    LuSearch,
    LuSettings,
    LuUserRound,
    LuX,
} from "react-icons/lu";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { APP_ROUTES } from "../../../config/routes";
import type { AccountUserProfile } from "../../../models/entities/AccountProfile";
import { logout } from "../../../services/authService";
import { getCurrentUser, isHostUser } from "../../../store/authStore";
import { cn } from "../../../utils";

type MenuItem = {
    key: string;
    label: string;
    icon: IconType;
    to?: string;
    action?: () => void;
};

type MenuGroup = {
    key: string;
    items: MenuItem[];
};

type AccountMenuProps = {
    user: AccountUserProfile;
    isAuthenticated: boolean;
    hostAction?: {
        label: string;
        to: string;
    };
};

const createMenuGroups = (
    hostAction: AccountMenuProps["hostAction"],
    onMessagesClick: () => void,
    onLogout: () => void,
    isAuthenticated: boolean,
): MenuGroup[] => [
    {
        key: "personal",
        items: [
            { key: "favorites", label: "Danh sách yêu thích", icon: LuHeart, to: APP_ROUTES.search },
            { key: "trips", label: "Chuyến đi", icon: LuPlane, to: APP_ROUTES.accountTrips },
            { key: "messages", label: "Tin nhắn", icon: LuMessageSquare, action: onMessagesClick },
            { key: "profile", label: "Hồ sơ", icon: LuUserRound, to: APP_ROUTES.accountProfile },
        ],
    },
    {
        key: "account",
        items: [
            { key: "settings", label: "Cài đặt tài khoản", icon: LuSettings, to: APP_ROUTES.accountProfile },
            { key: "help", label: "Trung tâm trợ giúp", icon: LuCircleHelp },
        ],
    },
    {
        key: "host",
        items: [
            { key: "become-host", label: hostAction?.label ?? "Trở thành Host", icon: LuHouse, to: hostAction?.to ?? APP_ROUTES.hostLanding },
            { key: "host-support", label: "Tìm hỗ trợ Host", icon: LuSearch, to: APP_ROUTES.ownerDashboard },
        ],
    },
    {
        key: "auth",
        items: [
            isAuthenticated
                ? { key: "logout", label: "Đăng xuất", icon: LuLogOut, action: onLogout }
                : { key: "login", label: "Đăng nhập", icon: LuLogIn, to: APP_ROUTES.login },
        ],
    },
];

const isMobileViewport = () =>
    typeof window !== "undefined" && window.matchMedia("(max-width: 767.98px)").matches;

const getInitials = (displayName: string) =>
    displayName
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join("");

const AccountMenu = ({ user, isAuthenticated, hostAction }: AccountMenuProps) => {
    const navigate = useNavigate();
    const location = useLocation();
    const desktopRef = useRef<HTMLDivElement | null>(null);
    const [isDesktopOpen, setIsDesktopOpen] = useState(false);
    const [isMobileMounted, setIsMobileMounted] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const closeTimerRef = useRef<number | null>(null);

    const handleLogout = () => {
        logout();
        setIsDesktopOpen(false);
        setIsMobileOpen(false);
        navigate(APP_ROUTES.login, { replace: true });
    };

    const handleMessagesClick = () => {
        const currentUser = getCurrentUser();

        if (!currentUser) {
            navigate(`${APP_ROUTES.login}?redirectTo=${encodeURIComponent(location.pathname + location.search)}`);
            return;
        }

        navigate(isHostUser(currentUser) ? APP_ROUTES.hostMessages : APP_ROUTES.messages);
    };

    const menuGroups = createMenuGroups(hostAction, handleMessagesClick, handleLogout, isAuthenticated);

    useEffect(() => {
        if (!isDesktopOpen) {
            return;
        }

        const handlePointerDown = (event: PointerEvent) => {
            if (desktopRef.current && !desktopRef.current.contains(event.target as Node)) {
                setIsDesktopOpen(false);
            }
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setIsDesktopOpen(false);
            }
        };

        document.addEventListener("pointerdown", handlePointerDown);
        window.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("pointerdown", handlePointerDown);
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [isDesktopOpen]);

    useEffect(() => {
        if (!isMobileMounted) {
            return;
        }

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setIsMobileOpen(false);
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [isMobileMounted]);

    useEffect(
        () => () => {
            if (closeTimerRef.current !== null) {
                window.clearTimeout(closeTimerRef.current);
            }
        },
        [],
    );

    useEffect(() => {
        if (isMobileOpen) {
            if (closeTimerRef.current !== null) {
                window.clearTimeout(closeTimerRef.current);
                closeTimerRef.current = null;
            }
            return;
        }

        if (isMobileMounted) {
            closeTimerRef.current = window.setTimeout(() => {
                setIsMobileMounted(false);
                closeTimerRef.current = null;
            }, 220);
        }
    }, [isMobileMounted, isMobileOpen]);

    const openMobileSheet = () => {
        if (closeTimerRef.current !== null) {
            window.clearTimeout(closeTimerRef.current);
            closeTimerRef.current = null;
        }

        setIsMobileMounted(true);
        window.requestAnimationFrame(() => setIsMobileOpen(true));
    };

    const closeMobileSheet = () => {
        setIsMobileOpen(false);
    };

    const handleTriggerClick = () => {
        if (isMobileViewport()) {
            if (isMobileMounted) {
                closeMobileSheet();
                return;
            }

            openMobileSheet();
            return;
        }

        setIsDesktopOpen((current) => !current);
    };

    const triggerContent = (
        <>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-cyan-700 text-sm font-semibold text-white shadow-sm">
                {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.displayName} className="h-10 w-10 rounded-full object-cover" />
                ) : (
                    getInitials(user.displayName)
                )}
            </span>
            <span className="hidden text-sm font-medium text-slate-700 md:inline">{user.displayName}</span>
            <LuMenu size={18} className="text-slate-500" />
        </>
    );

    const renderMenuItem = (item: MenuItem, close: () => void) => {
        const content = (
            <>
                <item.icon size={17} className="text-slate-500 transition-colors duration-200 group-hover:text-cyan-700" />
                <span className="flex-1">{item.label}</span>
            </>
        );

        if (item.to) {
            return (
                <Link
                    key={item.key}
                    to={item.to}
                    onClick={close}
                    className="group flex min-h-11 items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 transition-all duration-200 hover:bg-cyan-300/10 hover:text-cyan-800"
                >
                    {content}
                </Link>
            );
        }

        return (
            <button
                key={item.key}
                type="button"
                onClick={() => {
                    item.action?.();
                    close();
                }}
                className="group flex min-h-11 w-full items-center gap-3 rounded-xl px-4 py-2.5 text-left text-sm font-medium text-slate-700 transition-all duration-200 hover:bg-cyan-300/10 hover:text-cyan-800"
            >
                {content}
            </button>
        );
    };

    return (
        <>
            <div ref={desktopRef} className="relative">
                <button
                    type="button"
                    onClick={handleTriggerClick}
                    className="inline-flex min-h-11 items-center gap-3 rounded-full border border-slate-200 bg-white px-2.5 py-2 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-cyan-300/50 hover:shadow-md"
                    aria-haspopup="menu"
                    aria-expanded={isDesktopOpen || isMobileOpen}
                    aria-label="Mở menu tài khoản"
                >
                    {triggerContent}
                </button>

                <div
                    className={cn(
                        "absolute right-0 top-[calc(100%+12px)] hidden w-[320px] origin-top-right rounded-2xl border border-slate-200 bg-white p-2 shadow-md transition-all duration-200 md:block",
                        isDesktopOpen
                            ? "visible translate-y-0 opacity-100"
                            : "pointer-events-none invisible -translate-y-2 opacity-0",
                    )}
                >
                    {menuGroups.map((group, index) => (
                        <div key={group.key} className={index === 0 ? undefined : "mt-2 border-t border-gray-100 pt-2"}>
                            {group.items.map((item) => renderMenuItem(item, () => setIsDesktopOpen(false)))}
                        </div>
                    ))}
                </div>
            </div>

            {isMobileMounted ? (
                <div className="fixed inset-0 z-[85] md:hidden">
                    <button
                        type="button"
                        className={cn(
                            "absolute inset-0 bg-slate-950/40 transition-opacity duration-200",
                            isMobileOpen ? "opacity-100" : "opacity-0",
                        )}
                        onClick={closeMobileSheet}
                        aria-label="Đóng menu tài khoản"
                    />

                    <div
                        className={cn(
                            "absolute inset-x-0 bottom-0 rounded-t-2xl bg-white px-4 pb-8 pt-4 shadow-md transition-all duration-200",
                            isMobileOpen ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0",
                        )}
                    >
                        <div className="mx-auto mb-4 h-1.5 w-14 rounded-full bg-slate-200" />

                        <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl bg-cyan-300/10 px-4 py-4">
                            <div className="flex items-center gap-3">
                                <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-cyan-700 text-sm font-semibold text-white">
                                    {user.avatarUrl ? (
                                        <img
                                            src={user.avatarUrl}
                                            alt={user.displayName}
                                            className="h-12 w-12 rounded-full object-cover"
                                        />
                                    ) : (
                                        getInitials(user.displayName)
                                    )}
                                </span>
                                <div>
                                    <p className="text-base font-semibold text-slate-900">{user.displayName}</p>
                                    <p className="text-sm text-slate-500">{user.location}</p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={closeMobileSheet}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white bg-white text-slate-600"
                                aria-label="Đóng"
                            >
                                <LuX size={18} />
                            </button>
                        </div>

                        {menuGroups.map((group, index) => (
                            <div key={group.key} className={index === 0 ? undefined : "mt-2 border-t border-gray-100 pt-2"}>
                                {group.items.map((item) => renderMenuItem(item, closeMobileSheet))}
                            </div>
                        ))}
                    </div>
                </div>
            ) : null}
        </>
    );
};

export default AccountMenu;
