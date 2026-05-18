import { ErrorRequestHandler, RequestHandler } from "express";
import { DatabaseError, UniqueConstraintError, ValidationError } from "sequelize";

import { ApiError } from "../common/api-error";

export const notFoundHandler: RequestHandler = (req, _res, next) => {
    next(new ApiError(404, `Route ${req.method} ${req.originalUrl} not found`));
};

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
    if (error instanceof ApiError) {
        return res.status(error.statusCode).json({
            success: false,
            message: error.message,
            ...(error.errors ? { errors: error.errors } : {}),
        });
    }

    if (error instanceof UniqueConstraintError) {
        return res.status(409).json({
            success: false,
            message: "Conflict",
        });
    }

    if (error instanceof ValidationError) {
        const details = error.errors.map((item) => ({
            path: item.path ?? undefined,
            msg: item.message,
        }));

        return res.status(422).json({
            success: false,
            message: "Validation error",
            errors: details,
        });
    }

    if (error instanceof DatabaseError) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Database error",
        });
    }

    console.error(error);

    return res.status(500).json({
        success: false,
        message: "Internal server error",
    });
};
