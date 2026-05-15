export type ApiUserRole = "guest" | "host" | "moderator" | "admin";
export type ApiUserStatus = "active" | "inactive" | "blocked" | "suspended" | "deleted" | "locked";

export type ApiUser = {
    id: string;
    userId: string;
    email: string;
    phone: string | null;
    name: string;
    fullName: string;
    firstName?: string;
    lastName?: string;
    username: string | null;
    dateOfBirth?: string | null;
    dob?: string | null;
    bio?: string | null;
    avatarUrl?: string | null;
    status: ApiUserStatus;
    roles: ApiUserRole[];
    role: ApiUserRole;
    isEmailVerified?: boolean;
    isPhoneVerified?: boolean;
    isHostVerified?: boolean;
    hostApplicationStatus?: "pending" | "approved" | "rejected" | null;
    createdAt: string;
    updatedAt: string;
};

export type PaginatedUsers = {
    items: ApiUser[];
    pagination: {
        page: number;
        limit: number;
        totalItems: number;
        totalPages: number;
    };
};