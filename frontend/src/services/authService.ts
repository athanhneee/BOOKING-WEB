import { APP_ROUTES } from "../config/routes";
import { adminUsers } from "../data/mockData";
import { clearCurrentUser, setCurrentUser, type AuthUser, type UserRole } from "../store/authStore";

type LoginInput = {
    identifier: string;
    password: string;
};

type RegisterInput = {
    fullName: string;
    phoneNumber: string;
    email: string;
    password: string;
};

type PasswordResetInput = {
    identifier: string;
};

type PasswordResetOtpInput = {
    identifier: string;
    otp: string;
};

const adminEmails = new Set(["nam@gmail.com", "admin@minhthanhvilla.vn"]);
const hostEmails = new Set(["host@minhthanhvilla.vn", "chu-nha@minhthanhvilla.vn"]);
const authRouteSet = new Set([APP_ROUTES.login, APP_ROUTES.register, APP_ROUTES.forgotPassword]);

const normalizeIdentifier = (identifier: string) => identifier.trim().toLowerCase();
const normalizePhone = (value: string) => value.replace(/\D/g, "");

const isSafeRedirect = (value?: string | null) => {
    if (!value || !value.startsWith("/")) {
        return false;
    }

    return !value.startsWith("//") && !authRouteSet.has(value);
};

const getDefaultName = (identifier: string) => {
    const normalized = normalizeIdentifier(identifier);

    if (normalized.includes("@")) {
        const [localPart = "khach"] = normalized.split("@");
        const words = localPart
            .replace(/[._-]+/g, " ")
            .trim()
            .split(/\s+/)
            .filter(Boolean);

        if (words.length > 0) {
            return words
                .slice(0, 3)
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" ");
        }
    }

    return "Khach Minh Thanh";
};

const inferRole = (identifier: string): UserRole => {
    const normalized = normalizeIdentifier(identifier);

    if (adminEmails.has(normalized)) {
        return "Admin";
    }

    if (hostEmails.has(normalized)) {
        return "Host";
    }

    return "Guest";
};

const findExistingUser = (identifier: string) => {
    const normalizedIdentifier = normalizeIdentifier(identifier);
    const normalizedPhone = normalizePhone(identifier);

    return adminUsers.find((user) => {
        const matchesEmail = user.email.trim().toLowerCase() === normalizedIdentifier;
        const matchesPhone = normalizedPhone.length > 0 && normalizePhone(user.phone) === normalizedPhone;
        return matchesEmail || matchesPhone;
    });
};

export const getDefaultRouteForRole = (role: UserRole) => {
    if (role === "Admin") {
        return APP_ROUTES.adminOverview;
    }

    if (role === "Host" || role === "Host new") {
        return APP_ROUTES.ownerDashboard;
    }

    return APP_ROUTES.accountProfile;
};

export const resolvePostAuthRoute = (user: AuthUser, redirectTo?: string | null) =>
    isSafeRedirect(redirectTo) ? redirectTo : getDefaultRouteForRole(user.role);

const createUserId = (seed: string) => {
    const normalized = seed.replace(/[^a-z0-9]+/gi, "").toLowerCase();
    const suffix = normalized.slice(0, 10) || "guest";
    return `user_${suffix}`;
};

const validatePassword = (password: string) => {
    if (password.trim().length < 6) {
        throw new Error("Mật khẩu cần tối thiểu 6 ký tự.");
    }
};

export const loginWithCredentials = ({ identifier, password }: LoginInput) => {
    const normalizedIdentifier = normalizeIdentifier(identifier);

    if (!normalizedIdentifier) {
        throw new Error("Vui lòng nhập email hoặc số điện thoại.");
    }

    validatePassword(password);

    const matchedUser = findExistingUser(normalizedIdentifier);

    const user: AuthUser = matchedUser
        ? {
              id: matchedUser.id,
              name: matchedUser.name,
              email: matchedUser.email,
              role: matchedUser.role,
          }
        : {
              id: createUserId(normalizedIdentifier),
              name: getDefaultName(normalizedIdentifier),
              email: normalizedIdentifier.includes("@") ? normalizedIdentifier : `${normalizedIdentifier}@minhthanhvilla.vn`,
              role: inferRole(normalizedIdentifier),
          };

    setCurrentUser(user);

    const matchedUserIndex = adminUsers.findIndex((item) => item.id === user.id);
    if (matchedUserIndex >= 0) {
        adminUsers[matchedUserIndex] = {
            ...adminUsers[matchedUserIndex],
            lastLogin: new Date().toISOString().slice(0, 10),
        };
    }

    return user;
};

export const registerAccount = ({ fullName, phoneNumber, email, password }: RegisterInput) => {
    const normalizedEmail = normalizeIdentifier(email);
    const normalizedPhoneNumber = normalizePhone(phoneNumber);

    if (!fullName.trim()) {
        throw new Error("Vui lòng nhập họ và tên.");
    }

    if (!phoneNumber.trim() || normalizedPhoneNumber.length < 9) {
        throw new Error("Số điện thoại chưa hợp lệ.");
    }

    if (!normalizedEmail.includes("@")) {
        throw new Error("Email chưa hợp lệ.");
    }

    validatePassword(password);

    const user: AuthUser = {
        id: createUserId(normalizedEmail),
        name: fullName.trim(),
        email: normalizedEmail,
        role: "Guest",
    };

    const existingUserIndex = adminUsers.findIndex(
        (item) => item.email.trim().toLowerCase() === normalizedEmail || normalizePhone(item.phone) === normalizedPhoneNumber,
    );

    const nextAdminUser = {
        id: user.id,
        name: fullName.trim(),
        email: normalizedEmail,
        phone: normalizedPhoneNumber,
        role: "Guest",
        status: "active",
        joinDate: new Date().toISOString().slice(0, 10),
        totalBookings: 0,
        hasActiveBooking: false,
        lastLogin: new Date().toISOString().slice(0, 10),
    };

    if (existingUserIndex >= 0) {
        adminUsers[existingUserIndex] = {
            ...adminUsers[existingUserIndex],
            ...nextAdminUser,
        };
    } else {
        adminUsers.unshift(nextAdminUser);
    }

    setCurrentUser(user);

    return user;
};

export const requestPasswordResetOtp = ({ identifier }: PasswordResetInput) => {
    const normalizedIdentifier = normalizeIdentifier(identifier);

    if (!normalizedIdentifier) {
        throw new Error("Vui lòng nhập email hoặc số điện thoại đã đăng ký.");
    }

    return {
        maskedDestination: normalizedIdentifier,
    };
};

export const verifyPasswordResetOtp = ({ identifier, otp }: PasswordResetOtpInput) => {
    const normalizedIdentifier = normalizeIdentifier(identifier);

    if (!normalizedIdentifier) {
        throw new Error("Thiếu thông tin tài khoản cần đặt lại mật khẩu.");
    }

    if (!/^\d{6}$/.test(otp)) {
        throw new Error("Mã OTP phải gồm 6 chữ số.");
    }

    return true;
};

export const logout = () => {
    clearCurrentUser();
};
