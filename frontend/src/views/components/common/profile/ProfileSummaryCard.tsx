import { useRef } from "react";
import { LuBadgeCheck, LuCamera, LuMapPin } from "react-icons/lu";
import type { AccountUserProfile } from "../../../../models/entities/AccountProfile";

type ProfileSummaryCardProps = {
    user: AccountUserProfile;
    onEdit: () => void;
    onAvatarUpload: (file: File) => void;
};

const getInitials = (displayName: string) =>
    displayName
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join("");

const ProfileSummaryCard = ({ user, onEdit, onAvatarUpload }: ProfileSummaryCardProps) => {
    const inputRef = useRef<HTMLInputElement | null>(null);

    return (
        <article className="rounded-2xl bg-cyan-300/10 p-6 shadow-[0_2px_12px_-4px_rgba(15,23,42,0.08)]">
            <div className="flex flex-col items-center text-center">
                <div className="relative">
                    {user.avatarUrl ? (
                        <img
                            src={user.avatarUrl}
                            alt={user.displayName}
                            className="h-24 w-24 rounded-full object-cover shadow-sm"
                        />
                    ) : (
                        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-cyan-500 text-3xl font-semibold text-white shadow-sm">
                            {getInitials(user.displayName)}
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={() => inputRef.current?.click()}
                        className="absolute bottom-0 right-0 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white bg-white text-slate-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:text-cyan-700"
                        aria-label="Tải ảnh đại diện"
                    >
                        <LuCamera size={16} />
                    </button>

                    <input
                        ref={inputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="hidden"
                        onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) {
                                onAvatarUpload(file);
                            }
                            event.target.value = "";
                        }}
                    />
                </div>

                <h3 className="mt-5 text-2xl font-semibold text-slate-900">{user.displayName}</h3>
                <p className="mt-2 inline-flex items-center gap-2 text-sm text-slate-500">
                    <LuMapPin size={15} className="text-cyan-500" />
                    <span>{user.location || "Chưa cập nhật"}</span>
                </p>

                {user.isVerified ? (
                    <span className="mt-4 inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-white px-3 py-1.5 text-sm font-medium text-cyan-800">
                        <LuBadgeCheck size={16} />
                        Hồ sơ đã xác minh
                    </span>
                ) : null}

                <p className="mt-4 text-sm text-slate-500">Tham gia từ {user.joinedYear}</p>
            </div>

            <button
                type="button"
                onClick={onEdit}
                className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-cyan-300/50 bg-white px-4 py-3 text-sm font-medium text-cyan-800 transition-all duration-200 hover:bg-cyan-300/10"
            >
                Chỉnh sửa hồ sơ
            </button>
        </article>
    );
};

export default ProfileSummaryCard;
