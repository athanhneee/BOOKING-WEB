import express from "express";

import adminAmenitiesRoutes from "../amenities/admin-amenities.routes";
import adminHostPayoutsRoutes from "../payouts/admin-host-payouts.routes";
import adminListingsRoutes from "./admin-listings.routes";
import adminVerificationsRoutes from "../verifications/admin-verifications.routes";
import { adminCouponsRoutes } from "../coupons/coupons.routes";
import { adminReportsRouter } from "../reports/reports.routes";

const router = express.Router();

router.use("/amenities", adminAmenitiesRoutes);
router.use("/verifications", adminVerificationsRoutes);
router.use("/listings", adminListingsRoutes);
router.use("/host-payouts", adminHostPayoutsRoutes);
router.use("/coupons", adminCouponsRoutes);
router.use("/reports", adminReportsRouter);

export default router;
