import { useState } from "react";
import { FiChevronDown, FiChevronUp, FiMail, FiMessageCircle, FiPhoneCall } from "react-icons/fi";
import { PageHeader } from "../shared";
import { hostCardClass, inputClassName, pageWrapperClass, primaryButtonClass, tableClassName, textareaClassName } from "../sharedStyles";

const faqGroups = [
    {
        title: "Quản lý đặt phòng",
        items: [
            { q: "Làm sao để xác nhận booking nhanh?", a: "Bạn có thể kiểm tra mục Đặt phòng và cập nhật ghi chú nội bộ ngay khi khách vừa đặt." },
            { q: "Có thể chỉnh giờ check-in không?", a: "Có. Hãy cập nhật trong chỗ nghỉ hoặc nhắn trực tiếp cho khách để thống nhất." },
            { q: "Cách xử lý khách no-show?", a: "Đánh dấu tình trạng booking và liên hệ đội hỗ trợ nếu cần xử lý hoàn tiền." },
        ],
    },
    {
        title: "Thanh toán",
        items: [
            { q: "Bao lâu thì nhận được tiền?", a: "Thông thường BlueStay đối soát và chuyển tiền theo chu kỳ đã cấu hình trong tài khoản ngân hàng." },
            { q: "Vì sao giao dịch bị quá hạn?", a: "Thường do khách chưa chuyển khoản đúng nội dung hoặc còn thiếu số tiền." },
            { q: "Lấy báo cáo doanh thu ở đâu?", a: "Bạn có thể vào mục Báo cáo hoặc Thanh toán để xuất file đối soát." },
        ],
    },
    {
        title: "Chính sách",
        items: [
            { q: "Nên chọn chính sách hủy nào?", a: "Nếu chỗ nghỉ có tỷ lệ lấp đầy cao, bạn có thể dùng mức Vừa phải hoặc Nghiêm ngặt." },
            { q: "Có thể ẩn tạm chỗ nghỉ không?", a: "Có. Bạn có thể dùng nút Ẩn tại trang Chỗ nghỉ." },
            { q: "BlueStay hỗ trợ VAT thế nào?", a: "Bạn có thể ghi chú booking cần xuất VAT để đội vận hành phối hợp xử lý." },
        ],
    },
    {
        title: "Kỹ thuật",
        items: [
            { q: "Không tải được ảnh lên thì làm sao?", a: "Hãy thử giảm dung lượng ảnh hoặc đổi trình duyệt, sau đó gửi ticket nếu lỗi còn lặp lại." },
            { q: "QR thanh toán không hiển thị?", a: "Kiểm tra lại kết nối mạng và làm mới trang, hoặc chuyển qua trình duyệt khác." },
            { q: "Tài khoản đăng nhập bị khóa?", a: "Liên hệ hỗ trợ để xác minh và mở lại quyền truy cập." },
        ],
    },
];

const tickets = [
    { id: "TK-2401", title: "Cần hỗ trợ đối soát giao dịch tháng 3", status: "Mở", createdAt: "2026-03-21", updatedAt: "2026-03-24" },
    { id: "TK-2402", title: "Ảnh chỗ nghỉ tải lên chậm", status: "Đang xử lý", createdAt: "2026-03-18", updatedAt: "2026-03-23" },
    { id: "TK-2403", title: "Cập nhật thông tin ngân hàng", status: "Đã giải quyết", createdAt: "2026-03-11", updatedAt: "2026-03-12" },
];

const HoTro = () => {
    const [openKey, setOpenKey] = useState<string | null>("Quản lý đặt phòng-0");

    return (
        <div className={pageWrapperClass}>
            <div className="mx-auto max-w-7xl space-y-6">
                <PageHeader title="Hỗ trợ" subtitle="Tìm câu trả lời nhanh hoặc gửi yêu cầu hỗ trợ đến đội ngũ BlueStay." />

                <div className="grid gap-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm md:grid-cols-3">
                    <div className="flex items-center gap-3 rounded-2xl bg-gray-50 p-4"><FiPhoneCall className="text-cyan-600" /><span className="font-medium text-gray-700">1900-xxxx</span></div>
                    <div className="flex items-center gap-3 rounded-2xl bg-gray-50 p-4"><FiMail className="text-cyan-600" /><span className="font-medium text-gray-700">host@bluestay.vn</span></div>
                    <button type="button" className="flex items-center justify-center gap-3 rounded-xl bg-cyan-600 p-4 font-medium text-white"><FiMessageCircle />Live chat</button>
                </div>

                <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
                    <section className="space-y-5">
                        {faqGroups.map((group) => (
                            <div key={group.title} className={hostCardClass}>
                                <h2 className="text-lg font-semibold text-gray-900">{group.title}</h2>
                                <div className="mt-4 space-y-3">
                                    {group.items.map((item, index) => {
                                        const key = `${group.title}-${index}`;
                                        const isOpen = openKey === key;
                                        return (
                                            <div key={key} className="overflow-hidden rounded-xl border border-gray-100">
                                                <button type="button" onClick={() => setOpenKey(isOpen ? null : key)} className="flex w-full items-center justify-between gap-4 rounded-xl px-4 py-4 text-left">
                                                    <span className="font-medium text-gray-800">{item.q}</span>
                                                    {isOpen ? <FiChevronUp /> : <FiChevronDown />}
                                                </button>
                                                {isOpen ? <div className="rounded-b-xl px-4 pb-4 text-sm leading-7 text-gray-500">{item.a}</div> : null}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </section>

                    <section className="space-y-6">
                        <div className={hostCardClass}>
                            <h2 className="text-lg font-semibold text-gray-900">Gửi yêu cầu hỗ trợ</h2>
                            <div className="mt-5 space-y-4">
                                <select className={inputClassName}>
                                    <option>Chọn chủ đề</option>
                                    <option>Quản lý đặt phòng</option>
                                    <option>Thanh toán</option>
                                    <option>Kỹ thuật</option>
                                </select>
                                <input placeholder="Tiêu đề" className={inputClassName} />
                                <textarea placeholder="Mô tả chi tiết vấn đề của bạn" className={textareaClassName} />
                                <input type="file" className={inputClassName} />
                                <button type="button" className={primaryButtonClass}>Gửi yêu cầu</button>
                            </div>
                        </div>

                        <div className={hostCardClass}>
                            <h2 className="text-lg font-semibold text-gray-900">Lịch sử ticket</h2>
                            <div className="mt-4 overflow-hidden rounded-2xl border border-gray-100">
                                <table className={`${tableClassName} text-left text-sm`}>
                                    <thead className="bg-gray-50 text-gray-500">
                                        <tr>
                                            {["Mã", "Tiêu đề", "Trạng thái", "Ngày tạo", "Cập nhật"].map((column) => <th key={column} className="px-4 py-3 font-medium">{column}</th>)}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 bg-white">
                                        {tickets.map((ticket) => <tr key={ticket.id}><td className="px-4 py-4 font-medium text-gray-900">{ticket.id}</td><td className="px-4 py-4 text-gray-500">{ticket.title}</td><td className="px-4 py-4 text-gray-500">{ticket.status}</td><td className="px-4 py-4 text-gray-500">{ticket.createdAt}</td><td className="px-4 py-4 text-gray-500">{ticket.updatedAt}</td></tr>)}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default HoTro;
