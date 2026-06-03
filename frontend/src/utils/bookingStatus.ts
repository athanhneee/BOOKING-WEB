import type { ApiBooking } from "../models/entities/Booking";

export type BookingStatusTone = "warning" | "danger" | "success" | "info" | "muted";
export type BookingActionRole = "guest" | "host" | "admin";

export type BookingDisplayStatusCode =
    | "pending_payment"
    | "payment_expired"
    | "paid"
    | "confirmed"
    | "checked_in"
    | "checked_out"
    | "completed"
    | "cancelled_by_guest"
    | "cancelled_by_host"
    | "cancelled_by_admin"
    | "rejected"
    | "refund_pending"
    | "refunded"
    | "payout_pending"
    | "payout_paid"
    | "unknown";

export type BookingStatusActions = {
    canConfirm: boolean;
    canCheckIn: boolean;
    canCheckOut: boolean;
    canCancel: boolean;
};

export type BookingDisplayStatus = {
    label: string;
    tone: BookingStatusTone;
    normalizedStatus: BookingDisplayStatusCode;
    code: BookingDisplayStatusCode;
    reason?: string | null;
    isTerminal?: boolean;
    canHostConfirm?: boolean;
    canHostCancel?: boolean;
    actions: BookingStatusActions;
};

type BookingDisplayOptions =
    | Date
    | {
        now?: Date;
        role?: BookingActionRole;
    };

type BookingActionOptions =
    | Date
    | {
        today?: Date;
        role?: BookingActionRole;
    };

export const cancellationReasons = {
    customerCancelled: "CUSTOMER_CANCELLED",
    hostRejected: "HOST_REJECTED",
    adminCancelled: "ADMIN_CANCELLED",
    paymentExpired: "PAYMENT_EXPIRED",
} as const;

const terminalStatuses = new Set<BookingDisplayStatusCode>([
    "payment_expired",
    "completed",
    "cancelled_by_guest",
    "cancelled_by_host",
    "cancelled_by_admin",
    "rejected",
]);

const paidStatuses = new Set<BookingDisplayStatusCode>([
    "paid",
    "confirmed",
    "checked_in",
    "checked_out",
    "completed",
]);

const staffRoles = new Set<BookingActionRole>(["host", "admin"]);
const cancelledStatuses = new Set<BookingDisplayStatusCode>([
    "cancelled_by_guest",
    "cancelled_by_host",
    "cancelled_by_admin",
    "rejected",
]);

const emptyActions: BookingStatusActions = {
    canConfirm: false,
    canCheckIn: false,
    canCheckOut: false,
    canCancel: false,
};

export function getVietnamTodayDateString(now = new Date()) {
    return new Date(now.getTime() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export function isSameLocalDate(dateA: Date, dateB: Date) {
    return (
        dateA.getFullYear() === dateB.getFullYear() &&
        dateA.getMonth() === dateB.getMonth() &&
        dateA.getDate() === dateB.getDate()
    );
}

const normalizeStatusValue = (value?: unknown) => String(value ?? "").trim().toLowerCase();

const normalizeKnownDisplayStatus = (value?: unknown): BookingDisplayStatusCode | null => {
    const normalized = normalizeStatusValue(value);

    switch (normalized) {
        case "pending":
        case "pending_payment":
            return "pending_payment";
        case "expired":
        case "payment_expired":
            return "payment_expired";
        case "pending_host":
        case "pending_host_confirmation":
        case "paid":
            return "paid";
        case "confirmed":
            return "confirmed";
        case "checked_in":
            return "checked_in";
        case "checked_out":
            return "checked_out";
        case "completed":
            return "completed";
        case "cancelled_by_guest":
            return "cancelled_by_guest";
        case "host_cancelled":
        case "cancelled_by_host":
            return "cancelled_by_host";
        case "cancelled_by_admin":
            return "cancelled_by_admin";
        case "rejected":
            return "rejected";
        case "refund_pending":
            return "refund_pending";
        case "refunded":
            return "refunded";
        case "payout_pending":
            return "payout_pending";
        case "payout_paid":
            return "payout_paid";
        case "unknown":
            return "unknown";
        default:
            return null;
    }
};

const parseLocalDate = (value?: string | null) => {
    if (!value) {
        return null;
    }

    const [datePart] = value.split("T");
    const parts = datePart.split("-").map((part) => Number.parseInt(part, 10));

    if (parts.length !== 3 || parts.some((part) => Number.isNaN(part))) {
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
    }

    return new Date(parts[0], parts[1] - 1, parts[2]);
};

const getDateOnlyString = (value?: string | null) => {
    if (!value) {
        return null;
    }

    const [datePart] = value.split("T");

    if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
        return datePart;
    }

    const parsed = parseLocalDate(value);

    if (!parsed) {
        return null;
    }

    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, "0");
    const date = String(parsed.getDate()).padStart(2, "0");
    return `${year}-${month}-${date}`;
};

