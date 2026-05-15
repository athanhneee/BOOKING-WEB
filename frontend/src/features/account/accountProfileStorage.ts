import type { AccountUserProfile } from "../../data/mockAccountUser";
import { adminUsers, hostApplications } from "../../data/mockData";
import type { AuthUser, UserRole } from "../../store/authStore";

const ACCOUNT_PROFILE_STORAGE_KEY = "minhthanhvilla_account_profiles";

const canUseLocalStorage = () => typeof window !== "undefined" && typeof window.localStorage !== "undefined";

const getJoinedYear = (joinDate?: string) => {
    if (!joinDate) {
        return new Date().getFullYear();
    }

    const parsedYear = Number.parseInt(joinDate.slice(0, 4), 10);
    return Number.isFinite(parsedYear) ? parsedYear : new Date().getFullYear();
};

const getLatestApplicationForUser = (userId: string) =>
    hostApplications
        .filter((application) => application.userId === userId)
        .sort((left, right) => right.submittedAt.localeCompare(left.submittedAt))[0] ?? null;

const getJobLabel = (role: UserRole, totalBookings?: number, applicationStatus?: string) => {
    if (role === "Admin") {
        return "Quản trị viên Minh Thanh Villa";
    }

    if (role === "Host") {
        return "Chủ nhà trên Minh Thanh Villa";
    }

    if (role === "Host new") {
        return "Đang hoàn thiện hồ sơ Host";
    }

    if (applicationStatus === "pending") {
        return "Đang đăng ký trở thành Host";
    }

    if (applicationStatus === "rejected") {
        return "Đang bổ sung hồ sơ Host";
    }

    if (totalBookings && totalBookings > 0) {
        return `Khách lưu trú với ${totalBookings} chuyến đi`;
    }

    return "Khách đặt villa";
};

const getDefaultBio = (authUser: AuthUser, totalBookings?: number, hostBio?: string) => {
    if (hostBio?.trim()) {
        return hostBio.trim();
    }

    if (authUser.role === "Admin") {
        return `Xin chào! Tôi là ${authUser.name}, thành viên đội ngũ vận hành Minh Thanh Villa.`;
    }

    if (authUser.role === "Host" || authUser.role === "Host new") {
        return `Xin chào! Tôi là ${authUser.name}, đang quản lý và chuẩn bị các trải nghiệm lưu trú trên Minh Thanh Villa.`;
    }

    if (totalBookings && totalBookings > 0) {
        return `Xin chào! Tôi là ${authUser.name}. Tôi đã có ${totalBookings} chuyến đi trên Minh Thanh Villa và luôn ưu tiên những chỗ ở rõ ràng, thuận tiện.`;
    }

    return `Xin chào! Tôi là ${authUser.name}. Tôi đang tìm kiếm những chỗ ở phù hợp cho các chuyến đi sắp tới trên Minh Thanh Villa.`;
};

const readStoredProfiles = (): Record<string, AccountUserProfile> => {
    if (!canUseLocalStorage()) {
        return {};
    }

    const rawValue = window.localStorage.getItem(ACCOUNT_PROFILE_STORAGE_KEY);
    if (!rawValue) {
        return {};
    }

    try {
        const parsed = JSON.parse(rawValue) as Record<string, AccountUserProfile>;
        return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
        return {};
    }
};

const writeStoredProfiles = (profiles: Record<string, AccountUserProfile>) => {
    if (!canUseLocalStorage()) {
        return;
    }

    window.localStorage.setItem(ACCOUNT_PROFILE_STORAGE_KEY, JSON.stringify(profiles));
};

export const createAccountProfileFromAuthUser = (authUser: AuthUser): AccountUserProfile => {
    const adminUser = adminUsers.find((user) => user.id === authUser.id || user.email.toLowerCase() === authUser.email.toLowerCase());
    const latestApplication = getLatestApplicationForUser(authUser.id);
    const hostInfo = latestApplication?.hostInfo;
    const documents = latestApplication?.documents;
    const location = hostInfo?.address || documents?.address || "Việt Nam";

    return {
        id: authUser.id,
        displayName: authUser.name,
        location,
        avatarUrl: "",
        job: getJobLabel(authUser.role, adminUser?.totalBookings, latestApplication?.status),
        dreamDestination: "",
        school: "",
        languages: ["Tiếng Việt"],
        bio: getDefaultBio(authUser, adminUser?.totalBookings, hostInfo?.bio),
        isVerified: authUser.role === "Admin" || authUser.role === "Host" || adminUser?.status === "active",
        joinedYear: getJoinedYear(adminUser?.joinDate),
    };
};

export const getAccountProfileForUser = (authUser: AuthUser): AccountUserProfile => {
    const baseProfile = createAccountProfileFromAuthUser(authUser);
    const storedProfile = readStoredProfiles()[authUser.id];

    if (!storedProfile) {
        return baseProfile;
    }

    return {
        ...baseProfile,
        ...storedProfile,
        id: authUser.id,
    };
};

export const saveAccountProfileForUser = (authUser: AuthUser, profile: AccountUserProfile) => {
    const profiles = readStoredProfiles();
    const nextProfile = {
        ...profile,
        id: authUser.id,
    };

    writeStoredProfiles({
        ...profiles,
        [authUser.id]: nextProfile,
    });

    window.dispatchEvent(new CustomEvent("account-profile-updated", { detail: { userId: authUser.id } }));

    return nextProfile;
};

export const createGuestMenuProfile = (): AccountUserProfile => ({
    id: "guest",
    displayName: "Tài khoản",
    location: "Chưa đăng nhập",
    avatarUrl: "",
    job: "",
    dreamDestination: "",
    school: "",
    languages: [],
    bio: "",
    isVerified: false,
    joinedYear: new Date().getFullYear(),
});
