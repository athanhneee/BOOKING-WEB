import Skeleton from "../Skeleton";

type TableRowSkeletonProps = {
    /** Số cột trong bảng */
    cols?: number;
    /** Số hàng skeleton */
    rows?: number;
};

/**
 * Skeleton rows cho bảng admin/host
 */
const TableRowSkeleton = ({ cols = 5, rows = 5 }: TableRowSkeletonProps) => (
    <>
        {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex} className="border-b border-slate-100">
                {Array.from({ length: cols }).map((_, colIndex) => (
                    <td key={colIndex} className="px-4 py-3">
                        <Skeleton
                            className={`h-4 ${colIndex === 0 ? "w-32" : colIndex === cols - 1 ? "w-20" : "w-full max-w-[160px]"}`}
                        />
                    </td>
                ))}
            </tr>
        ))}
    </>
);

export default TableRowSkeleton;
