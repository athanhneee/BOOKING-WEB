import type { IconType } from "react-icons";

export interface SidebarMenuItem {
    id: string;
    label: string;
    icon: IconType;
    to: string;
}

export type StatCardTone = "primary" | "soft" | "default";

export interface StatCardTrend {
    label: string;
    value: string;
    isPositive: boolean;
}

export interface StatCardItem {
    id: string;
    title: string;
    value: string;
    description: string;
    icon: IconType;
    tone: StatCardTone;
    trend?: StatCardTrend;
}

export interface StayStatusItem {
    id: string;
    listingName: string;
    listingType: "Villa" | "Căn hộ" | "Homestay";
    bookedNights: number;
    totalNights: number;
}

export interface OccupancySummary {
    averageRate: number;
    targetRate: number;
    occupiedStays: number;
    readyStays: number;
    totalStays: number;
    cleaningStays: number;
}

export type RecentBookingStatus = "Sắp nhận phòng" | "Đang lưu trú" | "Sắp trả phòng";

export interface RecentBookingItem {
    id: string;
    guestName: string;
    bookingCode: string;
    stayName: string;
    scheduleText: string;
    status: RecentBookingStatus;
}

export type BookingStatus =
    | "Sắp nhận phòng"
    | "Đang lưu trú"
    | "Sắp trả phòng"
    | "Quá hạn thanh toán"
    | "Đang trống";

export type PaymentStatus = "Đã thanh toán" | "Cọc 50%" | "Chờ thanh toán" | "Quá hạn";

export interface BookingTableRow {
    id: string;
    guestName: string;
    bookingCode: string;
    stayName: string;
    status: BookingStatus;
    checkoutDate: string;
    paymentStatus: PaymentStatus;
}

export interface RevenuePoint {
    month: string;
    revenue: number;
    occupancyRate: number;
}
