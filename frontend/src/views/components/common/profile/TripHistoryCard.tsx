import { LuCalendar, LuMapPin, LuMoon } from "react-icons/lu";
import type { TripHistory } from "../../../../models/entities/TripHistory";
import { cn } from "../../../../utils";

type TripHistoryCardProps = {
    trip: TripHistory;
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

const getStatusMeta = (status: TripHistory["status"]) => {
    switch (status) {
        case "completed":
            return {
                label: "Hoàn thành",
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

const TripHistoryCard = ({ trip }: TripHistoryCardProps) => {
    const statusMeta = getStatusMeta(trip.status);
    const actions =
        trip.status === "pending_review"
            ? [
                  { key: "detail", label: "Xem chi tiết", variant: "secondary" as const },
                  { key: "review", label: "Viết đánh giá", variant: "primary" as const },
              ]
            : trip.status === "cancelled"
              ? [{ key: "rebook", label: "Đặt lại", variant: "secondary" as const }]
              : trip.status === "active"
                ? [{ key: "detail", label: "Xem chi tiết", variant: "secondary" as const }]
              : trip.canReview
                ? [
                      { key: "review", label: "Viết đánh giá", variant: "primary" as const },
                      { key: "rebook", label: "Đặt lại", variant: "secondary" as const },
                  ]
                : [{ key: "rebook", label: "Đặt lại", variant: "secondary" as const }];

    return (
        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-5">
            <div className="grid gap-5 md:grid-cols-[160px_minmax(0,1fr)] xl:grid-cols-[160px_minmax(0,1fr)_220px] xl:items-center">
                <img
                    src={trip.imageUrl}
                    alt={trip.propertyName}
                    className="h-52 w-full rounded-2xl object-cover md:h-[120px] md:w-[160px]"
                />

                <div className="min-w-0">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900">{trip.propertyName}</h3>
                            <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                                <LuMapPin size={16} className="text-cyan-600" />
                                <span>{trip.location}</span>
                            </p>
                        </div>

                        <span className={cn("rounded-full px-3 py-1.5 text-xs font-semibold", statusMeta.className)}>
                            {statusMeta.label}
                        </span>
                    </div>

                    <div className="mt-4 flex flex-col gap-2 text-sm text-slate-600 sm:flex-row sm:flex-wrap sm:gap-4">
                        <span className="inline-flex items-center gap-2">
                            <LuCalendar size={16} className="text-cyan-600" />
                            {formatTripDate(trip.checkIn)} - {formatTripDate(trip.checkOut)}
                        </span>
                        <span className="inline-flex items-center gap-2">
                            <LuMoon size={16} className="text-cyan-600" />
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
                                className={cn(
                                    "inline-flex min-h-11 items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200",
                                    action.variant === "primary"
                                        ? "bg-cyan-700 text-white hover:bg-cyan-800"
                                        : "border border-cyan-300/50 bg-white text-cyan-800 hover:bg-cyan-300/10",
                                )}
                            >
                                {action.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </article>
    );
};

export default TripHistoryCard;