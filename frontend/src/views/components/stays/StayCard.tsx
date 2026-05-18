import { FaBath, FaBed, FaMapMarkerAlt, FaStar } from "react-icons/fa";
import { FiHome, FiUsers } from "react-icons/fi";
import { Link, useLocation } from "react-router-dom";
import type { PopularDestination, StayBadge } from "../../../models/entities/Listing";
import { APP_ROUTES } from "../../../config/routes";

type StayCardProps = {
    stay: PopularDestination;
};

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
});

const badgeClassMap: Record<StayBadge, string> = {
    "Yêu thích": "bg-white/95 text-cyan-700",
    "Nổi bật": "bg-cyan-500 text-white",
    "Mới": "bg-emerald-500 text-white",
    "Được đặt nhiều": "bg-slate-900/85 text-white",
};

const StayCard = ({ stay }: StayCardProps) => {
    const location = useLocation();
    const returnTo = `${location.pathname}${location.search}`;

    return (
        <Link
            to={{
                pathname: APP_ROUTES.villaDetail(stay.id),
                search: location.search,
            }}
            state={{ returnTo }}
            className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md"
        >
            <div className="relative aspect-[4/3] overflow-hidden bg-slate-200">
                {stay.imageUrl ? (
                    <img
                        src={stay.imageUrl}
                        alt={stay.name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200 text-sm font-medium text-slate-500">
                        Đang cập nhật ảnh
                    </div>
                )}

                <div className="absolute inset-x-0 top-0 flex items-start justify-between p-4">
                    {stay.badge ? (
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold shadow-sm ${badgeClassMap[stay.badge]}`}>
                            {stay.badge}
                        </span>
                    ) : (
                        <span />
                    )}

                    <span className="rounded-full bg-white/92 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
                        {stay.category}
                    </span>
                </div>
            </div>

            <div className="flex flex-1 flex-col p-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <h3 className="truncate text-lg font-semibold text-gray-900">{stay.name}</h3>
                        <p className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                            <FaMapMarkerAlt className="shrink-0 text-cyan-500" />
                            <span className="truncate">{stay.address}</span>
                        </p>
                    </div>

                    <div className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-sm font-semibold text-amber-700">
                        <FaStar className="text-[12px]" />
                        {stay.rating.toFixed(1)}
                    </div>
                </div>

                <p className="mt-3 min-h-[3rem] text-sm leading-6 text-gray-600">{stay.description}</p>

                <div className="mt-4 grid grid-cols-2 gap-2 text-sm text-gray-600">
                    <span className="inline-flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2">
                        <FiUsers className="text-cyan-500" />
                        {stay.guests} khách
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2">
                        <FiHome className="text-cyan-500" />
                        {stay.bedrooms} phòng ngủ
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2">
                        <FaBed className="text-cyan-500" />
                        {stay.beds} giường
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2">
                        <FaBath className="text-cyan-500" />
                        {stay.bathrooms} phòng tắm
                    </span>
                </div>

                <div className="mt-5 flex items-end justify-between gap-3 border-t border-gray-100 pt-4">
                    <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-gray-400">Giá từ</p>
                        <p className="mt-1 text-lg font-bold text-teal-700">{currencyFormatter.format(stay.pricePerNight)}</p>
                        <p className="text-sm text-gray-500">/ đêm</p>
                    </div>

                    <span className="rounded-full border border-cyan-100 bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
                        Còn trống
                    </span>
                </div>
            </div>
        </Link>
    );
};

export default StayCard;
