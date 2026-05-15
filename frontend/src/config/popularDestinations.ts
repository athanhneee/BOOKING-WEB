export type StayCategory = "Villa" | "Căn hộ" | "Homestay" | "Nhà nguyên căn" | "Resort" | "Khách sạn";
export type StayBadge = "Yêu thích" | "Nổi bật" | "Mới" | "Được đặt nhiều";
export type StayAmenity =
    | "Hồ bơi"
    | "Wifi"
    | string
    | "Bếp"
    | "Điều hòa"
    | "Máy giặt"
    | "Chỗ đậu xe"
    | "Cho mang thú cưng"
    | "Gần biển"
    | "Có BBQ"
    | "Ban công"
    | "View đẹp"
    | "Tự check-in";
export type StayHighlight = "Chủ nhà siêu cấp" | "Được yêu thích" | "Mới đăng" | "Giảm giá" | "Đặt nhiều" | "Miễn phí hủy";
export type StayPolicy = "Thanh toán linh hoạt" | "Miễn phí hủy" | "Xác nhận nhanh" | "Nhận phòng trong ngày";
export type StayQuickChoice = "Gần trung tâm" | "Phù hợp gia đình" | "Phù hợp nhóm đông";

export type PopularDestination = {
    id: string;
    name: string;
    address: string;
    rating: number;
    pricePerNight: number;
    imageUrl: string;
    description: string;
    category: StayCategory;
    guests: number;
    bedrooms: number;
    beds: number;
    bathrooms: number;
    badge?: StayBadge;
    amenities: StayAmenity[];
    highlights: StayHighlight[];
    policies: StayPolicy[];
    quickChoices: StayQuickChoice[];
};

type PopularDestinationSeed = {
    id: string;
    name: string;
    address: string;
    rating: number;
    pricePerNight: number;
    description: string;
    category: StayCategory;
    guests: number;
    bedrooms: number;
    beds: number;
    bathrooms: number;
    badge?: StayBadge;
    imageFile?: string;
};

const toImageUrl = (imageFile?: string): string => {
    if (!imageFile) {
        return "";
    }

    return new URL(`../assets/img/${imageFile}`, import.meta.url).href;
};

const isBeachAddress = (address: string) => /Phan Chu Trinh|Trần Phú|Thùy Dương|Hạ Long|Aria Resort|Võ Thị Sáu|Tô Ngọc Vân/i.test(address);
const isCentralAddress = (address: string) => /Võ Thị Sáu|Phan Chu Trinh|Hoàng Hoa Thám|Hà Huy Tập|Nguyễn Tuân|Phan Huy Chú/i.test(address);

const getAmenities = (seed: PopularDestinationSeed): StayAmenity[] => {
    const amenities = new Set<StayAmenity>(["Wifi", "Điều hòa", "Chỗ đậu xe"]);

    if (seed.category !== "Khách sạn") {
        amenities.add("Bếp");
        amenities.add("Máy giặt");
    }

    if (seed.category === "Villa" || seed.category === "Resort") {
        amenities.add("Hồ bơi");
        amenities.add("Có BBQ");
    }

    if (seed.category === "Căn hộ" || seed.category === "Homestay" || seed.category === "Resort") {
        amenities.add("Ban công");
    }

    if (seed.category === "Homestay" || seed.category === "Nhà nguyên căn" || seed.badge === "Yêu thích") {
        amenities.add("Cho mang thú cưng");
    }

    if (isBeachAddress(seed.address)) {
        amenities.add("Gần biển");
        amenities.add("View đẹp");
    }

    if (seed.rating >= 4.8 || seed.category === "Căn hộ" || seed.category === "Homestay") {
        amenities.add("Tự check-in");
    }

    return Array.from(amenities);
};

const getHighlights = (seed: PopularDestinationSeed, index: number): StayHighlight[] => {
    const highlights = new Set<StayHighlight>();

    if (seed.rating >= 4.8) {
        highlights.add("Chủ nhà siêu cấp");
    }

    if (seed.badge === "Yêu thích" || seed.rating >= 4.7) {
        highlights.add("Được yêu thích");
    }

    if (seed.badge === "Mới" || index % 7 === 0) {
        highlights.add("Mới đăng");
    }

    if (seed.pricePerNight <= 4500000 || index % 5 === 0) {
        highlights.add("Giảm giá");
    }

    if (seed.badge === "Được đặt nhiều" || seed.guests >= 12) {
        highlights.add("Đặt nhiều");
    }

    if (seed.rating >= 4.8 || seed.badge === "Yêu thích") {
        highlights.add("Miễn phí hủy");
    }

    return Array.from(highlights);
};

