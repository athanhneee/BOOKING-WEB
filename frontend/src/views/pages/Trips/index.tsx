import { useCallback, useEffect, useMemo, useState } from "react";
import { LuPencilLine } from "react-icons/lu";
import { useLocation, useNavigate } from "react-router-dom";
import { APP_ROUTES } from "../../../config/routes";
import type { AccountUserProfile, EditableProfileField } from "../../../models/entities/AccountProfile";
import { profileLanguageOptions } from "../../../models/entities/AccountProfile";
import type { TripHistory } from "../../../models/entities/TripHistory";
import type { ApiBooking } from "../../../models/entities/Booking";
import type { ApiUser } from "../../../models/entities/User";
import { getMyBookings } from "../../../services/bookingService";
import { getMe, updateMe, updateMyAvatar } from "../../../services/userService";
import { uploadFileToR2 } from "../../../services/api/uploadsApi";
import { getCurrentUser, setCurrentUser } from "../../../store/authStore";
import { cn, getBookingDisplayStatus } from "../../../utils";
import EditProfileModal from "../../components/common/profile/EditProfileModal";
import ProfileInfoList from "../../components/common/profile/ProfileInfoList";
import ProfileSidebar, { type AccountTab } from "../../components/common/profile/ProfileSidebar";
import ProfileSummaryCard from "../../components/common/profile/ProfileSummaryCard";
import TripHistoryList from "../../components/common/profile/TripHistoryList";

type EditModalState =
    | {
        mode: "all";
        field?: undefined;
    }
    | {
        mode: "single";
        field: EditableProfileField;
    };

type UpdateMePayload = Parameters<typeof updateMe>[0];

const pageCopy: Record<AccountTab, { title: string; description: string }> = {
    profile: {
        title: "Giới thiệu bản thân",
        description:
            "Cập nhật hồ sơ để khách và host dễ kết nối hơn, đồng thời giữ cho thông tin cá nhân của bạn luôn rõ ràng và đáng tin cậy.",
    },
    trips: {
        title: "Chuyến đi trước đây",
        description:
            "Xem lại các chuyến đi đã đặt, trạng thái hoàn tất và các thao tác tiếp theo cho từng kỳ nghỉ.",
    },
};

const normalizeProfile = (profile: AccountUserProfile): AccountUserProfile => ({
    ...profile,
    displayName: profile.displayName.trim(),
    location: profile.location.trim(),
    job: profile.job.trim(),
    dreamDestination: profile.dreamDestination.trim(),
    school: profile.school.trim(),
    bio: profile.bio.trim(),
    languages: [...new Set(profile.languages.map((language) => language.trim()).filter(Boolean))],
});

const getJoinedYear = (createdAt?: string, fallbackYear?: number | null) => {
    if (fallbackYear) {
        return fallbackYear;
    }

    if (!createdAt) {
        return new Date().getFullYear();
    }

    const parsed = new Date(createdAt);
    return Number.isNaN(parsed.getTime()) ? new Date().getFullYear() : parsed.getFullYear();
};

const getUserId = (user: ApiUser) => String(user.userId || user.id);

const createProfileFromApiUser = (user: ApiUser): AccountUserProfile => {
    const id = getUserId(user);
    const displayName = user.fullName?.trim() || user.name?.trim() || user.email;
    const isHost = user.role === "host" || user.roles?.includes("host");

    return {
        id,
        displayName,
        location: user.location?.trim() ?? "",
        avatarUrl: user.avatarUrl?.trim() ?? "",
        job: user.job?.trim() ?? (isHost ? "Chủ nhà trênminh thanh villa " : ""),
        dreamDestination: user.dreamDestination?.trim() ?? "",
        school: user.school?.trim() ?? "",
        languages: user.languages?.filter(Boolean) ?? [],
        bio: user.bio?.trim() ?? "",
        isVerified: user.isVerified ?? Boolean(user.isHostVerified || user.isEmailVerified),
        joinedYear: getJoinedYear(user.createdAt, user.joinedYear),
    };
};

