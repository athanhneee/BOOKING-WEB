import Skeleton from "../Skeleton";

/**
 * Skeleton cho 1 card villa — layout giống StayCard.tsx
 */
const StayCardSkeleton = () => (
    <div className="flex h-full flex-col overflow-hidden rounded-3xl bg-white shadow-[0_2px_12px_-4px_rgba(15,23,42,0.08)]">
        {/* Image area */}
        <Skeleton className="aspect-[4/3] w-full rounded-none rounded-t-2xl" />

        {/* Content */}
        <div className="flex flex-1 flex-col gap-3 p-4">
            {/* Title + rating */}
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                </div>
                <Skeleton className="h-8 w-10 shrink-0" />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-3.5 w-5/6" />
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
                <Skeleton className="h-9 w-20 rounded-3xl" />
                <Skeleton className="h-9 w-24 rounded-3xl" />
                <Skeleton className="h-9 w-20 rounded-3xl" />
            </div>

            {/* Price */}
            <div className="mt-auto flex items-end justify-between border-t border-gray-100 pt-4">
                <div className="space-y-1">
                    <Skeleton className="h-3 w-12" />
                    <Skeleton className="h-6 w-28" />
                    <Skeleton className="h-3 w-10" />
                </div>
                <Skeleton className="h-7 w-16 rounded-full" />
            </div>
        </div>
    </div>
);

export default StayCardSkeleton;
