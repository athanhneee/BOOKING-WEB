import express from "express";

import {
    cancelGuestBookingById,
    cancelHostBookingById,
    checkInHostBookingById,
    checkOutHostBookingById,
    confirmHostBookingById,
    createGuestBooking,
    getGuestBookingById,
    getHostBookingById,
    getHostBookingList,
    getMyGuestBookings,
} from "./bookings.controller";
import { authenticate } from "../../middlewares/authenticate.middleware";
import { requireRole } from "../../middlewares/require-role.middleware";
import { getBookingCreateRateLimiter } from "../../middlewares/rate-limit.middleware";
import { validate } from "../../middlewares/validate";
import {
    bookingIdParamSchema,
    bookingsQuerySchema,
    cancelBookingBodySchema,
    createBookingBodySchema,
} from "./bookings.validator";

const router = express.Router();
export const hostBookingsRoutes = express.Router();

router.use(authenticate, requireRole("guest", "host", "admin"));

router.post("/", getBookingCreateRateLimiter(), validate({ body: createBookingBodySchema }), createGuestBooking);
router.get("/mine", validate({ query: bookingsQuerySchema }), getMyGuestBookings);
router.get("/:bookingId", validate({ params: bookingIdParamSchema }), getGuestBookingById);
router.post(
    "/:bookingId/cancel",
    validate({ params: bookingIdParamSchema, body: cancelBookingBodySchema }),
    cancelGuestBookingById,
);

hostBookingsRoutes.use(authenticate, requireRole("host", "admin"));

hostBookingsRoutes.get("/", validate({ query: bookingsQuerySchema }), getHostBookingList);
hostBookingsRoutes.get("/:bookingId", validate({ params: bookingIdParamSchema }), getHostBookingById);
hostBookingsRoutes.patch("/:bookingId/confirm", validate({ params: bookingIdParamSchema }), confirmHostBookingById);
hostBookingsRoutes.patch("/:bookingId/check-in", validate({ params: bookingIdParamSchema }), checkInHostBookingById);
hostBookingsRoutes.patch("/:bookingId/check-out", validate({ params: bookingIdParamSchema }), checkOutHostBookingById);
hostBookingsRoutes.patch(
    "/:bookingId/cancel",
    validate({ params: bookingIdParamSchema, body: cancelBookingBodySchema }),
    cancelHostBookingById,
);

export default router;
