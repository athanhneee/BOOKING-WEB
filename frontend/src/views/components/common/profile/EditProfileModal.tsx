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
                    className="min-h-36 w-full resize-none rounded-[34px] border border-slate-200 bg-white px-6 py-5 text-sm font-medium leading-6 text-slate-800 shadow-[0_10px_28px_rgba(15,23,42,0.06)] outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100"
                />
            );
        }

        if (config.type === "tags") {
            return (
                <div className="space-y-5 rounded-[34px] border border-slate-100 bg-slate-50/80 p-5 shadow-inner">
                    <div className="flex flex-wrap gap-2.5">
                        {languageOptions.map((option) => {
                            const isActive = draftUser.languages.includes(option);

                            return (
                                <button
                                    key={option}
                                    type="button"
                                    onClick={() => toggleLanguage(option)}
                                    className={cn(
                                        "min-h-11 rounded-full border px-5 py-2.5 text-sm font-bold shadow-sm transition-all duration-200 hover:-translate-y-0.5",
                                        isActive
                                            ? "border-cyan-300 bg-cyan-50 text-cyan-800 ring-4 ring-cyan-100"
                                            : "border-slate-200 bg-white text-slate-600 hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-600",
                                    )}
                                >
                                    {option}
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
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
                            className="min-h-13 flex-1 rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-medium text-slate-800 shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100"
                        />

                        <button
                            type="button"
                            onClick={addCustomLanguage}
                            className="inline-flex min-h-13 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-600"
                        >
                            <LuPlus size={17} />
                            Thêm
                        </button>
                    </div>

                    {draftUser.languages.length > 0 ? (
                        <div className="flex flex-wrap gap-2.5">
                            {draftUser.languages.map((language) => (
                                <span
                                    key={language}
                                    className="inline-flex min-h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm"
                                >
                                    {language}

                                    <button
                                        type="button"
                                        onClick={() => toggleLanguage(language)}
                                        className="inline-flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                                        aria-label={`Xóa ${language}`}
                                    >
                                        <LuX size={14} />
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
                className="min-h-13 w-full rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-medium text-slate-800 shadow-[0_10px_28px_rgba(15,23,42,0.06)] outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100"
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
                "mt-auto h-auto max-h-[92dvh] overflow-hidden rounded-t-[44px] border border-white/80 bg-white shadow-[0_34px_100px_-42px_rgba(15,23,42,0.6)] sm:mt-8 sm:max-h-[calc(100dvh-4rem)] sm:rounded-[44px]",
                mode === "all" ? "sm:w-[min(880px,calc(100vw-2.5rem))]" : "sm:w-[min(680px,calc(100vw-2.5rem))]",
            )}
        >
            <div className="flex h-full flex-col overflow-hidden rounded-t-[44px] bg-white sm:rounded-[44px]">
                <div className="flex shrink-0 items-start justify-between gap-4 rounded-t-[44px] border-b border-slate-100 bg-white px-5 py-5 sm:px-8 sm:py-6">
                    <div className="min-w-0">
                        <h2 className="text-2xl font-bold tracking-[-0.03em] text-slate-950 sm:text-[30px]">
                            {modalTitle}
                        </h2>

                        <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-500">
                            {modalDescription}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-50 hover:text-slate-900"
                        aria-label="Đóng chỉnh sửa hồ sơ"
                    >
                        <LuX size={19} />
                    </button>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto bg-[#f7f8fb] px-5 py-5 sm:px-8 sm:py-6">
                    <div className={cn("grid gap-5", mode === "all" ? "lg:grid-cols-2" : "grid-cols-1")}>
                        {visibleFields.map((fieldKey) => {
                            const config = fieldConfigMap[fieldKey];
                            const spanClass = mode === "all" && fieldKey === "bio" ? "lg:col-span-2" : undefined;

                            return (
                                <div
                                    key={fieldKey}
                                    className={cn(
                                        "rounded-[36px] border border-white/80 bg-white p-5 shadow-[0_12px_34px_rgba(15,23,42,0.06)] sm:p-6",
                                        spanClass,
                                    )}
                                >
                                    <label className="block text-sm font-bold text-slate-850">
                                        {config.label}
                                    </label>

                                    <p className="mt-1.5 text-sm font-medium leading-6 text-slate-500">
                                        {config.description}
                                    </p>

                                    <div className="mt-4">
                                        {renderInput(fieldKey)}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="sticky bottom-0 shrink-0 rounded-b-[44px] border-t border-slate-100 bg-white px-5 py-4 shadow-[0_-18px_40px_-30px_rgba(15,23,42,0.45)] sm:px-8">
                    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            className="inline-flex min-h-13 items-center justify-center rounded-full border border-slate-200 bg-white px-7 py-3 text-sm font-bold text-slate-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-50 hover:text-slate-900"
                        >
                            Hủy
                        </button>

                        <button
                            type="button"
                            disabled={!hasChanged || isSaving}
                            onClick={handleSave}
                            className="inline-flex min-h-13 items-center justify-center rounded-full bg-cyan-500 px-8 py-3 text-sm font-bold text-white shadow-[0_10px_24px_rgba(14,116,144,0.28)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-cyan-500 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-white disabled:shadow-none"
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