import type { IconType } from "react-icons";
import {
    LuBadgeCheck,
    LuBriefcaseBusiness,
    LuChevronRight,
    LuGraduationCap,
    LuLanguages,
    LuMapPinned,
} from "react-icons/lu";
import type { AccountUserProfile, EditableProfileField } from "../../../../models/entities/AccountProfile";
import { cn } from "../../../../utils";

type ProfileInfoListProps = {
    user: AccountUserProfile;
    onEditField: (field: EditableProfileField) => void;
};

type RowConfig = {
    key: EditableProfileField | "isVerified";
    label: string;
    icon: IconType;
};

const rowConfigs: RowConfig[] = [
    { key: "job", label: "Công việc của tôi", icon: LuBriefcaseBusiness },
    { key: "dreamDestination", label: "Nơi tôi luôn muốn đến", icon: LuMapPinned },
    { key: "school", label: "Nơi tôi từng theo học", icon: LuGraduationCap },
    { key: "languages", label: "Ngôn ngữ của tôi", icon: LuLanguages },
    { key: "isVerified", label: "Đã xác minh danh tính", icon: LuBadgeCheck },
];

const emptyLabel = "Chưa cập nhật";

const ProfileInfoList = ({ user, onEditField }: ProfileInfoListProps) => {
    const getValue = (key: RowConfig["key"]) => {
        if (key === "isVerified") {
            return user.isVerified;
        }

        if (key === "languages") {
            return user.languages;
        }

        return user[key];
    };

    return (
        <div className="rounded-2xl bg-white p-3 shadow-[0_2px_12px_-4px_rgba(15,23,42,0.08)]">
            {rowConfigs.map((row) => {
                const Icon = row.icon;
                const value = getValue(row.key);
                const isEditable = row.key !== "isVerified";
                const hasValue = row.key === "languages" ? (value as string[]).length > 0 : Boolean(value);

                return (
                    <button
                        key={row.key}
                        type="button"
                        onClick={() => {
                            if (isEditable) {
                                onEditField(row.key as EditableProfileField);
                            }
                        }}
                        className={cn(
                            "flex w-full items-start gap-3 rounded-2xl px-3 py-3 text-left transition-all duration-200",
                            isEditable ? "cursor-pointer hover:bg-slate-50" : "cursor-default",
                        )}
                    >
                        <span className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-cyan-300/10 text-cyan-600">
                            <Icon size={18} />
                        </span>

                        <span className="min-w-0 flex-1">
                            <span className="block text-sm font-medium text-slate-500">{row.label}</span>

                            {row.key === "languages" ? (
                                <span className="mt-2 flex flex-wrap gap-2">
                                    {hasValue ? (
                                        (value as string[]).map((language) => (
                                            <span
                                                key={language}
                                                className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700"
                                            >
                                                {language}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-sm text-slate-400">{emptyLabel}</span>
                                    )}
                                </span>
                            ) : row.key === "isVerified" ? (
                                <span
                                    className={cn(
                                        "mt-2 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
                                        value
                                            ? "bg-emerald-50 text-emerald-700"
                                            : "bg-slate-100 text-slate-500",
                                    )}
                                >
                                    {value ? "Đã xác minh" : "Chưa xác minh"}
                                </span>
                            ) : (
                                <span
                                    className={cn(
                                        "mt-1 block text-[15px] leading-6",
                                        hasValue ? "text-slate-900" : "text-slate-400",
                                    )}
                                >
                                    {hasValue ? String(value) : emptyLabel}
                                </span>
                            )}
                        </span>

                        {isEditable ? <LuChevronRight size={18} className="mt-1 text-slate-300" /> : null}
                    </button>
                );
            })}
        </div>
    );
};

export default ProfileInfoList;