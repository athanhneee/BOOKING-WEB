import {
    FiBarChart2,
    FiCalendar,
    FiClock,
    FiCreditCard,
    FiHome,
    FiLifeBuoy,
    FiMessageCircle,
    FiSettings,
    FiUsers,
} from "react-icons/fi";
import { APP_ROUTES } from "../../../../config/routes";
import type { SidebarMenuItem } from "./types";

export const OWNER_SIDEBAR_ITEMS: SidebarMenuItem[] = [
    { id: "cho-nghi", label: "Chỗ nghỉ", icon: FiHome, to: APP_ROUTES.hostProperties },
    { id: "dat-phong", label: "Đặt phòng", icon: FiCalendar, to: APP_ROUTES.hostBookings },
    { id: "lich-luu-tru", label: "Lịch lưu trú", icon: FiClock, to: APP_ROUTES.hostCalendar },
    { id: "khach-luu-tru", label: "Khách lưu trú", icon: FiUsers, to: APP_ROUTES.hostGuests },
    { id: "thanh-toan", label: "Thanh toán", icon: FiCreditCard, to: APP_ROUTES.hostPayments },
    { id: "danh-gia", label: "Đánh giá", icon: FiMessageCircle, to: APP_ROUTES.hostReviews },
    { id: "bao-cao", label: "Báo cáo", icon: FiBarChart2, to: APP_ROUTES.hostReports },
    { id: "ho-tro", label: "Hỗ trợ", icon: FiLifeBuoy, to: APP_ROUTES.hostSupport },
    { id: "cai-dat", label: "Cài đặt", icon: FiSettings, to: APP_ROUTES.hostSettings },
];