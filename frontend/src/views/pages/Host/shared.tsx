import { type ReactNode } from "react";
import { cn } from "../../../utils";
import { hostCardClass } from "./sharedStyles";

type PageHeaderProps = {
    title: string;
    subtitle?: string;
    actions?: ReactNode;
};

export const PageHeader = ({ title, subtitle, actions }: PageHeaderProps) => {
    return (
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                {subtitle ? <p className="mt-1 text-sm text-gray-500">{subtitle}</p> : null}
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

export const StatCard = ({ label, value, description, icon, accentClassName = "bg-cyan-300/15 text-cyan-600" }: StatCardProps) => {
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
                            underline ? "rounded-none px-3 py-2 text-sm font-medium transition-colors" : "rounded-3xl px-3 py-2 text-sm font-medium transition-colors",
                            underline
                                ? isActive
                                    ? "border-b-2 border-cyan-500 text-cyan-600"
                                    : "border-b-2 border-transparent text-gray-500 hover:text-gray-700"
                                : isActive
                                    ? "bg-cyan-300/15 text-cyan-600"
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
            <span className={cn("relative inline-flex h-7 w-12 rounded-full transition-colors", checked ? "bg-cyan-500" : "bg-gray-300")}>
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