const parseDateTime = (value?: string | Date | null) => {
    if (!value) {
        return null;
    }

    const parsed = value instanceof Date ? value : new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const normalizeCancellationReason = (value?: string | null) => {
    const normalized = String(value ?? "").trim().toUpperCase();
    return normalized || null;
};

const normalizeLegacyCancellationStatus = (booking: ApiBooking): BookingDisplayStatusCode => {
    const reason = normalizeCancellationReason(booking.cancellationReason);

    if (reason === cancellationReasons.adminCancelled) {
        return "cancelled_by_admin";
    }

    if (reason === cancellationReasons.hostRejected) {
        return "rejected";
    }

    if (
        booking.cancelledByUserId !== null &&
        booking.cancelledByUserId !== undefined &&
        String(booking.cancelledByUserId) === String(booking.hostUserId)
    ) {
        return "cancelled_by_host";
    }

    return "cancelled_by_guest";
};

const getBackendDisplayCode = (booking: ApiBooking) =>
    normalizeKnownDisplayStatus(booking.displayStatus?.normalizedStatus) ??
    normalizeKnownDisplayStatus(booking.displayStatus?.code);

const getRawLifecycleStatus = (booking: ApiBooking) => {
    const backendDisplayCode = getBackendDisplayCode(booking);
    const publicStatus = normalizeKnownDisplayStatus(booking.status);
    const persistedStatus = normalizeKnownDisplayStatus(booking.persistedStatus);
    const internalStatus = normalizeKnownDisplayStatus(booking.internalStatus);

    if (backendDisplayCode && terminalStatuses.has(backendDisplayCode)) {
        return backendDisplayCode;
    }

    if (publicStatus && terminalStatuses.has(publicStatus)) {
        return publicStatus;
    }

    return internalStatus ?? persistedStatus ?? backendDisplayCode ?? publicStatus ?? "unknown";
};

export const getBookingLifecycleStatus = (booking: ApiBooking): BookingDisplayStatusCode => {
    const status = getRawLifecycleStatus(booking);

    if (status === "unknown") {
        const rawStatus = normalizeStatusValue(booking.internalStatus || booking.persistedStatus || booking.status);

        if (rawStatus === "cancelled") {
            return normalizeLegacyCancellationStatus(booking);
        }

        return "unknown";
    }

    const rawStatus = normalizeStatusValue(booking.internalStatus || booking.persistedStatus || booking.status);

    if (rawStatus === "cancelled") {
        return normalizeLegacyCancellationStatus(booking);
    }

    return status;
};

const isPaid = (booking: ApiBooking) => {
    const status = getBookingLifecycleStatus(booking);
    const paymentStatus = normalizeStatusValue(booking.paymentStatus);

    return paymentStatus === "paid" || Boolean(booking.paidAt) || paidStatuses.has(status);
};

const getPaymentStartedAt = (booking: ApiBooking) =>
    parseDateTime(booking.paymentStartedAt) ?? parseDateTime(booking.createdAt);

const getPaymentDeadline = (booking: ApiBooking) => {
    const explicitDeadline = parseDateTime(booking.paymentExpiresAt) ?? parseDateTime(booking.lockedUntil);

    if (explicitDeadline) {
        return explicitDeadline;
    }

    const startedAt = getPaymentStartedAt(booking);
    return startedAt ? new Date(startedAt.getTime() + 15 * 60 * 1000) : null;
};

export function getBookingPaymentDeadline(booking: ApiBooking) {
    return getPaymentDeadline(booking);
}

export function getRemainingBookingPaymentSeconds(booking: ApiBooking, now = new Date()) {
    const paymentDeadline = getPaymentDeadline(booking);

    if (!paymentDeadline) {
        return 0;
    }

    return Math.max(0, Math.floor((paymentDeadline.getTime() - now.getTime()) / 1000));
}

const getEffectiveLifecycleStatus = (booking: ApiBooking, now: Date): BookingDisplayStatusCode => {
    const lifecycleStatus = getBookingLifecycleStatus(booking);
    const cancellationReason = normalizeCancellationReason(booking.cancellationReason);
    const paymentDeadline = getPaymentDeadline(booking);

    if (
        !isPaid(booking) &&
        lifecycleStatus === "pending_payment" &&
        paymentDeadline &&
        paymentDeadline.getTime() <= now.getTime()
    ) {
        return "payment_expired";
    }

    if (cancellationReason === cancellationReasons.paymentExpired) {
        return "payment_expired";
    }

    if (lifecycleStatus === "pending_payment" && isPaid(booking)) {
        return "paid";
    }

    return lifecycleStatus;
};

const getRefundDisplayCode = (
    booking: ApiBooking,
    lifecycleStatus: BookingDisplayStatusCode,
): BookingDisplayStatusCode | null => {
    const explicitStatus =
        normalizeKnownDisplayStatus(booking.displayStatus?.normalizedStatus) ??
        normalizeKnownDisplayStatus(booking.displayStatus?.code) ??
        normalizeKnownDisplayStatus(booking.status);
    const paymentStatus = normalizeStatusValue(booking.paymentStatus);
    const refundStatus = normalizeStatusValue(booking.refundStatus);
    const canHaveRefund = terminalStatuses.has(lifecycleStatus) || lifecycleStatus === "payment_expired";

    if (explicitStatus === "refund_pending" || explicitStatus === "refunded") {
        return explicitStatus;
    }

    if (paymentStatus === "refunded" || refundStatus === "succeeded") {
        return "refunded";
    }

    if (canHaveRefund && ["pending", "processing"].includes(refundStatus)) {
        return "refund_pending";
    }

    return null;
};

const getPayoutDisplayCode = (
    booking: ApiBooking,
    lifecycleStatus: BookingDisplayStatusCode,
    role: BookingActionRole,
): BookingDisplayStatusCode | null => {
    if (!staffRoles.has(role) || !["checked_out", "completed"].includes(lifecycleStatus)) {
        return null;
    }

    const explicitStatus =
        normalizeKnownDisplayStatus(booking.displayStatus?.normalizedStatus) ??
        normalizeKnownDisplayStatus(booking.displayStatus?.code) ??
        normalizeKnownDisplayStatus(booking.status);
    const payoutStatus = normalizeStatusValue(booking.payoutStatus);

    if (explicitStatus === "payout_pending" || explicitStatus === "payout_paid") {
        return explicitStatus;
    }

    if (payoutStatus === "paid") {
        return "payout_paid";
    }

    if (["pending", "approved", "processing"].includes(payoutStatus)) {
        return "payout_pending";
    }

    return null;
};

const getCanonicalStatusMeta = (
    code: BookingDisplayStatusCode,
): Pick<BookingDisplayStatus, "label" | "tone"> => {
    switch (code) {
        case "pending_payment":
            return { label: "Chờ thanh toán", tone: "warning" };
        case "payment_expired":
            return { label: "Quá hạn thanh toán", tone: "danger" };
        case "paid":
            return { label: "Thanh toán thành công", tone: "success" };
        case "confirmed":
            return { label: "Đã xác nhận", tone: "success" };
        case "checked_in":
            return { label: "Đã nhận phòng", tone: "info" };
        case "checked_out":
            return { label: "Đã trả phòng", tone: "info" };
        case "completed":
            return { label: "Hoàn tất", tone: "success" };
        case "cancelled_by_guest":
            return { label: "Khách đã hủy", tone: "muted" };
        case "cancelled_by_host":
            return { label: "Host đã hủy", tone: "danger" };
        case "cancelled_by_admin":
            return { label: "Admin đã hủy", tone: "danger" };
        case "rejected":
            return { label: "Host đã từ chối", tone: "danger" };
        case "refund_pending":
            return { label: "Đang chờ hoàn tiền", tone: "warning" };
        case "refunded":
            return { label: "Đã hoàn tiền", tone: "success" };
        case "payout_pending":
            return { label: "Đang chờ chi trả", tone: "warning" };
        case "payout_paid":
            return { label: "Đã chi trả", tone: "success" };
        case "unknown":
        default:
            return { label: "Không rõ", tone: "muted" };
    }
};

const resolveDisplayOptions = (options?: BookingDisplayOptions) => {
    if (options instanceof Date) {
        return { now: options, role: "guest" as BookingActionRole };
    }

    return {
        now: options?.now ?? new Date(),
        role: options?.role ?? "guest",
    };
};

const resolveActionOptions = (options?: BookingActionOptions) => {
    if (options instanceof Date) {
        return { today: options, role: "host" as BookingActionRole };
    }

    return {
        today: options?.today ?? new Date(),
        role: options?.role ?? "host",
    };
};

const isDateTodayInVietnam = (dateValue: string | null | undefined, today: Date) => {
    const dateString = getDateOnlyString(dateValue);
    return Boolean(dateString && dateString === getVietnamTodayDateString(today));
};

const isDateReachedInVietnam = (dateValue: string | null | undefined, today: Date) => {
    const dateString = getDateOnlyString(dateValue);
    return Boolean(dateString && dateString <= getVietnamTodayDateString(today));
};

const buildBookingStatusActions = (
    booking: ApiBooking,
    role: BookingActionRole,
    today: Date,
): BookingStatusActions => {
    const lifecycleStatus = getEffectiveLifecycleStatus(booking, today);

    if (terminalStatuses.has(lifecycleStatus)) {
        return { ...emptyActions };
    }

    const isStaff = staffRoles.has(role);

    if (!isStaff) {
        return {
            ...emptyActions,
            canCancel: ["pending_payment", "paid", "confirmed"].includes(lifecycleStatus),
        };
    }

    return {
        canConfirm: lifecycleStatus === "paid",
        canCheckIn:
            ["paid", "confirmed"].includes(lifecycleStatus) &&
            isDateTodayInVietnam(booking.checkInDate, today),
        canCheckOut:
            lifecycleStatus === "checked_in" &&
            isDateReachedInVietnam(booking.checkOutDate, today),
        canCancel: ["paid", "confirmed"].includes(lifecycleStatus),
    };
};

export function getBookingDisplayStatus(
    booking: ApiBooking,
    options?: BookingDisplayOptions,
): BookingDisplayStatus {
    const { now, role } = resolveDisplayOptions(options);
    const lifecycleStatus = getEffectiveLifecycleStatus(booking, now);
    const refundCode = getRefundDisplayCode(booking, lifecycleStatus);
    const payoutCode = getPayoutDisplayCode(booking, lifecycleStatus, role);
    const guestSafeLifecycleStatus: BookingDisplayStatusCode =
        !staffRoles.has(role) && ["payout_pending", "payout_paid"].includes(lifecycleStatus)
            ? "checked_out"
            : lifecycleStatus;
    const code = payoutCode ?? refundCode ?? guestSafeLifecycleStatus;
    const meta = getCanonicalStatusMeta(code);
    const reason =
        code === "payment_expired"
            ? cancellationReasons.paymentExpired
            : booking.displayStatus?.reason ?? booking.cancellationReason ?? null;
    const hostActions = buildBookingStatusActions(booking, "host", now);
    const actions = buildBookingStatusActions(booking, role, now);

    return {
        ...meta,
        normalizedStatus: code,
        code,
        reason,
        isTerminal: terminalStatuses.has(lifecycleStatus) || terminalStatuses.has(code) || code === "refunded",
        canHostConfirm: hostActions.canConfirm,
        canHostCancel: hostActions.canCancel,
        actions,
    };
}

export const bookingStatusToneClassNames: Record<BookingStatusTone, string> = {
    warning: "bg-amber-50 text-amber-700",
    danger: "bg-rose-50 text-rose-700",
    success: "bg-emerald-50 text-emerald-700",
    info: "bg-cyan-50 text-cyan-700",
    muted: "bg-slate-100 text-slate-600",
};

export function getBookingStatusActions(
    booking: ApiBooking,
    options?: BookingActionOptions,
) {
    const { today, role } = resolveActionOptions(options);
    return buildBookingStatusActions(booking, role, today);
}

export function bookingMatchesDisplayStatus(
    booking: ApiBooking,
    status: BookingDisplayStatusCode | "cancelled" | "all",
    options?: BookingDisplayOptions,
) {
    if (status === "all") {
        return true;
    }

    const displayStatus = getBookingDisplayStatus(booking, options).normalizedStatus;

    if (status === "cancelled") {
        return cancelledStatuses.has(displayStatus);
    }

    return displayStatus === status;
}

export function canShowBookingConfirm(booking: ApiBooking, options?: BookingActionOptions) {
    return getBookingStatusActions(booking, options).canConfirm;
}

export function canShowBookingCheckIn(booking: ApiBooking, options?: BookingActionOptions) {
    return getBookingStatusActions(booking, options).canCheckIn;
}

export function canShowBookingCheckOut(booking: ApiBooking, options?: BookingActionOptions) {
    return getBookingStatusActions(booking, options).canCheckOut;
}

export function canShowHostBookingCancel(booking: ApiBooking, options?: BookingActionOptions) {
    return getBookingStatusActions(booking, { ...resolveActionOptions(options), role: "host" }).canCancel;
}
