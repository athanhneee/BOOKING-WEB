import { useEffect, useMemo, useState } from "react";
import { FiCheckCircle, FiClock, FiXCircle } from "react-icons/fi";
import { Link, useSearchParams } from "react-router-dom";

import { APP_ROUTES } from "../../../config/routes";
import { getPaymentDetail, type Payment } from "../../../services/paymentService";
import { formatCurrency } from "../Host/sharedStyles";

function getProviderLabel(payment: Payment | null, searchParams: URLSearchParams): string {
    const method = String(
        payment?.method ?? searchParams.get("method") ?? searchParams.get("provider") ?? "",
    ).toLowerCase();

    if (method === "momo") return "MoMo";
    if (method === "vnpay") return "VNPay";

    return "cổng thanh toán";
}

function getPaymentResultStatusLabel(status?: string | null): string {
    switch (String(status ?? "").toLowerCase()) {
        case "paid":
            return "Thanh toán thành công";
        case "pending":
            return "Đang chờ xác nhận thanh toán";
        case "expired":
            return "Quá hạn thanh toán";
        case "refund_pending":
            return "Đang chờ hoàn tiền";
        case "refunded":
            return "Đã hoàn tiền";
        case "failed":
            return "Thanh toán thất bại";
        case "cancelled":
            return "Đã hủy";
        default:
            return status || "unknown";
    }
}

const PaymentResultPage = () => {
    const [searchParams] = useSearchParams();
    const paymentId = searchParams.get("paymentId");
    const bookingId = searchParams.get("bookingId");
    const status = searchParams.get("status");

    const [payment, setPayment] = useState<Payment | null>(null);
    const [isLoading, setIsLoading] = useState(Boolean(paymentId));
    const [error, setError] = useState("");

    useEffect(() => {
        if (!paymentId) {
            setIsLoading(false);
            return;
        }

        let ignore = false;

        const loadPayment = async () => {
            setIsLoading(true);
            setError("");

            try {
                const result = await getPaymentDetail(paymentId);

                if (!ignore) {
                    setPayment(result);
                }
            } catch (loadError) {
                if (!ignore) {
                    setError(loadError instanceof Error ? loadError.message : "Không tải được kết quả thanh toán.");
                }
            } finally {
                if (!ignore) {
                    setIsLoading(false);
                }
            }
        };

        void loadPayment();

        return () => {
            ignore = true;
        };
    }, [paymentId]);

    const finalStatus = payment?.paymentResultStatus ?? payment?.paymentStatus ?? status;
    const requiresRefund =
        finalStatus === "refund_pending" ||
        payment?.requiresRefund === true ||
        searchParams.get("requiresRefund") === "true" ||
        searchParams.get("refundStatus") === "pending";

    const resultView = useMemo(() => {
        const providerLabel = getProviderLabel(payment, searchParams);

        if (requiresRefund) {
            return {
                icon: <FiClock className="text-amber-500" size={64} />,
                title: "Đang chờ hoàn tiền",
                description: "Giao dịch đã thành công sau khi phiên giữ chỗ hết hạn. Booking không được xác nhận và yêu cầu hoàn tiền đã được ghi nhận.",
            };
        }

        if (finalStatus === "refunded" || payment?.refundStatus === "succeeded") {
            return {
                icon: <FiCheckCircle className="text-emerald-500" size={64} />,
                title: "Đã hoàn tiền",
                description: "Giao dịch đã được hoàn tiền. Booking không còn hiệu lực.",
            };
        }

        if (finalStatus === "paid") {
            return {
                icon: <FiCheckCircle className="text-emerald-500" size={64} />,
                title: "Thanh toán thành công",
                description: "Thanh toán đã thành công. Booking đang chờ host xác nhận trước khi hoàn tất giữ chỗ.",
            };
        }

        if (finalStatus === "pending") {
            return {
                icon: <FiClock className="text-amber-500" size={64} />,
                title: "Đang chờ xác nhận thanh toán",
                description: "Hệ thống đang chờ cổng thanh toán xác nhận giao dịch.",
            };
        }

        if (finalStatus === "expired") {
            return {
                icon: <FiXCircle className="text-rose-500" size={64} />,
                title: "Phiên giữ chỗ đã hết hạn",
                description: "Phiên giữ chỗ đã hết hạn, vui lòng đặt lại.",
            };
        }

        return {
            icon: <FiXCircle className="text-rose-500" size={64} />,
            title: "Thanh toán chưa thành công",
            description: `Giao dịch bị hủy hoặc không được ${providerLabel} xác nhận.`,
        };
    }, [finalStatus, payment, requiresRefund, searchParams]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#F7F8FA] px-4 py-16 text-center">
                <p className="text-sm font-semibold text-gray-500">Đang kiểm tra kết quả thanh toán...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F7F8FA] px-4 py-16">
            <section className="mx-auto max-w-2xl rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-sm">
                <div className="flex justify-center">{resultView.icon}</div>

                <h1 className="mt-5 text-3xl font-bold text-gray-900">{resultView.title}</h1>

                <p className="mt-3 text-sm leading-7 text-gray-500">{resultView.description}</p>

                {error ? (
                    <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-600">{error}</p>
                ) : null}

                <div className="mt-6 rounded-2xl bg-gray-50 p-5 text-left text-sm text-gray-600">
                    <div className="flex justify-between gap-4 border-b border-gray-200 py-2">
                        <span>Mã booking</span>
                        <strong>{payment?.bookingId ?? bookingId ?? "Không có"}</strong>
                    </div>

                    <div className="flex justify-between gap-4 border-b border-gray-200 py-2">
                        <span>Mã thanh toán</span>
                        <strong>{payment?.paymentId ?? paymentId ?? "Không có"}</strong>
                    </div>

                    <div className="flex justify-between gap-4 border-b border-gray-200 py-2">
                        <span>Trạng thái</span>
                        <strong>{getPaymentResultStatusLabel(finalStatus)}</strong>
                    </div>

                    {requiresRefund ? (
                        <div className="flex justify-between gap-4 border-b border-gray-200 py-2">
                            <span>Hoàn tiền</span>
                            <strong>Đang chờ hoàn tiền</strong>
                        </div>
                    ) : null}

                    {payment ? (
                        <div className="flex justify-between gap-4 py-2">
                            <span>Số tiền</span>
                            <strong>{formatCurrency(payment.amount)}</strong>
                        </div>
                    ) : null}
                </div>

                <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                    <Link
                        to={APP_ROUTES.accountTrips}
                        className="inline-flex items-center justify-center rounded-xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-white hover:bg-cyan-500"
                    >
                        Xem chuyến đi của tôi
                    </Link>

                    <Link
                        to={APP_ROUTES.search}
                        className="inline-flex items-center justify-center rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    >
                        Tiếp tục đặt phòng
                    </Link>
                </div>
            </section>
        </div>
    );
};

export default PaymentResultPage;
