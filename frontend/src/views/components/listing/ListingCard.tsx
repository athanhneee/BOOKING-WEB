import { FaMapMarkerAlt, FaStar } from "react-icons/fa";
import type { PopularDestination } from "../../../models/entities/Listing";

type ListingCardProps = {
    listing: PopularDestination;
    onClick?: () => void;
    className?: string;
};

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
});

const ListingCard = ({ listing, onClick, className = "" }: ListingCardProps) => {
    const content = (
        <>
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-slate-100">
                {listing.imageUrl ? (
                    <img src={listing.imageUrl} alt={listing.name} className="h-full w-full object-cover" loading="lazy" />
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm font-medium text-slate-500">
                        Chưa có ảnh
                    </div>
                )}
                <span className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-slate-950/80 px-3 py-1.5 text-xs font-semibold text-white shadow-lg backdrop-blur-sm">
                    <span className="inline-flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <FaStar
                                key={i}
                                className={`text-[9px] ${i < Math.round(listing.rating) ? "text-amber-300" : "text-white/25"}`}
                            />
                        ))}
                    </span>
                    {listing.rating.toFixed(1)}
                </span>
            </div>

            <div className="mt-3 min-w-0">
                <div className="flex items-start justify-between gap-3">
                    <h3 className="min-w-0 truncate text-base font-semibold text-slate-900">{listing.name}</h3>
                    <p className="shrink-0 text-sm font-bold text-slate-900">{currencyFormatter.format(listing.pricePerNight)}</p>
                </div>
                <p className="mt-1 flex min-w-0 items-center gap-2 truncate text-sm text-slate-500">
                    <FaMapMarkerAlt className="shrink-0 text-slate-400" />
                    {listing.address}
                </p>
            </div>
        </>
    );

    if (onClick) {
        return (
            <button
                type="button"
                onClick={onClick}
                className={`group w-full min-w-0 cursor-pointer rounded-2xl bg-white p-0 text-left transition-transform hover:-translate-y-0.5 ${className}`.trim()}
            >
                {content}
            </button>
        );
    }

    return <article className={`group min-w-0 rounded-2xl bg-white ${className}`.trim()}>{content}</article>;
};

export default ListingCard;
