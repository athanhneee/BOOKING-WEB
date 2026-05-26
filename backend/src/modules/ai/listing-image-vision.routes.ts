import express from "express";
import { param, query } from "express-validator";

import { authenticate } from "../../middlewares/authenticate.middleware";
import { requireRole } from "../../middlewares/require-role.middleware";
import { analyzeAllListingImages, analyzeSingleListingImage } from "./listing-image-vision.controller";

const router = express.Router();

const listingIdParamValidator = param("listingId")
    .isInt({ min: 1 })
    .withMessage("listingId must be a positive integer")
    .toInt();

const imageIdParamValidator = param("imageId")
    .isInt({ min: 1 })
    .withMessage("imageId must be a positive integer")
    .toInt();

router.use(authenticate, requireRole("host", "admin"));

router.post(
    "/:listingId/images/:imageId/analyze",
    [listingIdParamValidator, imageIdParamValidator],
    analyzeSingleListingImage,
);

router.post(
    "/:listingId/analyze-images",
    [
        listingIdParamValidator,
        query("force")
            .optional()
            .isBoolean()
            .withMessage("force must be boolean")
            .toBoolean(),
    ],
    analyzeAllListingImages,
);

export default router;
