export type VungTauWard = {
    name: string;
    latitude: number;
    longitude: number;
};

// Tọa độ là điểm trung tâm tham khảo để đưa bản đồ tới khu vực.
// Host vẫn cần kéo ghim để chốt đúng vị trí chỗ nghỉ.
export const VUNG_TAU_WARDS: VungTauWard[] = [
    {
        name: "Phường Vũng Tàu",
        latitude: 10.345,
        longitude: 107.084,
    },
    {
        name: "Phường Tam Thắng",
        latitude: 10.365,
        longitude: 107.091,
    },
    {
        name: "Phường Rạch Dừa",
        latitude: 10.386,
        longitude: 107.105,
    },
    {
        name: "Phường Phước Thắng",
        latitude: 10.409,
        longitude: 107.137,
    },
];
