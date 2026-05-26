import { useEffect, useRef, useState } from "react";
import { PageHeader, ToggleSwitch } from "../shared";
import { getInitials, hostCardClass, inputClassName, pageWrapperClass, primaryButtonClass, secondaryButtonClass } from "../sharedStyles";
import type { ApiUser } from "../../../../models/entities/User";
import { getMe, updateMe, updateMyAvatar } from "../../../../services/userService";
import { uploadFileToR2 } from "../../../../services/api/uploadsApi";

type SettingsTab = "profile" | "security" | "notifications" | "bank" | "locale";

const tabs: Array<{ value: SettingsTab; label: string }> = [
    { value: "profile", label: "Hồ sơ" },
    { value: "security", label: "Bảo mật" },
    { value: "notifications", label: "Thông báo" },
    { value: "bank", label: "Tài khoản ngân hàng" },
    { value: "locale", label: "Ngôn ngữ & múi giờ" },
];

const notificationItems = [
    { key: "booking", label: "Đặt phòng mới", description: "Nhận thông báo khi có booking mới." },
    { key: "checkout", label: "Trả phòng", description: "Nhắc lịch khách sắp trả phòng." },
    { key: "payment", label: "Thanh toán", description: "Cập nhật giao dịch và đối soát." },
    { key: "review", label: "Đánh giá mới", description: "Thông báo khi khách để lại nhận xét." },
    { key: "system", label: "Cảnh báo hệ thống", description: "Thông báo quan trọng về tài khoản host." },
];

