import { FaMapMarkerAlt, FaStar } from "react-icons/fa";
import type { PopularDestination } from "../../../models/entities/Listing";

type PopularDestinationCardProps = {
    destination: PopularDestination;
    onClick?: () => void;
};

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
});

const PopularDestinationCard = ({ destination, onClick }: PopularDestinationCardProps) => {
    const content = (
        <>
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-gray-200">
                {destination.imageUrl ? (
                    <img
                        src={destination.imageUrl}
                        alt={destination.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200">
                        <span className="text-sm font-medium text-gray-500">Chưa có ảnh</span>
                    </div>
                )}

                <div className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-gray-900/80 px-3 py-1.5 text-xs font-semibold text-white shadow-lg backdrop-blur-sm">
                    <div className="inline-flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <FaStar
                                key={i}
                                className={`text-[9px] ${i < Math.round(destination.rating) ? "text-amber-300" : "text-white/25"}`}
                            />
                        ))}
                    </div>
                    {destination.rating.toFixed(1)}
                </div>

                <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <span key={index} className="h-1.5 w-1.5 rounded-full bg-white/80" />
                    ))}
                </div>
            </div>

            <div className="mt-3 flex items-center justify-between gap-3">
                <h3 className="min-w-0 truncate text-base font-semibold text-zinc-900 sm:text-lg md:text-xl">{destination.name}</h3>
                <p className="shrink-0 text-base font-bold text-zinc-900 sm:text-lg md:text-xl">{currencyFormatter.format(destination.pricePerNight)}</p>
            </div>

            <p className="mt-1 flex items-center gap-2 text-sm text-zinc-600">
                <FaMapMarkerAlt className="shrink-0 text-zinc-400" />
                <span className="truncate">{destination.address}</span>
            </p>
        </>
    );

    if (onClick) {
        return (
            <button
                type="button"
                onClick={onClick}
                className="group min-w-0 w-full cursor-pointer appearance-none border-0 bg-transparent p-0 text-left"
            >
                {content}
            </button>
        );
    }

    return <article className="group min-w-0">{content}</article>;
};

export default PopularDestinationCard;
