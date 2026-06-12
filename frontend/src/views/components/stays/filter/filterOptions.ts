import type {
    StayAmenity,
    StayCategory,
    StayHighlight,
    StayPolicy,
    StayQuickChoice,
} from "../../../../models/entities/Listing";
import {
    LuMapPin,
    LuStar,
    LuTrendingUp,
    LuUsersRound,
} from "react-icons/lu";
import type { CounterFilterItem, StaySortOption } from "./types";

export const stayCategoryOptions: StayCategory[] = ["Villa", "Căn hộ", "Homestay", "Nhà nguyên căn", "Khách sạn"];

export const stayAmenityOptions: StayAmenity[] = [
    "pool",
    "wifi",
    "kitchen",
    "air_conditioner",
    "washer",
    "parking",
    "pet_friendly",
    "near_beach",
    "bbq",
    "balcony",
    "nice_view",
    "self_checkin",
];

export const stayAmenityLabels: Record<string, string> = {
    pool: "Hồ bơi",
    wifi: "Wifi",
    kitchen: "Bếp",
    air_conditioner: "Điều hòa",
    washer: "Máy giặt",
    parking: "Chỗ đậu xe",
    pet_friendly: "Cho mang thú cưng",
    near_beach: "Gần biển",
    bbq: "Có BBQ",
    balcony: "Ban công",
    nice_view: "View đẹp",
    self_checkin: "Tự check-in",
    karaoke: "Karaoke",
    billiards: "Bida",
    elevator: "Thang máy",
};

export const stayHighlightOptions: StayHighlight[] = [
    "Chủ nhà siêu cấp",
    "Được yêu thích",
    "Mới đăng",
    "Giảm giá",
    "Đặt nhiều",
    "Miễn phí hủy",
];

export const stayPolicyOptions: StayPolicy[] = [
    "Thanh toán linh hoạt",
    "Miễn phí hủy",
    "Xác nhận nhanh",
    "Nhận phòng trong ngày",
];

export const stayQuickChoiceOptions: StayQuickChoice[] = ["Gần trung tâm", "Phù hợp gia đình", "Phù hợp nhóm đông"];

export const staySortOptions = [
    {
        value: "gia-thap-den-cao" as StaySortOption,
        label: "Giá thấp đến cao",
        description: "Hiển thị nơi có giá rẻ nhất trước",
        icon: LuTrendingUp,
    },
    {
        value: "danh-gia-cao-nhat" as StaySortOption,
        label: "Đánh giá cao nhất",
        description: "Ưu tiên nơi được khách đánh giá tốt",
        icon: LuStar,
    },
    {
        value: "gan-trung-tam" as StaySortOption,
        label: "Gần trung tâm",
        description: "Sắp xếp theo khoảng cách địa lý",
        icon: LuMapPin,
    },
    {
        value: "phu-hop-nhom-dong" as StaySortOption,
        label: "Phù hợp nhóm đông",
        description: "Nơi rộng rãi, sức chứa lớn",
        icon: LuUsersRound,
    },
];

export const counterFilterItems: CounterFilterItem[] = [
    { key: "guests", label: "Số khách", description: "Số khách tối thiểu có thể lưu trú" },
    { key: "bedrooms", label: "Phòng ngủ", description: "Số phòng ngủ tối thiểu bạn cần" },
    { key: "beds", label: "Giường", description: "Tối thiểu số giường mong muốn" },
    { key: "bathrooms", label: "Phòng tắm", description: "Tối thiểu số phòng tắm" },
];
