import { apiClient } from "./api/apiClient";
import type { ApiUser, ApiUserRole, ApiUserStatus, PaginatedUsers } from "../models/entities/User";

export const getMe = () => apiClient.get<{ user: ApiUser }>("/api/users/me");

export const updateMe = (
    payload: Partial<{
        username: string | null;
        fullName: string;
        firstName: string;
        lastName: string;
        phone: string | null;
        dateOfBirth: string | null;
        dob: string | null;
        bio: string | null;
        avatarUrl: string | null;
        location: string | null;
        job: string | null;
        dreamDestination: string | null;
        school: string | null;
        languages: string[];
        isVerified: boolean;
        joinedYear: number | null;
    }>,
) => apiClient.patch<{ user: ApiUser }>("/api/users/me", payload);

export const getAdminUsers = (
    query: {
        page?: number;
        limit?: number;
        search?: string;
        role?: ApiUserRole | "all";
        status?: ApiUserStatus | "all";
    } = {},
) =>
    apiClient.get<PaginatedUsers>("/api/users", {
        query: {
            ...query,
            role: query.role === "all" ? undefined : query.role,
            status: query.status === "all" ? undefined : query.status,
        },
    });

export const getAdminUserById = (userId: string | number) =>
    apiClient.get<{ user: ApiUser }>(`/api/users/${userId}`);

export const updateAdminUser = (
    userId: string | number,
    payload: Partial<ApiUser> & {
        role?: ApiUserRole;
        roles?: ApiUserRole[];
    },
) => apiClient.patch<{ user: ApiUser }>(`/api/users/${userId}`, payload);

export const updateAdminUserStatus = (userId: string | number, status: ApiUserStatus) =>
    apiClient.patch<{ user: ApiUser }>(`/api/users/${userId}/status`, { status });
