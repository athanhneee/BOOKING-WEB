import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
    getNotifications,
    markAllNotificationsRead,
    markNotificationRead,
    type NotificationItem,
} from "../../../services/notificationService";
import {
    connectSocket,
    offNewNotification,
    onNewNotification,
    type NotificationNewEvent,
} from "../../../services/socket/socketClient";
import { getAccessToken, getCurrentUser } from "../../../store/authStore";
import { cn } from "../../../utils";
import { APP_ROUTES } from "../../../config/routes";

type NotificationBellProps = {
    buttonClassName?: string;
};

const toNotificationItem = (payload: NotificationNewEvent): NotificationItem => ({
    ...payload,
    isRead: Boolean(payload.readAt),
    readAt: payload.readAt,
    updatedAt: payload.createdAt,
});

const formatNotificationTime = (value: string) =>
    new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(value));

const resolveNotificationUrl = (notification: NotificationItem): string | null => {
    // Use the backend-provided actionUrl if it exists and looks like a valid path
    if (notification.actionUrl) {
        return notification.actionUrl;
    }

    const targetId = notification.targetId;
    const eventType = notification.eventType?.toLowerCase() ?? "";
    const targetType = notification.targetType?.toLowerCase() ?? "";

    // Booking-related notifications
    if (targetType === "booking" || eventType.includes("booking")) {
        if (eventType.includes("payment") || eventType.includes("pending_payment")) {
            return targetId ? APP_ROUTES.guestPaymentDetail(targetId) : APP_ROUTES.accountTrips;
        }
        if (eventType.includes("host") || eventType.includes("owner")) {
            return APP_ROUTES.hostBookings;
        }
        return APP_ROUTES.accountTrips;
    }

    // Review-related notifications
    if (targetType === "review" || eventType.includes("review")) {
        if (eventType.includes("host")) {
            return APP_ROUTES.hostReviews;
        }
        return APP_ROUTES.accountTrips;
    }

    // Message-related notifications
    if (targetType === "message" || targetType === "conversation" || eventType.includes("message")) {
        return APP_ROUTES.messages;
    }

    // Listing-related notifications
    if (targetType === "listing" || eventType.includes("listing")) {
        if (targetId) {
            return APP_ROUTES.villaDetail(targetId);
        }
        return APP_ROUTES.hostProperties;
    }

    // Host application notifications
    if (eventType.includes("host_application") || eventType.includes("host_approved") || eventType.includes("host_rejected")) {
        return APP_ROUTES.hostStatus;
    }

    return null;
};

