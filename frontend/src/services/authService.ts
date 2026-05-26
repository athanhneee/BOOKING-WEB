import { APP_ROUTES } from "../config/routes";
import { apiClient, normalizeAuthUser } from "./api/apiClient";
import { disconnectSocket } from "./socket/socketClient";
import { clearCurrentUser, setAuthSession, type AuthUser, type UserRole } from "../store/authStore";

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

type AuthResponse = {
    token?: string;
    accessToken?: string;
    user?: unknown;
};

type PasswordResetInput = {
    identifier: string;
};

type ResetPasswordInput = {
    identifier: string;
    otp: string;
    newPassword: string;
};

const authRouteSet = new Set<string>([APP_ROUTES.login, APP_ROUTES.register, APP_ROUTES.forgotPassword]);

const isSafeRedirect = (value?: string | null): value is string => {
    if (!value || !value.startsWith("/")) return false;
    return !value.startsWith("//") && !authRouteSet.has(value);
};

const splitFullName = (fullName: string) => {
    const parts = fullName.trim().split(/\s+/).filter(Boolean);

    if (parts.length <= 1) {
        return {
            firstName: parts[0] ?? "Guest",
            lastName: "User",
        };
    }

    return {
        firstName: parts.slice(0, -1).join(" "),
        lastName: parts[parts.length - 1],
    };
};

const persistAuthResponse = (data: AuthResponse) => {
    const token = data.accessToken ?? data.token;
    const user = normalizeAuthUser(data.user);

    if (!token || !user) {
        throw new Error("Phản hồi đăng nhập không hợp lệ.");
    }

    setAuthSession(user, token);
    return user;
};

export const getDefaultRouteForRole = (role: UserRole) => {
    if (role === "Admin") return APP_ROUTES.adminOverview;
    if (role === "Host" || role === "Host new") return APP_ROUTES.ownerDashboard;
    return APP_ROUTES.accountProfile;
};

export const resolvePostAuthRoute = (user: AuthUser, redirectTo?: string | null) =>
    isSafeRedirect(redirectTo) ? redirectTo : getDefaultRouteForRole(user.role);

export const loginWithCredentials = async ({ identifier, password }: LoginInput) => {
    const data = await apiClient.post<AuthResponse>(
        "/api/auth/login",
        {
            identifier: identifier.trim(),
            password,
        },
        {
            skipAuthRefresh: true,
        },
    );

    return persistAuthResponse(data);
};

export const loginWithGoogleIdToken = async (idToken: string) => {
    const data = await apiClient.post<AuthResponse>(
        "/api/auth/google",
        { idToken },
        { skipAuthRefresh: true },
    );

    return persistAuthResponse(data);
};

export const registerAccount = async ({ fullName, phoneNumber, email, password }: RegisterInput) => {
    const { firstName, lastName } = splitFullName(fullName);

    const data = await apiClient.post<AuthResponse>(
        "/api/auth/register",
        {
            email: email.trim().toLowerCase(),
            password,
            firstName,
            lastName,
            phone: phoneNumber.trim() || undefined,
        },
        {
            skipAuthRefresh: true,
        },
    );

    return persistAuthResponse(data);
};

export const loadCurrentUser = async () => {
    const data = await apiClient.get<{ user: unknown }>("/api/auth/me");
    const user = normalizeAuthUser(data.user);

    if (!user) {
        throw new Error("Không lấy được thông tin người dùng.");
    }

    return user;
};

export const requestPasswordResetOtp = ({ identifier }: PasswordResetInput) =>
    apiClient.post(
        "/api/auth/forgot-password",
        {
            identifier: identifier.trim(),
        },
        {
            skipAuthRefresh: true,
        },
    );

export const resetPasswordWithOtp = ({ identifier, otp, newPassword }: ResetPasswordInput) =>
    apiClient.post(
        "/api/auth/reset-password",
        {
            identifier: identifier.trim(),
            otp,
            newPassword,
        },
        {
            skipAuthRefresh: true,
        },
    );

export const logout = async () => {
    try {
        await apiClient.post("/api/auth/logout");
    } finally {
        disconnectSocket();
        clearCurrentUser();
    }
};
export const verifyPasswordResetOtp = resetPasswordWithOtp;
