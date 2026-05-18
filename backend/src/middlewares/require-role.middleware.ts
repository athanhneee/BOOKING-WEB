import { RequestHandler } from "express";

import { ApiError } from "../common/api-error";
import { UserRole } from "../models/user";

export const requireRole = (...roles: UserRole[]): RequestHandler => {
    return (req, _res, next) => {
        if (!req.user) {
            return next(new ApiError(401, "Unauthorized"));
        }

        const hasAllowedRole = roles.some((role) => req.user?.roles.includes(role));

        if (!hasAllowedRole) {
            return next(new ApiError(403, "Forbidden"));
        }

        return next();
    };
};
