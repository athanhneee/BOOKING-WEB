import { useMemo, useState } from "react";
import { FiChevronDown } from "react-icons/fi";
import { Navigate, useNavigate } from "react-router-dom";
import { APP_ROUTES } from "../../../config/routes";
import { hostApplications } from "../../../data/mockData";
import { getCurrentUser } from "../../../store/authStore";

const getLatestApplicationForUser = (userId) =>
    hostApplications
        .filter((application) => application.userId === userId)
        .sort((left, right) => right.submittedAt.localeCompare(left.submittedAt))[0] ?? null;

const TimelineStep = ({ icon, title, subtitle, done, active, showConnector = true }) => (
    <div className="relative mb-6 flex items-start gap-4">
        <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${done ? "bg-teal-600 text-white" : active ? "bg-cyan-500 text-white" : "bg-gray-200 text-gray-400"}`}>
            {icon}
        </div>
        <div>
            <p className={`font-medium ${active ? "text-cyan-700" : done ? "text-gray-900" : "text-gray-400"}`}>{title}</p>
            <p className="text-xs text-gray-400">{subtitle}</p>
        </div>
        {showConnector ? <span className={`absolute left-4 top-9 h-full w-0.5 -translate-x-1/2 ${done ? "bg-teal-200" : "bg-gray-200"}`} /> : null}
    </div>
);

const DocumentsAccordion = ({ application }) => {
    const [open, setOpen] = useState(false);

    return (
        <article className="mb-6 rounded-2xl border border-gray-100 bg-white p-5">
            <button type="button" onClick={() => setOpen((current) => !current)} className="flex w-full items-center justify-between">
                <span className="text-sm font-medium text-gray-900">Xem tài liệu đã nộp</span>
                <FiChevronDown className={`transition-transform ${open ? "rotate-180 text-cyan-600" : "text-gray-400"}`} />
            </button>

            {open ? (
                <div className="mt-4 border-t border-gray-100 pt-4">
                    <div className="flex flex-wrap gap-3">
                        {[application.documents.frontImage, application.documents.backImage || application.documents.bizImage]
                            .filter(Boolean)
                            .map((image, index) => (
                                <img key={`${image}-${index}`} src={image} alt={`Tài liệu ${index + 1}`} className="h-24 w-36 rounded-xl border object-cover" />
                            ))}
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {[
                            { label: "Loại giấy tờ", value: application.documents.type === "bizlicense" ? "Giấy phép kinh doanh" : "CCCD / CMND" },
                            { label: "Họ và tên", value: application.documents.fullName || application.userName },
                            { label: "Số giấy tờ", value: application.documents.docNumber || application.documents.taxCode || "—" },
                            { label: "Địa chỉ", value: application.documents.address || application.documents.bizAddress || "—" },
                        ].map((item) => (
                            <div key={item.label} className="rounded-xl bg-gray-50 px-4 py-3">
                                <p className="text-xs text-gray-400">{item.label}</p>
                                <p className="mt-1 text-sm font-medium text-gray-900">{item.value}</p>
                            </div>
                        ))}
                    </div>
                </div>
            ) : null}
        </article>
    );
};

const TrangThaiHost = () => {
    const navigate = useNavigate();
    const currentUser = getCurrentUser();

    if (!currentUser) {
        return <Navigate to={APP_ROUTES.login} replace />;
    }

    const [application] = useState(() => getLatestApplicationForUser(currentUser.id));

    const fixItems = useMemo(() => {
        const reason = application?.rejectReason?.toLowerCase() ?? "";
        const items = [];
        if (reason.includes("mờ") || reason.includes("thiếu góc")) items.push("📷 Chụp lại ảnh rõ nét, đủ 4 góc");
        if (reason.includes("hết hạn")) items.push("📅 Sử dụng giấy tờ còn hiệu lực");
        if (reason.includes("không khớp") || reason.includes("không trùng")) items.push("👤 Đảm bảo tên trên giấy tờ khớp tài khoản");
        items.push("📋 Đọc lại yêu cầu và tải lại tài liệu đầy đủ");
        return items;
    }, [application]);

    if (!application) {
        return (
            <div className="min-h-screen bg-[#F7F8FA] px-4 py-12 pt-28">
                <div className="mx-auto max-w-2xl rounded-2xl border border-gray-100 bg-white p-8 text-center">
                    <div className="text-5xl">📝</div>
                    <h1 className="mt-4 text-xl font-bold text-gray-900">Bạn chưa gửi hồ sơ Host nào</h1>
                    <p className="mt-2 text-gray-500">Hoàn tất hồ sơ để bắt đầu quy trình xác minh Host tại MinhThanhVilla.</p>
                    <button type="button" onClick={() => navigate(APP_ROUTES.hostRegister)} className="mt-6 rounded-xl bg-cyan-500 px-6 py-3 font-semibold text-white transition-colors hover:bg-cyan-600">
                        Bắt đầu đăng ký
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F7F8FA] px-4 py-12 pt-28">
            <div className="mx-auto max-w-2xl">
                {application.status === "pending" ? (
                    <>
                        <article className="mb-8 rounded-2xl border border-gray-100 bg-white p-8 text-center">
                            <div className="mb-4 text-5xl">⏳</div>
                            <span className="inline-flex rounded-full border border-yellow-200 bg-yellow-50 px-4 py-1 text-sm font-medium text-yellow-700">Đang chờ xét duyệt</span>
                            <h1 className="mt-4 text-xl font-bold text-gray-900">Yêu cầu đã được gửi thành công!</h1>
                            <p className="mt-2 text-gray-500">Chúng tôi sẽ xem xét trong vòng 1–3 ngày làm việc.</p>
                            <p className="mt-2 text-sm text-gray-400">Gửi lúc: {application.submittedAt}</p>
                        </article>

                        <article className="mb-6 rounded-2xl border border-gray-100 bg-white p-6">
                            <h2 className="mb-6 font-semibold text-gray-900">Trạng thái xử lý</h2>
                            <TimelineStep icon="✓" title="Gửi yêu cầu" subtitle={application.submittedAt} done showConnector />
                            <TimelineStep icon="🔄" title="Admin đang xem xét" subtitle="Thường mất 1–3 ngày làm việc" active showConnector />
                            <TimelineStep icon="3" title="Nhận kết quả" subtitle="Qua email và thông báo trong ứng dụng" showConnector />
                            <TimelineStep icon="4" title="Bắt đầu đăng chỗ nghỉ" subtitle="Sẵn sàng sau khi được duyệt" showConnector={false} />
                        </article>

                        <DocumentsAccordion application={application} />

                        <button type="button" onClick={() => navigate(APP_ROUTES.home)} className="rounded-xl border border-gray-200 px-6 py-2.5 text-gray-700 transition-colors hover:bg-white">
                            Quay về trang chủ
                        </button>
                    </>
                ) : null}

                {application.status === "approved" ? (
                    <>
                        <article className="mb-8 rounded-2xl bg-gradient-to-br from-teal-600 to-cyan-500 p-8 text-center text-white">
                            <div className="mb-4 text-5xl">✅</div>
                            <span className="rounded-full bg-white/20 px-4 py-1 text-sm">Đã xác minh</span>
                            <h1 className="mt-4 text-2xl font-bold">Chúc mừng! Bạn đã trở thành Host!</h1>
                            <p className="mt-2 text-white/80">Tài khoản Host đã được kích hoạt. Hãy bắt đầu đăng chỗ nghỉ ngay!</p>
                        </article>

                        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
                            <article className="rounded-2xl bg-white p-6 text-center">
                                <div className="mb-3 text-3xl">🏠</div>
                                <h2 className="font-semibold text-gray-900">Thêm chỗ nghỉ đầu tiên</h2>
                                <button type="button" onClick={() => navigate(APP_ROUTES.hostNewProperty)} className="mt-4 w-full rounded-xl bg-cyan-500 py-2.5 text-white transition-colors hover:bg-cyan-600">
                                    Bắt đầu ngay
                                </button>
                            </article>

                            <article className="rounded-2xl bg-white p-6 text-center">
                                <div className="mb-3 text-3xl">⚙️</div>
                                <h2 className="font-semibold text-gray-900">Hoàn thiện hồ sơ Host</h2>
                                <button type="button" onClick={() => navigate(APP_ROUTES.hostSettings)} className="mt-4 w-full rounded-xl border border-gray-200 py-2.5 text-gray-700 transition-colors hover:bg-gray-50">
                                    Cài đặt
                                </button>
                            </article>

                            <article className="rounded-2xl bg-white p-6 text-center">
                                <div className="mb-3 text-3xl">📊</div>
                                <h2 className="font-semibold text-gray-900">Khám phá Dashboard</h2>
                                <button type="button" onClick={() => navigate(APP_ROUTES.hostOverviewLegacy)} className="mt-4 w-full rounded-xl border border-gray-200 py-2.5 text-gray-700 transition-colors hover:bg-gray-50">
                                    Xem ngay
                                </button>
                            </article>
                        </div>
                    </>
                ) : null}

                {application.status === "rejected" ? (
                    <>
                        <article className="mb-6 rounded-2xl border-2 border-red-200 bg-white p-8 text-center">
                            <div className="mb-4 text-5xl text-red-500">❌</div>
                            <span className="inline-flex rounded-full border border-red-200 bg-red-50 px-4 py-1 text-sm font-medium text-red-600">Bị từ chối</span>
                            <h1 className="mt-4 text-xl font-bold text-gray-900">Yêu cầu xác minh chưa được chấp thuận</h1>

                            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-left">
                                <p className="mb-1 text-sm font-medium text-red-700">Lý do từ chối:</p>
                                <p className="text-sm italic text-red-600">{application.rejectReason}</p>
                                <p className="mt-2 text-xs text-gray-400">Xem xét bởi {application.reviewedBy} — {application.reviewedAt}</p>
                            </div>
                        </article>

                        <article className="mb-6 rounded-2xl border border-yellow-200 bg-yellow-50 p-4">
                            <h2 className="mb-3 text-sm font-semibold text-gray-900">Những gì cần khắc phục:</h2>
                            {fixItems.map((item) => <div key={item} className="py-1 text-sm text-gray-700">{item}</div>)}
                        </article>

                        <button type="button" onClick={() => navigate(APP_ROUTES.hostRegister)} className="w-full rounded-xl bg-cyan-500 px-8 py-3 font-semibold text-white transition-colors hover:bg-cyan-600">
                            Gửi lại yêu cầu
                        </button>
                    </>
                ) : null}
            </div>
        </div>
    );
};

export default TrangThaiHost;
