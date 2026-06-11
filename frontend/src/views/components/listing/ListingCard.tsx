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
            <div className="relative aspect-[4/3] overflow-hidden rounded-t-2xl bg-slate-100">
                {listing.imageUrl ? (
                    <img
                        src={listing.imageUrl}
                        alt={listing.name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm font-medium text-slate-500">
                        Chưa có ảnh
                    </div>
                )}
                <span className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-slate-950/70 px-3 py-1.5 text-xs font-semibold text-white shadow-lg backdrop-blur-sm">
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

            <div className="flex flex-1 flex-col p-4">
                <h3 className="truncate text-base font-semibold text-slate-900">
                    {listing.name}
                </h3>
                <p className="mt-2 text-lg font-bold text-cyan-600">
                    {currencyFormatter.format(listing.pricePerNight)}
                    <span className="ml-1 text-xs font-normal text-slate-400">/ đêm</span>
                </p>
                <p className="mt-2 flex items-start gap-1.5 text-sm leading-5 text-slate-500">
                    <FaMapMarkerAlt className="mt-0.5 shrink-0 text-cyan-400" />
                    <span className="line-clamp-2">{listing.address}</span>
                </p>
            </div>
        </>
    );

    const cardClass =
        `group flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-[0_2px_12px_-4px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_24px_-8px_rgba(15,23,42,0.15)] ${className}`.trim();

    if (onClick) {
        return (
            <button
                type="button"
                onClick={onClick}
                className={`${cardClass} cursor-pointer text-left`}
            >
                {content}
            </button>
        );
    }

    return <article className={cardClass}>{content}</article>;
};

export default ListingCard;
