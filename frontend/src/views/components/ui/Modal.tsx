import { useEffect, type ReactNode } from "react";
import { FiX } from "react-icons/fi";
import { cn } from "../../../utils";

type ModalProps = {
    isOpen: boolean;
    onClose: () => void;
    children: ReactNode;
    title?: string;
    description?: string;
    size?: "md" | "lg" | "xl";
    panelClassName?: string;
    bodyClassName?: string;
    overlayClassName?: string;
    closeOnOverlayClick?: boolean;
    showCloseButton?: boolean;
};

const Modal = ({
    isOpen,
    onClose,
    children,
    title,
    description,
    size = "md",
    panelClassName = "",
    bodyClassName = "",
    overlayClassName = "",
    closeOnOverlayClick = true,
    showCloseButton = false,
}: ModalProps) => {
    const sizeClassName =
        size === "xl"
            ? "sm:w-[min(1180px,calc(100vw-2.5rem))]"
            : size === "lg"
              ? "sm:w-[min(1020px,calc(100vw-2.5rem))]"
              : "sm:w-[min(920px,calc(100vw-2.5rem))]";

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                onClose();
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen) {
        return null;
    }

    return (
        <div
            className={cn(
                "fixed inset-0 z-[90] flex items-start justify-center bg-slate-950/45 p-0 sm:p-5",
                overlayClassName,
            )}
        >
            <button
                type="button"
                aria-label="Đóng popup"
                className="absolute inset-0 cursor-default"
                onClick={closeOnOverlayClick ? onClose : undefined}
            />

            <div
                role="dialog"
                aria-modal="true"
                className={cn(
                    "modal-panel relative z-[1] flex h-[100dvh] w-full flex-col overflow-hidden bg-white shadow-2xl sm:mt-8 sm:h-auto sm:max-h-[calc(100dvh-4rem)] sm:rounded-2xl",
                    sizeClassName,
                    panelClassName,
                )}
            >
                {title ? (
                    <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-5 sm:px-6">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
                            {description ? <p className="mt-1 text-sm text-gray-500">{description}</p> : null}
                        </div>

                        {showCloseButton ? (
                            <button
                                type="button"
                                onClick={onClose}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700"
                                aria-label="Đóng"
                            >
                                <FiX size={18} />
                            </button>
                        ) : null}
                    </div>
                ) : null}

                <div className={cn("flex-1 overflow-y-auto", bodyClassName)}>{children}</div>
            </div>
        </div>
    );
};

export default Modal;