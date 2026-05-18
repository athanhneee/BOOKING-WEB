const assert = require("node:assert/strict");
const { afterEach, describe, it } = require("node:test");

const { UniqueConstraintError } = require("sequelize");
import type { PatchEntry, Rejectable, TransactionCallback } from "./helpers/types";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET_KEY = "test-secret";

const { ApiError } = require("../dist/common/api-error");
const sequelize = require("../dist/config/database").default;
const AvailabilityCalendar = require("../dist/models/availability-calendar").default;
const AuditLog = require("../dist/models/audit-log").default;
const Booking = require("../dist/models/booking").default;
const BookingDateLock = require("../dist/models/booking-date-lock").default;
const BookingStatusHistory = require("../dist/models/booking-status-history").default;
const Coupon = require("../dist/models/coupon").default;
const CouponRedemption = require("../dist/models/coupon-redemption").default;
const Listing = require("../dist/models/listing").default;
const ListingImage = require("../dist/models/listing-image").default;
const Payment = require("../dist/models/payment").default;
const Refund = require("../dist/models/refund").default;
const bookingsService = require("../dist/modules/bookings/bookings.service");

type QueryOptions = {
    type?: unknown;
    where?: {
        listingId?: number;
    };
};

const originals: PatchEntry[] = [];

const patch = (target: Record<string, unknown>, key: string, value: unknown): void => {
    originals.push([target, key, target[key]]);
    target[key] = value;
};

afterEach(() => {
    while (originals.length > 0) {
        const [target, key, value] = originals.pop()!;
        target[key] = value;
    }
});

const guestUser = {
    id: "201",
    email: "guest@example.com",
    phone: "0900000201",
    name: "Guest User",
    username: "guest",
    status: "active",
    roles: ["guest"],
};

const hostUser = {
    id: "101",
    email: "host@example.com",
    phone: "0900000101",
    name: "Host User",
    username: "host",
    status: "active",
    roles: ["host"],
};

const otherHostUser = {
    ...hostUser,
    id: "999",
};

const buildListing = (overrides: Record<string, unknown> = {}) => ({
    listingId: 801,
    hostId: 101,
    status: "active",
    deletedAt: null,
    title: "Seaside villa",
    city: "Vung Tau",
    district: "Ward 1",
    addressLine: "123 Tran Phu",
    maxGuests: 4,
    basePrice: 1000000,
    weekendPrice: null,
    cleaningFee: 100000,
    serviceFeePct: 10,
    currency: "VND",
    minNights: 1,
    maxNights: 10,
    instantBookEnabled: true,
    cancellationPolicy: "moderate",
    images: [],
    availabilityCalendar: [],
    ...overrides,
});

const buildBooking = (overrides: Record<string, unknown> = {}) => ({
    bookingId: 9001,
    listingId: 801,
    guestUserId: 201,
    hostUserId: 101,
    checkInDate: "2026-06-20",
    checkOutDate: "2026-06-22",
    guestCount: 2,
    nights: 2,
    status: "confirmed",
    version: 0,
    lockedUntil: null,
    currency: "VND",
    couponId: null,
    subtotalAmount: 2000000,
    cleaningFeeAmount: 100000,
    serviceFeeAmount: 200000,
    discountAmount: 0,
    totalAmount: 2300000,
    bookingNote: null,
    cancellationReason: null,
    cancelledByUserId: null,
    cancelledAt: null,
    checkedInAt: null,
    checkedOutAt: null,
    paidAt: null,
    createdAt: new Date("2026-05-10T00:00:00.000Z"),
    updatedAt: new Date("2026-05-10T00:00:00.000Z"),
    async save() {
        return this;
    },
    ...overrides,
});

const patchTransaction = () => {
    patch(sequelize, "transaction", async (callback: TransactionCallback) =>
        callback({
            LOCK: {
                UPDATE: "UPDATE",
            },
        }),
    );
    patch(sequelize, "query", async (_sql: string, options: QueryOptions = {}) => {
        if (options.type) {
            return [{ value: 9001 }];
        }

        return [];
    });
};

const patchSerialization = (listing = buildListing()) => {
    patch(Payment, "findOne", async () => null);
    patch(ListingImage, "findAll", async () => []);
    patch(AuditLog, "create", async () => ({}));
    patch(BookingStatusHistory, "create", async () => ({}));
    patch(Listing, "findOne", async (options: QueryOptions = {}) => {
        if (options.where?.listingId === listing.listingId) {
            return listing;
        }

        return null;
    });
};