const CaiDat = () => {
    const [tab, setTab] = useState<SettingsTab>("profile");
    const [profile, setProfile] = useState<ApiUser | null>(null);
    const [profileForm, setProfileForm] = useState({
        fullName: "",
        email: "",
        phone: "",
    });
    const [profileMessage, setProfileMessage] = useState("");
    const [profileError, setProfileError] = useState("");
    const [savingProfile, setSavingProfile] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const avatarInputRef = useRef<HTMLInputElement | null>(null);
    const [notifications, setNotifications] = useState<Record<string, boolean>>({
        booking: true,
        checkout: true,
        payment: true,
        review: true,
        system: true,
    });

    useEffect(() => {
        let ignore = false;

        const loadProfile = async () => {
            try {
                const result = await getMe();
                if (ignore) return;

                setProfile(result.user);
                setProfileForm({
                    fullName: result.user.fullName ?? result.user.name ?? "",
                    email: result.user.email ?? "",
                    phone: result.user.phone ?? "",
                });
            } catch (error) {
                if (!ignore) {
                    setProfileError(error instanceof Error ? error.message : "Không thể tải hồ sơ host.");
                }
            }
        };

        void loadProfile();

        return () => {
            ignore = true;
        };
    }, []);

    const handleAvatarChange = async (file: File | undefined) => {
        if (!file) return;

        setProfileError("");
        setProfileMessage("");
        setUploadingAvatar(true);

        try {
            const uploaded = await uploadFileToR2(file, {
                folder: "avatars",
                maxSizeBytes: 5 * 1024 * 1024,
            });
            const result = await updateMyAvatar({
                url: uploaded.publicUrl,
                key: uploaded.key,
            });
            setProfile(result.user);
            setProfileMessage("Đã cập nhật ảnh đại diện.");
        } catch (error) {
            setProfileError(error instanceof Error ? error.message : "Không thể cập nhật ảnh đại diện.");
        } finally {
            setUploadingAvatar(false);
        }
    };

    const handleSaveProfile = async () => {
        setProfileError("");
        setProfileMessage("");
        setSavingProfile(true);

        try {
            const result = await updateMe({
                fullName: profileForm.fullName,
                phone: profileForm.phone || null,
            });
            setProfile(result.user);
            setProfileMessage("Đã lưu hồ sơ host.");
        } catch (error) {
            setProfileError(error instanceof Error ? error.message : "Không thể lưu hồ sơ host.");
        } finally {
            setSavingProfile(false);
        }
    };

    return (
        <div className={pageWrapperClass}>
            <div className="mx-auto max-w-6xl space-y-6">
                <PageHeader title="Cài đặt" subtitle="Quản lý hồ sơ host, bảo mật tài khoản và phương thức nhận thanh toán." />

                <div className="flex flex-wrap gap-2 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
                    {tabs.map((item) => (
                        <button
                            key={item.value}
                            type="button"
                            onClick={() => setTab(item.value)}
                            className={`rounded-xl px-4 py-2.5 text-sm font-medium ${tab === item.value ? "bg-cyan-300/15 text-cyan-700" : "text-gray-500 hover:bg-gray-50"}`}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>

                <div className={hostCardClass}>
                    {tab === "profile" ? (
                        <div className="space-y-6">
                            {profileError ? <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{profileError}</div> : null}
                            {profileMessage ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{profileMessage}</div> : null}
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                                {profile?.avatarUrl ? (
                                    <img src={profile.avatarUrl} alt={profile.fullName ?? profile.name ?? "Host"} className="h-20 w-20 rounded-full object-cover" />
                                ) : (
                                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-cyan-600 text-2xl font-semibold text-white">
                                        {getInitials(profileForm.fullName || "Chủ Nhà")}
                                    </div>
                                )}
                                <input
                                    ref={avatarInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp,image/gif"
                                    className="hidden"
                                    onChange={(event) => {
                                        void handleAvatarChange(event.target.files?.[0]);
                                        event.target.value = "";
                                    }}
                                />
                                <button type="button" disabled={uploadingAvatar} onClick={() => avatarInputRef.current?.click()} className={secondaryButtonClass}>
                                    {uploadingAvatar ? "Đang upload..." : "Thay đổi ảnh"}
                                </button>
                            </div>
                            <div className="grid gap-5 md:grid-cols-2">
                                <input value={profileForm.fullName} onChange={(event) => setProfileForm((current) => ({ ...current, fullName: event.target.value }))} placeholder="Họ tên" className={inputClassName} />
                                <input value={profileForm.email} readOnly placeholder="Email" className={inputClassName} />
                                <input value={profileForm.phone} onChange={(event) => setProfileForm((current) => ({ ...current, phone: event.target.value }))} placeholder="Số điện thoại" className={inputClassName} />
                                <input placeholder="CMND/CCCD" className={inputClassName} />
                                <input placeholder="Địa chỉ" className={`${inputClassName} md:col-span-2`} />
                            </div>
                            <button type="button" disabled={savingProfile} onClick={handleSaveProfile} className={primaryButtonClass}>{savingProfile ? "Đang lưu..." : "Lưu thay đổi"}</button>
                        </div>
                    ) : null}

                    {tab === "security" ? (
                        <div className="space-y-6">
                            <div className="grid gap-5 md:grid-cols-3">
                                <input type="password" placeholder="Mật khẩu hiện tại" className={inputClassName} />
                                <input type="password" placeholder="Mật khẩu mới" className={inputClassName} />
                                <input type="password" placeholder="Xác nhận mật khẩu" className={inputClassName} />
                            </div>
                            <ToggleSwitch checked onChange={() => { }} label="Xác thực 2 bước" />
                            <button type="button" className="inline-flex items-center justify-center rounded-xl border border-rose-200 px-4 py-2.5 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50">Đăng xuất tất cả thiết bị</button>
                        </div>
                    ) : null}

                    {tab === "notifications" ? (
                        <div className="space-y-4">
                            {notificationItems.map((item) => (
                                <div key={item.key} className="flex flex-col gap-3 rounded-2xl border border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <p className="font-medium text-gray-900">{item.label}</p>
                                        <p className="mt-1 text-sm text-gray-500">{item.description}</p>
                                    </div>
                                    <ToggleSwitch checked={notifications[item.key]} onChange={(value) => setNotifications((current) => ({ ...current, [item.key]: value }))} />
                                </div>
                            ))}
                        </div>
                    ) : null}

                    {tab === "bank" ? (
                        <div className="space-y-6">
                            <div className="grid gap-5 md:grid-cols-2">
                                <select className={inputClassName}><option>Chọn ngân hàng</option><option>MB Bank</option><option>Vietcombank</option><option>ACB</option></select>
                                <input placeholder="Số tài khoản" className={inputClassName} />
                                <input placeholder="Chủ tài khoản" className={inputClassName} />
                                <input placeholder="Chi nhánh" className={inputClassName} />
                            </div>
                            <p className="rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-500">Thông tin này dùng để nhận thanh toán từ minh thanh villa.</p>
                            <button type="button" className={primaryButtonClass}>Lưu thông tin</button>
                        </div>
                    ) : null}

                    {tab === "locale" ? (
                        <div className="grid gap-5 md:grid-cols-2">
                            <select className={inputClassName}><option>Tiếng Việt</option><option>English</option></select>
                            <select className={inputClassName}><option>(GMT+7) Hà Nội, Bangkok, Jakarta</option></select>
                            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700">VND (cố định)</div>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
};

export default CaiDat;
