import { Op, Transaction } from "sequelize";
import { sequelize } from "../config/database";
import { getEnv } from "../config/env";
import Booking, { type BookingDocument } from "../models/booking";
import Payment, { type PaymentDocument } from "../models/payment";
import Refund from "../models/refund";
import BookingStatusHistory from "../models/booking-status-history";
import { releaseBookingDateLocksForBooking } from "./booking-date-lock.service";
import { logger } from "../config/logger";

let sweepTimer: NodeJS.Timeout | null = null;
let sweepRunning = false;

async function writeBookingStatusHistory(params: {
    bookingId: number;
    fromStatus: string | null;
    toStatus: string;
    reason: string;
    transaction: Transaction;
}) {
    await BookingStatusHistory.create(
        {
            bookingId: params.bookingId,
            oldStatus: params.fromStatus,
            newStatus: params.toStatus,
            reason: params.reason,
            createdAt: new Date(),
        },
        {
            transaction: params.transaction,
        },
    );
}

const isPaymentPaidBeforeHoldExpired = (params: {
    paidAt: Date | null;
    lockedUntil: Date | null;
}) => {
    if (!params.lockedUntil || !params.paidAt) {
        return true;
    }

    return params.paidAt.getTime() <= params.lockedUntil.getTime();
};

const createLatePaymentRefundIfMissing = async (params: {
    booking: BookingDocument;
    payment: PaymentDocument;
    transaction: Transaction;
}) => {
    const existingRefund = await Refund.findOne({
        where: {
            bookingId: params.booking.bookingId,
            paymentId: params.payment.paymentId,
            reason: "late_payment_after_booking_expired",
        },
        transaction: params.transaction,
        lock: params.transaction.LOCK.UPDATE,
    });

    if (existingRefund) {
        return;
    }

    await Refund.create(
        {
            bookingId: params.booking.bookingId,
            paymentId: params.payment.paymentId,
            requestedByUserId: params.booking.guestUserId,
            amount: params.payment.amount,
            currency: params.payment.currency,
            status: "pending",
            reason: "late_payment_after_booking_expired",
            providerRef: null,
            processedByUserId: null,
            processedAt: null,
        },
        { transaction: params.transaction },
    );
};

export async function expirePendingPaymentBooking(bookingId: number): Promise<boolean> {
    return sequelize.transaction(async (transaction) => {
        const now = new Date();

        const booking = await Booking.findOne({
            where: {
                bookingId,
            },
            transaction,
            lock: transaction.LOCK.UPDATE,
        });

        if (!booking) {
            return false;
        }

        if (booking.status !== "pending_payment") {
            return false;
        }

        if (!booking.lockedUntil || booking.lockedUntil.getTime() > now.getTime()) {
            return false;
        }

        const paidPayment = await Payment.findOne({
            where: {
                bookingId: booking.bookingId,
                status: "paid",
            },
            transaction,
            lock: transaction.LOCK.UPDATE,
        });

        if (
            paidPayment &&
            isPaymentPaidBeforeHoldExpired({
                paidAt: paidPayment.paidAt,
                lockedUntil: booking.lockedUntil,
            })
        ) {
            const previousStatus = booking.status;

            booking.status = "paid";
            booking.lockedUntil = null;
            booking.paidAt = paidPayment.paidAt ?? now;

            await booking.save({ transaction });

            await writeBookingStatusHistory({
                bookingId: booking.bookingId,
                fromStatus: previousStatus,
                toStatus: "paid",
                reason: "payment_paid_before_expiration_sweep",
                transaction,
            });

            return true;
        }

        if (paidPayment) {
            await createLatePaymentRefundIfMissing({
                booking,
                payment: paidPayment,
                transaction,
            });

            logger.warn("Late paid payment found after booking hold expired; booking was expired for manual review", {
                bookingId: booking.bookingId,
                paymentId: paidPayment.paymentId,
                paidAt: paidPayment.paidAt,
                lockedUntil: booking.lockedUntil,
            });
        }

        await Payment.update(
            {
                status: "expired",
                expiredAt: now,
                failedAt: now,
            },
            {
                where: {
                    bookingId: booking.bookingId,
                    status: "pending",
                },
                transaction,
            },
        );

        const previousStatus = booking.status;

        booking.status = "expired";
        booking.lockedUntil = null;

        await booking.save({ transaction });

        await releaseBookingDateLocksForBooking({
            bookingId: booking.bookingId,
            transaction,
        });

        await writeBookingStatusHistory({
            bookingId: booking.bookingId,
            fromStatus: previousStatus,
            toStatus: "expired",
            reason: "payment_hold_expired",
            transaction,
        });

        return true;
    });
}

export async function expirePendingPaymentBookings(limit = 100): Promise<number> {
    const now = new Date();

    const bookings = await Booking.findAll({
        where: {
            status: "pending_payment",
            lockedUntil: {
                [Op.lte]: now,
            },
        },
        attributes: ["bookingId"],
        limit,
        order: [["lockedUntil", "ASC"]],
    });

    let expiredCount = 0;

    for (const booking of bookings) {
        try {
            const changed = await expirePendingPaymentBooking(booking.bookingId);
            if (changed) {
                expiredCount += 1;
            }
        } catch (error) {
            logger.error("Failed to expire pending payment booking", error, {
                bookingId: booking.bookingId,
            });
        }
    }

    return expiredCount;
}

export function startPaymentExpirationSweep(): void {
    if (sweepTimer) {
        return;
    }

    const env = getEnv();
    const intervalMs = env.paymentExpirationSweepIntervalSeconds * 1000;

    sweepTimer = setInterval(() => {
        if (sweepRunning) {
            return;
        }

        sweepRunning = true;

        expirePendingPaymentBookings()
            .catch((error) => {
                logger.error("Payment expiration sweep failed", error);
            })
            .finally(() => {
                sweepRunning = false;
            });
    }, intervalMs);

    sweepTimer.unref?.();

    logger.info("Payment expiration sweep started", {
        intervalSeconds: env.paymentExpirationSweepIntervalSeconds,
    });
}

export function stopPaymentExpirationSweep(): void {
    if (!sweepTimer) {
        return;
    }

    clearInterval(sweepTimer);
    sweepTimer = null;
    sweepRunning = false;

    logger.info("Payment expiration sweep stopped");
}
