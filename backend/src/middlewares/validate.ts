import type { RequestHandler } from "express";
import type { ZodType } from "zod";

import { AppError, AppErrorDetail } from "../common/api-error";

type RequestSchemas = {
    body?: ZodType;
    query?: ZodType;
    params?: ZodType;
};

const toValidationErrors = (issues: Array<{ path: PropertyKey[]; message: string }>): AppErrorDetail[] =>
    issues.map((issue) => ({
        path: issue.path.join(".") || undefined,
        msg: issue.message,
    }));

export const validate = (schemas: RequestSchemas): RequestHandler => {
    return (req, _res, next) => {
        const validatedData = {
            ...(req.validatedData ?? {}),
        };

        for (const [location, schema] of Object.entries(schemas) as Array<
            [keyof RequestSchemas, ZodType | undefined]
        >) {
            if (!schema) {
                continue;
            }

            const parsed = schema.safeParse(req[location]);

            if (!parsed.success) {
                return next(new AppError(422, "Validation error", toValidationErrors(parsed.error.issues)));
            }

            validatedData[location] = parsed.data;
        }

        req.validatedData = validatedData;
        return next();
    };
};
