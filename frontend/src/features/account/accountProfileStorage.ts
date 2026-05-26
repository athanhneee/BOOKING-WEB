import type { AccountUserProfile } from "../../models/entities/AccountProfile";
import type { AuthUser, UserRole } from "../../store/authStore";

const getJoinedYear = (createdAt?: string | null) => {
    if (!createdAt) {
        return new Date().getFullYear();
    }

    const parsed = new Date(createdAt);
    return Number.isNaN(parsed.getTime()) ? new Date().getFullYear() : parsed.getFullYear();
};

const getJobLabel = (role: UserRole) => {
    if (role === "Admin") {
        return "Quản trị viênminh thanh villa ";
    }

    if (role === "Host") {
        return "Chủ nhà trênminh thanh villa ";
    }

    if (role === "Host new") {
        return "Đang hoàn thiện hồ sơ Host";
    }

    return "Khách đặt villa";
};

const getDefaultBio = (authUser: AuthUser) => {
    if (authUser.role === "Admin") {
        return `Xin chào! Tôi là ${authUser.name}, thành viên đội ngũ vận hànhminh thanh villa .`;
    }

    if (authUser.role === "Host" || authUser.role === "Host new") {
        return `Xin chào! Tôi là ${authUser.name}, đang quản lý các trải nghiệm lưu trú trênminh thanh villa .`;
    }

    return `Xin chào! Tôi là ${authUser.name}. Tôi đang tìm kiếm những chỗ ở phù hợp cho các chuyến đi sắp tới trênminh thanh villa .`;
};

export const createAccountProfileFromAuthUser = (authUser: AuthUser): AccountUserProfile => ({
    id: authUser.id,
    displayName: authUser.name,
    location: "Việt Nam",
    avatarUrl: "",
    job: getJobLabel(authUser.role),
    dreamDestination: "",
    school: "",
    languages: ["Tiếng Việt"],
    bio: getDefaultBio(authUser),
    isVerified: authUser.role === "Admin" || authUser.role === "Host",
    joinedYear: getJoinedYear(),
});

export const getAccountProfileForUser = createAccountProfileFromAuthUser;

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