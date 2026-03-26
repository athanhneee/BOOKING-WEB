import { useState } from "react";
import { FiChevronDown } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { APP_ROUTES } from "../../../config/routes";

const faqItems = [
    {
        question: "Mất bao lâu để được xác minh?",
        answer: "Thường từ 1–3 ngày làm việc sau khi nộp đủ tài liệu.",
    },
    {
        question: "Tôi cần giấy tờ gì?",
        answer: "CCCD/CMND còn hạn hoặc Giấy phép kinh doanh. Ảnh phải rõ nét, đủ 4 góc, không bị che khuất.",
    },
    {
        question: "Phí đăng ký bao nhiêu?",
        answer: "Hoàn toàn miễn phí. MinhThanhVilla chỉ thu phí dịch vụ khi có đặt phòng thành công.",
    },
];

const benefitCards = [
    {
        icon: "💰",
        title: "Thu nhập ổn định",
        description: "Kiếm từ 5–50 triệu đồng/tháng tùy loại chỗ nghỉ và mức độ hoạt động của bạn.",
    },
    {
        icon: "🛡️",
        title: "Được bảo vệ",
        description: "MinhThanhVilla xác minh danh tính khách hàng và hỗ trợ giải quyết tranh chấp 24/7.",
    },
    {
        icon: "📊",
        title: "Dashboard chuyên nghiệp",
        description: "Quản lý đặt phòng, doanh thu và khách lưu trú trên một nền tảng duy nhất.",
    },
];

const steps = [
    { number: "1", title: "Tạo tài khoản", description: "Tạo tài khoản MinhThanhVilla", circleClassName: "bg-teal-600 text-white", connectorClassName: "bg-cyan-400" },
    { number: "2", title: "Điền thông tin Host", description: "Hoàn thiện hồ sơ cá nhân", circleClassName: "bg-cyan-500 text-white", connectorClassName: "bg-cyan-400" },
    { number: "3", title: "Xác minh danh tính", description: "Tải giấy tờ hợp lệ", circleClassName: "bg-cyan-500 text-white", connectorClassName: "bg-gray-200" },
    { number: "4", title: "Đăng chỗ nghỉ", description: "Bắt đầu đón khách", circleClassName: "bg-gray-200 text-gray-400", connectorClassName: "" },
];

const TroThanhHostLanding = () => {
    const navigate = useNavigate();
    const [openFaq, setOpenFaq] = useState(0);

    const scrollToBenefits = () => {
        document.getElementById("benefits")?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    return (
        <div className="min-h-screen bg-[#F7F8FA] pt-24">
            <section className="bg-gradient-to-br from-teal-600 to-cyan-500 px-6 py-20 text-center">
                <div className="mx-auto max-w-4xl">
                    <h1 className="text-4xl font-bold text-white">Trở thành Host tại MinhThanhVilla</h1>
                    <p className="mx-auto mt-4 max-w-xl text-lg text-white/80">
                        Chia sẻ không gian của bạn, tạo thu nhập thụ động cùng hàng nghìn khách du lịch Vũng Tàu.
                    </p>

                    <div className="mt-8 flex flex-wrap justify-center gap-4">
                        <button
                            type="button"
                            onClick={() => navigate(APP_ROUTES.hostRegister)}
                            className="rounded-xl bg-white px-8 py-3 font-semibold text-teal-700 transition-colors hover:bg-gray-50"
                        >
                            Bắt đầu đăng ký
                        </button>
                        <button
                            type="button"
                            onClick={scrollToBenefits}
                            className="rounded-xl border border-white px-8 py-3 text-white transition-colors hover:bg-white/10"
                        >
                            Tìm hiểu thêm
                        </button>
                    </div>
                </div>
            </section>

            <section id="benefits" className="px-6 py-16">
                <div className="mx-auto max-w-5xl">
                    <h2 className="text-center text-2xl font-bold text-teal-800">Tại sao nên trở thành Host?</h2>

                    <div className="mx-auto mt-10 grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-3">
                        {benefitCards.map((card) => (
                            <article key={card.title} className="rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm">
                                <div className="mb-4 text-4xl">{card.icon}</div>
                                <h3 className="font-semibold text-gray-900">{card.title}</h3>
                                <p className="mt-2 text-sm text-gray-500">{card.description}</p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section className="bg-white px-6 py-16">
                <div className="mx-auto max-w-5xl">
                    <h2 className="text-center text-2xl font-bold text-teal-800">Quy trình trở thành Host</h2>

                    <div className="mx-auto mt-10 flex max-w-3xl items-start justify-center gap-0">
                        {steps.map((step, index) => (
                            <div key={step.title} className="flex flex-1 items-start">
                                <div className="flex flex-1 flex-col items-center text-center">
                                    <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${step.circleClassName}`}>
                                        {step.number}
                                    </div>
                                    <h3 className="mt-3 text-sm font-semibold text-gray-900">{step.title}</h3>
                                    <p className="mt-1 max-w-[100px] text-xs text-gray-500">{step.description}</p>
                                </div>
                                {index < steps.length - 1 ? <div className={`mt-5 h-0.5 flex-1 ${step.connectorClassName}`} /> : null}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="mx-auto max-w-2xl px-6 py-16">
                <h2 className="mb-8 text-center text-2xl font-bold text-teal-800">Câu hỏi thường gặp</h2>

                {faqItems.map((item, index) => {
                    const isOpen = openFaq === index;

                    return (
                        <article key={item.question} className="mb-3 overflow-hidden rounded-2xl border border-gray-100 bg-white">
                            <button
                                type="button"
                                onClick={() => setOpenFaq((current) => (current === index ? -1 : index))}
                                className="flex w-full items-center justify-between p-5 text-left"
                            >
                                <span className="text-sm font-semibold text-gray-900">{item.question}</span>
                                <FiChevronDown
                                    className={`transition-transform ${isOpen ? "rotate-180 text-cyan-600" : "text-gray-400"}`}
                                />
                            </button>

                            {isOpen ? (
                                <div className="border-t border-gray-100 p-5 pt-4 text-sm text-gray-500">{item.answer}</div>
                            ) : null}
                        </article>
                    );
                })}
            </section>

            <section className="px-6 py-16">
                <div className="mx-auto my-12 max-w-3xl rounded-2xl bg-gradient-to-r from-teal-600 to-cyan-500 p-10 text-center text-white">
                    <h2 className="text-2xl font-bold">Sẵn sàng bắt đầu hành trình Host của bạn?</h2>
                    <p className="mt-2 text-white/80">Đăng ký ngay — hoàn toàn miễn phí</p>
                    <button
                        type="button"
                        onClick={() => navigate(APP_ROUTES.hostRegister)}
                        className="mt-6 rounded-xl bg-white px-8 py-3 font-semibold text-teal-700 transition-colors hover:bg-gray-50"
                    >
                        Đăng ký ngay
                    </button>
                </div>
            </section>
        </div>
    );
};

export default TroThanhHostLanding;
