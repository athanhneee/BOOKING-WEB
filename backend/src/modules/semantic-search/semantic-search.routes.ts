import express from "express";
import { body } from "express-validator";

import { isValidIsoDate } from "../../common/validation";
import { semanticSearchListings } from "./semantic-search.controller";

const router = express.Router();

router.post(
    "/semantic",
    [
        body("query")
            .isString()
            .trim()
            .notEmpty()
            .withMessage("query is required")
            .isLength({ max: 300 })
            .withMessage("query must be at most 300 characters"),

        body("checkIn")
            .optional()
            .custom((value) => isValidIsoDate(String(value)))
            .withMessage("checkIn must use YYYY-MM-DD format"),

        body("checkOut")
            .optional()
            .custom((value) => isValidIsoDate(String(value)))
            .withMessage("checkOut must use YYYY-MM-DD format")
            .custom((value, { req }) => !req.body?.checkIn || String(req.body.checkIn) < String(value))
            .withMessage("checkOut must be after checkIn"),

        body("guests")
            .optional()
            .isInt({ min: 1 })
            .withMessage("guests must be at least 1")
            .toInt(),

        body("city")
            .optional()
            .isString()
            .trim()
            .notEmpty()
            .isLength({ max: 255 }),

        body("district")
            .optional()
            .isString()
            .trim()
            .notEmpty()
            .isLength({ max: 255 }),

        body("minPrice")
            .optional()
            .isFloat({ min: 0 })
            .withMessage("minPrice must be 0 or more")
            .toFloat(),

        body("maxPrice")
            .optional()
            .isFloat({ min: 0 })
            .withMessage("maxPrice must be 0 or more")
            .custom((value, { req }) => req.body?.minPrice === undefined || Number(value) >= Number(req.body.minPrice))
            .withMessage("maxPrice must be greater than or equal to minPrice")
            .toFloat(),

        body("amenities")
            .optional()
            .isArray()
            .withMessage("amenities must be an array"),

        body("amenities.*")
            .optional()
            .custom((value) => ["string", "number"].includes(typeof value))
            .withMessage("amenities values must be strings or numbers"),

        body("propertyType")
            .optional()
            .isIn(["apartment", "villa", "hotel", "homestay"])
            .withMessage("propertyType is invalid"),

        body("roomType")
            .optional()
            .isIn(["entire_place", "private_room", "shared_room"])
            .withMessage("roomType is invalid"),

        body("page")
            .optional()
            .isInt({ min: 1 })
            .withMessage("page must be at least 1")
            .toInt(),

        body("limit")
            .optional()
            .isInt({ min: 1, max: 50 })
            .withMessage("limit must be between 1 and 50")
            .toInt(),
    ],
    semanticSearchListings,
);

export default router;