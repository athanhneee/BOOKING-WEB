export const VUNG_TAU_LOCATION_GROUPS = {
    "Bãi Sau": [
        "Back Beach",
        "Hoàng Hoa Thám",
        "Phan Chu Trinh",
        "Lê Hồng Phong",
        "Nguyễn An Ninh",
        "Phan Văn Trị",
        "La Văn Cầu",
        "Phó Đức Chính",
        "Võ Thị Sáu",
        "Nguyễn Hiền",
        "Trần Quý Cáp",
        "Hồ Quý Ly",
        "Bàu Sen",
        "Thi Sách",
        "Mạc Thanh Đạm",
        "Phan Huy Chú",
        "Phan Huy Ích",
        "Lạc Long Quân",
        "Bình Giã",
    ],
    "Bãi Trước": [
        "Front Beach",
        "Tầm Dương",
        "Hạ Long",
        "Quang Trung",
        "Ba Cu",
        "Lê Lợi",
        "Lê Ngọc Hân",
        "Vi Ba",
        "Hải Đăng",
        "Lê Quý Đôn",
        "Trần Hưng Đạo",
        "Đồ Chiểu",
        "Trưng Trắc",
        "Trưng Nhị",
        "Lý Thường Kiệt",
        "Lê Lai",
    ],
    "Long Cung": [
        "Long Cung",
        "Bãi Long Cung",
        "Hà Huy Tập",
        "Nguyễn Đình Tứ",
        "3 Tháng 2",
        "Ba Vì",
        "Hoành Sơn",
        "Tản Viên",
        "An Hải",
        "Thùy Dương",
    ],
    "Chí Linh": [
        "Chí Linh",
        "Khu Chí Linh",
        "Bãi Chí Linh",
        "Nguyễn Hữu Cảnh",
        "Nguyễn An Ninh nối dài",
        "Đường 3/2 Chí Linh",
    ],
    "Thủy Tiên": [
        "Thủy Tiên",
        "Bãi Thủy Tiên",
        "Khu du lịch Thủy Tiên",
        "D5",
        "D7",
        "Nguyễn Hữu Cảnh",
    ],
    "Trung tâm": [
        "Trung tâm",
        "Phường 1",
        "Phường 2",
        "Phường 3",
        "Nam Kỳ Khởi Nghĩa",
        "Trương Công Định",
        "Lê Lai",
        "Lý Thường Kiệt",
        "Nguyễn Văn Trỗi",
        "Bacu",
        "Ba Cu",
        "Đồ Chiểu",
    ],
    "Trần Phú": [
        "Trần Phú",
        "Tran Phu",
        "Bãi Dâu",
        "Dâu",
        "Bến Đình",
        "Sao Mai",
    ],
    "Thùy Vân": [
        "Thùy Vân",
        "Thuy Van",
        "Biển Thùy Vân",
        "Đường Thùy Vân",
        "Hoàng Hoa Thám",
        "La Văn Cầu",
        "Phó Đức Chính",
    ],
} as const;

export type LocationGroupName = keyof typeof VUNG_TAU_LOCATION_GROUPS;

export const VUNG_TAU_LOCATION_GROUP_NAMES = Object.keys(
    VUNG_TAU_LOCATION_GROUPS,
) as LocationGroupName[];

export const MAP_SEARCH_LABEL = "Bản đồ · bán kính 800m";
export const MAP_SEARCH_RADIUS_METERS = 800;
export const VUNG_TAU_DEFAULT_COORDINATES = {
    latitude: 10.345,
    longitude: 107.084,
} as const;
export const VUNG_TAU_MAP_BOUNDS = {
    south: 10.295,
    west: 107.03,
    north: 10.455,
    east: 107.18,
} as const;

export const isLatLngInVungTauBounds = (position: { lat: number; lng: number }) =>
    Number.isFinite(position.lat) &&
    Number.isFinite(position.lng) &&
    position.lat >= VUNG_TAU_MAP_BOUNDS.south &&
    position.lat <= VUNG_TAU_MAP_BOUNDS.north &&
    position.lng >= VUNG_TAU_MAP_BOUNDS.west &&
    position.lng <= VUNG_TAU_MAP_BOUNDS.east;

export const clampLatLngToVungTauBounds = (position: { lat: number; lng: number }) => {
    if (!Number.isFinite(position.lat) || !Number.isFinite(position.lng)) {
        return {
            lat: VUNG_TAU_DEFAULT_COORDINATES.latitude,
            lng: VUNG_TAU_DEFAULT_COORDINATES.longitude,
        };
    }

    return {
        lat: Math.min(Math.max(position.lat, VUNG_TAU_MAP_BOUNDS.south), VUNG_TAU_MAP_BOUNDS.north),
        lng: Math.min(Math.max(position.lng, VUNG_TAU_MAP_BOUNDS.west), VUNG_TAU_MAP_BOUNDS.east),
    };
};

export const LOCATION_GROUP_SUGGESTIONS: Array<{
    id: string;
    title: LocationGroupName;
    description: string;
}> = [
    {
        id: "bai-sau",
        title: "Bãi Sau",
        description: "Hoàng Hoa Thám, Phan Chu Trinh, Lê Hồng Phong...",
    },
    {
        id: "bai-truoc",
        title: "Bãi Trước",
        description: "Hạ Long, Quang Trung, Ba Cu, Lê Lợi...",
    },
    {
        id: "long-cung",
        title: "Long Cung",
        description: "Hoành Sơn, Hà Huy Tập, 3 Tháng 2...",
    },
    {
        id: "chi-linh",
        title: "Chí Linh",
        description: "Khu Chí Linh, Nguyễn Hữu Cảnh...",
    },
    {
        id: "thuy-tien",
        title: "Thủy Tiên",
        description: "Bãi Thủy Tiên, D5, Nguyễn Hữu Cảnh...",
    },
    {
        id: "trung-tam",
        title: "Trung tâm",
        description: "Phường 1, Phường 2, Ba Cu, Đồ Chiểu...",
    },
    {
        id: "tran-phu",
        title: "Trần Phú",
        description: "Trần Phú, Bãi Dâu, Bến Đình...",
    },
    {
        id: "thuy-van",
        title: "Thùy Vân",
        description: "Đường Thùy Vân, biển Thùy Vân...",
    },
];

export const normalizeVietnameseText = (text: string) =>
    text
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, " ")
        .replace(/\s+/g, " ");

export const isLocationGroupName = (value: string): value is LocationGroupName =>
    VUNG_TAU_LOCATION_GROUP_NAMES.includes(value as LocationGroupName);
