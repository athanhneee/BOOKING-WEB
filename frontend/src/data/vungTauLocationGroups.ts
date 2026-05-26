export const VUNG_TAU_LOCATION_GROUPS = {
    "Bãi Sau": [
        "Hoàng Hoa Thám",
        "Thùy Vân",
        "Đồi Ngọc Tước",
        "Hoàng Lê Kha",
        "Kim Ngân",
        "Kim Minh",
        "Tô Ngọc Vân",
        "Nguyễn Hữu Tiến",
        "Đặng Thùy Trâm",
        "Trần Văn Thời",
        "Bàu Sen",
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
        "Hoàng Sâm",
        "Hoàng Trọng Mậu",
        "Kiều Thanh Quế",
        "Tạ Uyên",
        "Thống Nhất Mới",
        "Thi Sách",
        "Mạc Thanh Đạm",
        "Phan Huy Chú",
        "Phan Huy Ích",
        "Trần Bình Trọng",
        "Thái Văn Lung",
        "Nguyễn Biểu",
        "Nguyễn Thị Minh Khai",
        "Lạc Long Quân",
        "Hoàng Hữu Nam",
        "Bình Giã",
        "Lương Văn Can",
        "Trương Công Định",
        "Nam Kỳ Khởi Nghĩa",
        "Xô Viết Nghệ Tĩnh",
    ],
    "Bãi Trước / Dâu": [
        "Đinh Tiên Hoàng",
        "Nguyễn Trường Tộ",
        "Hạ Long",
        "Quang Trung",
        "Ba Cu",
        "Lê Lợi",
        "Trần Phú",
        "Lê Ngọc Hân",
        "Vi Ba",
        "Hải Đăng",
        "Lê Quý Đôn",
        "Trần Hưng Đạo",
        "Đồ Chiểu",
        "Trưng Trắc",
        "Trưng Nhị",
        "Bến Đình",
        "Lý Thường Kiệt",
        "Lê Lai",
    ],
    "Long Cung": [
        "Hà Huy Tập",
        "Nguyễn Hữu Cảnh",
        "Chí Linh",
        "Nguyễn Đình Tứ",
        "3 Tháng 2",
        "Ba Vì",
        "Hoành Sơn",
        "Tản Viên",
        "An Hải",
        "Thùy Dương",
    ],
    "Hồ Tràm / Long Hải / Phước Hải": [
        "Nguyễn Tất Thành",
        "Tôn Đức Thắng",
        "Hồ Tràm",
        "Phước Hải",
        "Long Hải",
        "Đường Bờ Kè",
        "Đường Ven Biển",
        "Đường Lộc An - Bình Châu",
        "Đường Lộc An – Bình Châu",
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
    
}> = [
    {
        id: "bai-sau",
        title: "Bãi Sau",
        //description: "Thùy Vân, Hoàng Hoa Thám, Phan Chu Trinh...",
    },
    {
        id: "bai-truoc-dau",
        title: "Bãi Trước / Dâu",
        //description: "Trần Phú, Hạ Long, Quang Trung...",
    },
    {
        id: "long-cung",
        title: "Long Cung",
        //description: "Hoành Sơn, Chí Linh, 3 Tháng 2...",
    },
    {
        id: "ho-tram-long-hai-phuoc-hai",
        title: "Hồ Tràm / Long Hải / Phước Hải",
        //description: "Hồ Tràm, Long Hải, Phước Hải...",
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
