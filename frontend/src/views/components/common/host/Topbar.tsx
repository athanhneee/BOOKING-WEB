import { FiMenu, FiPlus } from "react-icons/fi";
import { Link, matchPath, useLocation } from "react-router-dom";
import { APP_ROUTES } from "../../../../config/routes";
import NotificationBell from "../../notifications/NotificationBell";

interface TopbarProps {
    onOpenSidebar: () => void;
}

const pageMeta = [
    {
        pattern: APP_ROUTES.hostProperties,
        title: "Quản lý chỗ nghỉ",
        subtitle: "Theo dõi danh sách chỗ nghỉ và cập nhật tình trạng phòng.",
    },
    {
        pattern: APP_ROUTES.hostNewProperty,
        title: "Thêm chỗ nghỉ mới",
        subtitle: "Hoàn thiện các bước đăng tin để đưa chỗ nghỉ lên hệ thống.",
    },
    {
        pattern: APP_ROUTES.hostBookings,
        title: "Đặt phòng",
        subtitle: "Xem các đơn mới, tình trạng lưu trú và ghi chú.",
    },
    {
        pattern: APP_ROUTES.hostCalendar,
        title: "Lịch lưu trú",
        subtitle: "Nắm nhanh lịch nhận phòng, trả phòng và công suất từng chỗ nghỉ.",
    },
    {
        pattern: APP_ROUTES.hostGuests,
        title: "Khách lưu trú",
        subtitle: "Xem hồ sơ khách, lịch sử lưu trú.",
    },
    {
        pattern: APP_ROUTES.hostMessages,
        title: "Tin nhắn",
        subtitle: "Theo dõi hội thoại với khách và phản hồi các yêu cầu mới.",
    },
    {
        pattern: APP_ROUTES.hostPayments,
        title: "Thanh toán",
        subtitle: "Theo dõi dòng tiền, đối soát và các giao dịch cần xử lý.",
    },
    {
        pattern: APP_ROUTES.hostReviews,
        title: "Đánh giá",
        subtitle: "Phản hồi nhận xét mới và theo dõi chất lượng dịch vụ theo từng chỗ nghỉ.",
    },
    {
        pattern: APP_ROUTES.hostReports,
        title: "Báo cáo",
        subtitle: "Xem xu hướng doanh thu, lấp đầy và hiệu quả vận hành.",
    },
    {
        pattern: APP_ROUTES.hostSupport,
        title: "Hỗ trợ",
        subtitle: "Tìm câu trả lời nhanh hoặc gửi yêu cầu hỗ trợ cho đội ngũ minh thanh villa.",
    },
    {
        pattern: APP_ROUTES.hostSettings,
        title: "Cài đặt",
        subtitle: "Quản lý hồ sơ, bảo mật, thông báo và tài khoản thanh toán.",
    },
];

const Topbar = ({ onOpenSidebar }: TopbarProps) => {
    const location = useLocation();
    const today = new Intl.DateTimeFormat("vi-VN", {
        weekday: "long",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(new Date());

    const activeMeta =
        pageMeta.find((item) => matchPath({ path: item.pattern, end: item.pattern !== APP_ROUTES.hostProperties }, location.pathname)) ??
        pageMeta[0];

    return (
        <header className="sticky top-0 z-20 border-b border-[var(--color-border)] bg-white/95 backdrop-blur">
            <div className="flex flex-wrap items-center gap-4 px-4 py-4 sm:px-6">
                <button
                    type="button"
                    onClick={onOpenSidebar}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-3xl border border-gray-200 text-gray-600 transition-colors hover:bg-gray-50 lg:hidden"
                    aria-label="Mở menu"
                >
                    <FiMenu size={18} />
                </button>

                <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-600">host Center</p>
                    <h2 className="mt-1 text-lg font-semibold text-gray-900 sm:text-xl md:text-2xl">{activeMeta.title}</h2>
                    <p className="mt-1 hidden text-sm text-gray-500 sm:block">{activeMeta.subtitle}</p>
                    <p className="mt-2 text-xs font-medium capitalize text-gray-400">{today}</p>
                </div>

                <NotificationBell buttonClassName="border-gray-200 text-gray-600 shadow-none hover:bg-gray-50" />

                {location.pathname !== APP_ROUTES.hostNewProperty ? (
                    <Link
                        to={APP_ROUTES.hostNewProperty}
                        className="inline-flex items-center gap-2 rounded-3xl bg-cyan-500 px-3 py-2.5 text-sm font-medium text-white transition-colors hover:bg-cyan-500 sm:px-4"
                    >
                        <FiPlus size={16} />
                        <span className="hidden sm:inline">Thêm chỗ nghỉ</span>
                    </Link>
                ) : null}
            </div>
        </header>
    );
};

export default Topbar;