const patchCreateBookingHappyPath = (listing = buildListing()) => {
    patchTransaction();
    patchSerialization(listing);
    patch(AvailabilityCalendar, "findAll", async () => []);
    patch(Booking, "findOne", async () => null);
    patch(Booking, "create", async (payload: Record<string, unknown>) => buildBooking(payload));
    patch(BookingDateLock, "bulkCreate", async () => []);
    patch(Coupon, "findOne", async () => null);
    patch(Coupon, "increment", async () => {});
    patch(CouponRedemption, "create", async () => ({}));
};

const assertRejectsApiError = async (fn: Rejectable, statusCode: number): Promise<void> => {
    await assert.rejects(fn, (error: unknown) => {
        assert.equal(error instanceof ApiError, true);
        assert.equal((error as { statusCode: number }).statusCode, statusCode);
        return true;
    });
};

describe("Bookings service transaction-safe business rules", () => {
    it("creates a booking from trusted listing pricing, not client totals", async () => {
        patchCreateBookingHappyPath();

        const result = await bookingsService.createBooking(guestUser, {
            listingId: 801,
            checkInDate: "2026-06-20",
            checkOutDate: "2026-06-22",
            guestCount: 2,
        });

        assert.equal(result.bookingId, 9001);
        assert.equal(result.status, "confirmed");
        assert.equal(result.subtotalAmount, 2000000);
        assert.equal(result.cleaningFeeAmount, 100000);
        assert.equal(result.serviceFeeAmount, 200000);
        assert.equal(result.totalPrice, 2300000);
    });

    it("returns 409 when date lock insertion detects a double booking", async () => {
        patchCreateBookingHappyPath();
        patch(BookingDateLock, "bulkCreate", async () => {
            throw new UniqueConstraintError({ errors: [] });
        });

        await assertRejectsApiError(
            () =>
                bookingsService.createBooking(guestUser, {
                    listingId: 801,
                    checkInDate: "2026-06-20",
                    checkOutDate: "2026-06-22",
                    guestCount: 2,
                }),
            409,
        );
    });

    it("returns 422 when guestCount exceeds listing maxGuests", async () => {
        patchCreateBookingHappyPath(buildListing({ maxGuests: 2 }));

        await assertRejectsApiError(
            () =>
                bookingsService.createBooking(guestUser, {
                    listingId: 801,
                    checkInDate: "2026-06-20",
                    checkOutDate: "2026-06-22",
                    guestCount: 3,
                }),
            422,
        );
    });

    it("returns 422 when checkout is before checkin", async () => {
        await assertRejectsApiError(
            () =>
                bookingsService.createBooking(guestUser, {
                    listingId: 801,
                    checkInDate: "2026-06-22",
                    checkOutDate: "2026-06-20",
                    guestCount: 2,
                }),
            422,
        );
    });

    it("returns 403 when a guest tries to view or cancel another guest booking", async () => {
        patchTransaction();
        patch(Booking, "findOne", async () => buildBooking({ guestUserId: 999 }));

        await assertRejectsApiError(() => bookingsService.getGuestBookingDetail(guestUser, 9001), 403);
        await assertRejectsApiError(() => bookingsService.cancelGuestBooking(guestUser, 9001, {}), 403);
    });

    it("returns 403 when a host confirms a booking outside their listings", async () => {
        patchTransaction();
        patch(Booking, "findOne", async () => buildBooking({ hostUserId: 101, status: "pending" }));

        await assertRejectsApiError(() => bookingsService.confirmHostBooking(otherHostUser, 9001), 403);
    });

    it("returns 409 when cancelling an invalid status", async () => {
        patchTransaction();
        patch(Booking, "findOne", async () => buildBooking({ status: "completed" }));

        await assertRejectsApiError(() => bookingsService.cancelGuestBooking(guestUser, 9001, {}), 409);
    });

    it("returns 409 when check-in is requested for the wrong status", async () => {
        patchTransaction();
        patch(Booking, "findOne", async () => buildBooking({ status: "pending" }));

        await assertRejectsApiError(() => bookingsService.checkInHostBooking(hostUser, 9001), 409);
    });

    it("returns 409 when check-out is requested before check-in", async () => {
        patchTransaction();
        patch(Booking, "findOne", async () => buildBooking({ status: "confirmed" }));

        await assertRejectsApiError(() => bookingsService.checkOutHostBooking(hostUser, 9001), 409);
    });
});

export {};
