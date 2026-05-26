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

export const LOCATION_GROUP_AREA_KEYS: Record<LocationGroupName, string> = {
    "Bãi Sau": "bai_sau",
    "Bãi Trước / Dâu": "bai_truoc",
    "Long Cung": "bai_long_cung",
    "Hồ Tràm / Long Hải / Phước Hải": "ho_tram_ho_coc",
};
export const VUNG_TAU_MAP_BOUNDS = {
    south: 10.295,
    west: 107.03,
    north: 10.455,
    east: 107.18,
} as const;

const AREA_KEY_TO_LOCATION_GROUP = new Map(
    Object.entries(LOCATION_GROUP_AREA_KEYS).map(([groupName, areaKey]) => [
        areaKey,
        groupName as LocationGroupName,
    ]),
);

export const LOCATION_GROUP_QUERY_ALIASES: Record<LocationGroupName, string[]> = {
    "Bãi Sau": ["bãi sau", "bai sau", "back beach", "biển thùy vân", "đường thùy vân"],
    "Bãi Trước / Dâu": [
        "bãi trước",
        "bai truoc",
        "bãi dâu",
        "bai dau",
        "front beach",
        "tầm dương",
        "công viên tầm dương",
    ],
    "Long Cung": [
        "long cung",
        "bãi long cung",
        "bai long cung",
        "bãi chí linh",
        "bai chi linh",
        "khu chí linh",
    ],
    "Hồ Tràm / Long Hải / Phước Hải": [
        "hồ tràm",
        "ho tram",
        "long hải",
        "long hai",
        "phước hải",
        "phuoc hai",
        "lộc an bình châu",
        "loc an binh chau",
    ],
};

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

export const isValidLocationGroup = (value: unknown): value is LocationGroupName =>
    typeof value === "string" &&
    VUNG_TAU_LOCATION_GROUP_NAMES.includes(value as LocationGroupName);

export const getLocationGroupAreaKey = (groupName: LocationGroupName) =>
    LOCATION_GROUP_AREA_KEYS[groupName];

export const getLocationGroupNameFromAreaKey = (areaKey: string) =>
    AREA_KEY_TO_LOCATION_GROUP.get(areaKey) ?? null;

export const getLocationGroupNamesFromAreaKeys = (areaKeys: string[]) =>
    Array.from(
        new Set(
            areaKeys
                .map(getLocationGroupNameFromAreaKey)
                .filter((groupName): groupName is LocationGroupName => Boolean(groupName)),
        ),
    );

const getLocationGroupMatchTerms = (groupName: LocationGroupName) => [
    groupName,
    ...LOCATION_GROUP_QUERY_ALIASES[groupName],
    ...VUNG_TAU_LOCATION_GROUPS[groupName],
];

export const isAddressInLocationGroup = (address: string, groupName: LocationGroupName) => {
    const normalizedAddress = normalizeVietnameseText(address);

    if (!normalizedAddress) {
        return false;
    }

    return getLocationGroupMatchTerms(groupName)
        .map(normalizeVietnameseText)
        .some((term) => term && normalizedAddress.includes(term));
};

export const detectLocationGroupsFromQuery = (query: string): LocationGroupName[] => {
    const normalizedQuery = normalizeVietnameseText(query);

    if (!normalizedQuery) {
        return [];
    }

    return VUNG_TAU_LOCATION_GROUP_NAMES.filter((groupName) =>
        getLocationGroupMatchTerms(groupName)
            .map(normalizeVietnameseText)
            .some((term) => term && normalizedQuery.includes(term)),
    );
};

export const detectLocationGroupFromQuery = (query: string): LocationGroupName | null =>
    detectLocationGroupsFromQuery(query)[0] ?? null;

export const getDistanceMeters = (
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
) => {
    const earthRadiusMeters = 6371000;
    const toRad = (value: number) => (value * Math.PI) / 180;

    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);

    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) *
            Math.cos(toRad(lat2)) *
            Math.sin(dLng / 2) ** 2;

    return 2 * earthRadiusMeters * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const isValidLatitude = (value: number) =>
    Number.isFinite(value) && value >= -90 && value <= 90;

export const isValidLongitude = (value: number) =>
    Number.isFinite(value) && value >= -180 && value <= 180;

export const isCoordinateInVungTauBounds = (latitude: number, longitude: number) =>
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= VUNG_TAU_MAP_BOUNDS.south &&
    latitude <= VUNG_TAU_MAP_BOUNDS.north &&
    longitude >= VUNG_TAU_MAP_BOUNDS.west &&
    longitude <= VUNG_TAU_MAP_BOUNDS.east;
