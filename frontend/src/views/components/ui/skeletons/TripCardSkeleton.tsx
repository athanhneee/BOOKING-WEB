import Skeleton from "../Skeleton";

/**
 * Skeleton cho 1 trip history card — dùng cho trang Trips/Chuyến đi
 */
const TripCardSkeleton = () => (
    <div className="overflow-hidden rounded-3xl bg-white shadow-[0_2px_12px_-4px_rgba(15,23,42,0.08)]">
        <div className="flex flex-col sm:flex-row">
            {/* Image */}
            <Skeleton className="h-44 w-full shrink-0 rounded-none rounded-t-2xl sm:h-auto sm:w-48 sm:rounded-l-2xl sm:rounded-tr-none" />

            {/* Content */}
            <div className="flex flex-1 flex-col gap-3 p-5">
                {/* Status badge */}
                <Skeleton className="h-6 w-24 rounded-full" />

                {/* Title */}
                <Skeleton className="h-6 w-3/4" />

                {/* Location */}
                <Skeleton className="h-4 w-1/2" />

                {/* Dates row */}
                <div className="flex gap-4">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-20" />
                </div>

                {/* Price + action */}
                <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-10 w-32 rounded-3xl" />
                </div>
            </div>
        </div>
    </div>
);

export default TripCardSkeleton;
