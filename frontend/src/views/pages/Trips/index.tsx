import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LuPencilLine } from "react-icons/lu";
import EditProfileModal from "../../components/common/profile/EditProfileModal";
import ProfileInfoList from "../../components/common/profile/ProfileInfoList";
import ProfileSidebar, { type AccountTab } from "../../components/common/profile/ProfileSidebar";
import ProfileSummaryCard from "../../components/common/profile/ProfileSummaryCard";
import TripHistoryList from "../../components/common/profile/TripHistoryList";
import { APP_ROUTES } from "../../../config/routes";
import {
    mockAccountUser,
    profileLanguageOptions,
    type AccountUserProfile,
    type EditableProfileField,
} from "../../../data/mockAccountUser";
import { mockTripHistory } from "../../../data/mockTripHistory";

type ModalState =
    | { isOpen: false; mode: "single" | "all"; field?: EditableProfileField }
    | { isOpen: true; mode: "single" | "all"; field?: EditableProfileField };

const ProfilePage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [user, setUser] = useState<AccountUserProfile>(mockAccountUser);
    const [modalRevision, setModalRevision] = useState(0);
    const [modalState, setModalState] = useState<ModalState>({ isOpen: false, mode: "all" });

    const activeTab: AccountTab = useMemo(
        () => (location.pathname === APP_ROUTES.accountTrips ? "trips" : "profile"),
        [location.pathname],
    );

    const openSingleFieldModal = (field: EditableProfileField) => {
        setModalRevision((current) => current + 1);
        setModalState({ isOpen: true, mode: "single", field });
    };

    const openFullProfileModal = () => {
        setModalRevision((current) => current + 1);
        setModalState({ isOpen: true, mode: "all" });
    };

    const handleAvatarUpload = (file: File) => {
        const reader = new FileReader();
        reader.onload = () => {
            setUser((current) => ({
                ...current,
                avatarUrl: typeof reader.result === "string" ? reader.result : current.avatarUrl,
            }));
        };
        reader.readAsDataURL(file);
    };

    return (
        <div className="min-h-screen bg-slate-50 pt-28 pb-16 sm:pt-32">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="mb-8 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <p className="text-sm font-medium text-cyan-700">Khu vực tài khoản</p>
                        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-slate-900">
                            {activeTab === "profile" ? "Giới thiệu bản thân" : "Chuyến đi trước đây"}
                        </h1>
                        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                            {activeTab === "profile"
                                ? "Cập nhật hồ sơ để khách và host dễ kết nối hơn, đồng thời giữ cho thông tin cá nhân của bạn luôn rõ ràng và đáng tin cậy."
                                : "Xem lại các chuyến đi đã đặt, trạng thái hoàn tất và các thao tác tiếp theo cho từng kỳ nghỉ."}
                        </p>
                    </div>

                    {activeTab === "profile" ? (
                        <button
                            type="button"
                            onClick={openFullProfileModal}
                            className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-xl border border-cyan-300/50 bg-white px-4 py-3 text-sm font-medium text-cyan-800 transition-all duration-200 hover:bg-cyan-300/10 lg:self-auto"
                        >
                            <LuPencilLine size={16} />
                            Chỉnh sửa
                        </button>
                    ) : null}
                </div>

                <div className="grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
                    <ProfileSidebar
                        activeTab={activeTab}
                        onTabChange={(tab) =>
                            navigate(tab === "profile" ? APP_ROUTES.accountProfile : APP_ROUTES.accountTrips)
                        }
                    />

                    <section className="space-y-6">
                        {activeTab === "profile" ? (
                            <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
                                <div className="xl:sticky xl:top-28 xl:self-start">
                                    <ProfileSummaryCard
                                        user={user}
                                        onEdit={openFullProfileModal}
                                        onAvatarUpload={handleAvatarUpload}
                                    />
                                </div>

                                <div className="space-y-6">
                                    <ProfileInfoList user={user} onEditField={openSingleFieldModal} />

                                    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                        <div className="flex items-center justify-between gap-3">
                                            <div>
                                                <h2 className="text-xl font-semibold text-slate-900">Về tôi</h2>
                                                <p className="mt-1 text-sm text-slate-500">
                                                    Hãy chia sẻ một vài dòng ngắn gọn về bạn.
                                                </p>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => openSingleFieldModal("bio")}
                                                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition-all duration-200 hover:bg-slate-50"
                                            >
                                                <LuPencilLine size={16} />
                                                Chỉnh sửa
                                            </button>
                                        </div>

                                        <p
                                            className={`mt-5 max-w-prose text-[15px] leading-8 ${
                                                user.bio ? "text-slate-700" : "text-slate-400"
                                            }`}
                                        >
                                            {user.bio || "Hãy viết vài dòng về bản thân bạn..."}
                                        </p>
                                    </article>
                                </div>
                            </div>
                        ) : (
                            <TripHistoryList trips={mockTripHistory} />
                        )}
                    </section>
                </div>
            </div>

            <EditProfileModal
                key={`${modalState.mode}-${modalState.field ?? "all"}-${modalRevision}`}
                isOpen={modalState.isOpen}
                mode={modalState.mode}
                field={modalState.field}
                user={user}
                languageOptions={profileLanguageOptions}
                onClose={() => setModalState({ isOpen: false, mode: "all" })}
                onSave={(nextUser) => {
                    setUser(nextUser);
                    setModalState({ isOpen: false, mode: "all" });
                }}
            />
        </div>
    );
};

export default ProfilePage;
