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
    listingType: "Villa" | "Can h?" | "Homestay";
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

export type RecentBookingStatus = "S?p nh?n ph�ng" | "�ang luu tr�" | "S?p tr? ph�ng";

export interface RecentBookingItem {
    id: string;
    guestName: string;
    bookingCode: string;
    stayName: string;
    scheduleText: string;
    status: RecentBookingStatus;
}

export type BookingStatus =
    | "S?p nh?n ph�ng"
    | "�ang luu tr�"
    | "S?p tr? ph�ng"
    | "Qu� h?n thanh to�n"
    | "�ang tr?ng";

export type PaymentStatus = "�� thanh to�n" | "C?c 50%" | "Ch? thanh to�n" | "Qu� h?n";

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
