import { Op, type Transaction } from "sequelize";

import { ApiError } from "../../common/api-error";
import sequelize from "../../config/database";
import type { AuthenticatedUser } from "../auth/auth.service";
import Booking, { BookingDocument, BookingStatus } from "../../models/booking";
import { getNextSequence } from "../../models/counter";
import Coupon from "../../models/coupon";
import CouponRedemption from "../../models/coupon-redemption";
import Payment, { PaymentDocument, PaymentMethod, PaymentStatus } from "../../models/payment";
import PaymentTransaction from "../../models/payment-transaction";
import { toVnpayAmount } from "../../utils/money";
import { writeAuditLog } from "../../services/audit-log-service";
import {
    buildVnpayPaymentUrl,
    normalizeVnpayPayload,
    verifyVnpayPayload,
    VnpayPayload,
} from "./vnpay.service";

export type CreatePaymentInput = {
    bookingId: number;
    method: PaymentMethod;
};

export type ListPaymentsQuery = {
    status?: PaymentStatus;
    page?: number;
    limit?: number;
};

export type VnpayWebhookResult = {
    RspCode: string;
    Message: string;
};

type PaymentCallbackContext = {
    ipAddress?: string | null;
    userAgent?: string | null;
};

const payableBookingStatuses: BookingStatus[] = ["pending", "pending_payment", "confirmed"];
const reusablePaymentStatuses: PaymentStatus[] = ["pending", "paid"];
const pendingPaymentTtlMs = 15 * 60 * 1000;

const isAdmin = (user: AuthenticatedUser) => user.roles.includes("admin");
const isHost = (user: AuthenticatedUser) => user.roles.includes("host");

const assertBookingCanBePaidByUser = (booking: BookingDocument, user: AuthenticatedUser) => {
    if (String(booking.guestUserId) !== user.id) {
        throw new ApiError(403, "Forbidden");
    }

    if (!payableBookingStatuses.includes(booking.status)) {
        throw new ApiError(409, "Booking is not payable");
    }
};

const assertCanViewPayment = (booking: BookingDocument, user: AuthenticatedUser) => {
    if (
        String(booking.guestUserId) === user.id ||
        (isHost(user) && String(booking.hostUserId) === user.id) ||
        isAdmin(user)
    ) {
        return;
    }

    throw new ApiError(403, "Forbidden");
};

const serializePayment = (payment: PaymentDocument, paymentUrl?: string | null) => ({
    paymentId: payment.paymentId,
    bookingId: payment.bookingId,
    method: payment.method,
    paymentStatus: payment.status,
    amount: payment.amount,
    currency: payment.currency,
    paymentUrl: paymentUrl ?? null,
    paidAt: payment.paidAt ?? null,
    createdAt: payment.createdAt,
    updatedAt: payment.updatedAt,
});

const getPaymentBooking = async (payment: PaymentDocument) => {
    const booking = await Booking.findOne({ bookingId: payment.bookingId });

    if (!booking) {
        throw new ApiError(404, "Booking not found");
    }

    return booking;
};

const getClientIp = (value?: string | null) => {
    const firstForwardedIp = value?.split(",")[0]?.trim();
    return firstForwardedIp || "127.0.0.1";
};

const maybeBuildVnpayUrl = async (
    booking: BookingDocument,
    payment: PaymentDocument,
    ipAddress: string,
) => {
    if (payment.method !== "vnpay" || payment.status !== "pending") {
        return null;
    }

    const result = buildVnpayPaymentUrl({
        booking,
        payment,
        ipAddress,
        createdAt: payment.createdAt,
    });

    if (payment.providerTxnRef !== result.txnRef) {
        payment.provider = "vnpay";
        payment.providerTxnRef = result.txnRef;
        await payment.save();
    }

    return result.paymentUrl;
};

const isPendingPaymentReusable = (payment: PaymentDocument, now = new Date()) =>
    payment.status === "pending" &&
    payment.createdAt instanceof Date &&
    payment.createdAt.getTime() + pendingPaymentTtlMs > now.getTime();

const expirePendingPayment = async (payment: PaymentDocument, transaction: Transaction) => {
    if (payment.status !== "pending") {
        return;
    }

    payment.status = "expired";
    payment.failedAt = payment.failedAt ?? new Date();
    await payment.save({ transaction });

    if (payment.providerTxnRef) {
        await PaymentTransaction.update(
            {
                status: "cancelled",
                processedAt: payment.failedAt,
            },
            {
                where: {
                    providerTxnRef: payment.providerTxnRef,
                },
                transaction,
            },
        );
    }
};

