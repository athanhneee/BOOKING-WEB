import { cn } from "../../../utils";

const statusMap = {
    "sap-nhan": { label: "Sắp nhận phòng", className: "border border-cyan-200 bg-cyan-50 text-cyan-700" },
    "dang-luu-tru": { label: "Đang lưu trú", className: "border border-cyan-200 bg-cyan-50 text-cyan-700" },
    "sap-tra": { label: "Sắp trả phòng", className: "border border-amber-200 bg-amber-50 text-amber-700" },
    "da-tra": { label: "Đã trả phòng", className: "border border-gray-200 bg-gray-100 text-gray-600" },
    "qua-han": { label: "Quá hạn TT", className: "border border-red-200 bg-red-50 text-red-600" },
    "coc-50": { label: "Cọc 50%", className: "border border-violet-200 bg-violet-50 text-violet-700" },
    "cho-tt": { label: "Chờ thanh toán", className: "border border-yellow-200 bg-yellow-50 text-yellow-700" },
    "da-tt": { label: "Đã thanh toán", className: "border border-cyan-200 bg-cyan-50 text-cyan-700" },
    trong: { label: "Đang trống", className: "border border-gray-200 bg-gray-50 text-gray-500" },
    active: { label: "Hoạt động", className: "border border-cyan-200 bg-cyan-50 text-cyan-700" },
    paused: { label: "Tạm dừng", className: "border border-gray-200 bg-gray-100 text-gray-500" },
    locked: { label: "Bị khóa", className: "border border-red-200 bg-red-50 text-red-600" },
    pending: { label: "Chờ duyệt", className: "border border-yellow-200 bg-yellow-50 text-yellow-700" },
    approved: { label: "Đã duyệt", className: "border border-cyan-200 bg-cyan-50 text-cyan-700" },
    rejected: { label: "Từ chối", className: "border border-red-200 bg-red-50 text-red-600" },
    Guest: { label: "Khách", className: "border border-gray-200 bg-gray-100 text-gray-600" },
    host: { label: "host", className: "border border-cyan-200 bg-cyan-50 text-cyan-700" },
    "host new": { label: "host mới", className: "border border-cyan-200 bg-cyan-50 text-cyan-700" },
    Admin: { label: "Admin", className: "border border-violet-200 bg-violet-50 text-violet-700" },
} as const;

export type BadgeStatus = keyof typeof statusMap | string;

type BadgeProps = {
    status: BadgeStatus;
    className?: string;
};

const Badge = ({ status, className = "" }: BadgeProps) => {
    const config = statusMap[status as keyof typeof statusMap] ?? {
        label: status,
        className: "border border-gray-200 bg-gray-100 text-gray-600",
    };

    return (
        <span
            className={cn(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                config.className,
                className,
            )}
        >
            {config.label}
        </span>
    );
};

export default Badge;
