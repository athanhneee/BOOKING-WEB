import {
    clearCurrentUser,
    getAccessToken,
    setAuthSession,
    type AuthUser,
} from "../../store/authStore";

type ApiEnvelope<T> = {
    success: boolean;
    message?: string;
    code?: string;
    data?: T;
    details?: unknown;
    errors?: Array<{ path?: string; msg?: string }>;
};

type RequestOptions = Omit<RequestInit, "body" | "method"> & {
    query?: Record<string, string | number | boolean | null | undefined | Array<string | number | boolean>>;
    body?: unknown;
    skipAuthRefresh?: boolean;
};

export type PaginationMeta = {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
};

export type PaginatedResponse<T> = {
    items: T[];
    pagination: PaginationMeta;
};

type RefreshResponse = {
    token?: string;
    accessToken?: string;
    user?: unknown;
};

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

export class ApiError extends Error {
    status: number;
    code: string;
    details: unknown;
    errors: Array<{ path?: string; msg?: string }>;

    constructor(
        message: string,
        status: number,
        code = "INTERNAL_ERROR",
        details: unknown = {},
        errors: Array<{ path?: string; msg?: string }> = [],
    ) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.code = code;
        this.details = details;
        this.errors = errors;
    }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null && !Array.isArray(value);

const toApiErrors = (details: unknown, legacyErrors?: Array<{ path?: string; msg?: string }>) => {
    if (Array.isArray(details)) {
        return details
            .filter(isRecord)
            .map((item) => ({
                path: typeof item.path === "string" ? item.path : undefined,
                msg: typeof item.msg === "string" ? item.msg : undefined,
            }));
    }

    return legacyErrors ?? [];
};

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
    const normalizedRole = String(role ?? "").trim().toLowerCase();

    if (normalizedRole === "admin") return "Admin";
    // if (normalizedRole === "moderator") return "Moderator";
    if (normalizedRole === "host" || normalizedRole === "host verified" || normalizedRole === "host_verified") {
        return "host";
    }
    if (normalizedRole === "host new" || normalizedRole === "host_new" || normalizedRole === "host-new") {
        return "host new";
    }
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
        avatarUrl?: string | null;
        location?: string | null;
        job?: string | null;
        dreamDestination?: string | null;
        school?: string | null;
        languages?: string[] | null;
    };
    const id = user.id ?? user.userId;
    const roles = Array.isArray(user.roles) ? user.roles.map(String) : [];
    const role = user.role ?? roles[0];

    if (id === undefined || !user.email) {
        return null;
    }

    return {
        id: String(id),
        name: user.name?.trim() || user.email,
        email: user.email,
        role: normalizeUserRole(role),
        roles,
        avatarUrl: typeof user.avatarUrl === "string" ? user.avatarUrl : null,
        location: typeof user.location === "string" ? user.location : null,
        job: typeof user.job === "string" ? user.job : null,
        dreamDestination: typeof user.dreamDestination === "string" ? user.dreamDestination : null,
        school: typeof user.school === "string" ? user.school : null,
        languages: Array.isArray(user.languages) ? user.languages.map(String) : null,
    };
};

const parseEnvelope = async <T>(response: Response) => {
    let envelope: ApiEnvelope<T> | null = null;
    let payload: unknown = null;

    try {
        payload = await response.json();
        envelope = isRecord(payload) && typeof payload.success === "boolean"
            ? (payload as ApiEnvelope<T>)
            : null;
    } catch {
        envelope = null;
    }

    if (!response.ok || envelope?.success === false) {
        const details = envelope?.details ?? envelope?.errors ?? {};
        throw new ApiError(
            envelope?.message || "Khong the ket noi toi may chu. Vui long thu lai.",
            response.status,
            envelope?.code,
            details,
            toApiErrors(details, envelope?.errors),
        );
    }

    return (envelope ? envelope.data : payload) as T;
};

let refreshPromise: Promise<string> | null = null;

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
        throw new ApiError("Phiên đăng nhập đã hết hạn.", 401, "UNAUTHORIZED");
    }

    setAuthSession(user, token);
    return token;
};

const refreshAccessTokenOnce = () => {
    if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
            refreshPromise = null;
        });
    }

    return refreshPromise;
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
            await refreshAccessTokenOnce();
            return request<T>(method, path, options, true);
        } catch {
            clearCurrentUser();
            if (typeof window !== "undefined" && !window.location.pathname.includes("/dang-nhap")) {
                window.location.assign(`/dang-nhap?redirectTo=${encodeURIComponent(window.location.pathname + window.location.search)}`);
            }
            throw new ApiError("Phiên đăng nhập đã hết hạn.", 401, "SESSION_EXPIRED");
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
