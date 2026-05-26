import type { ApiBooking } from "../models/entities/Booking";

export type BookingStatusTone = "warning" | "danger" | "success" | "info" | "muted";

export type BookingDisplayStatus = {
    label: string;
    tone: BookingStatusTone;
    normalizedStatus: string;
};

const terminalStatuses = new Set(["expired", "completed", "cancelled", "host_cancelled", "rejected"]);

export function isSameLocalDate(dateA: Date, dateB: Date) {
    return (
        dateA.getFullYear() === dateB.getFullYear() &&
        dateA.getMonth() === dateB.getMonth() &&
        dateA.getDate() === dateB.getDate()
    );
}

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

const getRawBookingStatus = (booking: ApiBooking) => {
    const publicStatus = String(booking.status || "").toLowerCase();

    if (["cancelled_by_host", "host_cancelled", "cancelled_by_guest"].includes(publicStatus)) {
        return publicStatus;
    }

    return String(booking.internalStatus || booking.status || "").toLowerCase();
};

const normalizeBookingStatus = (booking: ApiBooking) => {
    const status = getRawBookingStatus(booking);

    if (status === "pending" || status === "pending_host_confirmation") {
        return "pending_host";
    }

    if (status === "cancelled_by_host") {
        return "host_cancelled";
    }

    if (status === "cancelled_by_guest") {
        return "cancelled";
    }

    return status;
};

export function getBookingDisplayStatus(booking: ApiBooking): BookingDisplayStatus {
    const now = new Date();
    const normalizedStatus = normalizeBookingStatus(booking);
    const paymentDeadline = booking.lockedUntil || booking.paymentExpiresAt;

    if (
        normalizedStatus === "pending_payment" &&
        paymentDeadline &&
        new Date(paymentDeadline).getTime() <= now.getTime()
    ) {
        return {
            label: "Quá hạn thanh toán",
            tone: "danger",
            normalizedStatus: "expired",
        };
    }

    switch (normalizedStatus) {
        case "pending_payment":
            return { label: "Chờ thanh toán", tone: "warning", normalizedStatus };
        case "expired":
            return { label: "Quá hạn thanh toán", tone: "danger", normalizedStatus };
        case "pending_host":
            return { label: "Chờ host xác nhận", tone: "warning", normalizedStatus };
        case "paid":
            return { label: "Thanh toán thành công", tone: "success", normalizedStatus };
        case "confirmed":
            return { label: "Đã xác nhận", tone: "success", normalizedStatus };
        case "checked_in":
            return { label: "Đang lưu trú", tone: "info", normalizedStatus };
        case "completed":
            return { label: "Hoàn tất", tone: "success", normalizedStatus };
        case "cancelled":
            return { label: "Đã hủy", tone: "muted", normalizedStatus };
        case "host_cancelled":
            return { label: "host hủy", tone: "danger", normalizedStatus };
        case "rejected":
            return { label: "Đã từ chối", tone: "danger", normalizedStatus };
        default:
            return { label: booking.status || "Không rõ", tone: "muted", normalizedStatus };
    }
}

export const bookingStatusToneClassNames: Record<BookingStatusTone, string> = {
    warning: "bg-amber-50 text-amber-700",
    danger: "bg-rose-50 text-rose-700",
    success: "bg-emerald-50 text-emerald-700",
    info: "bg-cyan-50 text-cyan-700",
    muted: "bg-slate-100 text-slate-600",
};

export function canShowBookingConfirm(booking: ApiBooking) {
    return getBookingDisplayStatus(booking).normalizedStatus === "pending_host";
}

export function canShowBookingCheckIn(booking: ApiBooking, today = new Date()) {
    const displayStatus = getBookingDisplayStatus(booking);

    if (!["paid", "confirmed"].includes(displayStatus.normalizedStatus)) {
        return false;
    }

    if (terminalStatuses.has(displayStatus.normalizedStatus)) {
        return false;
    }

    const checkInDate = parseLocalDate(booking.checkInDate);

    return Boolean(checkInDate && isSameLocalDate(today, checkInDate));
}

export function canShowBookingCheckOut(booking: ApiBooking, today = new Date()) {
    const displayStatus = getBookingDisplayStatus(booking);

    if (displayStatus.normalizedStatus !== "checked_in") {
        return false;
    }

    const checkOutDate = parseLocalDate(booking.checkOutDate);

    if (!checkOutDate) {
        return false;
    }

    return today.getTime() >= checkOutDate.getTime() || isSameLocalDate(today, checkOutDate);
}

export function canShowHostBookingCancel(booking: ApiBooking) {
    const displayStatus = getBookingDisplayStatus(booking);

    if (terminalStatuses.has(displayStatus.normalizedStatus)) {
        return false;
    }

    return ["pending_host", "paid", "confirmed"].includes(displayStatus.normalizedStatus);
}