const isVnpayAmountMatching = (payload: VnpayPayload, payment: PaymentDocument) => {
    if (!payload.vnp_Amount || !/^\d+$/.test(payload.vnp_Amount)) {
        return false;
    }

    try {
        return BigInt(payload.vnp_Amount) === toVnpayAmount(payment.amount);
    } catch {
        return false;
    }
};

const sanitizeVnpayPayloadForStorage = (payload: VnpayPayload) => ({
    vnp_TxnRef: payload.vnp_TxnRef ?? null,
    vnp_Amount: payload.vnp_Amount ?? null,
    vnp_ResponseCode: payload.vnp_ResponseCode ?? null,
    vnp_TransactionStatus: payload.vnp_TransactionStatus ?? null,
    vnp_TransactionNo: payload.vnp_TransactionNo ?? null,
    vnp_PayDate: payload.vnp_PayDate ?? null,
    vnp_BankCode: payload.vnp_BankCode ?? null,
});

const getFailedVnpayStatus = (payload: VnpayPayload): PaymentStatus => {
    if (payload.vnp_ResponseCode === "24") {
        return "cancelled";
    }

    if (payload.vnp_ResponseCode === "11" || payload.vnp_TransactionStatus === "02") {
        return "expired";
    }

    return "failed";
};

const redeemBookingCouponIfNeeded = async (booking: BookingDocument, transaction: Transaction) => {
    if (!booking.couponId || !booking.discountAmount || Number(booking.discountAmount) <= 0) {
        return;
    }

    const existingRedemption = await CouponRedemption.findOne({
        where: {
            couponId: booking.couponId,
            bookingId: booking.bookingId,
        },
        transaction,
        lock: true,
    });

    if (existingRedemption) {
        return;
    }

    const coupon = await Coupon.findOne({
        where: {
            couponId: booking.couponId,
            deletedAt: null,
        },
        transaction,
        lock: true,
    });

    if (!coupon) {
        return;
    }

    await CouponRedemption.create(
        {
            couponId: booking.couponId,
            userId: booking.guestUserId,
            bookingId: booking.bookingId,
            discountAmount: booking.discountAmount,
        },
        { transaction },
    );
    await Coupon.increment("usedCount", {
        by: 1,
        where: {
            couponId: booking.couponId,
        },
        transaction,
    });
};

export const createPayment = async (
    user: AuthenticatedUser,
    input: CreatePaymentInput,
    ipAddress?: string | null,
) => {
    const clientIp = getClientIp(ipAddress);

    return sequelize.transaction(async (transaction) => {
        const booking = await Booking.findOne({
            where: {
                bookingId: input.bookingId,
            },
            transaction,
            lock: true,
        });

        if (!booking) {
            throw new ApiError(404, "Booking not found");
        }

        assertBookingCanBePaidByUser(booking, user);

        const existingPayments = await Payment.findAll({
            where: {
                bookingId: booking.bookingId,
                status: {
                    [Op.in]: reusablePaymentStatuses,
                },
            },
            transaction,
            lock: true,
            order: [["createdAt", "DESC"], ["paymentId", "DESC"]],
        });

        const paidPayment = existingPayments.find((payment) => payment.status === "paid");
        if (paidPayment) {
            return serializePayment(paidPayment);
        }

        const pendingPayment = existingPayments.find((payment) => payment.status === "pending");
        if (pendingPayment && isPendingPaymentReusable(pendingPayment)) {
            let paymentUrl: string | null = null;

            if (pendingPayment.method === "vnpay") {
                const vnpayPayment = buildVnpayPaymentUrl({
                    booking,
                    payment: pendingPayment,
                    ipAddress: clientIp,
                    createdAt: pendingPayment.createdAt,
                });
                paymentUrl = vnpayPayment.paymentUrl;

                if (pendingPayment.providerTxnRef !== vnpayPayment.txnRef) {
                    pendingPayment.provider = "vnpay";
                    pendingPayment.providerTxnRef = vnpayPayment.txnRef;
                    await pendingPayment.save({ transaction });
                    await PaymentTransaction.update(
                        {
                            provider: "vnpay",
                            providerTxnRef: vnpayPayment.txnRef,
                        },
                        {
                            where: {
                                paymentId: pendingPayment.paymentId,
                                providerTxnRef: null,
                            },
                            transaction,
                        },
                    );
                }
            }

            return serializePayment(pendingPayment, paymentUrl);
        }

        for (const payment of existingPayments) {
            if (payment.status === "pending") {
                await expirePendingPayment(payment, transaction);
            }
        }

        const payment = new Payment({
            paymentId: await getNextSequence("payment", 890),
            bookingId: booking.bookingId,
            userId: Number(user.id),
            amount: booking.totalAmount,
            currency: booking.currency,
            method: input.method,
            status: "pending",
            provider: input.method === "vnpay" ? "vnpay" : null,
            providerTxnRef: null,
            providerTransactionNo: null,
            providerResponseCode: null,
            providerPayload: null,
            paidAt: null,
            failedAt: null,
        });

        let paymentUrl: string | null = null;

        if (input.method === "vnpay") {
            const vnpayPayment = buildVnpayPaymentUrl({ booking, payment, ipAddress: clientIp });
            payment.providerTxnRef = vnpayPayment.txnRef;
            paymentUrl = vnpayPayment.paymentUrl;
        }

        await payment.save({ transaction });
        await PaymentTransaction.create(
            {
                paymentId: payment.paymentId,
                bookingId: booking.bookingId,
                provider: payment.provider,
                providerTxnRef: payment.providerTxnRef,
                providerTransactionNo: payment.providerTransactionNo,
                transactionType: "payment",
                status: "pending",
                amount: payment.amount,
                currency: payment.currency,
                rawPayloadJson: null,
                processedAt: null,
            },
            { transaction },
        );

        if (booking.status === "pending") {
            booking.status = "pending_payment";
            await booking.save({ transaction });
        }

        return serializePayment(payment, paymentUrl);
    });
};