const NotificationBell = ({ buttonClassName }: NotificationBellProps) => {
    const navigate = useNavigate();
    const currentUser = getCurrentUser();
    const rootRef = useRef<HTMLDivElement | null>(null);
    const mobilePanelRef = useRef<HTMLDivElement | null>(null);
    const desktopPanelRef = useRef<HTMLDivElement | null>(null);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [items, setItems] = useState<NotificationItem[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loadError, setLoadError] = useState<string | null>(null);

    const currentUserId = currentUser?.id;

    useEffect(() => {
        if (!currentUserId) {
            setItems([]);
            setUnreadCount(0);
            return;
        }

        let cancelled = false;

        const loadNotifications = async () => {
            setLoading(true);

            try {
                const result = await getNotifications({ page: 1, limit: 10 });

                if (!cancelled) {
                    setItems(result.items);
                    setUnreadCount(result.unreadCount);
                    setLoadError(null);
                }
            } catch {
                if (!cancelled) {
                    setItems([]);
                    setUnreadCount(0);
                    setLoadError("Không tải được thông báo.");
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        void loadNotifications();

        return () => {
            cancelled = true;
        };
    }, [currentUserId]);

    useEffect(() => {
        if (!currentUserId) {
            return;
        }

        connectSocket(getAccessToken());

        const handleNewNotification = (payload: NotificationNewEvent) => {
            setItems((current) => {
                if (current.some((item) => item.notificationLogId === payload.notificationLogId)) {
                    return current;
                }

                return [toNotificationItem(payload), ...current].slice(0, 10);
            });
            setUnreadCount((current) => current + (payload.readAt ? 0 : 1));
        };

        onNewNotification(handleNewNotification);

        return () => {
            offNewNotification(handleNewNotification);
        };
    }, [currentUserId]);

    useEffect(() => {
        if (!open) {
            return;
        }

        const handlePointerDown = (event: PointerEvent) => {
            const target = event.target as Node;

            if (
                rootRef.current?.contains(target) ||
                mobilePanelRef.current?.contains(target) ||
                desktopPanelRef.current?.contains(target)
            ) {
                return;
            }

            setOpen(false);
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setOpen(false);
            }
        };

        document.addEventListener("pointerdown", handlePointerDown);
        window.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("pointerdown", handlePointerDown);
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [open]);

    if (!currentUser) {
        return null;
    }

    const markItemRead = async (notification: NotificationItem) => {
        try {
            if (!notification.isRead) {
                const updated = await markNotificationRead(notification.notificationLogId);

                setItems((current) =>
                    current.map((item) =>
                        item.notificationLogId === notification.notificationLogId
                            ? {
                                ...item,
                                isRead: true,
                                readAt: updated.readAt ?? new Date().toISOString(),
                            }
                            : item,
                    ),
                );
                setUnreadCount((current) => Math.max(0, current - 1));
                setLoadError(null);
            }
        } catch {
            setLoadError("Không cập nhật được thông báo.");
            return;
        }

        if (notification.actionUrl) {
            setOpen(false);
            navigate(notification.actionUrl);
        } else {
            const resolvedUrl = resolveNotificationUrl(notification);
            if (resolvedUrl) {
                setOpen(false);
                navigate(resolvedUrl);
            }
        }
    };

    const markAllRead = async () => {
        if (unreadCount === 0) {
            return;
        }

        let readAt = new Date().toISOString();

        try {
            const result = await markAllNotificationsRead();
            readAt = result.readAt ?? readAt;
        } catch {
            setLoadError("Không đánh dấu được thông báo.");
            return;
        }

        setItems((current) =>
            current.map((item) => ({
                ...item,
                isRead: true,
                readAt: item.readAt ?? readAt,
            })),
        );
        setUnreadCount(0);
        setLoadError(null);
    };

    const renderNotificationList = () => (
        <>
            {loading ? (
                <div className="flex items-center justify-center px-4 py-8 text-slate-500">
                    <Loader2 size={18} className="animate-spin" />
                </div>
            ) : null}

            {!loading && loadError ? (
                <p className="mx-4 my-3 rounded-2xl border border-amber-100 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700">
                    {loadError}
                </p>
            ) : null}

            {!loading && !loadError && items.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-slate-500">Chưa có thông báo.</p>
            ) : null}

            {items.map((item) => (
                <button
                    key={item.notificationLogId}
                    type="button"
                    onClick={() => void markItemRead(item)}
                    className="flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-cyan-50/60"
                >
                    <span
                        className={cn(
                            "mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full",
                            item.isRead ? "bg-slate-200" : "bg-cyan-500",
                        )}
                    />
                    <span className="min-w-0 flex-1 overflow-hidden">
                        <span className="block text-sm font-semibold text-slate-900" style={{ wordBreak: "break-word", overflowWrap: "anywhere" }}>
                            {item.title ?? "Thông báo mới"}
                        </span>
                        {item.body ? (
                            <span className="mt-1 block text-sm leading-5 text-slate-600" style={{ wordBreak: "break-word", overflowWrap: "anywhere" }}>
                                {item.body}
                            </span>
                        ) : null}
                        <span className="mt-1.5 block text-xs text-slate-400">
                            {formatNotificationTime(item.createdAt)}
                        </span>
                    </span>
                </button>
            ))}
        </>
    );

    const mobilePanel =
        open && typeof document !== "undefined"
            ? createPortal(
                <div ref={mobilePanelRef} className="fixed inset-0 z-[120] md:hidden">
                    <div
                        className="absolute inset-0 bg-black/40"
                        onClick={() => setOpen(false)}
                        role="presentation"
                    />
                    <div className="absolute inset-x-0 bottom-0 flex max-h-[82vh] flex-col rounded-t-2xl bg-white shadow-xl">
                        <div className="shrink-0 px-4 pt-3">
                            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-slate-200" />
                            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
                                <div>
                                    <p className="text-base font-semibold text-slate-900">Thông báo</p>
                                    <p className="text-xs text-slate-500">{unreadCount} chưa đọc</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => void markAllRead()}
                                    disabled={unreadCount === 0}
                                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-50 hover:text-cyan-600 disabled:opacity-40"
                                    aria-label="Đánh dấu tất cả đã đọc"
                                >
                                    <CheckCheck size={17} />
                                </button>
                            </div>
                        </div>
                        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden pb-[max(1rem,env(safe-area-inset-bottom))]">
                            {renderNotificationList()}
                        </div>
                    </div>
                </div>,
                document.body,
            )
            : null;

    return (
        <div ref={rootRef} className="relative">
            <button
                type="button"
                aria-label="Thông báo"
                aria-haspopup="menu"
                aria-expanded={open}
                onClick={() => setOpen((current) => !current)}
                className={cn(
                    "relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition-colors hover:border-cyan-300 hover:text-cyan-800",
                    buttonClassName,
                )}
            >
                <Bell size={18} />
                {unreadCount > 0 ? (
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-bold leading-none text-white">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                ) : null}
            </button>

            {mobilePanel}

            {open ? (
                <div
                    ref={desktopPanelRef}
                    className="absolute right-0 top-[calc(100%+12px)] z-50 hidden w-[22rem] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl md:block"
                >
                    <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
                        <div>
                            <p className="text-sm font-semibold text-slate-900">Thông báo</p>
                            <p className="text-xs text-slate-500">{unreadCount} chưa đọc</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => void markAllRead()}
                            disabled={unreadCount === 0}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-50 hover:text-cyan-600 disabled:opacity-40"
                            aria-label="Đánh dấu tất cả đã đọc"
                        >
                            <CheckCheck size={17} />
                        </button>
                    </div>
                    <div className="max-h-[420px] overflow-y-auto py-1">
                        {renderNotificationList()}
                    </div>
                </div>
            ) : null}
        </div>
    );
};

export default NotificationBell;
