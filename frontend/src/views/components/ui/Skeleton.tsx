import type { HTMLAttributes } from "react";

type SkeletonProps = HTMLAttributes<HTMLDivElement>;

const Skeleton = ({ className = "", ...divProps }: SkeletonProps) => {
    return (
        <div
            {...divProps}
            className={`animate-pulse rounded-2xl bg-slate-200/80 ${className}`.trim()}
            aria-hidden={divProps["aria-hidden"] ?? true}
        />
    );
};

export default Skeleton;