export const getPaymentDetail = async (user: AuthenticatedUser, paymentId: number) => {
    const payment = await Payment.findOne({ paymentId });

    if (!payment) {
        throw new ApiError(404, "Payment not found");
    }

    const booking = await getPaymentBooking(payment);
    assertCanViewPayment(booking, user);

    return serializePayment(payment);
};

export const getMyPayments = async (user: AuthenticatedUser, query: ListPaymentsQuery) => {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const filter: {
        userId: number;
        status?: PaymentStatus;
    } = {
        userId: Number(user.id),
    };

    if (query.status) {
        filter.status = query.status;
    }

    const [items, totalItems] = await Promise.all([
        Payment.find(filter)
            .sort({ createdAt: -1, paymentId: -1 })
            .skip((page - 1) * limit)
            .limit(limit),
        Payment.countDocuments(filter),
    ]);

    return {
        items: items.map((payment) => serializePayment(payment)),
        page,
        limit,
        totalItems,
        totalPages: Math.max(1, Math.ceil(totalItems / limit)),
    };
};

const isSuccessfulVnpayPayload = (payload: VnpayPayload) =>
    payload.vnp_ResponseCode === "00" &&
    (payload.vnp_TransactionStatus === undefined || payload.vnp_TransactionStatus === "00");

const findPaymentByVnpayPayload = async (payload: VnpayPayload) => {
    const txnRef = payload.vnp_TxnRef;

    if (!txnRef) {
        return null;
    }

    return Payment.findOne({ providerTxnRef: txnRef });
};

const updatePaymentFromVnpayPayload = async (payload: VnpayPayload) => {
    if (!verifyVnpayPayload(payload)) {
        throw new ApiError(400, "Invalid VNPay signature");
    }

    return sequelize.transaction(async (transaction) => {
        const payment = await Payment.findOne({
            where: {
                providerTxnRef: payload.vnp_TxnRef,
            },
            transaction,
            lock: true,
        });

        if (!payment) {
            throw new ApiError(404, "Payment not found");
        }

        const booking = await Booking.findOne({
            where: {
                bookingId: payment.bookingId,
            },
            transaction,
            lock: true,
        });

        if (!booking) {
            throw new ApiError(404, "Booking not found");
        }

        if (!isVnpayAmountMatching(payload, payment)) {
            throw new ApiError(400, "Invalid VNPay amount");
        }

        payment.providerPayload = sanitizeVnpayPayloadForStorage(payload);
        payment.providerTransactionNo = payload.vnp_TransactionNo ?? payment.providerTransactionNo;
        payment.providerResponseCode = payload.vnp_ResponseCode ?? payment.providerResponseCode;

        if (isSuccessfulVnpayPayload(payload)) {
            const paidAt = payment.paidAt ?? new Date();

            if (payment.status !== "paid") {
                payment.status = "paid";
                payment.paidAt = paidAt;
                payment.failedAt = null;
            }

            if (!["paid", "checked_in", "completed"].includes(booking.status)) {
                booking.status = "paid";
                booking.paidAt = paidAt;
            }
            await redeemBookingCouponIfNeeded(booking, transaction);
        } else if (payment.status !== "paid") {
            payment.status = getFailedVnpayStatus(payload);
            payment.failedAt = new Date();

            if (payment.status === "expired" && booking.status === "pending_payment") {
                booking.status = "expired";
            }
        }

        await payment.save({ transaction });
        await booking.save({ transaction });
        const transactionStatus =
            payment.status === "paid"
                ? "succeeded"
                : payment.status === "failed"
                  ? "failed"
                  : payment.status === "cancelled" || payment.status === "expired"
                    ? "cancelled"
                    : "pending";
        const existingTransaction = payment.providerTxnRef
            ? await PaymentTransaction.findOne({
                  where: {
                      providerTxnRef: payment.providerTxnRef,
                  },
                  transaction,
                  lock: true,
              })
            : null;

        if (existingTransaction) {
            existingTransaction.providerTransactionNo = payment.providerTransactionNo;
            existingTransaction.status = transactionStatus;
            existingTransaction.rawPayloadJson = sanitizeVnpayPayloadForStorage(payload);
            existingTransaction.processedAt = new Date();
            await existingTransaction.save({ transaction });
        } else {
            await PaymentTransaction.create(
                {
                    paymentId: payment.paymentId,
                    bookingId: booking.bookingId,
                    provider: payment.provider,
                    providerTxnRef: payment.providerTxnRef,
                    providerTransactionNo: payment.providerTransactionNo,
                    transactionType: "payment",
                    status: transactionStatus,
                    amount: payment.amount,
                    currency: payment.currency,
                    rawPayloadJson: sanitizeVnpayPayloadForStorage(payload),
                    processedAt: new Date(),
                },
                { transaction },
            );
        }

        return serializePayment(payment);
    });
};

