import type { ReactNode } from "react";

type BookingWidgetProps = {
    title?: string;
    priceLabel?: string;
    children?: ReactNode;
    actionLabel?: string;
    onAction?: () => void;
    className?: string;
};

const BookingWidget = ({
    title = "Thông tin đặt phòng",
    priceLabel,
    children,
    actionLabel = "Tiếp tục",
    onAction,
    className = "",
}: BookingWidgetProps) => {
    return (
        <aside className={`rounded-3xl border border-slate-200 bg-white p-5 shadow-sm ${className}`.trim()}>
            <div className="flex items-start justify-between gap-4">
                <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
                {priceLabel ? <p className="shrink-0 text-base font-bold text-cyan-600">{priceLabel}</p> : null}
            </div>

            {children ? <div className="mt-5 space-y-4">{children}</div> : null}

            {onAction ? (
                <button
                    type="button"
                    onClick={onAction}
                    className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-3xl bg-cyan-500 px-5 text-sm font-semibold text-white transition-colors hover:bg-cyan-500"
                >
                    {actionLabel}
                </button>
            ) : null}
        </aside>
    );
};

export default BookingWidget;
