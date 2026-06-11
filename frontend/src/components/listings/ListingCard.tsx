import { Bath, BedDouble, Calendar, MapPin, Star, Users } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { APP_ROUTES } from "../../config/routes";
import type { AiListingSearchItem } from "../../services/api/semanticSearchApi";

type ListingCardProps = {
    listing: AiListingSearchItem;
    checkIn?: string;
    checkOut?: string;
};

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
});

const propertyTypeLabel: Record<string, string> = {
    apartment: "Căn hộ",
    villa: "Villa",
    hotel: "Khách sạn",
    homestay: "Homestay",
};

const buildAddress = (listing: AiListingSearchItem) =>
    [listing.addressLine, listing.ward, listing.district, listing.city].filter(Boolean).join(", ");

const formatShortDate = (iso: string) => {
    const d = new Date(`${iso}T00:00:00`);
    if (Number.isNaN(d.getTime())) return iso;
    return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit" }).format(d);
};

const buildDetailUrl = (listingId: string, checkIn?: string, checkOut?: string) => {
    const base = APP_ROUTES.villaDetail(listingId);
    if (!checkIn) return base;
    const params = new URLSearchParams();
    params.set("checkIn", checkIn);
    if (checkOut) params.set("checkOut", checkOut);
    return `${base}?${params.toString()}`;
};

const ListingCard = ({ listing, checkIn, checkOut }: ListingCardProps) => {
    const location = useLocation();
    const returnTo = `${location.pathname}${location.search}`;
    const address = buildAddress(listing);
    const detailUrl = buildDetailUrl(String(listing.listingId), checkIn, checkOut);

    return (
        <Link
            to={detailUrl}
            state={{ returnTo }}
            className="group flex h-full flex-col overflow-hidden bg-white"
        >
            <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                {listing.imageUrl ? (
                    <img
                        src={listing.imageUrl}
                        alt={listing.title}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-slate-100 text-sm font-semibold text-slate-500">
                        Chưa có ảnh
                    </div>
                )}

                <span className="absolute right-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
                    {propertyTypeLabel[listing.propertyType] ?? listing.propertyType}
                </span>

                {checkIn ? (
                    <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-cyan-600/90 px-3 py-1 text-xs font-semibold text-white shadow-sm backdrop-blur-sm">
                        <Calendar size={12} />
                        {formatShortDate(checkIn)}
                        {checkOut ? ` – ${formatShortDate(checkOut)}` : ""}
                    </span>
                ) : null}
            </div>

            <div className="flex flex-1 flex-col p-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <h3 className="truncate text-lg font-semibold text-slate-950">{listing.title}</h3>
                        <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                            <MapPin size={15} className="shrink-0 text-cyan-500" />
                            <span className="truncate">{address || listing.city}</span>
                        </p>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-amber-50 px-2.5 py-1 text-sm font-semibold text-amber-700">
                        <Star size={13} />
                        {Number(listing.ratingAvg || 0).toFixed(1)}
                    </span>
                </div>

                <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">
                    {listing.description}
                </p>

                <div className="mt-4 grid grid-cols-3 gap-2 text-sm text-slate-600">
                    <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-50 px-2.5 py-2">
                        <Users size={15} className="text-cyan-500" />
                        {listing.maxGuests}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-50 px-2.5 py-2">
                        <BedDouble size={15} className="text-cyan-500" />
                        {listing.bedrooms}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-50 px-2.5 py-2">
                        <Bath size={15} className="text-cyan-500" />
                        {listing.bathrooms}
                    </span>
                </div>

                <div className="mt-4 flex items-end justify-between gap-3 border-t border-slate-100 pt-4">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Giá từ</p>
                        <p className="mt-1 text-lg font-bold text-cyan-600">
                            {currencyFormatter.format(Number(listing.basePrice || 0))}
                        </p>
                        <p className="text-sm text-slate-500">/ đêm</p>
                    </div>
                    <span className="rounded-full border border-cyan-100 bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-600">
                        Còn trống
                    </span>
                </div>
            </div>
        </Link>
    );
};

export default ListingCard;