const buildVnpayAuditMetadata = (payload: VnpayPayload, outcome: string) => ({
    provider: "vnpay",
    outcome,
    txnRef: payload.vnp_TxnRef ?? null,
    responseCode: payload.vnp_ResponseCode ?? null,
    transactionStatus: payload.vnp_TransactionStatus ?? null,
    providerTransactionNo: payload.vnp_TransactionNo ?? null,
    amount: payload.vnp_Amount ?? null,
});

const writePaymentCallbackAudit = async (
    action: string,
    payload: VnpayPayload,
    outcome: string,
    context: PaymentCallbackContext,
    targetId?: number | null,
) => {
    await writeAuditLog({
        action,
        targetType: targetId ? "payment" : "payment_callback",
        targetId: targetId ?? null,
        metadata: buildVnpayAuditMetadata(payload, outcome),
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
    });
};

const getVnpayCallbackFailureOutcome = (error: unknown) => {
    if (!(error instanceof ApiError)) {
        return "error";
    }

    if (error.statusCode === 400 && /signature/i.test(error.message)) {
        return "invalid_signature";
    }

    if (error.statusCode === 400 && /amount/i.test(error.message)) {
        return "invalid_amount";
    }

    if (error.statusCode === 404) {
        return "order_not_found";
    }

    return `http_${error.statusCode}`;
};

export const processVnpayReturn = async (
    input: Record<string, unknown>,
    context: PaymentCallbackContext = {},
) => {
    const payload = normalizeVnpayPayload(input);

    try {
        const result = await updatePaymentFromVnpayPayload(payload);

        await writePaymentCallbackAudit(
            "payment.callback.vnpay.return",
            payload,
            result.paymentStatus,
            context,
            result.paymentId,
        );

        return result;
    } catch (error) {
        const payment = await findPaymentByVnpayPayload(payload);

        await writePaymentCallbackAudit(
            "payment.callback.vnpay.return",
            payload,
            getVnpayCallbackFailureOutcome(error),
            context,
            payment?.paymentId ?? null,
        );

        throw error;
    }
};

export const processVnpayWebhook = async (
    input: Record<string, unknown>,
    context: PaymentCallbackContext = {},
): Promise<VnpayWebhookResult> => {
    const payload = normalizeVnpayPayload(input);

    if (!verifyVnpayPayload(payload)) {
        await writePaymentCallbackAudit("payment.callback.vnpay.webhook", payload, "invalid_signature", context);

        return {
            RspCode: "97",
            Message: "Invalid signature",
        };
    }

    const payment = await findPaymentByVnpayPayload(payload);

    if (!payment) {
        await writePaymentCallbackAudit("payment.callback.vnpay.webhook", payload, "order_not_found", context);

        return {
            RspCode: "01",
            Message: "Order not found",
        };
    }

    if (!isVnpayAmountMatching(payload, payment)) {
        await writePaymentCallbackAudit(
            "payment.callback.vnpay.webhook",
            payload,
            "invalid_amount",
            context,
            payment.paymentId,
        );

        return {
            RspCode: "04",
            Message: "Invalid amount",
        };
    }

    await updatePaymentFromVnpayPayload(payload);
    await writePaymentCallbackAudit(
        "payment.callback.vnpay.webhook",
        payload,
        "confirmed",
        context,
        payment.paymentId,
    );

    return {
        RspCode: "00",
        Message: "Confirm Success",
    };
};
