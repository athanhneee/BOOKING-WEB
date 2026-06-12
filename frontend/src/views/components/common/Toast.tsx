import { useEffect } from "react";
import { IoCheckmarkCircle, IoClose, IoCloseCircle, IoInformationCircle } from "react-icons/io5";

type ToastType = "success" | "error" | "info";

type ToastProps = {
    message: string;
    type?: ToastType;
    onClose: () => void;
    duration?: number;
};

const icons = {
    success: <IoCheckmarkCircle className="text-white" size={20} />,
    error: <IoCloseCircle className="text-white" size={20} />,
    info: <IoInformationCircle className="text-white" size={20} />,
} as const;

const colors: Record<ToastType, string> = {
    success: "bg-cyan-500",
    error: "bg-red-500",
    info: "bg-cyan-500",
};

const Toast = ({ message, type = "info", onClose, duration = 3000 }: ToastProps) => {
    useEffect(() => {
        const timer = window.setTimeout(onClose, duration);
        return () => window.clearTimeout(timer);
    }, [duration, onClose]);

    return (
        <div className={`flex min-w-64 max-w-sm items-center gap-3 rounded-3xl px-4 py-3 text-sm font-medium text-white shadow-lg ${colors[type]}`}>
            {icons[type]}
            <span className="flex-1">{message}</span>
            <button type="button" onClick={onClose} className="transition-opacity hover:opacity-70">
                <IoClose size={16} />
            </button>
        </div>
    );
};

export default Toast;
