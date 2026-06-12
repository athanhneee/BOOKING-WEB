import { useState, type FormEvent } from "react";
import { FaEnvelope, FaFacebookF, FaMapMarkerAlt, FaPhoneAlt } from "react-icons/fa";
import { FiClock, FiSend } from "react-icons/fi";
import { Link } from "react-router-dom";
import stayImage from "../../../assets/img/NDT05929-HDR1.jpg";
import { APP_ROUTES } from "../../../config/routes";

const contactItems = [
    {
        label: "Hotline",
        value: "0929.399.893",
        href: "tel:0929399893",
        icon: FaPhoneAlt,
    },
    {
        label: "Email",
        value: "bookingvillavtdl@gmail.com",
        href: "mailto:bookingvillavtdl@gmail.com",
        icon: FaEnvelope,
    },
    {
        label: "Địa chỉ",
        value: "28 Thi Sách, Vũng Tàu",
        href: "https://www.google.com/maps/search/?api=1&query=28%20Thi%20Sach%20Vung%20Tau",
        icon: FaMapMarkerAlt,
    },
];

const supportTopics = [
    "Tư vấn chọn villa theo số khách",
    "Kiểm tra lịch trống và giá theo ngày",
    "Hỗ trợ thanh toán hoặc đổi lịch",
    "Góp ý trải nghiệm lưu trú",
];

const ContactPage = () => {
    const [sentMessage, setSentMessage] = useState("");

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSentMessage("Cảm ơn bạn,minh thanh villa  đã ghi nhận thông tin và sẽ phản hồi sớm nhất.");
        event.currentTarget.reset();
    };

    return (
        <div className="min-h-screen bg-[#f7f8fb] pt-24 text-slate-900 md:pt-28">
            <main>
                <section className="mx-auto grid max-w-7xl gap-8 px-4 pb-12 sm:px-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:px-8">
                    <div className="flex flex-col justify-center">
                        <p className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-600">Liên hệ minh thanh villa </p>
                        <h1 className="mt-4 text-2xl font-bold leading-tight tracking-tight text-slate-950 sm:text-4xl md:text-5xl">
                            Cần tư vấn villa hoặc hỗ trợ đặt phòng?
                        </h1>
                        <p className="mt-5 text-base leading-8 text-slate-600 sm:text-lg">
                            Gửi nhu cầu của bạn cho đội ngũ minh thanh villa . Chúng tôi hỗ trợ chọn căn phù hợp, kiểm tra lịch trống, báo giá và giải đáp các câu hỏi trước chuyến đi.
                        </p>

                        <div className="mt-7 grid gap-3 sm:grid-cols-3">
                            {contactItems.map((item) => {
                                const Icon = item.icon;

                                return (
                                    <a
                                        key={item.label}
                                        href={item.href}
                                        target={item.href.startsWith("http") ? "_blank" : undefined}
                                        rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
                                        className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm transition hover:border-cyan-200 hover:shadow-md"
                                    >
                                        <Icon className="text-lg text-cyan-600" />
                                        <p className="mt-3 text-sm font-semibold text-slate-950">{item.label}</p>
                                        <p className="mt-1 break-words text-sm leading-6 text-slate-500">{item.value}</p>
                                    </a>
                                );
                            })}
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
                        <img src={stayImage} alt="Không gian villa Minh Thanh tại Vũng Tàu" className="h-[280px] w-full object-cover sm:h-[420px]" />
                    </div>
                </section>

                <section className="bg-white py-12">
                    <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[minmax(280px,0.72fr)_minmax(0,1.28fr)] lg:px-8">
                        <aside className="rounded-3xl border border-cyan-100 bg-cyan-50 p-5 sm:p-6">
                            <h2 className="text-2xl font-bold text-slate-950">Thông tin hỗ trợ</h2>
                            <div className="mt-5 space-y-4">
                                <div className="flex gap-3">
                                    <FiClock className="mt-1 shrink-0 text-xl text-cyan-600" />
                                    <div>
                                        <p className="font-semibold text-slate-950">Thời gian phản hồi</p>
                                        <p className="mt-1 text-sm leading-6 text-slate-600">08:00 - 22:00 hằng ngày, ưu tiên khách có lịch nhận phòng gần.</p>
                                    </div>
                                </div>

                                {supportTopics.map((topic) => (
                                    <div key={topic} className="rounded-3xl bg-white px-4 py-3 text-sm font-medium text-slate-700">
                                        {topic}
                                    </div>
                                ))}
                            </div>

                            <a
                                href="https://www.facebook.com/villavungtauuytin"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-6 inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
                            >
                                <FaFacebookF />
                                Nhắn qua Facebook
                            </a>
                        </aside>

                        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
                            <h2 className="text-2xl font-bold text-slate-950">Gửi yêu cầu tư vấn</h2>
                            <p className="mt-2 text-sm leading-7 text-slate-500">
                                Điền thông tin cơ bản để đội ngũ hỗ trợ gợi ý căn phù hợp hơn.
                            </p>

                            <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <label className="grid gap-2 text-sm font-semibold text-slate-700">
                                        Họ và tên
                                        <input
                                            name="name"
                                            required
                                            className="h-12 border border-slate-200 bg-white px-4 text-sm font-normal outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                                            placeholder="Tên của bạn"
                                        />
                                    </label>
                                    <label className="grid gap-2 text-sm font-semibold text-slate-700">
                                        Số điện thoại
                                        <input
                                            name="phone"
                                            required
                                            className="h-12 border border-slate-200 bg-white px-4 text-sm font-normal outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                                            placeholder="0929..."
                                        />
                                    </label>
                                </div>

                                <label className="grid gap-2 text-sm font-semibold text-slate-700">
                                    Nhu cầu của bạn
                                    <textarea
                                        name="message"
                                        rows={5}
                                        required
                                        className="border border-slate-200 bg-white px-4 py-3 text-sm font-normal leading-7 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                                        placeholder="Ví dụ: nhóm 10 khách, cần villa hồ bơi gần Bãi Sau, đi 2 ngày 1 đêm..."
                                    />
                                </label>

                                {sentMessage ? (
                                    <p className="rounded-3xl border border-cyan-100 bg-cyan-50 px-4 py-3 text-sm font-medium text-cyan-600">
                                        {sentMessage}
                                    </p>
                                ) : null}

                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <button
                                        type="submit"
                                        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-cyan-500 px-6 text-sm font-semibold text-white transition-colors hover:bg-cyan-500"
                                    >
                                        <FiSend />
                                        Gửi yêu cầu
                                    </button>
                                    <Link to={APP_ROUTES.search} className="text-sm font-semibold text-cyan-600 transition-colors hover:text-cyan-800">
                                        Xem danh sách villa
                                    </Link>
                                </div>
                            </form>
                        </div>

                    </div>
                </section>
            </main>
        </div>
    );
};

export default ContactPage;
