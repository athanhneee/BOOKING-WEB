import { Op, type WhereOptions } from "sequelize";

import type { BookingDocument, BookingStatus } from "../models/booking";

export const alwaysBlockingBookingStatuses = [
    "pending",
    "pending_host",
    "confirmed",
    "paid",
    "checked_in",
] as const satisfies readonly BookingStatus[];
export const pendingPaymentBlockingStatus = "pending_payment" as const satisfies BookingStatus;

export const buildActiveBookingStatusWhere = (now = new Date()): WhereOptions<BookingDocument> => ({
    [Op.or]: [
        {
            status: {
                [Op.in]: [...alwaysBlockingBookingStatuses],
            },
        },
        {
            status: pendingPaymentBlockingStatus,
            [Op.or]: [
                {
                    lockedUntil: {
                        [Op.is]: null,
                    },
                },
                {
                    lockedUntil: {
                        [Op.gt]: now,
                    },
                },
            ],
        },
    ],
});
