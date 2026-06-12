import { useEffect, useState } from "react";
import { FiCalendar, FiCreditCard, FiHelpCircle, FiMapPin } from "react-icons/fi";
import { Link, useParams } from "react-router-dom";

import logo from "../../../assets/img/logo_mau.svg";
import type { ApiBooking } from "../../../models/entities/Booking";
import { getBookingDetail } from "../../../services/bookingService";
import {
    createPayment,
    getPaymentMethods,
    type PaymentMethod,
    type PaymentMethodAvailability,
} from "../../../services/paymentService";
import { getBookingDisplayStatus, getRemainingBookingPaymentSeconds } from "../../../utils/bookingStatus";
import { daysBetween, formatCurrency, formatDate } from "../Host/sharedStyles";

const defaultPaymentMethods: PaymentMethodAvailability[] = [
    { method: "vnpay", label: "VNPay", available: true },
    { method: "momo", label: "MoMo", available: false },
];

function getRemainingPaymentSeconds(booking: ApiBooking): number {
    if (typeof booking?.remainingPaymentSeconds === "number") {
        return Math.max(0, booking.remainingPaymentSeconds);
    }

    return getRemainingBookingPaymentSeconds(booking);
}

const getErrorStatus = (error: unknown) => {
    if (!error || typeof error !== "object") {
        return undefined;
    }

    const candidate = error as { status?: number; response?: { status?: number } };
    return candidate.response?.status ?? candidate.status;
};

