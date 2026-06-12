import { useEffect, useMemo, useState } from "react";
import { LuPlus, LuX } from "react-icons/lu";
import type { AccountUserProfile, EditableProfileField } from "../../../../models/entities/AccountProfile";
import { cn } from "../../../../utils";
import Modal from "../../ui/Modal";

type EditProfileModalProps = {
    isOpen: boolean;
    mode: "single" | "all";
    field?: EditableProfileField;
    user: AccountUserProfile;
    languageOptions: string[];
    onClose: () => void;
    onSave: (nextUser: AccountUserProfile) => void | Promise<void>;
};

type FieldConfig = {
    label: string;
    title: string;
    description: string;
    placeholder: string;
    type: "text" | "textarea" | "tags";
};

const fieldConfigMap: Record<EditableProfileField, FieldConfig> = {
    displayName: {
        label: "Tên hiển thị",
        title: "Bạn muốn mọi người gọi bạn là gì?",
        description: "Tên này sẽ xuất hiện trên hồ sơ và trong các đặt phòng của bạn.",
        placeholder: "Nguyễn Văn A",
        type: "text",
    },
    location: {
        label: "Địa điểm",
        title: "Bạn đang sống ở đâu?",
        description: "Thêm thành phố hoặc quốc gia để hồ sơ của bạn gần gũi hơn.",
        placeholder: "Thành phố, Quốc gia",
        type: "text",
    },
    job: {
        label: "Công việc",
        title: "Bạn làm công việc gì?",
        description: "Hãy chia sẻ nghề nghiệp hoặc vai trò hiện tại của bạn.",
        placeholder: "Ví dụ: Chủ nhà, Kỹ sư phần mềm...",
        type: "text",
    },
    dreamDestination: {
        label: "Nơi muốn đến",
        title: "Nơi bạn luôn muốn đến là đâu?",
        description: "Một điểm đến mơ ước sẽ giúp hồ sơ của bạn có thêm cá tính.",
        placeholder: "Ví dụ: Đà Lạt, Tokyo...",
        type: "text",
    },
    school: {
        label: "Trường từng học",
        title: "Bạn từng theo học ở đâu?",
        description: "Bạn có thể thêm tên trường đại học hoặc trường phổ thông.",
        placeholder: "Tên trường đại học / phổ thông...",
        type: "text",
    },
    languages: {
        label: "Ngôn ngữ",
        title: "Bạn có thể giao tiếp bằng ngôn ngữ nào?",
        description: "Chọn các ngôn ngữ bạn sử dụng để khách hoặc host kết nối thuận tiện hơn.",
        placeholder: "Thêm ngôn ngữ",
        type: "tags",
    },
    bio: {
        label: "Giới thiệu bản thân",
        title: "Hãy giới thiệu một chút về bản thân",
        description: "Một đoạn giới thiệu ngắn sẽ giúp hồ sơ của bạn ấm áp và đáng tin cậy hơn.",
        placeholder: "Xin chào! Tôi là...",
        type: "textarea",
    },
};

const editableFields: EditableProfileField[] = [
    "displayName",
    "location",
    "job",
    "dreamDestination",
    "school",
    "languages",
    "bio",
];

const normalizeUser = (user: AccountUserProfile) => ({
    ...user,
    displayName: user.displayName.trim(),
    location: user.location.trim(),
    job: user.job.trim(),
    dreamDestination: user.dreamDestination.trim(),
    school: user.school.trim(),
    bio: user.bio.trim(),
    languages: [...user.languages].map((language) => language.trim()).filter(Boolean).sort(),
});

