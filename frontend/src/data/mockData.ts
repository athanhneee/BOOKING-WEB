export type PropertyStatus = "active" | "paused";
export type BookingStatus = "sap-nhan" | "dang-luu-tru" | "sap-tra" | "da-tra";
export type PaymentStatus = "da-tt" | "coc-50" | "cho-tt" | "qua-han";
export type GuestSegment = "vip" | "moi" | "thuong-xuyen";

export type Property = {
    id: string;
    name: string;
    type: "Villa" | "Can h?" | "Homestay" | "Ph�ng don";
    address: string;
    rating: number;
    occupancy: number;
    revenueMonth: number;
    status: PropertyStatus;
    image: string;
};

export type Booking = {
    id: string;
    code: string;
    propertyId: string;
    guestId: string;
    guestName: string;
    checkIn: string;
    checkOut: string;
    nights: number;
    guestCount: number;
    totalAmount: number;
    status: BookingStatus;
    paymentStatus: PaymentStatus;
    bookedAt: string;
    paidAt?: string | null;
    notes: string;
};

export type Guest = {
    id: string;
    name: string;
    phone: string;
    email: string;
    joinedAt: string;
    segment: GuestSegment;
    stayCount: number;
    totalSpend: number;
    lastStay: string;
    ratingByHost: number;
    note: string;
};

export type Review = {
    id: string;
    guestId: string;
    guestName: string;
    propertyId: string;
    propertyName: string;
    date: string;
    rating: number;
    content: string;
    replied: boolean;
    replyText?: string;
};

export type Transaction = {
    id: string;
    bookingId: string;
    guestName: string;
    propertyId: string;
    propertyName: string;
    bookedAt: string;
    paidAt?: string | null;
    amount: number;
    status: PaymentStatus;
};

export type MonthlyRevenuePoint = {
    month: string;
    revenue: number;
    bookings: number;
};