const getPersistableAvatarUrl = (avatarUrl: string) => {
    const value = avatarUrl.trim();
    if (!value) {
        return null;
    }

    try {
        const parsedUrl = new URL(value);
        return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:" ? value : undefined;
    } catch {
        return undefined;
    }
};

const buildCurrentBackendPayload = (profile: AccountUserProfile): UpdateMePayload => {
    const avatarUrl = getPersistableAvatarUrl(profile.avatarUrl);

    return {
        fullName: profile.displayName,
        bio: profile.bio || null,
        location: profile.location || null,
        job: profile.job || null,
        dreamDestination: profile.dreamDestination || null,
        school: profile.school || null,
        languages: profile.languages,
        ...(avatarUrl !== undefined ? { avatarUrl } : {}),
    };
};

const syncCurrentUserSession = (user: ApiUser) => {
    const currentUser = getCurrentUser();

    if (!currentUser) {
        return;
    }

    setCurrentUser({
        ...currentUser,
        id: getUserId(user),
        name: user.fullName?.trim() || user.name?.trim() || currentUser.name,
        email: user.email || currentUser.email,
        roles: user.roles ?? currentUser.roles,
        avatarUrl: user.avatarUrl ?? currentUser.avatarUrl,
        location: user.location ?? currentUser.location,
        job: user.job ?? currentUser.job,
        dreamDestination: user.dreamDestination ?? currentUser.dreamDestination,
        school: user.school ?? currentUser.school,
        languages: user.languages ?? currentUser.languages,
    });

    window.dispatchEvent(new Event("account-profile-updated"));
};

const calculateNights = (checkIn: string, checkOut: string) => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        return 0;
    }

    return Math.max(1, Math.round((end.getTime() - start.getTime()) / 86_400_000));
};

const mapBookingStatusToTripStatus = (
    displayStatus: ReturnType<typeof getBookingDisplayStatus>,
): TripHistory["status"] => {
    const normalizedStatus = displayStatus.normalizedStatus;

    if (
        normalizedStatus.includes("cancel") ||
        ["payment_expired", "rejected", "refund_pending", "refunded"].includes(normalizedStatus)
    ) {
        return "cancelled";
    }

    if (normalizedStatus === "completed") {
        return "completed";
    }

    return "active";
};

const mapBookingToTrip = (booking: ApiBooking, now: Date): TripHistory => {
    const totalPrice = Number(booking.totalAmount || booking.totalPrice || 0);
    const displayStatus = getBookingDisplayStatus(booking, { role: "guest", now });
    const status = mapBookingStatusToTripStatus(displayStatus);
    const location = [booking.listing?.city, booking.listing?.district].filter(Boolean).join(", ");
    const address = [booking.listing?.addressLine, booking.listing?.district, booking.listing?.city]
        .filter(Boolean)
        .join(", ");
    const coverImageUrl =
        booking.listing?.coverImageUrl ||
        booking.listing?.coverImage?.url ||
        booking.listing?.images?.find((image) => image.isCover)?.url ||
        booking.listing?.images?.[0]?.url ||
        booking.listing?.imageUrl ||
        "";

    return {
        id: String(booking.bookingId),
        listingId: booking.listingId ?? null,
        propertyName: booking.listing?.title ?? `Chỗ nghỉ #${booking.listingId}`,
        location: location || "Chưa cập nhật",
        imageUrl: coverImageUrl,
        checkIn: booking.checkInDate,
        checkOut: booking.checkOutDate,
        nights: booking.nights || calculateNights(booking.checkInDate, booking.checkOutDate),
        totalPrice,
        currency: booking.currency || "VND",
        status,
        bookingStatusCode: displayStatus.normalizedStatus,
        bookingStatusLabel: displayStatus.label,
        bookingStatusTone: displayStatus.tone,
        canReview: status === "completed" || displayStatus.normalizedStatus === "checked_out",
        canRebook: status === "completed" || status === "cancelled",
        guestCount: booking.guestCount ?? booking.guestsCount,
        address: address || location,
        paymentStatus: booking.paymentStatus,
        subtotalAmount: Number(booking.subtotalAmount || 0),
        cleaningFeeAmount: Number(booking.cleaningFeeAmount || 0),
        serviceFeeAmount: Number(booking.serviceFeeAmount || 0),
        discountAmount: Number(booking.discountAmount || 0),
        bookingNote: booking.bookingNote,
        cancellationReason: booking.cancellationReason,
        createdAt: booking.createdAt,
        paidAt: booking.paidAt,
        checkedInAt: booking.checkedInAt,
        checkedOutAt: booking.checkedOutAt,
    };
};

