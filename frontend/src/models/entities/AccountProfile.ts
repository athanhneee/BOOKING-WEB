export type EditableProfileField =
    | "displayName"
    | "location"
    | "job"
    | "dreamDestination"
    | "school"
    | "languages"
    | "bio";

export type AccountUserProfile = {
    id: string;
    displayName: string;
    location: string;
    avatarUrl: string;
    job: string;
    dreamDestination: string;
    school: string;
    languages: string[];
    bio: string;
    isVerified: boolean;
    joinedYear: number;
};

export const profileLanguageOptions = [
    "Tiếng Việt",
    "English",
    "中文",
    "한국어",
    "日本語",
    "Français",
    "Deutsch",
];