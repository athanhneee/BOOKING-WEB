const assert = require("node:assert/strict");
const { createHmac } = require("node:crypto");
const { afterEach, describe, it } = require("node:test");
import type { PatchEntry, Rejectable, TransactionCallback } from "./helpers/types";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET_KEY = "test-secret";
process.env.VNPAY_TMN_CODE = "TESTTMN";
process.env.VNPAY_HASH_SECRET = "test-vnpay-secret";
process.env.VNPAY_RETURN_URL = "https://example.test/api/payments/vnpay/return";
process.env.VNPAY_PAYMENT_URL = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";

const { ApiError } = require("../dist/common/api-error");
const sequelize = require("../dist/config/database").default;
const AuditLog = require("../dist/models/audit-log").default;
const Booking = require("../dist/models/booking").default;
const Coupon = require("../dist/models/coupon").default;
const CouponRedemption = require("../dist/models/coupon-redemption").default;
const HostPayoutBatch = require("../dist/models/host-payout-batch").default;
const HostPayoutBookingItem = require("../dist/models/host-payout-booking-item").default;
const Payment = require("../dist/models/payment").default;
const PaymentTransaction = require("../dist/models/payment-transaction").default;
const PayoutAccount = require("../dist/models/payout-account").default;
const userAccessService = require("../dist/services/user-access-service");
const paymentsService = require("../dist/modules/payments/payments.service");
const vnpayService = require("../dist/modules/payments/vnpay.service");
const couponsService = require("../dist/modules/coupons/coupons.service");
const payoutsService = require("../dist/modules/payouts/payouts.service");
const reportsService = require("../dist/modules/reports/reports.service");

