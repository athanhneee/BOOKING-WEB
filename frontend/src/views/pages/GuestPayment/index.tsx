import { useEffect, useState } from "react";
import { FiCalendar, FiCheckCircle, FiCopy, FiHelpCircle, FiLoader } from "react-icons/fi";
import { Link, useParams } from "react-router-dom";
import logo from "../../../assets/img/logo_mau.svg";
import { getPendingBookingDraft } from "../../../services/bookingService";
import { daysBetween, formatCurrency, formatDate } from "../Host/sharedStyles";

const GuestPayment = () => {
    const { bookingId } = useParams();
    const [remaining, setRemaining] = useState(15 * 60);
    const [confirmed, setConfirmed] = useState(false);
    const [bookingDraft] = useState(() => getPendingBookingDraft(bookingId));
    const generatedId = bookingDraft?.bookingId ?? bookingId ?? "preview";
    const checkIn = bookingDraft?.checkIn ?? "2026-03-26";
    const checkOut = bookingDraft?.checkOut ?? "2026-03-29";
    const nights = daysBetween(checkIn, checkOut);
    const pricePerNight = bookingDraft?.pricePerNight ?? 2400000;
    const serviceFee = bookingDraft?.serviceFee ?? Math.round(pricePerNight * nights * 0.1);
    const vat = bookingDraft?.vatAmount ?? Math.round((pricePerNight * nights + serviceFee) * 0.08);
    const totalAmount = bookingDraft?.totalAmount ?? pricePerNight * nights + serviceFee + vat;
    const sepayUrl = `https://qr.sepay.vn/img?bank=MBBank&acc=0123456789&template=compact&amount=${totalAmount}&des=${generatedId}`;

    useEffect(() => {
        if (confirmed) return;
        const timer = window.setInterval(() => setRemaining((value) => (value > 0 ? value - 1 : 0)), 1000);
        return () => window.clearInterval(timer);
    }, [confirmed]);

    const copyText = async (value: string) => {
        try {
            await navigator.clipboard.writeText(value);
        } catch {
            window.alert("Không thể sao chép vào clipboard.");
        }
    };

    const minutes = String(Math.floor(remaining / 60)).padStart(2, "0");
    const seconds = String(remaining % 60).padStart(2, "0");

    if (!bookingDraft) {
        return (
            <div className="min-h-screen bg-[#F7F8FA] px-4 py-16">
                <div className="mx-auto max-w-3xl rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
                    <h1 className="text-2xl font-semibold text-gray-900">Không tìm thấy thông tin đặt chỗ</h1>
                    <p className="mt-3 text-sm leading-7 text-gray-500">
                        Phiên thanh toán này đã hết hạn hoặc chưa nhận được dữ liệu từ trang chi tiết nơi lưu trú.
                    </p>
                    <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                        <Link
                            to="/"
                            className="inline-flex items-center justify-center rounded-xl bg-cyan-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-cyan-700"
                        >
                            Về trang chủ
                        </Link>
                        <Link
                            to="/noi-luu-tru"
                            className="inline-flex items-center justify-center rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                        >
                            Xem danh sách lưu trú
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F7F8FA]">
            <header className="border-b border-gray-200 bg-white">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
                    <Link to="/" className="flex items-center gap-3">
                        <img src={logo} alt="BlueStay" className="h-9 w-9" />
                        <span className="text-lg font-semibold text-gray-900">BlueStay</span>
                    </Link>
                    <a href="#support" className="inline-flex items-center gap-2 text-sm font-medium text-gray-500">
                        <FiHelpCircle />
                        Hỗ trợ
                    </a>
                </div>
            </header>

            <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-2">
                <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                    <img src={bookingDraft.listingImage} alt={bookingDraft.listingName} className="aspect-video w-full rounded-2xl object-cover" />
                    <div className="mt-5">
                        <div className="flex flex-wrap items-center gap-3">
                            <h1 className="text-2xl font-bold text-gray-900">{bookingDraft.listingName}</h1>
                            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                                {bookingDraft.guestSummary}
                            </span>
                        </div>

                        <p className="mt-2 text-sm text-gray-500">{bookingDraft.listingAddress}</p>

                        <div className="mt-5 grid gap-4 md:grid-cols-2">
                            <div className="rounded-xl bg-gray-50 p-4">
                                <p className="inline-flex items-center gap-2 text-sm text-gray-500"><FiCalendar />Nhận phòng</p>
                                <p className="mt-2 font-semibold text-gray-900">{formatDate(checkIn)}</p>
                            </div>
                            <div className="rounded-xl bg-gray-50 p-4">
                                <p className="inline-flex items-center gap-2 text-sm text-gray-500"><FiCalendar />Trả phòng</p>
                                <p className="mt-2 font-semibold text-gray-900">{formatDate(checkOut)}</p>
                            </div>
                        </div>

                        <p className="mt-4 text-sm text-gray-500">{nights} đêm</p>

                        <div className="mt-6 rounded-2xl border border-gray-100">
                            <div className="flex items-center justify-between px-4 py-3 text-sm text-gray-500"><span>{formatCurrency(pricePerNight)} x {nights} đêm</span><span>{formatCurrency(pricePerNight * nights)}</span></div>
                            <div className="flex items-center justify-between px-4 py-3 text-sm text-gray-500"><span>Phí dịch vụ (10%)</span><span>{formatCurrency(serviceFee)}</span></div>
                            <div className="flex items-center justify-between px-4 py-3 text-sm text-gray-500"><span>Thuế VAT (8%)</span><span>{formatCurrency(vat)}</span></div>
                            <div className="flex items-center justify-between border-t border-gray-100 px-4 py-4 text-lg font-semibold text-cyan-700"><span>Tổng cộng</span><span>{formatCurrency(totalAmount)}</span></div>
                        </div>

                        <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-cyan-300/15 px-4 py-2 text-sm font-medium text-cyan-700">
                            🔒 Đơn hàng được bảo vệ bởi BlueStay
                        </div>
                    </div>
                </section>

                <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                    {!confirmed ? (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Thanh toán</h2>
                                <div className="mt-4 rounded-xl border border-cyan-300/30 bg-cyan-300/12 p-4">
                                    <p className="font-medium text-gray-900">Chuyển khoản ngân hàng</p>
                                </div>
                            </div>

                            <img src={sepayUrl} alt="QR thanh toán" className="mx-auto h-48 w-48 rounded-2xl" />

                            <div className="rounded-xl bg-gray-50 p-4">
                                <div className="space-y-3 text-sm text-gray-600">
                                    <div className="flex items-center justify-between gap-3"><span>Ngân hàng</span><strong className="text-gray-900">MB Bank</strong></div>
                                    <div className="flex items-center justify-between gap-3"><span>Số tài khoản</span><button type="button" onClick={() => copyText("0123456789")} className="inline-flex items-center gap-2 rounded-full font-semibold text-gray-900"><span>0123456789</span><FiCopy size={14} /></button></div>
                                    <div className="flex items-center justify-between gap-3"><span>Chủ tài khoản</span><strong className="text-gray-900">BLUESTAY VIETNAM</strong></div>
                                    <div className="flex items-center justify-between gap-3"><span>Nội dung CK</span><button type="button" onClick={() => copyText(generatedId)} className="inline-flex items-center gap-2 rounded-full font-semibold text-gray-900"><span>{generatedId}</span><FiCopy size={14} /></button></div>
                                    <div className="flex items-center justify-between gap-3"><span>Số tiền</span><button type="button" onClick={() => copyText(String(totalAmount))} className="inline-flex items-center gap-2 rounded-full font-semibold text-gray-900"><span>{formatCurrency(totalAmount)}</span><FiCopy size={14} /></button></div>
                                </div>
                            </div>

                            <p className="text-sm font-medium text-gray-700">QR hết hạn sau <strong>{minutes}:{seconds}</strong></p>

                            <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-4 text-sm text-gray-500">
                                <FiLoader className="animate-spin text-cyan-600" />
                                Đang chờ xác nhận thanh toán...
                            </div>

                            <button type="button" onClick={() => setConfirmed(true)} className="w-full rounded-xl bg-cyan-600 px-4 py-3 font-medium text-white transition-colors hover:bg-cyan-700">
                                Tôi đã chuyển khoản
                            </button>

                            <p className="text-xs text-gray-400">Vui lòng chuyển đúng số tiền và nội dung để được xác nhận tự động.</p>
                        </div>
                    ) : (
                        <div className="flex h-full flex-col items-center justify-center text-center">
                            <FiCheckCircle size={54} className="text-cyan-600" />
                            <h2 className="mt-4 text-2xl font-bold text-gray-900">Đã nhận yêu cầu xác nhận</h2>
                            <p className="mt-3 max-w-md text-sm leading-7 text-gray-500">Chúng tôi sẽ xác nhận thanh toán của bạn trong vòng 5 phút.</p>
                            <p className="mt-6 rounded-full bg-cyan-300/15 px-4 py-2 text-sm font-semibold text-cyan-700">Mã đặt phòng: {generatedId}</p>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};

export default GuestPayment;
