import {
    col,
    Op,
    QueryTypes,
    where as sequelizeWhere,
    type Transaction,
    type WhereOptions,
} from "sequelize";
import { getEnv } from "../../config/env";
import {
    createBookingDateLocks,
    releaseBookingDateLocksForBooking,
} from "../../services/booking-date-lock.service";
import { ApiError } from "../../common/api-error";
import { buildActiveBookingStatusWhere } from "../../common/booking-availability";
import { getListingImagesForListing } from "../../common/listing-relations";
import { getCoverImage, getDefaultDailyPrice, serializeListingImage } from "../../common/listing-mappers";
import { sanitizeNullableSingleLineText } from "../../common/sanitization";
import sequelize from "../../config/database";
import AvailabilityCalendar from "../../models/availability-calendar";
import Booking, { BookingDocument, BookingStatus } from "../../models/booking";
import BookingStatusHistory from "../../models/booking-status-history";
import Coupon from "../../models/coupon";
import CouponRedemption from "../../models/coupon-redemption";
import Listing, { CancellationPolicy, ListingDocument } from "../../models/listing";
import Payment from "../../models/payment";
import Refund from "../../models/refund";
import type { AuthenticatedUser } from "../auth/auth.service";
import { writeAuditLog } from "../../services/audit-log-service";

export type CreateBookingInput = {
    listingId: number;
    checkInDate: string;
    checkOutDate: string;
    guestCount: number;
    couponCode?: string;
    couponId?: number;
    bookingNote?: string;
};

export type ListBookingsQuery = {
    status?: BookingStatus | ApiBookingStatus;
    page?: number;
    limit?: number;
};

export type CancelBookingInput = {
    reason?: string;
};

export type ApiBookingStatus =
    | "pending"
    | "pending_payment"
    | "pending_host"
    | "pending_host_confirmation"
    | "confirmed"
    | "paid"
    | "checked_in"
    | "completed"
    | "cancelled"
    | "cancelled_by_guest"
    | "cancelled_by_host"
    | "host_cancelled"
    | "expired"
    | "rejected";

type PricingBreakdown = {
    nights: number;
    nightlyPrices: Array<{
        date: string;
        amount: number;
        source: "basePrice" | "weekendPrice" | "priceOverride";
    }>;
    subtotalAmount: number;
    cleaningFeeAmount: number;
    serviceFeeAmount: number;
    discountAmount: number;
    totalAmount: number;
    couponId: number | null;
    couponCode: string | null;
};

type CouponDiscount = {
    coupon: InstanceType<typeof Coupon> | null;
    discountAmount: number;
};

type CancellationActor = "guest" | "host";

const maxPageLimit = 100;
const millisecondsPerDay = 24 * 60 * 60 * 1000;
const cancellableStatuses: BookingStatus[] = ["pending", "pending_host", "pending_payment", "confirmed", "paid"];
const hostConfirmableStatuses: BookingStatus[] = ["pending", "pending_host"];
const checkInStatuses: BookingStatus[] = ["confirmed", "paid"];
const apiStatusToInternalStatuses: Record<ApiBookingStatus, BookingStatus[]> = {
    pending: ["pending"],
    pending_payment: ["pending_payment"],
    pending_host: ["pending_host", "pending"],
    pending_host_confirmation: ["pending_host", "pending"],
    confirmed: ["confirmed"],
    paid: ["paid"],
    checked_in: ["checked_in"],
    completed: ["completed"],
    cancelled: ["cancelled"],
    cancelled_by_guest: ["cancelled"],
    cancelled_by_host: ["cancelled"],
    host_cancelled: ["cancelled"],
    expired: ["expired"],
    rejected: ["rejected"],
};

const toNumber = (value: unknown) => Number(value ?? 0);

const toDateAtUtcMidnight = (date: string) => new Date(`${date}T00:00:00.000Z`);

const getTodayInVietnam = () => new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);

const getNightCount = (checkInDate: string, checkOutDate: string) =>
    Math.round((toDateAtUtcMidnight(checkOutDate).getTime() - toDateAtUtcMidnight(checkInDate).getTime()) / millisecondsPerDay);