const GuestPayment = () => {
    const { bookingId } = useParams();

    const [booking, setBooking] = useState<ApiBooking | null>(null);
    const [method, setMethod] = useState<PaymentMethod>("vnpay");
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethodAvailability[]>(defaultPaymentMethods);
    const [remaining, setRemaining] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        let ignore = false;

        const loadPaymentMethods = async () => {
            try {
                const result = await getPaymentMethods();

                if (ignore) {
                    return;
                }

                const methods = result.items.length > 0 ? result.items : defaultPaymentMethods;
                setPaymentMethods(methods);
                setMethod((currentMethod) => {
                    const current = methods.find((item) => item.method === currentMethod);

                    if (current?.available !== false) {
                        return currentMethod;
                    }

                    return methods.find((item) => item.available)?.method ?? "vnpay";
                });
            } catch {
                if (!ignore) {
                    setPaymentMethods(defaultPaymentMethods);
                }
            }
        };

        void loadPaymentMethods();

        return () => {
            ignore = true;
        };
    }, []);

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
                    setRemaining(getRemainingPaymentSeconds(result));
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

    const vnpayMethod = paymentMethods.find((item) => item.method === "vnpay");
    const momoMethod = paymentMethods.find((item) => item.method === "momo");
    const isVnpayAvailable = vnpayMethod?.available !== false;
    const isMomoAvailable = momoMethod?.available !== false;
    const momoUnavailableReason = "MoMo chưa được cấu hình trên máy chủ. Vui lòng chọn VNPay.";
    const selectedMethod = paymentMethods.find((item) => item.method === method);
    const isSelectedMethodAvailable = selectedMethod?.available !== false;
    const selectedMethodUnavailableReason =
        method === "momo"
            ? momoUnavailableReason
            : selectedMethod?.unavailableReason ?? "Phương thức thanh toán chưa khả dụng.";
    const displayStatus = booking ? getBookingDisplayStatus(booking, { role: "guest" }) : null;
    const isPayable = displayStatus?.normalizedStatus === "pending_payment";
    const isExpired = displayStatus?.normalizedStatus === "payment_expired" || (isPayable && remaining <= 0);
    const displayStatusLabel = isExpired ? "Quá hạn thanh toán" : displayStatus?.label ?? "Không rõ";

    const handlePay = async () => {
        if (!booking) return;

        if (!isPayable || isExpired) {
            setError("Phiên giữ chỗ đã hết hạn, vui lòng đặt lại.");
            return;
        }

        if (!isSelectedMethodAvailable) {
            setError(selectedMethodUnavailableReason);
            return;
        }

        setIsSubmitting(true);
        setError("");

        try {
            const payment = await createPayment({
                bookingId: booking.bookingId,
                method,
            });

            if (method === "vnpay" || method === "momo") {
                if (!payment.paymentUrl) {
                    throw new Error(`Đang xảy ra lỗi khi thanh toán bằng ${method === "vnpay" ? "VNPay" : "MoMo"}.`);
                }

                window.location.assign(payment.paymentUrl);
                return;
            }

            window.location.assign(`/thanh-toan/ket-qua?paymentId=${payment.paymentId}&bookingId=${payment.bookingId}&status=${payment.paymentStatus}`);
        } catch (submitError) {
            if (getErrorStatus(submitError) === 409) {
                setError("Phiên giữ chỗ đã hết hạn, lịch đã được mở lại. Vui lòng đặt lại.");
                setRemaining(0);
                return;
            }

            setError(submitError instanceof Error ? submitError.message : "Không tạo được thanh toán.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-[#F7F8FA] px-4 py-16 text-center">
                <div className="mb-4 h-8 w-8 animate-spin rounded-full border-[3px] border-cyan-500 border-t-transparent"></div>
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
                        className="mt-6 inline-flex rounded-2xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-white"
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
    const priceBreakdown = booking.priceBreakdown;
    const nights = Number(priceBreakdown?.totalNights ?? booking.totalNights ?? booking.nights ?? daysBetween(checkIn, checkOut));
    const subtotalAmount = Number(priceBreakdown?.subtotalAmount ?? booking.subtotalAmount ?? 0);
    const cleaningFeeAmount = Number(priceBreakdown?.cleaningFeeAmount ?? booking.cleaningFeeAmount ?? 0);
    const surchargeAmount = Number(priceBreakdown?.surchargeAmount ?? 0);
    const serviceFeeAmount = Number(priceBreakdown?.serviceFeeAmount ?? booking.serviceFeeAmount ?? 0);
    const extraGuestFeeAmount = Number(priceBreakdown?.extraGuestFeeAmount ?? booking.extraGuestFeeAmount ?? 0);
    const discountAmount = Number(priceBreakdown?.discountAmount ?? booking.discountAmount ?? 0);
    const totalAmount = Number(priceBreakdown?.totalAmount ?? booking.totalAmount ?? booking.totalPrice ?? 0);
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
                            <div className="rounded-2xl bg-gray-50 p-4">
                                <p className="inline-flex items-center gap-2 text-sm text-gray-500">
                                    <FiCalendar />
                                    Nhận phòng
                                </p>
                                <p className="mt-2 font-semibold text-gray-900">{formatDate(checkIn)}</p>
                            </div>

                            <div className="rounded-2xl bg-gray-50 p-4">
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
                                <span>{formatCurrency(subtotalAmount)}</span>
                            </div>

                            {extraGuestFeeAmount > 0 ? (
                                <div className="flex items-center justify-between px-4 py-3 text-sm text-gray-500">
                                    <span>Phí khách vượt chuẩn</span>
                                    <span>{formatCurrency(extraGuestFeeAmount)}</span>
                                </div>
                            ) : null}

                            <div className="flex items-center justify-between px-4 py-3 text-sm text-gray-500">
                                <span>Phí dọn dẹp</span>
                                <span>{formatCurrency(cleaningFeeAmount)}</span>
                            </div>

                            {surchargeAmount > 0 ? (
                                <div className="flex items-center justify-between px-4 py-3 text-sm text-gray-500">
                                    <span>Phụ thu</span>
                                    <span>{formatCurrency(surchargeAmount)}</span>
                                </div>
                            ) : null}

                            <div className="flex items-center justify-between px-4 py-3 text-sm text-gray-500">
                                <span>Phí dịch vụ</span>
                                <span>{formatCurrency(serviceFeeAmount)}</span>
                            </div>

                            {discountAmount > 0 ? (
                                <div className="flex items-center justify-between px-4 py-3 text-sm text-gray-500">
                                    <span>Ưu đãi</span>
                                    <span>-{formatCurrency(discountAmount)}</span>
                                </div>
                            ) : null}

                            <div className="flex items-center justify-between border-t border-gray-100 px-4 py-4 text-lg font-semibold text-cyan-600">
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
                                onClick={() => isVnpayAvailable && setMethod("vnpay")}
                                disabled={!isVnpayAvailable}
                                className={`rounded-2xl border p-4 text-left font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${method === "vnpay"
                                    ? "border-cyan-400 bg-cyan-50 text-cyan-600"
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
                                onClick={() => isMomoAvailable && setMethod("momo")}
                                disabled={!isMomoAvailable}
                                className={`rounded-2xl border p-4 text-left font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${method === "momo"
                                    ? "border-cyan-400 bg-cyan-50 text-cyan-600"
                                    : "border-gray-200 text-gray-700"
                                    }`}
                            >
                                Thanh toán MoMo
                                {!isMomoAvailable ? (
                                    <span className="mt-1 block text-xs font-medium text-amber-600">
                                        {momoUnavailableReason}
                                    </span>
                                ) : null}
                            </button>


                        </div>

                        {isPayable && !isExpired ? (
                            <p className="text-sm font-medium text-gray-700">
                                Phiên thanh toán còn{" "}
                                <strong>
                                    {minutes}:{seconds}
                                </strong>
                            </p>
                        ) : (
                            <p className="text-sm font-medium text-gray-700">
                                Trạng thái booking: <strong>{displayStatusLabel}</strong>
                            </p>
                        )}

                        {isExpired && (
                            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                Phiên giữ chỗ đã hết hạn, lịch đã được mở lại. Vui lòng đặt lại nếu bạn vẫn muốn thuê căn này.
                            </div>
                        )}

                        {error ? (
                            <p className="rounded-2xl bg-rose-50 p-3 text-sm font-semibold text-rose-600">{error}</p>
                        ) : null}

                        <button
                            type="button"
                            onClick={handlePay}
                            disabled={isSubmitting || isExpired || !isPayable || !selectedMethod || !isSelectedMethodAvailable}
                            className="w-full rounded-2xl bg-cyan-500 px-4 py-3 font-medium text-white transition-colors hover:bg-cyan-500 disabled:opacity-60"
                        >
                            {isSubmitting ? (
                                <span className="inline-flex items-center gap-2">
                                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                                    Đang tạo thanh toán...
                                </span>
                            ) : method === "vnpay" ? (
                                "Thanh toán qua VNPay"
                            ) : method === "momo" ? (
                                "Thanh toán qua MoMo"
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
