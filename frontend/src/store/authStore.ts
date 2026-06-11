export type UserRole = "Guest" | "host" | "host new" | "Admin" | string;

export type AuthUser = {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    roles?: string[];
    avatarUrl?: string | null;
    location?: string | null;
    job?: string | null;
    dreamDestination?: string | null;
    school?: string | null;
    languages?: string[] | null;
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
                id: String(parsed.id),
                name: parsed.name,
                email: parsed.email,
                role: parsed.role,
                roles: Array.isArray(parsed.roles) ? parsed.roles.map(String) : undefined,
                avatarUrl: typeof parsed.avatarUrl === "string" ? parsed.avatarUrl : null,
                location: typeof parsed.location === "string" ? parsed.location : null,
                job: typeof parsed.job === "string" ? parsed.job : null,
                dreamDestination: typeof parsed.dreamDestination === "string" ? parsed.dreamDestination : null,
                school: typeof parsed.school === "string" ? parsed.school : null,
                languages: Array.isArray(parsed.languages) ? parsed.languages.map(String) : null,
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

const normalizeRole = (role: unknown) => String(role ?? "").trim().toLowerCase();

const getRoleValues = (user: Pick<AuthUser, "role"> & { roles?: string[] } | null | undefined) => {
    if (!user) {
        return [];
    }

    return [user.role, ...(Array.isArray(user.roles) ? user.roles : [])]
        .map(normalizeRole)
        .filter(Boolean);
};

export const isAuthenticated = (user: AuthUser | null | undefined): user is AuthUser => Boolean(user);
export const isAdminUser = (user: (Pick<AuthUser, "role"> & { roles?: string[] }) | null | undefined) =>
    getRoleValues(user).includes("admin");
export const isHostUser = (user: (Pick<AuthUser, "role"> & { roles?: string[] }) | null | undefined) =>
    getRoleValues(user).some((role) => ["host", "host verified", "host_verified"].includes(role));