export const properties: Property[] = [
    { id: "p1", name: "Villa Bi?n An Nhi�n", type: "Villa", address: "�� N?ng", rating: 4.9, occupancy: 80, revenueMonth: 45000000, status: "active", image: "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=600" },
    { id: "p2", name: "Can h? Gateway 2PN", type: "Can h?", address: "TP.HCM", rating: 4.7, occupancy: 70, revenueMonth: 28000000, status: "active", image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600" },
    { id: "p3", name: "Homestay Gi� �?i", type: "Homestay", address: "�� L?t", rating: 4.8, occupancy: 87, revenueMonth: 32000000, status: "active", image: "https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=600" },
    { id: "p4", name: "Can h? Sunset Studio", type: "Can h?", address: "Nha Trang", rating: 4.6, occupancy: 60, revenueMonth: 18000000, status: "paused", image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600" },
];

export const guests: Guest[] = [
    { id: "g1", name: "Nguy?n Minh Thu", phone: "0908123456", email: "minhthu@example.com", joinedAt: "2025-07-12", segment: "vip", stayCount: 6, totalSpend: 76400000, lastStay: "2026-03-22", ratingByHost: 4.9, note: "Kh�ch th�n thi?t, uu ti�n ph�ng y�n tinh v� check-in s?m khi c� th?." },
    { id: "g2", name: "Tr?n Gia Huy", phone: "0911445566", email: "giahuy@example.com", joinedAt: "2025-09-01", segment: "thuong-xuyen", stayCount: 4, totalSpend: 48900000, lastStay: "2026-03-24", ratingByHost: 4.8, note: "Di chuy?n c�ng t�c, thu?ng ? 2-3 d�m m?i l?n." },
    { id: "g3", name: "Ph?m B?o Ng?c", phone: "0933991122", email: "baongoc@example.com", joinedAt: "2026-01-17", segment: "moi", stayCount: 1, totalSpend: 11200000, lastStay: "2026-03-21", ratingByHost: 4.7, note: "Kh�ch m?i, ph?n h?i t?t v? s? s?ch s?." },
    { id: "g4", name: "L� Qu?c Kh�nh", phone: "0977002233", email: "quockhanh@example.com", joinedAt: "2025-08-03", segment: "vip", stayCount: 5, totalSpend: 53100000, lastStay: "2026-03-19", ratingByHost: 4.6, note: "Hay d?t cho gia d�nh, c?n th�m n�i em b� khi c� tr? nh?." },
    { id: "g5", name: "�? H?i Y?n", phone: "0988223344", email: "haiyen@example.com", joinedAt: "2025-10-28", segment: "thuong-xuyen", stayCount: 3, totalSpend: 27600000, lastStay: "2026-02-26", ratingByHost: 4.8, note: "Th�ch can h? g?n bi?n, uu ti�n ban c�ng r?ng." },
    { id: "g6", name: "Vu �?c Long", phone: "0966332211", email: "duclong@example.com", joinedAt: "2026-02-08", segment: "moi", stayCount: 1, totalSpend: 9800000, lastStay: "2026-03-15", ratingByHost: 4.5, note: "�?t c?n ng�y, c?n x�c nh?n nhanh qua di?n tho?i." },
];

export const bookings: Booking[] = [
    { id: "b1", code: "BK24031", propertyId: "p1", guestId: "g1", guestName: "Nguy?n Minh Thu", checkIn: "2026-03-24", checkOut: "2026-03-27", nights: 3, guestCount: 4, totalAmount: 17600000, status: "sap-nhan", paymentStatus: "coc-50", bookedAt: "2026-03-18", paidAt: "2026-03-18", notes: "Kh�ch d?n b?ng xe ri�ng, c?n h? tr? ch? du?ng check-in." },
    { id: "b2", code: "BK24032", propertyId: "p2", guestId: "g2", guestName: "Tr?n Gia Huy", checkIn: "2026-03-22", checkOut: "2026-03-25", nights: 3, guestCount: 2, totalAmount: 11800000, status: "dang-luu-tru", paymentStatus: "da-tt", bookedAt: "2026-03-15", paidAt: "2026-03-16", notes: "�� y�u c?u h�a don VAT." },
    { id: "b3", code: "BK24033", propertyId: "p3", guestId: "g3", guestName: "Ph?m B?o Ng?c", checkIn: "2026-03-20", checkOut: "2026-03-24", nights: 4, guestCount: 3, totalAmount: 15400000, status: "sap-tra", paymentStatus: "da-tt", bookedAt: "2026-03-09", paidAt: "2026-03-09", notes: "Y�u th�ch kh�ng gian c� nhi?u �nh s�ng t? nhi�n." },
    { id: "b4", code: "BK24034", propertyId: "p1", guestId: "g4", guestName: "L� Qu?c Kh�nh", checkIn: "2026-03-19", checkOut: "2026-03-23", nights: 4, guestCount: 5, totalAmount: 21400000, status: "da-tra", paymentStatus: "qua-han", bookedAt: "2026-03-05", paidAt: null, notes: "�ang ch? kh�ch b? sung ph?n thanh to�n c�n l?i." },
    { id: "b5", code: "BK24035", propertyId: "p4", guestId: "g5", guestName: "�? H?i Y?n", checkIn: "2026-03-28", checkOut: "2026-03-30", nights: 2, guestCount: 2, totalAmount: 7600000, status: "sap-nhan", paymentStatus: "cho-tt", bookedAt: "2026-03-23", paidAt: null, notes: "Kh�ch mu?n nh?n hu?ng d?n b�i d? xe tru?c khi d?n." },
    { id: "b6", code: "BK24036", propertyId: "p2", guestId: "g6", guestName: "Vu �?c Long", checkIn: "2026-03-24", checkOut: "2026-03-26", nights: 2, guestCount: 1, totalAmount: 8200000, status: "sap-nhan", paymentStatus: "da-tt", bookedAt: "2026-03-21", paidAt: "2026-03-21", notes: "Ch? c?n 1 b? khan, check-in mu?n sau 21h." },
    { id: "b7", code: "BK24037", propertyId: "p3", guestId: "g1", guestName: "Nguy?n Minh Thu", checkIn: "2026-03-25", checkOut: "2026-03-29", nights: 4, guestCount: 3, totalAmount: 16800000, status: "dang-luu-tru", paymentStatus: "coc-50", bookedAt: "2026-03-10", paidAt: "2026-03-10", notes: "Kh�ch ? d�i ng�y, c� nhu c?u d?n ph�ng b? sung gi?a k?." },
    { id: "b8", code: "BK24038", propertyId: "p1", guestId: "g2", guestName: "Tr?n Gia Huy", checkIn: "2026-03-30", checkOut: "2026-04-02", nights: 3, guestCount: 2, totalAmount: 18200000, status: "sap-nhan", paymentStatus: "da-tt", bookedAt: "2026-03-22", paidAt: "2026-03-22", notes: "Kh�ch quay l?i l?n th? hai trong th�ng n�y." },
];

export const reviews: Review[] = [
    { id: "r1", guestId: "g1", guestName: "Nguy?n Minh Thu", propertyId: "p1", propertyName: "Villa Bi?n An Nhi�n", date: "2026-03-18", rating: 5, content: "Villa r?t s?ch, h? boi d?p hon ?nh v� d?i ngu h? tr? c?c k? nhanh. Gia d�nh m�nh d?c bi?t th�ch khu b?p v� s�n ngo�i tr?i, r?t h?p cho nh�m d�ng ngu?i.", replied: true, replyText: "C?m on ch? Thu d� quay l?i c�ng BlueStay. R?t mong du?c d�n gia d�nh m�nh trong c�c k? ngh? t?i." },
    { id: "r2", guestId: "g2", guestName: "Tr?n Gia Huy", propertyId: "p2", propertyName: "Can h? Gateway 2PN", date: "2026-03-16", rating: 4, content: "V? tr� thu?n ti?n cho c�ng t�c, can h? y�n tinh v� internet ?n d?nh. N?u c?i thi?n th�m ph?n hu?ng d?n check-in chi ti?t hon th� tr?i nghi?m s? tr?n v?n hon.", replied: false },
    { id: "r3", guestId: "g3", guestName: "Ph?m B?o Ng?c", propertyId: "p3", propertyName: "Homestay Gi� �?i", date: "2026-03-13", rating: 5, content: "Kh�ng gian c?c chill, s�ng s?m nh�n xu?ng d?i r?t d?p. Ch? d?ng h? tr? nhanh khi c?n th�m chan, t?i m�nh r?t h�i l�ng.", replied: true, replyText: "C?m on b?n Ng?c d� chia s?. BlueStay r?t vui v� chuy?n di c?a b?n th?t thu gi�n." },
    { id: "r4", guestId: "g4", guestName: "L� Qu?c Kh�nh", propertyId: "p1", propertyName: "Villa Bi?n An Nhi�n", date: "2026-03-10", rating: 4, content: "Kh�ng gian r?ng, ph� h?p cho gia d�nh d�ng ngu?i. Tuy nhi�n h�m d?u c� ch�t ch?m khi b�n giao ch�a kh�a. Sau d� d?i h? tr? x? l� r?t ?n.", replied: false },
    { id: "r5", guestId: "g5", guestName: "�? H?i Y?n", propertyId: "p4", propertyName: "Can h? Sunset Studio", date: "2026-03-07", rating: 5, content: "M�nh th�ch �nh s�ng trong ph�ng v� ban c�ng nh�n ra ph?. Can h? nh? nhung d? ti?n nghi cho c?p d�i ngh? cu?i tu?n.", replied: true, replyText: "C?m on H?i Y?n, hy v?ng l?n t?i b?n s? ti?p t?c ch?n Sunset Studio cho k? ngh? ng?n ng�y." },
    { id: "r6", guestId: "g6", guestName: "Vu �?c Long", propertyId: "p2", propertyName: "Can h? Gateway 2PN", date: "2026-03-02", rating: 5, content: "Can h? m?i, thom s?ch v� check-in thu?n ti?n. M�nh d?n kh� mu?n nhung v?n du?c h? tr? nhi?t t�nh.", replied: false },
];

export const transactions: Transaction[] = [
    { id: "TX24031", bookingId: "BK24031", guestName: "Nguy?n Minh Thu", propertyId: "p1", propertyName: "Villa Bi?n An Nhi�n", bookedAt: "2026-03-18", paidAt: "2026-03-18", amount: 8800000, status: "coc-50" },
    { id: "TX24032", bookingId: "BK24032", guestName: "Tr?n Gia Huy", propertyId: "p2", propertyName: "Can h? Gateway 2PN", bookedAt: "2026-03-15", paidAt: "2026-03-16", amount: 11800000, status: "da-tt" },
    { id: "TX24033", bookingId: "BK24033", guestName: "Ph?m B?o Ng?c", propertyId: "p3", propertyName: "Homestay Gi� �?i", bookedAt: "2026-03-09", paidAt: "2026-03-09", amount: 15400000, status: "da-tt" },
    { id: "TX24034", bookingId: "BK24034", guestName: "L� Qu?c Kh�nh", propertyId: "p1", propertyName: "Villa Bi?n An Nhi�n", bookedAt: "2026-03-05", paidAt: null, amount: 10700000, status: "qua-han" },
    { id: "TX24035", bookingId: "BK24035", guestName: "�? H?i Y?n", propertyId: "p4", propertyName: "Can h? Sunset Studio", bookedAt: "2026-03-23", paidAt: null, amount: 7600000, status: "cho-tt" },
    { id: "TX24036", bookingId: "BK24036", guestName: "Vu �?c Long", propertyId: "p2", propertyName: "Can h? Gateway 2PN", bookedAt: "2026-03-21", paidAt: "2026-03-21", amount: 8200000, status: "da-tt" },
    { id: "TX24037", bookingId: "BK24037", guestName: "Nguy?n Minh Thu", propertyId: "p3", propertyName: "Homestay Gi� �?i", bookedAt: "2026-03-10", paidAt: "2026-03-10", amount: 8400000, status: "coc-50" },
    { id: "TX24038", bookingId: "BK24038", guestName: "Tr?n Gia Huy", propertyId: "p1", propertyName: "Villa Bi?n An Nhi�n", bookedAt: "2026-03-22", paidAt: "2026-03-22", amount: 18200000, status: "da-tt" },
];

export const monthlyRevenue: MonthlyRevenuePoint[] = [
    { month: "T1", revenue: 320000000, bookings: 18 },
    { month: "T2", revenue: 338000000, bookings: 19 },
    { month: "T3", revenue: 352000000, bookings: 21 },
    { month: "T4", revenue: 361000000, bookings: 20 },
    { month: "T5", revenue: 390000000, bookings: 23 },
    { month: "T6", revenue: 408000000, bookings: 24 },
    { month: "T7", revenue: 432000000, bookings: 27 },
    { month: "T8", revenue: 448000000, bookings: 29 },
    { month: "T9", revenue: 421000000, bookings: 25 },
    { month: "T10", revenue: 397000000, bookings: 22 },
    { month: "T11", revenue: 385000000, bookings: 21 },
    { month: "T12", revenue: 470000000, bookings: 31 },
];

export const adminUsers = [
    {
        id: "u001",
        name: "Nguyễn Minh Thư",
        email: "thu@gmail.com",
        phone: "0901234567",
        role: "Guest",
        status: "active",
        joinDate: "2025-10-01",
        totalBookings: 3,
        hasActiveBooking: false,
        lastLogin: "2026-03-24",
    },
    {
        id: "u002",
        name: "Trần Gia Huy",
        email: "huy@gmail.com",
        phone: "0912345678",
        role: "Guest",
        status: "active",
        joinDate: "2025-11-15",
        totalBookings: 1,
        hasActiveBooking: true,
        lastLogin: "2026-03-22",
    },
    {
        id: "u003",
        name: "Phạm Bảo Ngọc",
        email: "ngoc@gmail.com",
        phone: "0923456789",
        role: "Host",
        status: "active",
        joinDate: "2025-09-01",
        totalBookings: 0,
        hasActiveBooking: false,
        lastLogin: "2026-03-23",
    },
    {
        id: "u004",
        name: "Lê Quốc Khánh",
        email: "khanh@gmail.com",
        phone: "0934567890",
        role: "Host",
        status: "locked",
        joinDate: "2025-08-20",
        totalBookings: 0,
        hasActiveBooking: false,
        lastLogin: "2026-02-10",
    },
    {
        id: "u005",
        name: "Đỗ Hải Yến",
        email: "yen@gmail.com",
        phone: "0945678901",
        role: "Guest",
        status: "active",
        joinDate: "2026-01-05",
        totalBookings: 1,
        hasActiveBooking: false,
        lastLogin: "2026-03-20",
    },
    {
        id: "u006",
        name: "Hoàng Văn Nam",
        email: "nam@gmail.com",
        phone: "0956789012",
        role: "Admin",
        status: "active",
        joinDate: "2024-05-01",
        totalBookings: 0,
        hasActiveBooking: false,
        lastLogin: "2026-03-25",
    },
    {
        id: "u007",
        name: "Vũ Thị Lan",
        email: "lan@gmail.com",
        phone: "0967890123",
        role: "Host new",
        status: "pending",
        joinDate: "2026-03-10",
        totalBookings: 0,
        hasActiveBooking: false,
        lastLogin: "2026-03-10",
    },
    {
        id: "u008",
        name: "Bùi Thanh Tùng",
        email: "tung@gmail.com",
        phone: "0978901234",
        role: "Guest",
        status: "locked",
        joinDate: "2025-07-14",
        totalBookings: 2,
        hasActiveBooking: false,
        lastLogin: "2026-01-30",
    },
];

export const adminListings = [
    {
        id: "lst001",
        title: "Villa Hướng Biển Vũng Tàu",
        hostName: "Phạm Bảo Ngọc",
        hostId: "u003",
        type: "Villa",
        address: "Vũng Tàu",
        pricePerNight: 3500000,
        status: "pending",
        images: ["https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=400"],
        submittedAt: "2026-03-20",
        amenities: ["WiFi", "Hồ bơi", "Điều hòa"],
        description: "Villa sang trọng view biển, 4 phòng ngủ, hồ bơi riêng.",
        isPriority: false,
        isFeatured: false,
        locationMatch: true,
    },
    {
        id: "lst002",
        title: "Homestay Đồi Thông",
        hostName: "Vũ Thị Lan",
        hostId: "u007",
        type: "Homestay",
        address: "Vũng Tàu",
        pricePerNight: 1200000,
        status: "pending",
        images: ["https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=400"],
        submittedAt: "2026-03-21",
        amenities: ["WiFi", "Bếp", "Ban công"],
        description: "Homestay yên tĩnh giữa rừng thông, phù hợp nghỉ dưỡng.",
        isPriority: false,
        isFeatured: false,
        locationMatch: false,
    },
    {
        id: "lst003",
        title: "Căn hộ Cao Cấp Trung Tâm",
        hostName: "Phạm Bảo Ngọc",
        hostId: "u003",
        type: "Căn hộ",
        address: "Vũng Tàu",
        pricePerNight: 1800000,
        status: "approved",
        images: ["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400"],
        submittedAt: "2026-03-01",
        amenities: ["WiFi", "Điều hòa", "Bãi đỗ xe"],
        description: "Căn hộ 2PN full nội thất, trung tâm thành phố.",
        isPriority: true,
        isFeatured: false,
        locationMatch: true,
    },
    {
        id: "lst004",
        title: "Phòng Nghỉ Bình Dân",
        hostName: "Lê Quốc Khánh",
        hostId: "u004",
        type: "Phòng đơn",
        address: "Vũng Tàu",
        pricePerNight: 450000,
        status: "rejected",
        images: ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400"],
        submittedAt: "2026-03-15",
        amenities: ["WiFi"],
        description: "Phòng nhỏ sạch sẽ, gần bãi biển.",
        isPriority: false,
        isFeatured: false,
        locationMatch: false,
        rejectReason: "Địa chỉ không khớp với vị trí thực tế trên bản đồ.",
    },
];

export const adminActivityLog = [
    {
        id: "log001",
        adminName: "Hoàng Văn Nam",
        action: "Khóa tài khoản",
        targetUser: "Lê Quốc Khánh",
        targetId: "u004",
        time: "2026-03-24 14:32",
        reason: "Vi phạm chính sách",
    },
    {
        id: "log002",
        adminName: "Hoàng Văn Nam",
        action: "Phê duyệt bài đăng",
        targetUser: "Phạm Bảo Ngọc",
        targetId: "lst003",
        time: "2026-03-23 10:15",
        reason: "",
    },
    {
        id: "log003",
        adminName: "Hoàng Văn Nam",
        action: "Đổi mật khẩu",
        targetUser: "Trần Gia Huy",
        targetId: "u002",
        time: "2026-03-22 09:00",
        reason: "Yêu cầu từ người dùng",
    },
    {
        id: "log004",
        adminName: "Hoàng Văn Nam",
        action: "Từ chối bài đăng",
        targetUser: "Lê Quốc Khánh",
        targetId: "lst004",
        time: "2026-03-21 16:45",
        reason: "Địa chỉ không hợp lệ",
    },
    {
        id: "log005",
        adminName: "Hoàng Văn Nam",
        action: "Thay đổi quyền",
        targetUser: "Vũ Thị Lan",
        targetId: "u007",
        time: "2026-03-20 11:20",
        reason: "Nâng cấp lên Host",
    },
];