const listReservedDates = (checkInDate: string, checkOutDate: string) => {
    const dates: string[] = [];
    const cursor = toDateAtUtcMidnight(checkInDate);
    const end = toDateAtUtcMidnight(checkOutDate);

    while (cursor < end) {
        dates.push(cursor.toISOString().slice(0, 10));
        cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    return dates;
};

const parsePagination = (query: ListBookingsQuery) => ({
    page: Math.max(1, query.page ?? 1),
    limit: Math.min(maxPageLimit, Math.max(1, query.limit ?? 10)),
});

const getNextBookingSequence = async (transaction: Transaction) => {
    await sequelize.query(
        `
        INSERT INTO counters (\`key\`, \`value\`)
        VALUES ('booking', 1)
        ON DUPLICATE KEY UPDATE \`value\` = \`value\` + 1
        `,
        { transaction },
    );

    const rows = await sequelize.query<{ value: number }>(
        "SELECT `value` FROM counters WHERE `key` = 'booking' LIMIT 1 FOR UPDATE",
        {
            type: QueryTypes.SELECT,
            transaction,
        },
    );

    const nextValue = rows[0]?.value;

    if (!nextValue) {
        throw new ApiError(500, "Unable to allocate booking id");
    }

    return Number(nextValue);
};

const assertBookingDateRange = (input: Pick<CreateBookingInput, "checkInDate" | "checkOutDate">) => {
    if (input.checkInDate >= input.checkOutDate) {
        throw new ApiError(422, "Validation error", [
            {
                path: "checkOutDate",
                msg: "checkOutDate must be after checkInDate",
            },
        ]);
    }

    if (input.checkInDate < getTodayInVietnam()) {
        throw new ApiError(422, "Validation error", [
            {
                path: "checkInDate",
                msg: "checkInDate cannot be in the past",
            },
        ]);
    }
};

const assertNightRules = (
    listing: ListingDocument,
    checkInCalendarMinNights: number | null,
    nights: number,
) => {
    const minNights = checkInCalendarMinNights ?? listing.minNights;

    if (nights < minNights) {
        throw new ApiError(422, "Validation error", [
            {
                path: "checkOutDate",
                msg: `Booking must be at least ${minNights} night(s)`,
            },
        ]);
    }

    if (listing.maxNights !== null && listing.maxNights !== undefined && nights > listing.maxNights) {
        throw new ApiError(422, "Validation error", [
            {
                path: "checkOutDate",
                msg: `Booking must be at most ${listing.maxNights} night(s)`,
            },
        ]);
    }
};

const getPublicListingForBooking = async (listingId: number, transaction: Transaction) => {
    const listing = await Listing.findOne({
        where: {
            listingId,
            deletedAt: null,
        },
        transaction,
        lock: transaction.LOCK.UPDATE,
    });

    if (!listing || listing.status !== "active") {
        throw new ApiError(404, "Listing not found");
    }

    return listing;
};

const getCalendarMapForDates = async (
    listing: ListingDocument,
    dates: string[],
    transaction: Transaction,
) => {
    const calendarByDate = new Map(
        listing.availabilityCalendar.map((row) => [row.date, row] as const),
    );
    const rows = await AvailabilityCalendar.findAll({
        where: {
            listingId: listing.listingId,
            date: {
                [Op.in]: dates,
            },
        },
        transaction,
        lock: transaction.LOCK.UPDATE,
    });

    for (const row of rows) {
        calendarByDate.set(row.date, {
            date: row.date,
            isAvailable: row.isAvailable,
            isBlockedByHost: row.isBlockedByHost,
            priceOverride: row.priceOverride ?? null,
            minNightsOverride: row.minNightsOverride ?? null,
            notes: row.notes ?? null,
        });
    }

    return calendarByDate;
};

const assertCalendarAvailability = (dates: string[], calendarByDate: Map<string, { isAvailable: boolean; isBlockedByHost: boolean }>) => {
    const unavailableDates = dates.filter((date) => {
        const day = calendarByDate.get(date);
        return day ? day.isBlockedByHost || !day.isAvailable : false;
    });

    if (unavailableDates.length > 0) {
        throw new ApiError(409, "Listing is not available for the selected dates", [
            {
                path: "checkInDate",
                msg: `Unavailable dates: ${unavailableDates.join(", ")}`,
            },
        ]);
    }
};

const assertNoActiveOverlappingBooking = async (
    listingId: number,
    checkInDate: string,
    checkOutDate: string,
    transaction: Transaction,
) => {
    const overlapping = await Booking.findOne({
        where: {
            listingId,
            ...buildActiveBookingStatusWhere(),
            checkInDate: {
                [Op.lt]: checkOutDate,
            },
            checkOutDate: {
                [Op.gt]: checkInDate,
            },
        },
        transaction,
        lock: transaction.LOCK.UPDATE,
    });

    if (overlapping) {
        throw new ApiError(409, "Listing is already booked for the selected dates");
    }
};

const getNightlyPrice = (
    listing: ListingDocument,
    date: string,
    calendarByDate: Map<string, { priceOverride?: number | null }>,
) => {
    const priceOverride = calendarByDate.get(date)?.priceOverride;

    if (priceOverride !== null && priceOverride !== undefined) {
        return {
            amount: toNumber(priceOverride),
            source: "priceOverride" as const,
        };
    }

    const defaultPrice = toNumber(getDefaultDailyPrice(listing, date));
    const weekendPrice = toNumber(listing.weekendPrice);

    return {
        amount: defaultPrice,
        source: weekendPrice > 0 && defaultPrice === weekendPrice ? "weekendPrice" as const : "basePrice" as const,
    };
};

const getCouponDiscount = async (
    userId: number,
    couponInput: Pick<CreateBookingInput, "couponCode" | "couponId">,
    preDiscountTotal: number,
    transaction: Transaction,
): Promise<CouponDiscount> => {
    if (!couponInput.couponCode && !couponInput.couponId) {
        return {
            coupon: null,
            discountAmount: 0,
        };
    }

    const couponWhere = couponInput.couponId
        ? { couponId: couponInput.couponId }
        : { code: couponInput.couponCode!.trim() };
    const coupon = await Coupon.findOne({
        where: {
            ...couponWhere,
            isActive: true,
            deletedAt: null,
        },
        transaction,
        lock: transaction.LOCK.UPDATE,
    });

    if (!coupon) {
        throw new ApiError(422, "Coupon is invalid", [
            {
                path: couponInput.couponId ? "couponId" : "couponCode",
                msg: "Coupon is invalid",
            },
        ]);
    }

    const now = new Date();

    if (coupon.startDate > now || coupon.endDate < now) {
        throw new ApiError(422, "Coupon is expired or not active");
    }

    if (coupon.totalLimit !== null && coupon.totalLimit !== undefined && coupon.usedCount >= coupon.totalLimit) {
        throw new ApiError(422, "Coupon usage limit has been reached");
    }

    if (coupon.minOrderValue !== null && coupon.minOrderValue !== undefined && preDiscountTotal < toNumber(coupon.minOrderValue)) {
        throw new ApiError(422, "Order value does not meet coupon minimum");
    }

    if (coupon.limitPerUser !== null && coupon.limitPerUser !== undefined) {
        const redemptionCount = await CouponRedemption.count({
            where: {
                couponId: coupon.couponId,
                userId,
            },
            transaction,
        });

        if (redemptionCount >= coupon.limitPerUser) {
            throw new ApiError(422, "Coupon usage limit has been reached");
        }
    }

    const rawDiscount =
        coupon.type === "percent"
            ? preDiscountTotal * (toNumber(coupon.discountValue) / 100)
            : toNumber(coupon.discountValue);
    const cappedDiscount =
        coupon.maxDiscountAmount !== null && coupon.maxDiscountAmount !== undefined
            ? Math.min(rawDiscount, toNumber(coupon.maxDiscountAmount))
            : rawDiscount;

    return {
        coupon,
        discountAmount: Math.min(preDiscountTotal, Math.max(0, Math.round(cappedDiscount))),
    };
};

const calculatePricing = async (
    userId: number,
    listing: ListingDocument,
    dates: string[],
    calendarByDate: Map<string, { priceOverride?: number | null }>,
    input: Pick<CreateBookingInput, "couponCode" | "couponId">,
    transaction: Transaction,
): Promise<PricingBreakdown> => {
    const nightlyPrices = dates.map((date) => ({
        date,
        ...getNightlyPrice(listing, date, calendarByDate),
    }));
    const subtotalAmount = nightlyPrices.reduce((total, item) => total + item.amount, 0);
    const cleaningFeeAmount = toNumber(listing.cleaningFee);
    const serviceFeeAmount = Math.round(subtotalAmount * (toNumber(listing.serviceFeePct) / 100));
    const preDiscountTotal = subtotalAmount + cleaningFeeAmount + serviceFeeAmount;
    const { coupon, discountAmount } = await getCouponDiscount(userId, input, preDiscountTotal, transaction);

    return {
        nights: dates.length,
        nightlyPrices,
        subtotalAmount,
        cleaningFeeAmount,
        serviceFeeAmount,
        discountAmount,
        totalAmount: Math.max(0, preDiscountTotal - discountAmount),
        couponId: coupon?.couponId ?? null,
        couponCode: coupon?.code ?? null,
    };
};

const toApiBookingStatus = (booking: BookingDocument): ApiBookingStatus => {
    switch (booking.status) {
        case "pending":
        case "pending_host":
            return "pending_host";
        case "pending_payment":
            return "pending_payment";
        case "confirmed":
            return "confirmed";
        case "paid":
            return "paid";
        case "checked_in":
            return "checked_in";
        case "completed":
            return "completed";
        case "expired":
            return "expired";
        case "rejected":
            return "rejected";
        case "cancelled":
            return "cancelled";
        default:
            return "pending_payment";
    }
};

const getLatestPaymentForBooking = async (bookingId: number) =>
    Payment.findOne({
        where: {
            bookingId,
        },
        order: [["createdAt", "DESC"]],
    });

const serializeBooking = async (booking: BookingDocument, includeImages = false) => {
    const [latestPayment, listing] = await Promise.all([
        getLatestPaymentForBooking(booking.bookingId),
        Listing.findOne({
            where: {
                listingId: booking.listingId,
            },
        }),
    ]);
    const images = listing ? await getListingImagesForListing(listing) : [];
    const coverImage = getCoverImage(images);
    const serializedCoverImage = coverImage ? serializeListingImage(coverImage) : null;
    const paymentExpiresAt = latestPayment?.expiresAt ?? booking.lockedUntil;
    const remainingPaymentSeconds = paymentExpiresAt
        ? Math.max(
            0,
            Math.floor((new Date(paymentExpiresAt).getTime() - Date.now()) / 1000),
        )
        : 0;

    return {
        bookingId: booking.bookingId,
        listingId: booking.listingId,
        guestUserId: String(booking.guestUserId),
        hostUserId: String(booking.hostUserId),
        listingTitle: listing?.title ?? null,
        listing: listing
            ? {
                listingId: listing.listingId,
                title: listing.title,
                city: listing.city,
                district: listing.district,
                addressLine: listing.addressLine,
                imageUrl: coverImage?.url ?? null,
                coverImageUrl: coverImage?.url ?? null,
                coverImage: serializedCoverImage,
                images: includeImages ? images.map(serializeListingImage) : [],
            }
            : null,
        checkInDate: booking.checkInDate,
        checkOutDate: booking.checkOutDate,
        guests: booking.guestCount,
        guestCount: booking.guestCount,
        guestsCount: booking.guestCount,
        nights: booking.nights ?? getNightCount(booking.checkInDate, booking.checkOutDate),
        status: toApiBookingStatus(booking),
        internalStatus: booking.status,
        paymentStatus: latestPayment?.status ?? null,
        lockedUntil: booking.lockedUntil,
        paymentExpiresAt,
        remainingPaymentSeconds,
        currency: booking.currency,
        subtotalAmount: toNumber(booking.subtotalAmount),
        cleaningFeeAmount: toNumber(booking.cleaningFeeAmount),
        serviceFeeAmount: toNumber(booking.serviceFeeAmount),
        discountAmount: toNumber(booking.discountAmount),
        totalAmount: toNumber(booking.totalAmount),
        totalPrice: toNumber(booking.totalAmount),
        couponId: booking.couponId ?? null,
        bookingNote: booking.bookingNote ?? null,
        cancellationReason: booking.cancellationReason ?? null,
        cancelledByUserId: booking.cancelledByUserId ? String(booking.cancelledByUserId) : null,
        cancelledAt: booking.cancelledAt ?? null,
        checkedInAt: booking.checkedInAt ?? null,
        checkedOutAt: booking.checkedOutAt ?? null,
        paidAt: booking.paidAt ?? null,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
    };
};

const writeBookingStatusHistory = async (
    booking: BookingDocument,
    oldStatus: string | null,
    newStatus: string,
    actorId: number | null,
    reason: string | null,
    metadata: Record<string, unknown> | null,
    transaction: Transaction,
) => {
    await BookingStatusHistory.create(
        {
            bookingId: booking.bookingId,
            oldStatus,
            newStatus,
            changedByUserId: actorId,
            reason,
            metadataJson: metadata,
        },
        { transaction },
    );
};

const buildStatusWhere = (status?: BookingStatus | ApiBookingStatus): WhereOptions<BookingDocument> | undefined => {
    if (!status) {
        return undefined;
    }

    if (status === "cancelled_by_guest") {
        return {
            status: "cancelled",
            [Op.and]: [sequelizeWhere(col("cancelled_by_user_id"), Op.eq, col("guest_user_id"))],
        } as WhereOptions<BookingDocument>;
    }

    if (status === "cancelled_by_host") {
        return {
            status: "cancelled",
            [Op.and]: [sequelizeWhere(col("cancelled_by_user_id"), Op.eq, col("host_user_id"))],
        } as WhereOptions<BookingDocument>;
    }

    if (status === "host_cancelled") {
        return {
            status: "cancelled",
            [Op.and]: [sequelizeWhere(col("cancelled_by_user_id"), Op.eq, col("host_user_id"))],
        } as WhereOptions<BookingDocument>;
    }

    const internalStatuses =
        status in apiStatusToInternalStatuses
            ? apiStatusToInternalStatuses[status as ApiBookingStatus]
            : [status as BookingStatus];

    return {
        status: {
            [Op.in]: internalStatuses,
        },
    } as WhereOptions<BookingDocument>;
};

const assertGuestOwnsBooking = (booking: BookingDocument, user: AuthenticatedUser) => {
    if (String(booking.guestUserId) !== user.id) {
        throw new ApiError(403, "Forbidden");
    }
};

const assertHostOwnsBooking = (booking: BookingDocument, user: AuthenticatedUser) => {
    if (user.roles.includes("admin")) {
        return;
    }

    if (String(booking.hostUserId) !== user.id) {
        throw new ApiError(403, "Forbidden");
    }
};

const getBookingOrThrow = async (bookingId: number, transaction?: Transaction, lock = false) => {
    const booking = await Booking.findOne({
        where: {
            bookingId,
        },
        transaction,
        lock: lock && transaction ? transaction.LOCK.UPDATE : undefined,
    });

    if (!booking) {
        throw new ApiError(404, "Booking not found");
    }

    return booking;
};

const getListingCancellationPolicy = async (booking: BookingDocument, transaction: Transaction) => {
    const listing = await Listing.findOne({
        where: {
            listingId: booking.listingId,
        },
        transaction,
    });

    return listing?.cancellationPolicy ?? "strict";
};

const getHoursUntilCheckIn = (booking: BookingDocument) =>
    (toDateAtUtcMidnight(booking.checkInDate).getTime() - Date.now()) / (60 * 60 * 1000);

const calculateRefundAmount = (
    booking: BookingDocument,
    policy: CancellationPolicy,
    actor: CancellationActor,
) => {
    const totalAmount = toNumber(booking.totalAmount);

    if (actor === "host") {
        return totalAmount;
    }

    const hoursUntilCheckIn = getHoursUntilCheckIn(booking);

    if (policy === "flexible") {
        return hoursUntilCheckIn >= 24 ? totalAmount : 0;
    }

    if (policy === "moderate") {
        if (hoursUntilCheckIn >= 120) return totalAmount;
        if (hoursUntilCheckIn >= 24) return Math.round(totalAmount * 0.5);
        return 0;
    }

    return hoursUntilCheckIn >= 168 ? Math.round(totalAmount * 0.5) : 0;
};

const createRefundForPaidPaymentIfNeeded = async (
    booking: BookingDocument,
    policy: CancellationPolicy,
    actor: CancellationActor,
    requestedByUserId: number,
    reason: string | null,
    transaction: Transaction,
) => {
    const paidPayment = await Payment.findOne({
        where: {
            bookingId: booking.bookingId,
            status: "paid",
        },
        transaction,
        lock: transaction.LOCK.UPDATE,
    });

    if (!paidPayment) {
        return null;
    }

    const refundAmount = calculateRefundAmount(booking, policy, actor);

    if (refundAmount <= 0) {
        return null;
    }

    return Refund.create(
        {
            paymentId: paidPayment.paymentId,
            bookingId: booking.bookingId,
            amount: refundAmount,
            currency: booking.currency,
            reason,
            status: "pending",
            providerRef: null,
            requestedByUserId,
            processedByUserId: null,
            processedAt: null,
        },
        { transaction },
    );
};

const cancelBooking = async (
    user: AuthenticatedUser,
    bookingId: number,
    input: CancelBookingInput,
    actor: CancellationActor,
) => {
    const reason = sanitizeNullableSingleLineText(input.reason);

    const booking = await sequelize.transaction(async (transaction) => {
        const existingBooking = await getBookingOrThrow(bookingId, transaction, true);

        if (actor === "guest") {
            assertGuestOwnsBooking(existingBooking, user);
        } else {
            assertHostOwnsBooking(existingBooking, user);
        }

        if (!cancellableStatuses.includes(existingBooking.status)) {
            throw new ApiError(409, "Booking cannot be cancelled in its current status");
        }

        const oldStatus = existingBooking.status;
        const policy = await getListingCancellationPolicy(existingBooking, transaction);
        const refund = await createRefundForPaidPaymentIfNeeded(
            existingBooking,
            policy,
            actor,
            Number(user.id),
            reason,
            transaction,
        );

        existingBooking.status = "cancelled";
        existingBooking.cancellationReason = reason;
        existingBooking.cancelledByUserId = Number(user.id);
        existingBooking.cancelledAt = new Date();
        existingBooking.version += 1;
        await existingBooking.save({ transaction });
        await releaseBookingDateLocksForBooking({
            bookingId: existingBooking.bookingId,
            transaction,
        });
        await Payment.update(
            {
                status: "cancelled",
                failedAt: new Date(),
            },
            {
                where: {
                    bookingId: existingBooking.bookingId,
                    status: "pending",
                },
                transaction,
            },
        );
        await writeBookingStatusHistory(
            existingBooking,
            oldStatus,
            actor === "host" ? "cancelled_by_host" : "cancelled_by_guest",
            Number(user.id),
            reason,
            {
                cancellationPolicy: policy,
                refundId: refund?.refundId ?? null,
                refundAmount: refund ? toNumber(refund.amount) : 0,
            },
            transaction,
        );
        await writeAuditLog({
            actorId: Number(user.id),
            action: actor === "host" ? "booking.cancel.host" : "booking.cancel.guest",
            targetType: "booking",
            targetId: existingBooking.bookingId,
            metadata: {
                fromStatus: oldStatus,
                reason,
                cancellationPolicy: policy,
            },
            transaction,
        });

        return existingBooking;
    });

    return serializeBooking(booking, true);
};

export const createBooking = async (user: AuthenticatedUser, input: CreateBookingInput) => {
    assertBookingDateRange(input);

    const booking = await sequelize.transaction(async (transaction) => {
        const listing = await getPublicListingForBooking(input.listingId, transaction);

        if (String(listing.hostId) === user.id) {
            throw new ApiError(403, "Hosts cannot book their own listing");
        }

        if (input.guestCount > listing.maxGuests) {
            throw new ApiError(422, "Validation error", [
                {
                    path: "guestCount",
                    msg: "guestCount exceeds listing maxGuests",
                },
            ]);
        }

        const reservedDates = listReservedDates(input.checkInDate, input.checkOutDate);
        const calendarByDate = await getCalendarMapForDates(listing, reservedDates, transaction);
        const checkInMinNights = calendarByDate.get(input.checkInDate)?.minNightsOverride ?? null;
        const nights = getNightCount(input.checkInDate, input.checkOutDate);

        assertNightRules(listing, checkInMinNights, nights);
        assertCalendarAvailability(reservedDates, calendarByDate);
        await assertNoActiveOverlappingBooking(listing.listingId, input.checkInDate, input.checkOutDate, transaction);

        const pricing = await calculatePricing(
            Number(user.id),
            listing,
            reservedDates,
            calendarByDate,
            input,
            transaction,
        );
        const env = getEnv();
        const lockedUntil = new Date(Date.now() + env.paymentHoldMinutes * 60 * 1000);
        const status: BookingStatus = "pending_payment";
        const createdBooking = await Booking.create(
            {
                bookingId: await getNextBookingSequence(transaction),
                listingId: listing.listingId,
                guestUserId: Number(user.id),
                hostUserId: Number(listing.hostId),
                checkInDate: input.checkInDate,
                checkOutDate: input.checkOutDate,
                guestCount: input.guestCount,
                nights: pricing.nights,
                status,
                version: 0,
                lockedUntil,
                currency: listing.currency,
                couponId: pricing.couponId,
                subtotalAmount: pricing.subtotalAmount,
                cleaningFeeAmount: pricing.cleaningFeeAmount,
                serviceFeeAmount: pricing.serviceFeeAmount,
                discountAmount: pricing.discountAmount,
                totalAmount: pricing.totalAmount,
                bookingNote: sanitizeNullableSingleLineText(input.bookingNote),
                cancellationReason: null,
                cancelledByUserId: null,
                cancelledAt: null,
                checkedInAt: null,
                checkedOutAt: null,
                paidAt: null,
            },
            { transaction },
        );

        await createBookingDateLocks({
            bookingId: createdBooking.bookingId,
            listingId: createdBooking.listingId,
            checkInDate: toDateAtUtcMidnight(createdBooking.checkInDate),
            checkOutDate: toDateAtUtcMidnight(createdBooking.checkOutDate),
            transaction,
        });

        if (pricing.couponId) {
            await CouponRedemption.create(
                {
                    couponId: pricing.couponId,
                    userId: Number(user.id),
                    bookingId: createdBooking.bookingId,
                    discountAmount: pricing.discountAmount,
                },
                { transaction },
            );
            await Coupon.increment("usedCount", {
                by: 1,
                where: {
                    couponId: pricing.couponId,
                },
                transaction,
            });
        }

        await writeBookingStatusHistory(
            createdBooking,
            null,
            toApiBookingStatus(createdBooking),
            Number(user.id),
            null,
            {
                pricingSnapshot: pricing,
                instantBookEnabled: listing.instantBookEnabled,
            },
            transaction,
        );
        await writeAuditLog({
            actorId: Number(user.id),
            action: "booking.create",
            targetType: "booking",
            targetId: createdBooking.bookingId,
            metadata: {
                listingId: listing.listingId,
                status: toApiBookingStatus(createdBooking),
                totalAmount: pricing.totalAmount,
            },
            transaction,
        });

        return createdBooking;
    });

    return serializeBooking(booking, true);
};

export const getMyBookings = async (user: AuthenticatedUser, query: ListBookingsQuery) => {
    const { page, limit } = parsePagination(query);
    const statusWhere = buildStatusWhere(query.status);
    const where = {
        guestUserId: Number(user.id),
        ...(statusWhere ?? {}),
    };
    const [items, totalItems] = await Promise.all([
        Booking.findAll({
            where,
            order: [["createdAt", "DESC"], ["bookingId", "DESC"]],
            offset: (page - 1) * limit,
            limit,
        }),
        Booking.count({ where }),
    ]);

    return {
        items: await Promise.all(items.map((booking) => serializeBooking(booking))),
        page,
        limit,
        totalItems,
        totalPages: Math.max(1, Math.ceil(totalItems / limit)),
    };
};

export const getGuestBookingDetail = async (user: AuthenticatedUser, bookingId: number) => {
    const booking = await getBookingOrThrow(bookingId);
    assertGuestOwnsBooking(booking, user);
    return serializeBooking(booking, true);
};

export const cancelGuestBooking = async (
    user: AuthenticatedUser,
    bookingId: number,
    input: CancelBookingInput,
) => cancelBooking(user, bookingId, input, "guest");

export const getHostBookings = async (user: AuthenticatedUser, query: ListBookingsQuery) => {
    const { page, limit } = parsePagination(query);
    const statusWhere = buildStatusWhere(query.status);
    const where = {
        ...(user.roles.includes("admin") ? {} : { hostUserId: Number(user.id) }),
        ...(statusWhere ?? {}),
    };
    const [items, totalItems] = await Promise.all([
        Booking.findAll({
            where,
            order: [["checkInDate", "ASC"], ["bookingId", "DESC"]],
            offset: (page - 1) * limit,
            limit,
        }),
        Booking.count({ where }),
    ]);

    return {
        items: await Promise.all(items.map((booking) => serializeBooking(booking))),
        page,
        limit,
        totalItems,
        totalPages: Math.max(1, Math.ceil(totalItems / limit)),
    };
};

export const getHostBookingDetail = async (user: AuthenticatedUser, bookingId: number) => {
    const booking = await getBookingOrThrow(bookingId);
    assertHostOwnsBooking(booking, user);
    return serializeBooking(booking, true);
};

export const confirmHostBooking = async (user: AuthenticatedUser, bookingId: number) => {
    const booking = await sequelize.transaction(async (transaction) => {
        const existingBooking = await getBookingOrThrow(bookingId, transaction, true);
        assertHostOwnsBooking(existingBooking, user);

        if (!hostConfirmableStatuses.includes(existingBooking.status)) {
            throw new ApiError(409, "Booking cannot be confirmed in its current status");
        }

        const oldStatus = existingBooking.status;
        existingBooking.status = "confirmed";
        existingBooking.version += 1;
        await existingBooking.save({ transaction });
        await writeBookingStatusHistory(
            existingBooking,
            oldStatus,
            "confirmed",
            Number(user.id),
            null,
            null,
            transaction,
        );
        await writeAuditLog({
            actorId: Number(user.id),
            action: "booking.confirm",
            targetType: "booking",
            targetId: existingBooking.bookingId,
            metadata: {
                fromStatus: oldStatus,
            },
            transaction,
        });

        return existingBooking;
    });

    return serializeBooking(booking, true);
};

export const checkInHostBooking = async (user: AuthenticatedUser, bookingId: number) => {
    const booking = await sequelize.transaction(async (transaction) => {
        const existingBooking = await getBookingOrThrow(bookingId, transaction, true);
        assertHostOwnsBooking(existingBooking, user);

        if (!checkInStatuses.includes(existingBooking.status)) {
            throw new ApiError(409, "Booking cannot be checked in in its current status");
        }

        if (getTodayInVietnam() !== existingBooking.checkInDate) {
            throw new ApiError(400, "Booking can only be checked in on the check-in date");
        }

        const oldStatus = existingBooking.status;
        existingBooking.status = "checked_in";
        existingBooking.checkedInAt = new Date();
        existingBooking.version += 1;
        await existingBooking.save({ transaction });
        await writeBookingStatusHistory(
            existingBooking,
            oldStatus,
            "checked_in",
            Number(user.id),
            null,
            null,
            transaction,
        );
        await writeAuditLog({
            actorId: Number(user.id),
            action: "booking.check_in",
            targetType: "booking",
            targetId: existingBooking.bookingId,
            metadata: {
                fromStatus: oldStatus,
            },
            transaction,
        });

        return existingBooking;
    });

    return serializeBooking(booking, true);
};

export const checkOutHostBooking = async (user: AuthenticatedUser, bookingId: number) => {
    const booking = await sequelize.transaction(async (transaction) => {
        const existingBooking = await getBookingOrThrow(bookingId, transaction, true);
        assertHostOwnsBooking(existingBooking, user);

        if (existingBooking.status !== "checked_in") {
            throw new ApiError(409, "Booking cannot be checked out in its current status");
        }

        if (getTodayInVietnam() < existingBooking.checkOutDate) {
            throw new ApiError(400, "Booking can only be checked out on or after the check-out date");
        }

        const oldStatus = existingBooking.status;
        existingBooking.status = "completed";
        existingBooking.checkedOutAt = new Date();
        existingBooking.version += 1;
        await existingBooking.save({ transaction });
        await writeBookingStatusHistory(
            existingBooking,
            oldStatus,
            "completed",
            Number(user.id),
            null,
            null,
            transaction,
        );
        await writeAuditLog({
            actorId: Number(user.id),
            action: "booking.check_out",
            targetType: "booking",
            targetId: existingBooking.bookingId,
            metadata: {
                fromStatus: oldStatus,
            },
            transaction,
        });

        return existingBooking;
    });

    return serializeBooking(booking, true);
};

export const cancelHostBooking = async (
    user: AuthenticatedUser,
    bookingId: number,
    input: CancelBookingInput,
) => cancelBooking(user, bookingId, input, "host");
