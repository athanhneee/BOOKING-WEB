import {
    clearCurrentUser,
    getAccessToken,
    setAuthSession,
    type AuthUser,
} from "../../store/authStore";

type ApiEnvelope<T> = {
    success: boolean;
    message?: string;
    data?: T;
    errors?: Array<{ path?: string; msg?: string }>;
};

type RequestOptions = Omit<RequestInit, "body" | "method"> & {
    query?: Record<string, string | number | boolean | null | undefined | Array<string | number | boolean>>;
    body?: unknown;
    skipAuthRefresh?: boolean;
};

type RefreshResponse = {
    token?: string;
    accessToken?: string;
    user?: unknown;
};

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

export class ApiError extends Error {
    status: number;
    errors: Array<{ path?: string; msg?: string }>;

    constructor(message: string, status: number, errors: Array<{ path?: string; msg?: string }> = []) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.errors = errors;
    }
}

const buildUrl = (path: string, query?: RequestOptions["query"]) => {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    const url = new URL(`${API_BASE_URL}${normalizedPath}`, window.location.origin);

    Object.entries(query ?? {}).forEach(([key, value]) => {
        if (value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0)) {
            return;
        }

        if (Array.isArray(value)) {
            url.searchParams.set(key, value.join(","));
            return;
        }

        url.searchParams.set(key, String(value));
    });

    return url.toString();
};

const normalizeUserRole = (role?: string): AuthUser["role"] => {
    if (role === "admin" || role === "Admin") return "Admin";
    if (role === "host" || role === "Host") return "Host";
    return "Guest";
};

export const normalizeAuthUser = (raw: unknown): AuthUser | null => {
    if (!raw || typeof raw !== "object") {
        return null;
    }

    const user = raw as {
        id?: string | number;
        userId?: string | number;
        name?: string;
        email?: string;
        role?: string;
        roles?: string[];
    };
    const id = user.id ?? user.userId;
    const role = user.role ?? user.roles?.[0];

    if (id === undefined || !user.email) {
        return null;
    }

    return {
        id: String(id),
        name: user.name?.trim() || user.email,
        email: user.email,
        role: normalizeUserRole(role),
    };
};

const parseEnvelope = async <T>(response: Response) => {
    let envelope: ApiEnvelope<T> | null = null;

    try {
        envelope = (await response.json()) as ApiEnvelope<T>;
    } catch {
        envelope = null;
    }

    if (!response.ok || envelope?.success === false) {
        throw new ApiError(
            envelope?.message || "Không thể kết nối tới máy chủ. Vui lòng thử lại.",
            response.status,
            envelope?.errors ?? [],
        );
    }

    return envelope?.data as T;
};

const refreshAccessToken = async () => {
    const response = await fetch(buildUrl("/api/auth/refresh"), {
        method: "POST",
        credentials: "include",
        headers: {
            Accept: "application/json",
        },
    });
    const data = await parseEnvelope<RefreshResponse>(response);
    const token = data?.accessToken ?? data?.token;
    const user = normalizeAuthUser(data?.user);

    if (!token || !user) {
        throw new ApiError("Phiên đăng nhập đã hết hạn.", 401);
    }

    setAuthSession(user, token);
    return token;
};

const request = async <T>(method: string, path: string, options: RequestOptions = {}, retried = false): Promise<T> => {
    const headers = new Headers(options.headers);
    const token = getAccessToken();

    headers.set("Accept", "application/json");

    if (options.body !== undefined && !(options.body instanceof FormData)) {
        headers.set("Content-Type", "application/json");
    }

    if (token) {
        headers.set("Authorization", `Bearer ${token}`);
    }

    const response = await fetch(buildUrl(path, options.query), {
        ...options,
        method,
        credentials: "include",
        headers,
        body:
            options.body === undefined
                ? undefined
                : options.body instanceof FormData
                    ? options.body
                    : JSON.stringify(options.body),
    });

    if (response.status === 401 && !options.skipAuthRefresh && !retried) {
        try {
            await refreshAccessToken();
            return request<T>(method, path, options, true);
        } catch {
            clearCurrentUser();
            if (typeof window !== "undefined" && !window.location.pathname.includes("/dang-nhap")) {
                window.location.assign(`/dang-nhap?redirectTo=${encodeURIComponent(window.location.pathname + window.location.search)}`);
            }
        }
    }

    return parseEnvelope<T>(response);
};

export const apiClient = {
    get: <T>(path: string, options?: RequestOptions) => request<T>("GET", path, options),
    post: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>("POST", path, { ...options, body }),
    put: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>("PUT", path, { ...options, body }),
    patch: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>("PATCH", path, { ...options, body }),
    delete: <T>(path: string, options?: RequestOptions) => request<T>("DELETE", path, options),
};

export { API_BASE_URL };