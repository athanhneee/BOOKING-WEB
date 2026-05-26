export const hostCardClass = "card bg-white rounded-2xl shadow-sm border border-gray-100 p-6";
export const primaryButtonClass =
    "bg-cyan-500 hover:bg-cyan-500 text-white rounded-xl px-4 py-2.5 font-medium transition-colors";
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
