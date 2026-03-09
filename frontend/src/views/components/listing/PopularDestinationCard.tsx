import { FaMapMarkerAlt, FaStar } from "react-icons/fa";
import type { PopularDestination } from "../../../config/popularDestinations";

type PopularDestinationCardProps = {
    destination: PopularDestination;
};

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
});

const PopularDestinationCard = ({ destination }: PopularDestinationCardProps) => {
    return (
        <article className="group min-w-0">
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-gray-200">
                {destination.imageUrl ? (
                    <img
                        src={destination.imageUrl}
                        alt={destination.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200">
                        <span className="text-sm font-medium text-gray-500">Image Placeholder</span>
                    </div>
                )}

                <div className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-xl bg-gray-900/75 px-2.5 py-1 text-xs font-semibold text-white">
                    <FaStar className="text-yellow-300" />
                    {destination.rating.toFixed(1)}
                </div>

                <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <span key={index} className="h-1.5 w-1.5 rounded-full bg-white/80" />
                    ))}
                </div>
            </div>

            <div className="mt-3 flex items-start justify-between gap-3">
                <h3 className="min-w-0 text-base font-semibold text-zinc-900 sm:text-lg md:text-xl">{destination.name}</h3>
                <p className="shrink-0 text-base font-bold text-zinc-900 sm:text-lg md:text-xl">{currencyFormatter.format(destination.pricePerNight)}</p>
            </div>

            <p className="mt-1 flex items-center gap-2 truncate text-sm text-zinc-600">
                <FaMapMarkerAlt className="text-zinc-400" />
                {destination.address}
            </p>
        </article>
    );
};

export default PopularDestinationCard;
