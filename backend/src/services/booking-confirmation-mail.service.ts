import { UniqueConstraintError } from "sequelize";

import { logger } from "../config/logger";
import Booking from "../models/booking";
import Listing, { type ListingDocument } from "../models/listing";
import NotificationLog from "../models/notification-log";
import Payment from "../models/payment";
import User from "../models/user";
import { sendMail } from "./mail.service";

function formatMoney(value: unknown, currency = "VND"): string {
    const numberValue = Number(value ?? 0);

    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
    }).format(numberValue);
}

function formatDate(value: Date | string | null | undefined): string {
    if (!value) {
        return "";
    }

    return new Intl.DateTimeFormat("vi-VN").format(new Date(value));
}

function escapeHtml(value: unknown): string {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function listingAddress(listing: ListingDocument | null): string {
    return [
        listing?.addressLine,
        listing?.ward,
        listing?.district,
        listing?.city,
    ]
        .filter(Boolean)
        .join(", ");
}

export async function sendBookingConfirmationEmail(paymentId: number): Promise<void> {
    const payment = await Payment.findOne({ paymentId });

    if (!payment || payment.status !== "paid") {
        return;
    }

    const booking = await Booking.findOne({ bookingId: payment.bookingId });

    if (!booking) {
        return;
    }

    const [guest, listing] = await Promise.all([
        User.findByPk(booking.guestUserId),
        Listing.findOne({ listingId: booking.listingId }),
    ]);

    if (!guest?.email) {
        return;
    }

    const eventType = "booking_payment_success";
    const targetType = "booking";
    const targetId = String(booking.bookingId);
    const recipient = guest.email;

    let log: NotificationLog;

    try {
        log = await NotificationLog.create({
            eventType,
            targetType,
            targetId,
            recipient,
            status: "pending",
            provider: "smtp",
            providerMessageId: null,
            errorMessage: null,
            sentAt: null,
        });
    } catch (error) {
        if (error instanceof UniqueConstraintError) {
            logger.info("Booking confirmation email already processed", {
                bookingId: booking.bookingId,
                paymentId: payment.paymentId,
                recipient,
            });
            return;
        }

        throw error;
    }

    const guestName = guest.fullName ?? guest.email;
    const address = listingAddress(listing);
    const transactionNo = payment.providerTransactionNo ?? payment.providerTxnRef ?? payment.paymentId;
    const subject = "Xác nhận đặt phòng thành công - Minh Thành Villa";

    const text = `
Xin chào ${guestName},

Đặt phòng của bạn đã thanh toán thành công.

Mã booking: ${booking.bookingId}
Tên căn/villa: ${listing?.title ?? ""}
Địa chỉ: ${address}
Ngày nhận phòng: ${formatDate(booking.checkInDate)}
Ngày trả phòng: ${formatDate(booking.checkOutDate)}
Số khách: ${booking.guestCount}
Tổng tiền: ${formatMoney(payment.amount, payment.currency)}
Phương thức thanh toán: ${payment.method}
Mã giao dịch: ${transactionNo}

Hotline hỗ trợ: 0929399893

Minh Thành Villa
`.trim();

    const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
      <h2>Xác nhận đặt phòng thành công</h2>
      <p>Xin chào <strong>${escapeHtml(guestName)}</strong>,</p>
      <p>Đặt phòng của bạn đã thanh toán thành công.</p>
      <ul>
        <li><strong>Mã booking:</strong> ${booking.bookingId}</li>
        <li><strong>Tên căn/villa:</strong> ${escapeHtml(listing?.title ?? "")}</li>
        <li><strong>Địa chỉ:</strong> ${escapeHtml(address)}</li>
        <li><strong>Ngày nhận phòng:</strong> ${escapeHtml(formatDate(booking.checkInDate))}</li>
        <li><strong>Ngày trả phòng:</strong> ${escapeHtml(formatDate(booking.checkOutDate))}</li>
        <li><strong>Số khách:</strong> ${booking.guestCount}</li>
        <li><strong>Tổng tiền:</strong> ${escapeHtml(formatMoney(payment.amount, payment.currency))}</li>
        <li><strong>Phương thức:</strong> ${escapeHtml(payment.method)}</li>
        <li><strong>Mã giao dịch:</strong> ${escapeHtml(transactionNo)}</li>
      </ul>
      <p>Hotline hỗ trợ: <strong>0929399893</strong></p>
      <p>Minh Thành Villa</p>
    </div>
  `;

    try {
        const result = await sendMail({
            to: recipient,
            subject,
            text,
            html,
        });

        await log.update({
            status: "sent",
            sentAt: new Date(),
            providerMessageId:
                typeof result === "object" && result && "messageId" in result
                    ? String(result.messageId)
                    : null,
        });
    } catch (error) {
        await log.update({
            status: "failed",
            errorMessage: error instanceof Error ? error.message : String(error),
        });

        logger.error("Failed to send booking confirmation email", error, {
            bookingId: booking.bookingId,
            paymentId: payment.paymentId,
            recipient,
        });
    }
}
