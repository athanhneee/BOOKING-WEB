export type UserRole = "Guest" | "Host" | "Host new" | "Admin";

export type AuthUser = {
    id: string;
    name: string;
    email: string;
    role: UserRole;
};

const AUTH_STORAGE_KEY = "minhthanhvilla_current_user";

const fallbackAdminUser: AuthUser = {
    id: "u006",
    name: "Hoàng Văn Nam",
    email: "nam@gmail.com",
    role: "Admin",
};

const canUseStorage = () => typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";

export const getCurrentUser = (): AuthUser => {
    if (!canUseStorage()) {
        return fallbackAdminUser;
    }

    const rawValue = window.sessionStorage.getItem(AUTH_STORAGE_KEY);
    if (!rawValue) {
        return fallbackAdminUser;
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
        return fallbackAdminUser;
    }

    return fallbackAdminUser;
};

export const setCurrentUser = (user: AuthUser) => {
    if (!canUseStorage()) {
        return;
    }

    window.sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
};

export const clearCurrentUser = () => {
    if (!canUseStorage()) {
        return;
    }

    window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
};

export const isAdminUser = (user: Pick<AuthUser, "role"> | null | undefined) => user?.role === "Admin";
