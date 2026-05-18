import type { Response } from "express";

export type ApiSuccessPayload<T> = {
    success: true;
    message?: string;
    data?: T;
};

export type ApiErrorPayload = {
    success: false;
    message?: string;
    code: string;
    details?: unknown;
    errors?: unknown;
};

type SuccessOptions<T> = {
    statusCode?: number;
    message?: string;
    data?: T;
};

export function sendSuccess<T>(res: Response, options?: SuccessOptions<T>): Response;
export function sendSuccess<T>(res: Response, statusCode?: number, message?: string, data?: T): Response;
export function sendSuccess<T>(
    res: Response,
    optionsOrStatusCode: SuccessOptions<T> | number = {},
    message?: string,
    data?: T,
) {
    const options =
        typeof optionsOrStatusCode === "number"
            ? {
                  statusCode: optionsOrStatusCode,
                  message,
                  data,
              }
            : optionsOrStatusCode;

    const payload: ApiSuccessPayload<T> = {
        success: true,
    };

    if (options.message) {
        payload.message = options.message;
    }

    if (options.data !== undefined) {
        payload.data = options.data;
    }

    return res.status(options.statusCode ?? 200).json(payload);
}

export const sendError = (
    res: Response,
    statusCode: number,
    message?: string,
    errors?: unknown,
) => {
    const codeByStatus: Record<number, string> = {
        400: "BAD_REQUEST",
        401: "UNAUTHORIZED",
        403: "FORBIDDEN",
        404: "NOT_FOUND",
        405: "METHOD_NOT_ALLOWED",
        409: "CONFLICT",
        410: "GONE",
        413: "PAYLOAD_TOO_LARGE",
        415: "UNSUPPORTED_MEDIA_TYPE",
        422: "VALIDATION_ERROR",
        423: "LOCKED",
        429: "RATE_LIMITED",
        503: "SERVICE_UNAVAILABLE",
    };
    const code = codeByStatus[statusCode] ?? "INTERNAL_ERROR";
    const payload: ApiErrorPayload = {
        success: false,
        code,
    };

    if (message) {
        payload.message = message;
    }

    if (errors !== undefined) {
        payload.details = errors;
        payload.errors = errors;
    }

    return res.status(statusCode).json(payload);
};