const getPolicies = (seed: PopularDestinationSeed, index: number): StayPolicy[] => {
    const policies = new Set<StayPolicy>();

    if (seed.pricePerNight <= 5000000 || seed.category === "Căn hộ" || seed.category === "Homestay") {
        policies.add("Thanh toán linh hoạt");
    }

    if (seed.rating >= 4.7 || seed.badge === "Yêu thích" || index % 2 === 0) {
        policies.add("Miễn phí hủy");
    }

    if (seed.rating >= 4.8 || seed.pricePerNight >= 6000000) {
        policies.add("Xác nhận nhanh");
    }

    if (seed.category === "Homestay" || seed.category === "Căn hộ" || seed.category === "Nhà nguyên căn" || index % 3 === 0) {
        policies.add("Nhận phòng trong ngày");
    }

    return Array.from(policies);
};

const getQuickChoices = (seed: PopularDestinationSeed): StayQuickChoice[] => {
    const quickChoices = new Set<StayQuickChoice>();

    if (isCentralAddress(seed.address)) {
        quickChoices.add("Gần trung tâm");
    }

    if (seed.guests <= 10 || seed.bedrooms >= 3) {
        quickChoices.add("Phù hợp gia đình");
    }

    if (seed.guests >= 12) {
        quickChoices.add("Phù hợp nhóm đông");
    }

    return Array.from(quickChoices);
};

