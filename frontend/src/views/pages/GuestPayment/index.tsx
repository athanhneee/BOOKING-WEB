import { useEffect, useState } from "react";
import { FiCalendar, FiCreditCard, FiHelpCircle, FiLoader, FiMapPin } from "react-icons/fi";
import { Link, useParams } from "react-router-dom";

import logo from "../../../assets/img/logo_mau.svg";
import type { ApiBooking } from "../../../models/entities/Booking";
import { getBookingDetail } from "../../../services/bookingService";
import { createPayment, type PaymentMethod } from "../../../services/paymentService";
import { daysBetween, formatCurrency, formatDate } from "../Host/sharedStyles";

const GuestPayment = () => {
    const { bookingId } = useParams();

    const [booking, setBooking] = useState<ApiBooking | null>(null);
    const [method, setMethod] = useState<PaymentMethod>("vnpay");
    const [remaining, setRemaining] = useState(15 * 60);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!bookingId) {
            setError("Thiếu mã đặt phòng.");
            setIsLoading(false);
            return;
        }

        let ignore = false;

        const loadBooking = async () => {
            setIsLoading(true);
            setError("");

            try {
                const result = await getBookingDetail(bookingId);

                if (!ignore) {
                    setBooking(result);
                }
            } catch (loadError) {
                if (!ignore) {
                    setError(loadError instanceof Error ? loadError.message : "Không tải được thông tin đặt phòng.");
                }
            } finally {
                if (!ignore) {
                    setIsLoading(false);
                }
            }
        };

        void loadBooking();

        return () => {
            ignore = true;
        };
    }, [bookingId]);

    useEffect(() => {
        const timer = window.setInterval(() => {
            setRemaining((value) => (value > 0 ? value - 1 : 0));
        }, 1000);

        return () => window.clearInterval(timer);
    }, []);

    const handlePay = async () => {
        if (!booking) return;

        setIsSubmitting(true);
        setError("");

        try {
            const payment = await createPayment({
                bookingId: booking.bookingId,
                method,
            });

            if (method === "vnpay") {
                if (!payment.paymentUrl) {
                    throw new Error("Backend chưa trả về paymentUrl VNPay.");
                }

                window.location.assign(payment.paymentUrl);
                return;
            }

            window.location.assign(`/thanh-toan/ket-qua?paymentId=${payment.paymentId}&bookingId=${payment.bookingId}&status=${payment.paymentStatus}`);
        } catch (submitError) {
            setError(submitError instanceof Error ? submitError.message : "Không tạo được thanh toán.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#F7F8FA] px-4 py-16 text-center">
                <p className="text-sm font-semibold text-gray-500">Đang tải thông tin thanh toán...</p>
            </div>
        );
    }

    if (error && !booking) {
        return (
            <div className="min-h-screen bg-[#F7F8FA] px-4 py-16">
                <div className="mx-auto max-w-3xl rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
                    <h1 className="text-2xl font-semibold text-gray-900">Không tìm thấy thông tin đặt chỗ</h1>
                    <p className="mt-3 text-sm leading-7 text-gray-500">{error}</p>

                    <Link
                        to="/noi-luu-tru"
                        className="mt-6 inline-flex rounded-xl bg-cyan-600 px-5 py-3 text-sm font-semibold text-white"
                    >
                        Xem danh sách lưu trú
                    </Link>
                </div>
            </div>
        );
    }

    if (!booking) return null;

    const checkIn = booking.checkInDate;
    const checkOut = booking.checkOutDate;
    const nights = booking.nights || daysBetween(checkIn, checkOut);
    const totalAmount = Number(booking.totalAmount ?? booking.totalPrice ?? 0);
    const listingName = booking.listing?.title ?? `Villa #${booking.listingId}`;
    const listingAddress = [booking.listing?.addressLine, booking.listing?.district, booking.listing?.city]
        .filter(Boolean)
        .join(", ");
    const listingImage = booking.listing?.imageUrl ?? "";
    const minutes = String(Math.floor(remaining / 60)).padStart(2, "0");
    const seconds = String(remaining % 60).padStart(2, "0");

    return (
        <div className="min-h-screen bg-[#F7F8FA]">
            <header className="border-b border-gray-200 bg-white">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
                    <Link to="/" className="flex items-center gap-3">
                        <img src={logo} alt="minh thanh villa" className="h-9 w-9" />
                        <span className="text-lg font-semibold text-gray-900">minh thanh villa</span>
                    </Link>

                    <a href="#support" className="inline-flex items-center gap-2 text-sm font-medium text-gray-500">
                        <FiHelpCircle />
                        Hỗ trợ
                    </a>
                </div>
            </header>

            <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-2">
                <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                    {listingImage ? (
                        <img src={listingImage} alt={listingName} className="aspect-video w-full rounded-2xl object-cover" />
                    ) : (
                        <div className="flex aspect-video w-full items-center justify-center rounded-2xl bg-gray-100 text-sm font-medium text-gray-500">
                            Đang cập nhật ảnh
                        </div>
                    )}

                    <div className="mt-5">
                        <h1 className="text-2xl font-bold text-gray-900">{listingName}</h1>

                        <p className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                            <FiMapPin />
                            {listingAddress || "Đang cập nhật vị trí"}
                        </p>

                        <div className="mt-5 grid gap-4 md:grid-cols-2">
                            <div className="rounded-xl bg-gray-50 p-4">
                                <p className="inline-flex items-center gap-2 text-sm text-gray-500">
                                    <FiCalendar />
                                    Nhận phòng
                                </p>
                                <p className="mt-2 font-semibold text-gray-900">{formatDate(checkIn)}</p>
                            </div>

                            <div className="rounded-xl bg-gray-50 p-4">
                                <p className="inline-flex items-center gap-2 text-sm text-gray-500">
                                    <FiCalendar />
                                    Trả phòng
                                </p>
                                <p className="mt-2 font-semibold text-gray-900">{formatDate(checkOut)}</p>
                            </div>
                        </div>

                        <div className="mt-6 rounded-2xl border border-gray-100">
                            <div className="flex items-center justify-between px-4 py-3 text-sm text-gray-500">
                                <span>{nights} đêm</span>
                                <span>{formatCurrency(booking.subtotalAmount)}</span>
                            </div>

                            <div className="flex items-center justify-between px-4 py-3 text-sm text-gray-500">
                                <span>Phí dọn dẹp</span>
                                <span>{formatCurrency(booking.cleaningFeeAmount)}</span>
                            </div>

                            <div className="flex items-center justify-between px-4 py-3 text-sm text-gray-500">
                                <span>Phí dịch vụ</span>
                                <span>{formatCurrency(booking.serviceFeeAmount)}</span>
                            </div>

                            <div className="flex items-center justify-between border-t border-gray-100 px-4 py-4 text-lg font-semibold text-cyan-700">
                                <span>Tổng cộng</span>
                                <span>{formatCurrency(totalAmount)}</span>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Chọn phương thức thanh toán</h2>
                            <p className="mt-2 text-sm text-gray-500">
                                Mã đặt phòng: <strong>#{booking.bookingId}</strong>
                            </p>
                        </div>

                        <div className="grid gap-3">
                            <button
                                type="button"
                                onClick={() => setMethod("vnpay")}
                                className={`rounded-xl border p-4 text-left font-semibold ${method === "vnpay"
                                    ? "border-cyan-400 bg-cyan-50 text-cyan-700"
                                    : "border-gray-200 text-gray-700"
                                    }`}
                            >
                                <span className="inline-flex items-center gap-2">
                                    <FiCreditCard />
                                    Thanh toán VNPay
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setMethod("bank_transfer")}
                                className={`rounded-xl border p-4 text-left font-semibold ${method === "bank_transfer"
                                    ? "border-cyan-400 bg-cyan-50 text-cyan-700"
                                    : "border-gray-200 text-gray-700"
                                    }`}
                            >
                                Chuyển khoản ngân hàng
                            </button>

                            <button
                                type="button"
                                onClick={() => setMethod("cod")}
                                className={`rounded-xl border p-4 text-left font-semibold ${method === "cod"
                                    ? "border-cyan-400 bg-cyan-50 text-cyan-700"
                                    : "border-gray-200 text-gray-700"
                                    }`}
                            >
                                Thanh toán khi nhận phòng
                            </button>
                        </div>

                        <p className="text-sm font-medium text-gray-700">
                            Phiên thanh toán còn{" "}
                            <strong>
                                {minutes}:{seconds}
                            </strong>
                        </p>

                        {error ? (
                            <p className="rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-600">{error}</p>
                        ) : null}

                        <button
                            type="button"
                            onClick={handlePay}
                            disabled={isSubmitting}
                            className="w-full rounded-xl bg-cyan-600 px-4 py-3 font-medium text-white transition-colors hover:bg-cyan-700 disabled:opacity-60"
                        >
                            {isSubmitting ? (
                                <span className="inline-flex items-center gap-2">
                                    <FiLoader className="animate-spin" />
                                    Đang tạo thanh toán...
                                </span>
                            ) : method === "vnpay" ? (
                                "Thanh toán qua VNPay"
                            ) : (
                                "Xác nhận thanh toán"
                            )}
                        </button>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default GuestPayment;