export type ApiUserRole = "guest" | "host" | "admin";
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
    location?: string | null;
    job?: string | null;
    dreamDestination?: string | null;
    school?: string | null;
    languages?: string[] | null;
    isVerified?: boolean;
    joinedYear?: number | null;
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
        total: number;
        totalPages: number;
    };
};
