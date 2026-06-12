import Modal from "./Modal";

type ConfirmDialogProps = {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: "default" | "danger";
};

const ConfirmDialog = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmLabel = "Xác nhận",
    cancelLabel = "Hủy",
    variant = "default",
}: ConfirmDialogProps) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            description={description}
            showCloseButton
            panelClassName="sm:w-[min(480px,calc(100vw-2.5rem))]"
            bodyClassName="px-5 pb-5 pt-0 sm:px-6 sm:pb-6"
        >
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex items-center justify-center rounded-2xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                    {cancelLabel}
                </button>

                <button
                    type="button"
                    onClick={onConfirm}
                    className={`inline-flex items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-medium text-white transition-colors ${variant === "danger" ? "bg-rose-500 hover:bg-rose-600" : "bg-cyan-500 hover:bg-cyan-500"
                        }`}
                >
                    {confirmLabel}
                </button>
            </div>
        </Modal>
    );
};

export default ConfirmDialog;