const EditProfileModal = ({
    isOpen,
    mode,
    field,
    user,
    languageOptions,
    onClose,
    onSave,
}: EditProfileModalProps) => {
    const [draftUser, setDraftUser] = useState<AccountUserProfile>(() => user);
    const [customLanguage, setCustomLanguage] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const visibleFields = useMemo<EditableProfileField[]>(
        () => (mode === "all" ? editableFields : field ? [field] : ["displayName"]),
        [field, mode],
    );

    const hasChanged = useMemo(
        () => JSON.stringify(normalizeUser(draftUser)) !== JSON.stringify(normalizeUser(user)),
        [draftUser, user],
    );

    useEffect(() => {
        if (isOpen) {
            setDraftUser(user);
            setCustomLanguage("");
            setIsSaving(false);
        }
    }, [field, isOpen, mode, user]);

    const updateField = <T extends EditableProfileField>(key: T, value: AccountUserProfile[T]) => {
        setDraftUser((current) => ({
            ...current,
            [key]: value,
        }));
    };

    const toggleLanguage = (language: string) => {
        setDraftUser((current) => {
            const exists = current.languages.includes(language);

            return {
                ...current,
                languages: exists
                    ? current.languages.filter((item) => item !== language)
                    : [...current.languages, language],
            };
        });
    };

    const addCustomLanguage = () => {
        const nextLanguage = customLanguage.trim();

        if (!nextLanguage) {
            return;
        }

        if (!draftUser.languages.includes(nextLanguage)) {
            updateField("languages", [...draftUser.languages, nextLanguage]);
        }

        setCustomLanguage("");
    };

    const handleSave = async () => {
        if (!hasChanged || isSaving) {
            return;
        }

        setIsSaving(true);

        try {
            await onSave(draftUser);
        } finally {
            setIsSaving(false);
        }
    };

    const renderInput = (fieldKey: EditableProfileField) => {
        const config = fieldConfigMap[fieldKey];

        if (config.type === "textarea") {
            return (
                <textarea
                    value={String(draftUser[fieldKey] ?? "")}
                    onChange={(event) => updateField(fieldKey, event.target.value)}
                    placeholder={config.placeholder}
                    rows={mode === "all" ? 5 : 7}
                    className="w-full resize-none rounded-3xl border border-slate-200 bg-slate-50/50 px-4 py-3.5 text-sm leading-6 text-slate-800 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-cyan-400 focus:bg-white focus:shadow-[0_0_0_3px_rgba(34,211,238,0.1)]"
                />
            );
        }

        if (config.type === "tags") {
            return (
                <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                        {languageOptions.map((option) => {
                            const isActive = draftUser.languages.includes(option);

                            return (
                                <button
                                    key={option}
                                    type="button"
                                    onClick={() => toggleLanguage(option)}
                                    className={cn(
                                        "rounded-3xl border px-4 py-2 text-sm font-medium transition-all duration-200",
                                        isActive
                                            ? "border-cyan-400 bg-cyan-50 text-cyan-700 shadow-sm"
                                            : "border-slate-200 bg-white text-slate-600 hover:border-cyan-300 hover:bg-cyan-50/50 hover:text-cyan-600",
                                    )}
                                >
                                    {option}
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={customLanguage}
                            onChange={(event) => setCustomLanguage(event.target.value)}
                            onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                    event.preventDefault();
                                    addCustomLanguage();
                                }
                            }}
                            placeholder={config.placeholder}
                            className="min-h-[42px] flex-1 rounded-3xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-800 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-cyan-400 focus:bg-white focus:shadow-[0_0_0_3px_rgba(34,211,238,0.1)]"
                        />

                        <button
                            type="button"
                            onClick={addCustomLanguage}
                            className="inline-flex min-h-[42px] items-center gap-1.5 rounded-3xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all duration-200 hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-600"
                        >
                            <LuPlus size={15} />
                            Thêm
                        </button>
                    </div>

                    {draftUser.languages.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {draftUser.languages.map((language) => (
                                <span
                                    key={language}
                                    className="inline-flex items-center gap-1.5 rounded-3xl border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-sm font-medium text-cyan-700"
                                >
                                    {language}

                                    <button
                                        type="button"
                                        onClick={() => toggleLanguage(language)}
                                        className="inline-flex h-5 w-5 items-center justify-center rounded-full text-cyan-500 transition-colors hover:bg-cyan-100 hover:text-cyan-700"
                                        aria-label={`Xóa ${language}`}
                                    >
                                        <LuX size={12} />
                                    </button>
                                </span>
                            ))}
                        </div>
                    ) : null}
                </div>
            );
        }

        return (
            <input
                type="text"
                value={String(draftUser[fieldKey] ?? "")}
                onChange={(event) => updateField(fieldKey, event.target.value)}
                placeholder={config.placeholder}
                className="min-h-[42px] w-full rounded-3xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-800 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-cyan-400 focus:bg-white focus:shadow-[0_0_0_3px_rgba(34,211,238,0.1)]"
            />
        );
    };

    const modalTitle =
        mode === "all"
            ? "Chỉnh sửa hồ sơ"
            : field
                ? fieldConfigMap[field].title
                : "Chỉnh sửa hồ sơ";

    const modalDescription =
        mode === "all"
            ? "Cập nhật thông tin cá nhân để hồ sơ của bạn đầy đủ, đáng tin cậy và dễ kết nối hơn."
            : field
                ? fieldConfigMap[field].description
                : "Cập nhật thông tin hồ sơ của bạn.";

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            panelClassName={cn(
                "mt-auto h-auto max-h-[92dvh] overflow-hidden rounded-t-3xl border border-slate-200/60 bg-white shadow-2xl sm:mt-8 sm:max-h-[calc(100dvh-4rem)] sm:rounded-3xl",
                mode === "all" ? "sm:w-[min(880px,calc(100vw-2.5rem))]" : "sm:w-[min(680px,calc(100vw-2.5rem))]",
            )}
        >
            <div className="flex h-full flex-col overflow-hidden">
                {/* Header */}
                <div className="shrink-0 border-b border-slate-100 bg-gradient-to-b from-slate-50/80 to-white px-6 pb-5 pt-6 sm:px-8">
                    <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                            <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                                {modalTitle}
                            </h2>
                            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-slate-500">
                                {modalDescription}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-all duration-200 hover:bg-slate-50 hover:text-slate-700"
                            aria-label="Đóng chỉnh sửa hồ sơ"
                        >
                            <LuX size={16} />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 sm:px-8">
                    <div className={cn("grid gap-5", mode === "all" ? "lg:grid-cols-2" : "grid-cols-1")}>
                        {visibleFields.map((fieldKey) => {
                            const config = fieldConfigMap[fieldKey];
                            const spanClass = mode === "all" && fieldKey === "bio" ? "lg:col-span-2" : undefined;

                            return (
                                <div
                                    key={fieldKey}
                                    className={cn(
                                        "rounded-3xl border border-slate-100 bg-white p-5 transition-all duration-200 hover:border-slate-200 hover:shadow-sm",
                                        spanClass,
                                    )}
                                >
                                    <label className="block text-sm font-semibold text-slate-800">
                                        {config.label}
                                    </label>

                                    <p className="mt-1 text-[13px] leading-5 text-slate-500">
                                        {config.description}
                                    </p>

                                    <div className="mt-3.5">
                                        {renderInput(fieldKey)}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div className="shrink-0 border-t border-slate-100 bg-slate-50/50 px-6 py-4 sm:px-8">
                    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            className="inline-flex min-h-[42px] items-center justify-center rounded-3xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-all duration-200 hover:bg-slate-50 hover:text-slate-900"
                        >
                            Hủy
                        </button>

                        <button
                            type="button"
                            disabled={!hasChanged || isSaving}
                            onClick={handleSave}
                            className="inline-flex min-h-[42px] items-center justify-center rounded-3xl bg-cyan-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
                        >
                            {isSaving ? "Đang lưu..." : "Lưu"}
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default EditProfileModal;