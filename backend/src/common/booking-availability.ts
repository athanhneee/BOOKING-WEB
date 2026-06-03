import { Op, type WhereOptions } from "sequelize";

import type { BookingDocument, BookingStatus } from "../models/booking";

export const alwaysBlockingBookingStatuses = [
    "paid",
    "confirmed",
    "checked_in",
] as const satisfies readonly BookingStatus[];
export const pendingPaymentBlockingStatus = "pending_payment" as const satisfies BookingStatus;
export const checkedOutBlockingStatus = "checked_out" as const satisfies BookingStatus;

const getVietnamDateString = (now: Date) =>
    new Date(now.getTime() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);

export const buildBookingDateOverlapWhere = (
    checkInDate: string,
    checkOutDate: string,
): WhereOptions<BookingDocument> => ({
    checkInDate: {
        [Op.lt]: checkOutDate,
    },
    checkOutDate: {
        [Op.gt]: checkInDate,
    },
});

export const buildActiveBookingStatusWhere = (now = new Date()): WhereOptions<BookingDocument> => {
    const stayCompletionCutoffDate = getVietnamDateString(now);

    return {
        [Op.or]: [
            {
                status: {
                    [Op.in]: [...alwaysBlockingBookingStatuses],
                },
            },
            {
                status: pendingPaymentBlockingStatus,
                lockedUntil: {
                    [Op.gt]: now,
                },
            },
            {
                status: checkedOutBlockingStatus,
                checkOutDate: {
                    [Op.gt]: stayCompletionCutoffDate,
                },
            },
        ],
    };
};