const AboutMeCard = ({
    bio,
    onEdit,
}: {
    bio: string;
    onEdit: () => void;
}) => (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
                <h2 className="text-2xl font-semibold text-slate-900">Về tôi</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                    Hãy chia sẻ một vài dòng ngắn gọn về bạn.
                </p>
            </div>

            <button
                type="button"
                onClick={onEdit}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-all duration-200 hover:border-cyan-300/50 hover:bg-cyan-300/10 hover:text-cyan-800"
            >
                <LuPencilLine size={16} />
                Chỉnh sửa
            </button>
        </div>

        <p
            className={cn(
                "mt-5 max-w-3xl whitespace-pre-line text-[15px] leading-8",
                bio ? "text-slate-700" : "text-slate-400",
            )}
        >
            {bio || "Chưa cập nhật phần giới thiệu."}
        </p>
    </section>
);

const ProfilePage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const activeTab: AccountTab = location.pathname === APP_ROUTES.accountTrips ? "trips" : "profile";
    const [profile, setProfile] = useState<AccountUserProfile | null>(null);
    const [bookings, setBookings] = useState<ApiBooking[]>([]);
    const [statusNow, setStatusNow] = useState(() => new Date());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [editModal, setEditModal] = useState<EditModalState | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const [meResult, bookingResult] = await Promise.allSettled([
                getMe(),
                getMyBookings({ page: 1, limit: 100 }),
            ]);

            if (meResult.status === "rejected") {
                throw meResult.reason;
            }

            setProfile(createProfileFromApiUser(meResult.value.user));
            setBookings(bookingResult.status === "fulfilled" ? (bookingResult.value.items ?? []) : []);

            if (bookingResult.status === "rejected") {
                setError("Đã tải hồ sơ, nhưng chưa tải được lịch sử chuyến đi.");
            }
        } catch (fetchError) {
            setError(fetchError instanceof Error ? fetchError.message : "Không thể tải thông tin tài khoản.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void fetchData();
    }, [fetchData]);

    useEffect(() => {
        const timer = window.setInterval(() => setStatusNow(new Date()), 60_000);
        return () => window.clearInterval(timer);
    }, []);

    const trips = useMemo(() => bookings.map((booking) => mapBookingToTrip(booking, statusNow)), [bookings, statusNow]);
    const copy = pageCopy[activeTab];

    const handleTabChange = (nextTab: AccountTab) => {
        navigate(nextTab === "profile" ? APP_ROUTES.accountProfile : APP_ROUTES.accountTrips);
    };

    const saveProfile = async (nextProfile: AccountUserProfile) => {
        const normalizedProfile = normalizeProfile(nextProfile);
        setError("");
        setSuccess("");

        try {
            const result = await updateMe(buildCurrentBackendPayload(normalizedProfile));
            setProfile(createProfileFromApiUser(result.user));
            syncCurrentUserSession(result.user);
            setSuccess("Đã cập nhật hồ sơ.");
            setEditModal(null);
        } catch (saveError) {
            const message = saveError instanceof Error ? saveError.message : "Không thể cập nhật hồ sơ.";
            setError(message);
            throw saveError;
        }
    };

    const handleAvatarUpload = async (file: File) => {
        if (!profile) {
            return;
        }

        setError("");
        setSuccess("");

        try {
            const uploaded = await uploadFileToR2(file, {
                folder: "avatars",
                maxSizeBytes: 5 * 1024 * 1024,
            });
            const result = await updateMyAvatar({
                url: uploaded.publicUrl,
                key: uploaded.key,
            });
            setProfile(createProfileFromApiUser(result.user));
            syncCurrentUserSession(result.user);
            setSuccess("Đã cập nhật ảnh đại diện.");
        } catch (avatarError) {
            setError(avatarError instanceof Error ? avatarError.message : "Không thể cập nhật ảnh đại diện.");
        }
    };

    return (
        <div className="min-h-screen bg-[#F6F8FA] px-4 pb-12 pt-28 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-[1680px]">
                <header className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                    <div>
                        <p className="text-sm font-semibold text-cyan-700 sm:text-base">Khu vực tài khoản</p>
                        <h1 className="mt-2 text-4xl font-semibold tracking-normal text-slate-950 sm:text-5xl">
                            {copy.title}
                        </h1>
                        <p className="mt-4 max-w-3xl text-base leading-8 text-slate-500">{copy.description}</p>
                    </div>

                    {activeTab === "profile" ? (
                        <button
                            type="button"
                            onClick={() => setEditModal({ mode: "all" })}
                            disabled={!profile}
                            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-cyan-300/70 bg-white px-5 py-3 text-sm font-semibold text-cyan-800 transition-all duration-200 hover:bg-cyan-300/10 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
                        >
                            <LuPencilLine size={17} />
                            Chỉnh sửa
                        </button>
                    ) : null}
                </header>

                {error || success ? (
                    <div
                        className={cn(
                            "mt-6 rounded-2xl border px-5 py-4 text-sm font-medium",
                            error
                                ? "border-rose-200 bg-rose-50 text-rose-700"
                                : "border-emerald-200 bg-emerald-50 text-emerald-700",
                        )}
                    >
                        {error || success}
                    </div>
                ) : null}

                <main className="mt-9 grid gap-7 lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)]">
                    <ProfileSidebar activeTab={activeTab} onTabChange={handleTabChange} />

                    {activeTab === "profile" ? (
                        profile ? (
                            <div className="grid gap-7 xl:grid-cols-[380px_minmax(0,1fr)]">
                                <ProfileSummaryCard
                                    user={profile}
                                    onEdit={() => setEditModal({ mode: "all" })}
                                    onAvatarUpload={handleAvatarUpload}
                                />

                                <div className="space-y-7">
                                    <ProfileInfoList
                                        user={profile}
                                        onEditField={(field) => setEditModal({ mode: "single", field })}
                                    />
                                    <AboutMeCard bio={profile.bio} onEdit={() => setEditModal({ mode: "single", field: "bio" })} />
                                </div>
                            </div>
                        ) : (
                            <section className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
                                <p className="text-sm font-medium text-slate-500">
                                    {loading ? "Đang tải hồ sơ..." : "Chưa có dữ liệu hồ sơ."}
                                </p>
                            </section>
                        )
                    ) : (
                        <section>
                            {loading ? (
                                <div className="rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center text-sm font-medium text-slate-500 shadow-sm">
                                    Đang tải chuyến đi...
                                </div>
                            ) : (
                                <TripHistoryList trips={trips} />
                            )}
                        </section>
                    )}
                </main>
            </div>

            {profile && editModal ? (
                <EditProfileModal
                    isOpen={Boolean(editModal)}
                    mode={editModal.mode}
                    field={editModal.field}
                    user={profile}
                    languageOptions={profileLanguageOptions}
                    onClose={() => setEditModal(null)}
                    onSave={saveProfile}
                />
            ) : null}
        </div>
    );
};

export default ProfilePage;