type QueryOptions = {
    type?: unknown;
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

const otherGuestUser = {
    ...guestUser,
    id: "999",
};

const adminUser = {
    ...guestUser,
    id: "1",
    roles: ["admin"],
};

const buildBooking = (overrides: Record<string, unknown> = {}) => ({
    bookingId: 9001,
    listingId: 801,
    guestUserId: 201,
    hostUserId: 101,
    status: "pending_payment",
    totalAmount: 2300000,
    discountAmount: 100000,
    couponId: 7,
    currency: "VND",
    paidAt: null,
    async save() {
        return this;
    },
    ...overrides,
});

const buildPayment = (overrides: Record<string, unknown> = {}) => ({
    paymentId: 8901,
    bookingId: 9001,
    userId: 201,
    amount: 2300000,
    currency: "VND",
    method: "vnpay",
    status: "pending",
    provider: "vnpay",
    providerTxnRef: "8901",
    providerTransactionNo: null,
    providerResponseCode: null,
    providerPayload: null,
    paidAt: null,
    failedAt: null,
    createdAt: new Date("2026-05-10T00:00:00.000Z"),
    updatedAt: new Date("2026-05-10T00:00:00.000Z"),
    async save() {
        return this;
    },
    ...overrides,
});

const encodeVnpayComponent = (value: string): string => encodeURIComponent(value).replace(/%20/g, "+");

const signVnpayPayload = (payload: Record<string, string | undefined>): string => {
    const unsigned = Object.fromEntries(
        Object.entries(payload).filter(([key, value]) => key !== "vnp_SecureHash" && key !== "vnp_SecureHashType" && value !== undefined && value !== ""),
    );
    const hashData = Object.keys(unsigned)
        .sort()
        .map((key) => `${encodeVnpayComponent(key)}=${encodeVnpayComponent(String(unsigned[key]))}`)
        .join("&");

    return createHmac("sha512", process.env.VNPAY_HASH_SECRET).update(Buffer.from(hashData, "utf-8")).digest("hex");
};

const buildVnpayCallback = (overrides: Record<string, string> = {}) => {
    const payload = {
        vnp_TmnCode: "TESTTMN",
        vnp_Amount: "230000000",
        vnp_BankCode: "NCB",
        vnp_OrderInfo: "Thanh toan booking 9001",
        vnp_PayDate: "20260510121500",
        vnp_ResponseCode: "00",
        vnp_TransactionNo: "14123456",
        vnp_TransactionStatus: "00",
        vnp_TxnRef: "8901",
        ...overrides,
    };

    return {
        ...payload,
        vnp_SecureHash: signVnpayPayload(payload),
    };
};

const assertRejectsApiError = async (fn: Rejectable, statusCode: number): Promise<void> => {
    await assert.rejects(fn, (error: unknown) => {
        assert.equal(error instanceof ApiError, true);
        assert.equal((error as { statusCode: number }).statusCode, statusCode);
        return true;
    });
};

describe("Payments, coupons, payouts, and revenue reports", () => {
    it("accepts valid VNPay checksum and rejects tampered payloads", () => {
        const payload = buildVnpayCallback();

        assert.equal(vnpayService.verifyVnpayPayload(payload), true);
        assert.equal(vnpayService.verifyVnpayPayload({ ...payload, vnp_Amount: "1" }), false);
        assert.equal(vnpayService.verifyVnpayPayload({ ...payload, vnp_SecureHash: "not-hex" }), false);
    });

    it("returns VNPay webhook error codes for invalid signature and amount mismatch", async () => {
        const payment = buildPayment();
        patch(AuditLog, "create", async () => ({}));
        patch(Payment, "findOne", async () => payment);

        const invalidSignature = await paymentsService.processVnpayWebhook({
            ...buildVnpayCallback(),
            vnp_SecureHash: "not-hex",
        });

        assert.deepEqual(invalidSignature, { RspCode: "97", Message: "Invalid signature" });

        const wrongAmount = await paymentsService.processVnpayWebhook(buildVnpayCallback({ vnp_Amount: "1" }));

        assert.deepEqual(wrongAmount, { RspCode: "04", Message: "Invalid amount" });
        assert.equal(payment.status, "pending");
    });

    it("processes duplicate VNPay webhook callbacks idempotently", async () => {
        const payment = buildPayment();
        const booking = buildBooking();
        let redemptionCreated = 0;
        let redemptionExists = false;
        let paymentSaves = 0;
        let bookingSaves = 0;
        const paymentTransaction = {
            providerTransactionNo: null,
            status: "pending",
            rawPayloadJson: null,
            processedAt: null,
            async save() {
                return this;
            },
        };

        patch(sequelize, "transaction", async (callback: TransactionCallback) =>
            callback({
                LOCK: {
                    UPDATE: "UPDATE",
                },
            }),
        );
        patch(Payment, "findOne", async () => payment);
        patch(Booking, "findOne", async () => booking);
        patch(payment, "save", async () => {
            paymentSaves += 1;
            return payment;
        });
        patch(booking, "save", async () => {
            bookingSaves += 1;
            return booking;
        });
        patch(PaymentTransaction, "findOne", async () => paymentTransaction);
        patch(CouponRedemption, "findOne", async () => (redemptionExists ? { id: 1 } : null));
        patch(CouponRedemption, "create", async () => {
            redemptionCreated += 1;
            redemptionExists = true;
            return { id: 1 };
        });
        patch(Coupon, "findOne", async () => ({ couponId: 7, deletedAt: null }));
        patch(Coupon, "increment", async () => {});
        patch(AuditLog, "create", async () => ({}));

        const payload = buildVnpayCallback();
        const first = await paymentsService.processVnpayWebhook(payload);
        const second = await paymentsService.processVnpayWebhook(payload);

        assert.deepEqual(first, { RspCode: "00", Message: "Confirm Success" });
        assert.deepEqual(second, { RspCode: "00", Message: "Confirm Success" });
        assert.equal(payment.status, "paid");
        assert.equal(booking.status, "paid");
        assert.equal(redemptionCreated, 1);
        assert.equal(paymentSaves, 2);
        assert.equal(bookingSaves, 2);
    });

    it("rejects payment creation by a user that does not own the booking", async () => {
        patch(sequelize, "transaction", async (callback: TransactionCallback) => callback({}));
        patch(Booking, "findOne", async () => buildBooking({ guestUserId: 201, status: "pending_payment" }));

        await assertRejectsApiError(
            () => paymentsService.createPayment(otherGuestUser, { bookingId: 9001, method: "vnpay" }),
            403,
        );
    });

    it("validates coupon amount, cap, and per-user limit", async () => {
        patch(Coupon, "findOne", async () => ({
            couponId: 7,
            code: "SUMMER10",
            title: "Summer 10",
            description: null,
            type: "percent",
            discountValue: 10,
            maxDiscountAmount: 50000,
            minOrderValue: 100000,
            startDate: new Date("2026-01-01T00:00:00.000Z"),
            endDate: new Date("2027-01-01T00:00:00.000Z"),
            totalLimit: 100,
            usedCount: 0,
            limitPerUser: 1,
            isActive: true,
            deletedAt: null,
            createdAt: new Date("2026-01-01T00:00:00.000Z"),
            updatedAt: new Date("2026-01-01T00:00:00.000Z"),
        }));
        patch(CouponRedemption, "count", async () => 0);

        const result = await couponsService.validateCouponForUser(guestUser, {
            code: "summer10",
            bookingAmount: "1000000",
        });

        assert.equal(result.valid, true);
        assert.equal(result.discountAmount, 50000);
        assert.equal(result.finalAmount, 950000);
    });

    it("rejects payout creation for bookings without a paid payment", async () => {
        patch(userAccessService, "assertUserHasRole", async () => {});
        patch(sequelize, "transaction", async (callback: TransactionCallback) =>
            callback({
                LOCK: {
                    UPDATE: "UPDATE",
                },
            }),
        );
        patch(PayoutAccount, "findOne", async () => ({ payoutAccountId: 77, userId: 101, deletedAt: null }));
        patch(sequelize, "query", async (sql: string, options: QueryOptions = {}) => {
            if (String(sql).includes("FROM bookings b")) {
                return [
                    {
                        bookingId: 9001,
                        bookingDetailId: 9001,
                        listingId: 801,
                        hostId: 101,
                        bookingStatus: "completed",
                        paymentStatus: null,
                        listingTitle: "Seaside villa",
                        accommodationAmount: "2300000.00",
                    },
                ];
            }

            return options.type ? [] : [];
        });
        patch(HostPayoutBatch, "create", async () => {
            throw new Error("should not create payout");
        });
        patch(HostPayoutBookingItem, "bulkCreate", async () => []);

        await assertRejectsApiError(
            () =>
                payoutsService.createHostPayout(adminUser, {
                    hostId: 101,
                    bookingIds: [9001],
                    payoutAccountId: 77,
                    amount: 2300000,
                    currency: "VND",
                }),
            409,
        );
    });

    it("rejects admin payout when amount does not match eligible bookings total", async () => {
        patch(userAccessService, "assertUserHasRole", async () => {});
        patch(sequelize, "transaction", async (callback: TransactionCallback) =>
            callback({
                LOCK: {
                    UPDATE: "UPDATE",
                },
            }),
        );
        patch(PayoutAccount, "findOne", async () => ({ payoutAccountId: 77, userId: 101, deletedAt: null }));
        patch(sequelize, "query", async (sql: string, options: QueryOptions = {}) => {
            if (String(sql).includes("FROM bookings b")) {
                return [
                    {
                        bookingId: 9001,
                        bookingDetailId: 9001,
                        listingId: 801,
                        hostId: 101,
                        bookingStatus: "completed",
                        paymentStatus: "paid",
                        listingTitle: "Seaside villa",
                        accommodationAmount: "2300000.00",
                    },
                ];
            }

            if (String(sql).includes("FROM information_schema.tables")) {
                return [{ count: 0 }];
            }

            return options.type ? [] : [];
        });
        patch(HostPayoutBatch, "create", async () => {
            throw new Error("should not create payout");
        });

        await assertRejectsApiError(
            () =>
                payoutsService.createHostPayout(adminUser, {
                    hostId: 101,
                    bookingIds: [9001],
                    payoutAccountId: 77,
                    amount: 1,
                    currency: "VND",
                }),
            422,
        );
    });

    it("rejects duplicate payout for a booking that is already in an active payout batch", async () => {
        patch(userAccessService, "assertUserHasRole", async () => {});
        patch(sequelize, "transaction", async (callback: TransactionCallback) =>
            callback({
                LOCK: {
                    UPDATE: "UPDATE",
                },
            }),
        );
        patch(PayoutAccount, "findOne", async () => ({ payoutAccountId: 77, userId: 101, deletedAt: null }));
        patch(sequelize, "query", async (sql: string, options: QueryOptions = {}) => {
            if (String(sql).includes("FROM bookings b")) {
                return [
                    {
                        bookingId: 9001,
                        bookingDetailId: 9001,
                        listingId: 801,
                        hostId: 101,
                        bookingStatus: "completed",
                        paymentStatus: "paid",
                        listingTitle: "Seaside villa",
                        accommodationAmount: "2300000.00",
                    },
                ];
            }

            if (String(sql).includes("FROM host_payout_booking_item")) {
                return [{ bookingDetailId: 9001 }];
            }

            return options.type ? [] : [];
        });
        patch(HostPayoutBatch, "create", async () => {
            throw new Error("should not create payout");
        });

        await assertRejectsApiError(
            () =>
                payoutsService.createHostPayout(adminUser, {
                    hostId: 101,
                    bookingIds: [9001],
                    payoutAccountId: 77,
                    amount: 2300000,
                    currency: "VND",
                }),
            409,
        );
    });

    it("enforces admin RBAC for revenue reports", async () => {
        await assertRejectsApiError(
            () => reportsService.getAdminRevenueReport(guestUser, { from: "2026-05-01", to: "2026-05-10", group: "day" }),
            403,
        );
    });
});

export {};
