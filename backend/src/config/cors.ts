import type { CorsOptions } from "cors";

import { ApiError } from "../common/api-error";
import { getEnv } from "./env";

export const getCorsOptions = (): CorsOptions => {
    const env = getEnv();
    const allowedOrigins = env.corsOrigins;

    if (allowedOrigins.includes("*")) {
        throw new Error("Wildcard CORS origin is not allowed when credentials are enabled");
    }

    if (env.nodeEnv === "production") {
        if (allowedOrigins.length === 0) {
            throw new Error("CORS_ORIGIN, CORS_ORIGINS, or CLIENT_ORIGIN is required in production");
        }
    }

    return {
        credentials: true,
        origin(origin, callback) {
            if (!origin) {
                return callback(null, true);
            }

            if (env.nodeEnv !== "production" && allowedOrigins.length === 0) {
                return callback(null, true);
            }

            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            }

            return callback(new ApiError(403, "CORS origin is not allowed"));
        },
    };
};
