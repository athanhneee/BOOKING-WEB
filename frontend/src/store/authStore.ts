export type UserRole = "Guest" | "Host" | "Host new" | "Admin";

export type AuthUser = {
    id: string;
    name: string;
    email: string;
    role: UserRole;
};

const AUTH_STORAGE_KEY = "minhthanhvilla_current_user";
const AUTH_TOKEN_STORAGE_KEY = "minhthanhvilla_access_token";

const canUseStorage = () => typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";

export const getCurrentUser = (): AuthUser | null => {
    if (!canUseStorage()) {
        return null;
    }

    const rawValue = window.sessionStorage.getItem(AUTH_STORAGE_KEY);
    if (!rawValue) {
        return null;
    }

    try {
        const parsed = JSON.parse(rawValue) as Partial<AuthUser>;
        if (parsed?.id && parsed?.name && parsed?.email && parsed?.role) {
            return {
                id: parsed.id,
                name: parsed.name,
                email: parsed.email,
                role: parsed.role,
            };
        }
    } catch {
        return null;
    }

    return null;
};

export const setCurrentUser = (user: AuthUser) => {
    if (!canUseStorage()) {
        return;
    }

    window.sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
};

export const getAccessToken = () => {
    if (!canUseStorage()) {
        return null;
    }

    return window.sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
};

export const setAccessToken = (token: string) => {
    if (!canUseStorage()) {
        return;
    }

    window.sessionStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
};

export const setAuthSession = (user: AuthUser, token?: string | null) => {
    setCurrentUser(user);

    if (token) {
        setAccessToken(token);
    }
};

export const clearCurrentUser = () => {
    if (!canUseStorage()) {
        return;
    }

    window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
    window.sessionStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
};

export const isAuthenticated = (user: AuthUser | null | undefined): user is AuthUser => Boolean(user);
export const isAdminUser = (user: Pick<AuthUser, "role"> | null | undefined) => user?.role === "Admin";
export const isHostUser = (user: Pick<AuthUser, "role"> | null | undefined) =>
    user?.role === "Host" || user?.role === "Host new" || user?.role === "Admin";