const popularDestinationSeeds: PopularDestinationSeed[] = [
    {
        id: "villa-01",
        name: "Casa Villa",
        address: "111 Phan Chu Trinh, Vũng Tàu",
        rating: 4.9,
        pricePerNight: 5000000,
        description: "Biệt thự hồ bơi riêng, phù hợp nhóm bạn hoặc gia đình nghỉ dưỡng gần biển.",
        category: "Villa",
        guests: 12,
        bedrooms: 5,
        beds: 7,
        bathrooms: 6,
        badge: "Nổi bật",
        imageFile: "lacase.jpg",
    },
    {
        id: "villa-02",
        name: "Nasa Villa",
        address: "84B13 Phan Chu Trinh, Vũng Tàu",
        rating: 4.8,
        pricePerNight: 10000000,
        description: "Không gian lớn, sân BBQ và tầm nhìn đẹp cho kỳ nghỉ đông người cuối tuần.",
        category: "Villa",
        guests: 18,
        bedrooms: 7,
        beds: 10,
        bathrooms: 8,
        badge: "Được đặt nhiều",
        imageFile: "nasa.jpg",
    },
    {
        id: "villa-03",
        name: "Nabi Villa",
        address: "185A Võ Thị Sáu, Vũng Tàu",
        rating: 4.7,
        pricePerNight: 5500000,
        description: "Villa riêng tư gần trung tâm, tiện nghi đầy đủ và dễ di chuyển ra bãi sau.",
        category: "Villa",
        guests: 10,
        bedrooms: 4,
        beds: 6,
        bathrooms: 5,
        badge: "Yêu thích",
        imageFile: "nabi.JPG",
    },
    {
        id: "villa-04",
        name: "S07 Aria",
        address: "Aria Resort, Vũng Tàu",
        rating: 4.8,
        pricePerNight: 5000000,
        description: "Phòng nghỉ dưỡng view biển, phù hợp cặp đôi hoặc gia đình nhỏ thích sự yên tĩnh.",
        category: "Resort",
        guests: 6,
        bedrooms: 2,
        beds: 3,
        bathrooms: 2,
        badge: "Nổi bật",
        imageFile: "s07.jpg",
    },
    {
        id: "villa-05",
        name: "Casa Mar",
        address: "93 Phan Chu Trinh, Vũng Tàu",
        rating: 4.9,
        pricePerNight: 4500000,
        description: "Phong cách hiện đại, sáng thoáng và chỉ vài phút là tới biển.",
        category: "Villa",
        guests: 10,
        bedrooms: 4,
        beds: 6,
        bathrooms: 4,
        badge: "Mới",
        imageFile: "casamar.jpg",
    },
    {
        id: "villa-06",
        name: "16 Hà Huy Tập",
        address: "16 Hà Huy Tập, Vũng Tàu",
        rating: 4.6,
        pricePerNight: 5500000,
        description: "Nhà nguyên căn rộng rãi, hợp nhóm bạn thích khu vực yên tĩnh và riêng tư.",
        category: "Nhà nguyên căn",
        guests: 8,
        bedrooms: 4,
        beds: 5,
        bathrooms: 4,
        badge: "Yêu thích",
        imageFile: "16hahuytap.jpg",
    },
    {
        id: "villa-07",
        name: "C12 Tô Ngọc Vân",
        address: "C12 Tô Ngọc Vân, Vũng Tàu",
        rating: 4.7,
        pricePerNight: 6000000,
        description: "Villa cao cấp với hồ bơi riêng, sân thoáng và khu bếp phù hợp tiệc gia đình.",
        category: "Villa",
        guests: 12,
        bedrooms: 5,
        beds: 7,
        bathrooms: 5,
        badge: "Được đặt nhiều",
        imageFile: "c12tongocvan.jpg",
    },
    {
        id: "villa-08",
        name: "Mộc Nhiên",
        address: "B2.50 Thùy Dương, Vũng Tàu",
        rating: 4.7,
        pricePerNight: 3000000,
        description: "Homestay ấm cúng, nhiều ánh sáng tự nhiên và rất phù hợp cho nghỉ dưỡng nhẹ nhàng.",
        category: "Homestay",
        guests: 6,
        bedrooms: 3,
        beds: 4,
        bathrooms: 3,
        badge: "Mới",
        imageFile: "mocnhien.jpg",
    },
    {
        id: "villa-09",
        name: "Pha Lê Villa",
        address: "B2.5 Thùy Dương, Vũng Tàu",
        rating: 4.8,
        pricePerNight: 4000000,
        description: "Villa sân vườn gần biển, phù hợp nhóm gia đình cần không gian sinh hoạt chung rộng.",
        category: "Villa",
        guests: 10,
        bedrooms: 4,
        beds: 6,
        bathrooms: 4,
        badge: "Nổi bật",
        imageFile: "b25thuyduong.jpg",
    },
    {
        id: "villa-10",
        name: "A2 Đặng Thùy Trâm",
        address: "A2 Đặng Thùy Trâm, Vũng Tàu",
        rating: 4.6,
        pricePerNight: 5500000,
        description: "Biệt thự nghỉ dưỡng riêng tư, thích hợp các nhóm bạn cần chỗ ở cuối tuần rộng rãi.",
        category: "Villa",
        guests: 12,
        bedrooms: 5,
        beds: 7,
        bathrooms: 5,
        imageFile: "a3dtt.jpg",
    },
    {
        id: "villa-11",
        name: "B5 Đặng Thùy Trâm",
        address: "B5 Đặng Thùy Trâm, Vũng Tàu",
        rating: 4.6,
        pricePerNight: 8000000,
        description: "Không gian lớn, nhiều phòng ngủ và hồ bơi riêng cho đoàn khách đông.",
        category: "Villa",
        guests: 16,
        bedrooms: 6,
        beds: 8,
        bathrooms: 6,
        badge: "Được đặt nhiều",
        imageFile: "b5dtt.jpg",
    },
    {
        id: "villa-12",
        name: "11 Trần Phú",
        address: "11 Trần Phú, Vũng Tàu",
        rating: 4.9,
        pricePerNight: 8500000,
        description: "Villa mặt tiền sang trọng, rất hợp cho kỳ nghỉ cao cấp hoặc nhóm gia đình nhiều thế hệ.",
        category: "Villa",
        guests: 16,
        bedrooms: 6,
        beds: 9,
        bathrooms: 7,
        badge: "Nổi bật",
        imageFile: "11tranphu.jpg",
    },
    {
        id: "villa-13",
        name: "19 Trần Phú",
        address: "19 Trần Phú, Vũng Tàu",
        rating: 4.9,
        pricePerNight: 7500000,
        description: "Biệt thự gần biển với không gian mở, phù hợp kỳ nghỉ ngắn ngày nhiều trải nghiệm.",
        category: "Villa",
        guests: 14,
        bedrooms: 5,
        beds: 8,
        bathrooms: 6,
        badge: "Yêu thích",
        imageFile: "19tranphu.jpg",
    },
    {
        id: "villa-14",
        name: "87 Trần Phú",
        address: "87 Trần Phú, Vũng Tàu",
        rating: 4.8,
        pricePerNight: 6000000,
        description: "Villa gia đình gần khu ăn uống, dễ di chuyển và có sân sinh hoạt ngoài trời.",
        category: "Villa",
        guests: 12,
        bedrooms: 5,
        beds: 7,
        bathrooms: 5,
        imageFile: "87tranphu.jpg",
    },
    {
        id: "villa-15",
        name: "109 Trần Phú",
        address: "109 Trần Phú, Vũng Tàu",
        rating: 4.8,
        pricePerNight: 9000000,
        description: "Villa cao cấp view đẹp, không gian rộng và phù hợp đoàn khách lớn dịp lễ.",
        category: "Villa",
        guests: 18,
        bedrooms: 7,
        beds: 10,
        bathrooms: 8,
        badge: "Được đặt nhiều",
        imageFile: "109tranphu.jpg",
    },
    {
        id: "villa-16",
        name: "34/3 Võ Thị Sáu",
        address: "34/3 Võ Thị Sáu, Vũng Tàu",
        rating: 4.7,
        pricePerNight: 6000000,
        description: "Homestay nguyên căn sáng đẹp, hợp nhóm nhỏ cần không gian riêng và gần trung tâm.",
        category: "Homestay",
        guests: 8,
        bedrooms: 4,
        beds: 5,
        bathrooms: 4,
        badge: "Mới",
        imageFile: "343vothisau.jpg",
    },
    {
        id: "villa-17",
        name: "6 Nguyễn Tuân",
        address: "6 Nguyễn Tuân, Vũng Tàu",
        rating: 4.7,
        pricePerNight: 6500000,
        description: "Villa hồ bơi riêng với phong cách trẻ trung, phù hợp nhóm bạn đi cuối tuần.",
        category: "Villa",
        guests: 12,
        bedrooms: 5,
        beds: 7,
        bathrooms: 5,
        badge: "Yêu thích",
        imageFile: "6nguyentuan.jpg",
    },
    {
        id: "villa-18",
        name: "1 Phan Huy Chú",
        address: "1 Phan Huy Chú, Vũng Tàu",
        rating: 4.7,
        pricePerNight: 7000000,
        description: "Villa gần biển, bố cục thoáng và thích hợp cho nhóm khách lưu trú ngắn ngày.",
        category: "Villa",
        guests: 14,
        bedrooms: 5,
        beds: 8,
        bathrooms: 5,
        imageFile: "1phanhuychu.jpg",
    },
    {
        id: "villa-19",
        name: "Osaka Villa",
        address: "164B Phan Chu Trinh, Vũng Tàu",
        rating: 4.8,
        pricePerNight: 5000000,
        description: "Thiết kế hiện đại, tiện nghi đầy đủ và phù hợp nhóm gia đình từ 8 đến 10 khách.",
        category: "Villa",
        guests: 10,
        bedrooms: 4,
        beds: 6,
        bathrooms: 4,
        badge: "Nổi bật",
        imageFile: "osaka.jpg",
    },
    {
        id: "villa-20",
        name: "160/22A Hoàng Hoa Thám",
        address: "160/22A Hoàng Hoa Thám, Vũng Tàu",
        rating: 4.7,
        pricePerNight: 4000000,
        description: "Nhà nguyên căn dễ thương, phù hợp nhóm bạn nhỏ hoặc cặp đôi đi nghỉ ngắn ngày.",
        category: "Nhà nguyên căn",
        guests: 6,
        bedrooms: 3,
        beds: 4,
        bathrooms: 3,
        badge: "Yêu thích",
        imageFile: "16022ahht.jpg",
    },
    {
        id: "villa-21",
        name: "220/12A Phan Chu Trinh",
        address: "220/12A Phan Chu Trinh, Vũng Tàu",
        rating: 4.8,
        pricePerNight: 6000000,
        description: "Villa riêng tư gần bãi sau, tiện cho nhóm khách yêu thích lịch trình ngắn ngày năng động.",
        category: "Villa",
        guests: 12,
        bedrooms: 5,
        beds: 7,
        bathrooms: 5,
        imageFile: "22012aphanchutrinh.jpg",
    },
    {
        id: "villa-22",
        name: "Diamond Villa",
        address: "B2.21 Thùy Dương, Vũng Tàu",
        rating: 4.9,
        pricePerNight: 7000000,
        description: "Villa cao cấp với hồ bơi, khu BBQ và phòng khách lớn cho các buổi tụ họp riêng tư.",
        category: "Villa",
        guests: 14,
        bedrooms: 6,
        beds: 8,
        bathrooms: 6,
        badge: "Được đặt nhiều",
        imageFile: "diamond.jpg",
    },
    {
        id: "villa-23",
        name: "Sunset Horizon",
        address: "68/7 Hạ Long, Vũng Tàu",
        rating: 4.7,
        pricePerNight: 7000000,
        description: "Căn hộ nghỉ dưỡng có view biển thoáng, hợp cặp đôi hoặc gia đình nhỏ thích ngắm hoàng hôn.",
        category: "Căn hộ",
        guests: 6,
        bedrooms: 2,
        beds: 3,
        bathrooms: 2,
        badge: "Mới",
        imageFile: "sunset.jpg",
    },
];

export const popularDestinations: PopularDestination[] = popularDestinationSeeds.map((destination, index) => ({
    ...destination,
    imageUrl: toImageUrl(destination.imageFile),
    amenities: getAmenities(destination),
    highlights: getHighlights(destination, index),
    policies: getPolicies(destination, index),
    quickChoices: getQuickChoices(destination),
}));
