import StayCardSkeleton from "./StayCardSkeleton";

type StayGridSkeletonProps = {
    count?: number;
    className?: string;
};

/**
 * Grid skeleton cho danh sách villa — dùng cho SearchPage, AiSearchPage
 */
const StayGridSkeleton = ({ count = 6, className = "" }: StayGridSkeletonProps) => (
    <div className={`grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 ${className}`.trim()}>
        {Array.from({ length: count }).map((_, i) => (
            <StayCardSkeleton key={i} />
        ))}
    </div>
);

export default StayGridSkeleton;
