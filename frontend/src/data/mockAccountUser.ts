export type EditableProfileField =
    | "displayName"
    | "location"
    | "job"
    | "dreamDestination"
    | "school"
    | "languages"
    | "bio";

export interface AccountUserProfile {
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
}

export const mockAccountUser: AccountUserProfile = {
    id: "user_001",
    displayName: "Minh Thành",
    location: "Vũng Tàu, Việt Nam",
    avatarUrl: "",
    job: "Chủ nhà tại Vũng Tàu",
    dreamDestination: "Đà Lạt",
    school: "Học viện Công nghệ Bưu chính Viễn thông",
    languages: ["Tiếng Việt", "Tiếng Anh", "Tiếng Hàn Quốc", "Tiếng Nhật Bản"],
    bio: "Xin chào! Tôi là Minh Thành, chủ nhà tại Vũng Tàu với hơn 3 năm kinh nghiệm đón tiếp khách. Tôi yêu những chuyến đi gần biển, thích chia sẻ các gợi ý địa phương và luôn muốn tạo ra cảm giác nghỉ dưỡng chỉn chu, riêng tư cho mỗi vị khách ghé thăm.",
    isVerified: true,
    joinedYear: 2021,
};

export const profileLanguageOptions = [
    "Tiếng Việt",
    "Tiếng Anh",
    "Tiếng Nhật Bản",
    "Tiếng Hàn Quốc",
    "Tiếng Trung",
    "Tiếng Pháp",
    "Tiếng Đức",
];
