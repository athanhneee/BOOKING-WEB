import { type ReactNode } from "react";
import { cn } from "../../../utils";

export const hostCardClass = "card bg-white rounded-2xl shadow-sm border border-gray-100 p-6";
export const primaryButtonClass =
    "bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl px-4 py-2.5 font-medium transition-colors";
export const secondaryButtonClass =
    "border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl px-4 py-2.5 transition-colors";
export const inputClassName =
    "w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500";
export const textareaClassName = `${inputClassName} min-h-[120px]`;
export const tableClassName = "w-full rounded-2xl overflow-hidden border border-gray-100";
export const pageWrapperClass = "min-h-screen bg-[#F7F8FA] p-4 sm:p-6";
export const labelClassName = "mb-2 block text-sm font-medium text-gray-700";

export const formatCurrency = (value: number) =>
    new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
    })
        .format(value)
        .replace("₫", "đ");

export const formatCompactCurrency = (value: number) =>
    new Intl.NumberFormat("vi-VN", {
        notation: "compact",
        maximumFractionDigits: 1,
    }).format(value);

export const formatDate = (value: string, options?: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("vi-VN", options ?? { day: "2-digit", month: "2-digit", year: "numeric" }).format(
        new Date(`${value}T12:00:00`),
    );

export const daysBetween = (start: string, end: string) => {
    const startDate = new Date(`${start}T00:00:00`);
    const endDate = new Date(`${end}T00:00:00`);
    return Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
};

export const getInitials = (name: string) =>
    name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join("");

export const maskPhone = (phone: string) => `${phone.slice(0, 4)}***${phone.slice(-3)}`;

export const maskEmail = (email: string) => {
    const [local, domain] = email.split("@");
    if (!local || !domain) {
        return email;
    }

    return `${local.slice(0, 2)}***@${domain}`;
};

export const createTimeOptions = () => {
    const options: string[] = [];

    for (let hour = 6; hour <= 22; hour += 1) {
        for (const minute of [0, 30]) {
            if (hour === 22 && minute > 0) {
                continue;
            }

            options.push(`${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`);
        }
    }

    return options;
};

export const downloadTextFile = (fileName: string, content: string, contentType = "text/plain;charset=utf-8") => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
};

type PageHeaderProps = {
    title: string;
    subtitle: string;
    actions?: ReactNode;
};

export const PageHeader = ({ title, subtitle, actions }: PageHeaderProps) => {
    return (
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
            </div>
            {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
        </div>
    );
};

type StatCardProps = {
    label: string;
    value: string;
    description?: string;
    icon?: ReactNode;
    accentClassName?: string;
};

export const StatCard = ({ label, value, description, icon, accentClassName = "bg-cyan-300/15 text-cyan-700" }: StatCardProps) => {
    return (
        <div className={hostCardClass}>
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-sm font-medium text-gray-500">{label}</p>
                    <p className="mt-3 text-3xl font-bold text-gray-900">{value}</p>
                </div>

                {icon ? <div className={cn("rounded-full p-3", accentClassName)}>{icon}</div> : null}
            </div>

            {description ? <p className="mt-3 text-sm text-gray-500">{description}</p> : null}
        </div>
    );
};

type FilterTabsProps<T extends string> = {
    options: Array<{ label: string; value: T }>;
    value: T;
    onChange: (nextValue: T) => void;
    underline?: boolean;
};

export const FilterTabs = <T extends string,>({ options, value, onChange, underline = false }: FilterTabsProps<T>) => {
    return (
        <div className={cn("flex flex-wrap items-center gap-2", underline && "border-b border-gray-200")}>
            {options.map((option) => {
                const isActive = option.value === value;

                return (
                    <button
                        key={option.value}
                        type="button"
                        onClick={() => onChange(option.value)}
                        className={cn(
                            underline ? "rounded-none px-3 py-2 text-sm font-medium transition-colors" : "rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                            underline
                                ? isActive
                                    ? "border-b-2 border-cyan-600 text-cyan-700"
                                    : "border-b-2 border-transparent text-gray-500 hover:text-gray-700"
                                : isActive
                                  ? "bg-cyan-300/15 text-cyan-700"
                                  : "text-gray-500 hover:bg-white hover:text-gray-700",
                        )}
                    >
                        {option.label}
                    </button>
                );
            })}
        </div>
    );
};

type ToggleSwitchProps = {
    checked: boolean;
    onChange: (nextValue: boolean) => void;
    label?: string;
};

export const ToggleSwitch = ({ checked, onChange, label }: ToggleSwitchProps) => {
    return (
        <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className="inline-flex items-center gap-3">
            {label ? <span className="text-sm font-medium text-gray-700">{label}</span> : null}
            <span className={cn("relative inline-flex h-7 w-12 rounded-full transition-colors", checked ? "bg-cyan-600" : "bg-gray-300")}>
                <span
                    className={cn(
                        "absolute top-1 h-5 w-5 rounded-full bg-white transition-transform",
                        checked ? "translate-x-6" : "translate-x-1",
                    )}
                />
            </span>
        </button>
    );
};
