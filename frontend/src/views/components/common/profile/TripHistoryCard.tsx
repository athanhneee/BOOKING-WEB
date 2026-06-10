import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { APP_ROUTES } from "../../../../config/routes";
import {
    LuArrowRight,
    LuCalendar,
    LuChevronDown,
    LuChevronUp,
    LuCreditCard,
    LuMapPin,
    LuMoon,
    LuReceiptText,
    LuStickyNote,
    LuUsers,
} from "react-icons/lu";
import type { TripHistory } from "../../../../models/entities/TripHistory";
import { bookingStatusToneClassNames, cn } from "../../../../utils";

type TripHistoryCardProps = {
    trip: TripHistory;
    onReview?: () => void;
};

type DetailItemProps = {
    icon: ReactNode;
    label: string;
    value: ReactNode;
};

const priceFormatter = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
});

const formatTripDate = (value: string) => {
    const parsed = new Date(`${value}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(parsed);
};

const formatTripDateTime = (value?: string | null) => {
    if (!value) {
        return "Chưa cập nhật";
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(parsed);
};

const getStatusMeta = (trip: TripHistory) => {
    if (trip.bookingStatusLabel) {
        return {
            label: trip.bookingStatusLabel,
            className: bookingStatusToneClassNames[trip.bookingStatusTone ?? "muted"],
        };
    }

    switch (trip.status) {
        case "completed":
            return {
                label: "Hoàn tất",
                className: "bg-emerald-50 text-emerald-700",
            };
        case "pending_review":
            return {
                label: "Chờ đánh giá",
                className: "bg-amber-50 text-amber-700",
            };
        case "active":
            return {
                label: "Đang hiệu lực",
                className: "bg-cyan-50 text-cyan-700",
            };
        case "cancelled":
            return {
                label: "Đã hủy",
                className: "bg-rose-50 text-rose-700",
            };
        default:
            return {
                label: "Đang xử lý",
                className: "bg-slate-100 text-slate-600",
            };
    }
};

const getPaymentStatusLabel = (status?: string | null) => {
    if (!status) {
        return "Chưa cập nhật";
    }

    switch (status.toLowerCase()) {
        case "paid":
        case "success":
            return "Đã thanh toán";
        case "pending":
        case "pending_payment":
            return "Chờ thanh toán";
        case "failed":
            return "Thanh toán thất bại";
        case "expired":
            return "Quá hạn thanh toán";
        case "refund_pending":
            return "Đang chờ hoàn tiền";
        case "cancelled":
            return "Đã hủy";
        case "refunded":
            return "Đã hoàn tiền";
        default:
            return status;
    }
};

const DetailItem = ({ icon, label, value }: DetailItemProps) => (
    <div className="flex gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cyan-50 text-cyan-700">
            {icon}
        </span>
        <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-normal text-slate-400">{label}</p>
            <div className="mt-1 text-sm font-medium leading-6 text-slate-700">{value}</div>
        </div>
    </div>
);

const TripHistoryCard = ({ trip, onReview }: TripHistoryCardProps) => {
    const navigate = useNavigate();
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const statusMeta = getStatusMeta(trip);

    const isPendingPayment = trip.bookingStatusCode === "pending_payment" || (trip.paymentStatus?.toLowerCase() === "pending" && trip.status === "active");

    const handleRebook = () => {
        if (trip.listingId) {
            navigate(APP_ROUTES.villaDetail(String(trip.listingId)));
        } else {
            navigate(APP_ROUTES.search);
        }
    };

    const handleContinuePayment = () => {
        navigate(APP_ROUTES.guestPaymentDetail(trip.id));
    };

    const guestCountLabel = trip.guestCount ? `${trip.guestCount} khách` : "Chưa cập nhật";
    const address = trip.address || trip.location || "Chưa cập nhật";
    const actions = [
        { key: "detail", label: isDetailOpen ? "Ẩn chi tiết" : "Xem chi tiết", variant: "secondary" as const },
        ...(isPendingPayment
            ? [{ key: "continue-payment", label: "Tiếp tục thanh toán", variant: "primary" as const }]
            : trip.status === "pending_review"
                ? [{ key: "review", label: "Viết đánh giá", variant: "primary" as const }]
                : trip.status === "active"
                    ? []
                    : trip.hasReview
                        ? [{ key: "reviewed", label: "Đã đánh giá", variant: "secondary" as const }]
                        : trip.canReview
                            ? [
                                { key: "review", label: "Viết đánh giá", variant: "primary" as const },
                                { key: "rebook", label: "Đặt lại", variant: "secondary" as const },
                            ]
                            : [{ key: "rebook", label: "Đặt lại", variant: "secondary" as const }]),
    ];

    return (
        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-5">
            <div className="grid gap-5 md:grid-cols-[160px_minmax(0,1fr)] xl:grid-cols-[160px_minmax(0,1fr)_220px] xl:items-center">
                {trip.imageUrl ? (
                    <img
                        src={trip.imageUrl}
                        alt={trip.propertyName}
                        className="h-52 w-full rounded-2xl object-cover md:h-[120px] md:w-[160px]"
                    />
                ) : (
                    <div className="flex h-52 w-full items-center justify-center rounded-2xl bg-slate-100 text-sm font-medium text-slate-500 md:h-[120px] md:w-[160px]">
                        Chưa có ảnh
                    </div>
                )}

                <div className="min-w-0">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900">{trip.propertyName}</h3>
                            <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                                <LuMapPin size={16} className="text-cyan-500" />
                                <span>{trip.location}</span>
                            </p>
                        </div>

                        <span className={cn("rounded-full px-3 py-1.5 text-xs font-semibold", statusMeta.className)}>
                            {statusMeta.label}
                        </span>
                    </div>

                    <div className="mt-4 flex flex-col gap-2 text-sm text-slate-600 sm:flex-row sm:flex-wrap sm:gap-4">
                        <span className="inline-flex items-center gap-2">
                            <LuCalendar size={16} className="text-cyan-500" />
                            {formatTripDate(trip.checkIn)} - {formatTripDate(trip.checkOut)}
                        </span>
                        <span className="inline-flex items-center gap-2">
                            <LuMoon size={16} className="text-cyan-500" />
                            {trip.nights} đêm
                        </span>
                    </div>
                </div>

                <div className="flex flex-col gap-3 xl:items-end">
                    <p className="text-2xl font-semibold text-cyan-700">{priceFormatter.format(trip.totalPrice)}</p>

                    <div className="flex flex-col gap-2 sm:flex-row xl:flex-col xl:items-stretch">
                        {actions.map((action) => (
                            <button
                                key={action.key}
                                type="button"
                                onClick={
                                    action.key === "detail"
                                        ? () => setIsDetailOpen((currentValue) => !currentValue)
                                        : action.key === "rebook"
                                            ? handleRebook
                                            : action.key === "continue-payment"
                                                ? handleContinuePayment
                                                : action.key === "review"
                                                    ? onReview
                                                    : undefined
                                }
                                aria-expanded={action.key === "detail" ? isDetailOpen : undefined}
                                className={cn(
                                    "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200",
                                    action.variant === "primary"
                                        ? "bg-cyan-500 text-white hover:bg-cyan-500"
                                        : "border border-cyan-300/50 bg-white text-cyan-800 hover:bg-cyan-300/10",
                                    action.key === "reviewed" && "opacity-50 cursor-not-allowed hover:bg-white"
                                )}
                                disabled={action.key === "reviewed"}
                            >
                                {action.label}
                                {action.key === "detail" ? (
                                    isDetailOpen ? <LuChevronUp size={16} /> : <LuChevronDown size={16} />
                                ) : action.key === "continue-payment" ? (
                                    <LuArrowRight size={16} />
                                ) : null}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {isDetailOpen ? (
                <div className="mt-5 border-t border-slate-100 pt-5">
                    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                        <div>
                            <h4 className="text-base font-semibold text-slate-900">Chi tiết đặt phòng</h4>
                            <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                <DetailItem
                                    icon={<LuReceiptText size={18} />}
                                    label="Mã đặt phòng"
                                    value={`#${trip.id}`}
                                />
                                <DetailItem icon={<LuUsers size={18} />} label="Số khách" value={guestCountLabel} />
                                <DetailItem
                                    icon={<LuCalendar size={18} />}
                                    label="Thời gian"
                                    value={`${formatTripDate(trip.checkIn)} - ${formatTripDate(trip.checkOut)}`}
                                />
                                <DetailItem icon={<LuMoon size={18} />} label="Số đêm" value={`${trip.nights} đêm`} />
                                <DetailItem
                                    icon={<LuMapPin size={18} />}
                                    label="Địa chỉ"
                                    value={<span className="break-words">{address}</span>}
                                />
                                <DetailItem
                                    icon={<LuCreditCard size={18} />}
                                    label="Thanh toán"
                                    value={getPaymentStatusLabel(trip.paymentStatus)}
                                />
                            </div>

                            <div className="mt-5 grid gap-3 border-t border-slate-100 pt-4 text-sm text-slate-600 sm:grid-cols-2">
                                <div>
                                    <span className="font-medium text-slate-900">Ngày đặt:</span>{" "}
                                    {formatTripDateTime(trip.createdAt)}
                                </div>
                                {trip.paidAt ? (
                                    <div>
                                        <span className="font-medium text-slate-900">Đã thanh toán:</span>{" "}
                                        {formatTripDateTime(trip.paidAt)}
                                    </div>
                                ) : null}
                                {trip.checkedInAt ? (
                                    <div>
                                        <span className="font-medium text-slate-900">Check-in:</span>{" "}
                                        {formatTripDateTime(trip.checkedInAt)}
                                    </div>
                                ) : null}
                                {trip.checkedOutAt ? (
                                    <div>
                                        <span className="font-medium text-slate-900">Check-out:</span>{" "}
                                        {formatTripDateTime(trip.checkedOutAt)}
                                    </div>
                                ) : null}
                            </div>

                            <div className="mt-5 flex gap-3 border-t border-slate-100 pt-4">
                                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                                    <LuStickyNote size={18} />
                                </span>
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-normal text-slate-400">
                                        Ghi chú
                                    </p>
                                    <p className="mt-1 whitespace-pre-line text-sm leading-6 text-slate-600">
                                        {trip.cancellationReason || trip.bookingNote || "Không có ghi chú."}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-slate-100 pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
                            <h4 className="text-base font-semibold text-slate-900">Chi phí</h4>
                            <dl className="mt-4 space-y-3 text-sm">
                                {(trip.subtotalAmount ?? 0) > 0 ? (
                                    <div className="flex items-center justify-between gap-4">
                                        <dt className="text-slate-500">Tiền phòng</dt>
                                        <dd className="font-medium text-slate-700">
                                            {priceFormatter.format(trip.subtotalAmount ?? 0)}
                                        </dd>
                                    </div>
                                ) : null}
                                {(trip.cleaningFeeAmount ?? 0) > 0 ? (
                                    <div className="flex items-center justify-between gap-4">
                                        <dt className="text-slate-500">Phí vệ sinh</dt>
                                        <dd className="font-medium text-slate-700">
                                            {priceFormatter.format(trip.cleaningFeeAmount ?? 0)}
                                        </dd>
                                    </div>
                                ) : null}
                                {(trip.serviceFeeAmount ?? 0) > 0 ? (
                                    <div className="flex items-center justify-between gap-4">
                                        <dt className="text-slate-500">Phí dịch vụ</dt>
                                        <dd className="font-medium text-slate-700">
                                            {priceFormatter.format(trip.serviceFeeAmount ?? 0)}
                                        </dd>
                                    </div>
                                ) : null}
                                {(trip.discountAmount ?? 0) > 0 ? (
                                    <div className="flex items-center justify-between gap-4">
                                        <dt className="text-slate-500">Giảm giá</dt>
                                        <dd className="font-medium text-emerald-700">
                                            -{priceFormatter.format(trip.discountAmount ?? 0)}
                                        </dd>
                                    </div>
                                ) : null}
                                <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-3">
                                    <dt className="font-semibold text-slate-900">Tổng cộng</dt>
                                    <dd className="text-lg font-semibold text-cyan-700">
                                        {priceFormatter.format(trip.totalPrice)}
                                    </dd>
                                </div>
                            </dl>
                        </div>
                    </div>
                </div>
            ) : null}
        </article>
    );
};

export default TripHistoryCard;
