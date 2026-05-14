export type AppEnv = {
    port: number;
    nodeEnv: string;
    trustProxy: boolean | number | string;
    dbHost: string;
    dbPort: number;
    dbName: string;
    dbUser: string;
    dbPassword: string;
    dbSsl: boolean;
    dbSslCa?: string;
    jwtSecret: string;
    jwtAccessSecret: string;
    jwtRefreshSecret: string;
    tokenHashSecret: string;
    otpHashSecret: string;
    cookieSecret?: string;
    googleClientId?: string;
    vnpayTmnCode?: string;
    vnpayHashSecret?: string;
    vnpayPaymentUrl: string;
    vnpayReturnUrl?: string;
    vnpayLocale: string;
    accessTokenTtlMinutes: number;
    refreshTokenTtlDays: number;
    refreshTokenTtlMs: number;
    refreshCookieName: string;
    refreshCookiePath: string;
    refreshCookieSameSite: "lax" | "strict" | "none";
    refreshCookieSecure: boolean;
    allowRefreshTokenInBody: boolean;
    allowRefreshTokenInHeader: boolean;
    authDebugOtp: boolean;
    otpTtlMinutes: number;
    otpRateLimitWindowMinutes: number;
    otpRateLimitMax: number;
    otpResendCooldownSeconds: number;
    otpMaxAttempts: number;
    clientOrigin?: string;
    corsOrigins: string[];
    requestBodyLimit: string;
    globalRateLimitWindowMinutes: number;
    globalRateLimitMax: number;
    authRateLimitWindowMinutes: number;
    authRateLimitMax: number;
    otpRateLimitWindowMinutesOverride: number;
    otpRateLimitMaxOverride: number;
    forgotPasswordRateLimitWindowMinutes: number;
    forgotPasswordRateLimitMax: number;
    paymentCallbackRateLimitWindowMinutes: number;
    paymentCallbackRateLimitMax: number;
    mailHost?: string;
    mailPort: number;
    mailUser?: string;
    mailPassword?: string;
    mailFrom?: string;
    allowProductionAutoSchemaSync: boolean;
};

const parseNumber = (name: string, value: string | undefined, fallback: number) => {
    if (value === undefined || value === "") {
        return fallback;
    }

    const parsed = Number(value);

    if (!Number.isFinite(parsed)) {
        throw new Error(`Environment variable ${name} must be a valid number`);
    }

    return parsed;
};

const parsePositiveInteger = (name: string, value: string | undefined, fallback: number) => {
    const parsed = parseNumber(name, value, fallback);

    if (!Number.isInteger(parsed) || parsed < 0) {
        throw new Error(`Environment variable ${name} must be a non-negative integer`);
    }

    return parsed;
};

const parseTrustProxy = (value: string | undefined): AppEnv["trustProxy"] => {
    if (value === undefined || value === "" || value === "false") {
        return false;
    }

    if (value === "true") {
        return 1;
    }

    const numericValue = Number(value);

    if (Number.isInteger(numericValue) && numericValue >= 0) {
        return numericValue;
    }

    return value;
};

const parseList = (value: string | undefined) =>
    (value ?? "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

const parseBoolean = (name: string, value: string | undefined, fallback: boolean) => {
    if (value === undefined || value === "") {
        return fallback;
    }

    if (value === "true") {
        return true;
    }

    if (value === "false") {
        return false;
    }

    throw new Error(`Environment variable ${name} must be true or false`);
};

const parseBodyLimit = (name: string, value: string | undefined, fallback: string) => {
    const rawValue = (value?.trim() || fallback).toLowerCase();
    const match = rawValue.match(/^(\d+)(b|kb|mb)$/);

    if (!match) {
        throw new Error(`Environment variable ${name} must use a byte size such as 100kb, 1mb, or 1048576b`);
    }

    const amount = Number(match[1]);
    const unit = match[2];
    const multiplier = unit === "mb" ? 1024 * 1024 : unit === "kb" ? 1024 : 1;
    const bytes = amount * multiplier;
    const maxBytes = 10 * 1024 * 1024;

    if (!Number.isSafeInteger(bytes) || bytes <= 0 || bytes > maxBytes) {
        throw new Error(`Environment variable ${name} must be between 1 byte and 10mb`);
    }

    return rawValue;
};

const parseRefreshCookieSameSite = (value: string | undefined): AppEnv["refreshCookieSameSite"] => {
    const normalized = value?.toLowerCase();
    if (normalized === "strict" || normalized === "none") {
        return normalized;
    }

    return "lax";
};

const assertResolvedEnv = (name: string, value: string | undefined) => {
    if (!value) {
        return value;
    }

    if (value.includes("${{") || value.includes("${")) {
        throw new Error(
            `Environment variable ${name} contains an unresolved placeholder: ${value}. ` +
                `Use a real value in .env when running locally.`,
        );
    }

    return value;
};

const weakProductionSecretPattern =
    /^(change[-_]?me.*|replace[-_]?with.*|your[-_].*|test[-_].*|placeholder.*|secret|supersecretkey)$/i;

const assertProductionValue = (
    name: string,
    value: string | undefined,
    nodeEnv: string,
    options: { secret?: boolean; minLength?: number } = {},
) => {
    const resolvedValue = assertResolvedEnv(name, value);

    if (nodeEnv === "production" && !resolvedValue?.trim()) {
        throw new Error(`Missing required production environment variable: ${name}`);
    }

    if (nodeEnv === "production" && resolvedValue && options.secret) {
        const minLength = options.minLength ?? 32;

        if (resolvedValue.length < minLength || weakProductionSecretPattern.test(resolvedValue)) {
            throw new Error(`Production secret ${name} is missing a strong value`);
        }
    }

    return resolvedValue;
};

const readEnv = (...names: string[]) => {
    for (const name of names) {
        const value = process.env[name];

        if (value !== undefined) {
            return value;
        }
    }

    return undefined;
};

export const getEnv = (): AppEnv => {
    const nodeEnv = process.env.NODE_ENV ?? "development";
    const jwtSecret = assertProductionValue(
        "JWT_SECRET_KEY or JWT_SECRET",
        readEnv("JWT_SECRET_KEY", "JWT_SECRET"),
        nodeEnv,
        { secret: true },
    );

    if (!jwtSecret) {
        throw new Error("Missing JWT secret");
    }

    const refreshTokenTtlDays = parsePositiveInteger(
        "REFRESH_TOKEN_TTL_DAYS",
        process.env.REFRESH_TOKEN_TTL_DAYS,
        7,
    );
    const accessTokenTtlMinutes = parsePositiveInteger(
        "ACCESS_TOKEN_TTL_MINUTES",
        process.env.ACCESS_TOKEN_TTL_MINUTES,
        15,
    );
    const otpTtlMinutes = parsePositiveInteger("OTP_TTL_MINUTES", process.env.OTP_TTL_MINUTES, 10);
    const otpRateLimitWindowMinutes = parsePositiveInteger(
        "OTP_RATE_LIMIT_WINDOW_MINUTES",
        process.env.OTP_RATE_LIMIT_WINDOW_MINUTES,
        15,
    );
    const otpRateLimitMax = parsePositiveInteger("OTP_RATE_LIMIT_MAX", process.env.OTP_RATE_LIMIT_MAX, 5);
    const otpResendCooldownSeconds = parsePositiveInteger(
        "OTP_RESEND_COOLDOWN_SECONDS",
        process.env.OTP_RESEND_COOLDOWN_SECONDS,
        60,
    );
    const otpMaxAttempts = parsePositiveInteger("OTP_MAX_ATTEMPTS", process.env.OTP_MAX_ATTEMPTS, 5);
    const clientOrigin = assertResolvedEnv("CLIENT_ORIGIN", process.env.CLIENT_ORIGIN);
    const corsOrigins = [
        ...parseList(process.env.CORS_ORIGIN),
        ...parseList(process.env.CORS_ORIGINS),
        ...(clientOrigin ? [clientOrigin] : []),
    ].filter((value, index, values) => values.indexOf(value) === index);
    const dbHost =
        assertProductionValue(
            "MYSQLHOST",
            readEnv("MYSQLHOST", "MYSQL_HOST") ?? (nodeEnv === "production" ? undefined : "127.0.0.1"),
            nodeEnv,
        ) ?? "127.0.0.1";
    const dbName =
        assertProductionValue(
            "MYSQL_DATABASE",
            readEnv("MYSQL_DATABASE", "MYSQLDATABASE") ?? (nodeEnv === "production" ? undefined : "booking_room"),
            nodeEnv,
        ) ?? "booking_room";
    const dbUser =
        assertProductionValue(
            "MYSQLUSER",
            readEnv("MYSQLUSER", "MYSQL_USER") ?? (nodeEnv === "production" ? undefined : "root"),
            nodeEnv,
        ) ?? "root";
    const dbPassword =
        assertProductionValue(
            "MYSQLPASSWORD",
            readEnv("MYSQLPASSWORD", "MYSQL_PASSWORD") ?? (nodeEnv === "production" ? undefined : ""),
            nodeEnv,
        ) ?? "";
    const rawAccessSecret = process.env.JWT_ACCESS_SECRET;
    const rawRefreshSecret = readEnv("JWT_REFRESH_SECRET", "REFRESH_SECRET", "REFRESH_TOKEN_SECRET");
    const rawTokenHashSecret = process.env.TOKEN_HASH_SECRET;
    const rawOtpHashSecret = process.env.OTP_HASH_SECRET;

    if (nodeEnv === "production") {
        const requiredDerivedSecrets = [
            ["JWT_ACCESS_SECRET", rawAccessSecret],
            ["JWT_REFRESH_SECRET or REFRESH_SECRET", rawRefreshSecret],
            ["TOKEN_HASH_SECRET", rawTokenHashSecret],
            ["OTP_HASH_SECRET", rawOtpHashSecret],
        ] as const;

        for (const [name, value] of requiredDerivedSecrets) {
            if (!value) {
                throw new Error(`Missing required production environment variable: ${name}`);
            }
        }
    }

    const cookieSecret = assertProductionValue(
        "COOKIE_SECRET",
        process.env.COOKIE_SECRET,
        nodeEnv,
        { secret: true },
    );
    const vnpayPaymentUrl =
        assertProductionValue(
        "VNPAY_PAYMENT_URL",
        process.env.VNPAY_PAYMENT_URL ?? (nodeEnv === "production" ? undefined : "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html"),
        nodeEnv,
        ) ?? "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
    const refreshCookieSecure =
        process.env.REFRESH_TOKEN_COOKIE_SECURE === "true" ||
        process.env.REFRESH_COOKIE_SECURE === "true" ||
        nodeEnv === "production";
    const refreshCookieSameSite = parseRefreshCookieSameSite(
        process.env.REFRESH_TOKEN_COOKIE_SAME_SITE ?? process.env.REFRESH_COOKIE_SAME_SITE,
    );

    if (refreshCookieSameSite === "none" && !refreshCookieSecure) {
        throw new Error("REFRESH_TOKEN_COOKIE_SAME_SITE=none requires REFRESH_TOKEN_COOKIE_SECURE=true");
    }

    return {
        port: parsePositiveInteger("PORT", process.env.PORT, 7000),
        nodeEnv,
        trustProxy: parseTrustProxy(process.env.TRUST_PROXY),
        dbHost,
        dbPort: parsePositiveInteger("MYSQLPORT", readEnv("MYSQLPORT", "MYSQL_PORT"), 3306),
        dbName,
        dbUser,
        dbPassword,
        dbSsl: process.env.MYSQL_SSL === "true",
        dbSslCa: process.env.MYSQL_SSL_CA,
        jwtSecret,
        jwtAccessSecret: rawAccessSecret
            ? assertProductionValue("JWT_ACCESS_SECRET", rawAccessSecret, nodeEnv, {
                secret: true,
            })!
            : jwtSecret,
        jwtRefreshSecret:
            assertProductionValue("JWT_REFRESH_SECRET or REFRESH_SECRET", rawRefreshSecret, nodeEnv, {
                secret: true,
            }) ??
            `${jwtSecret}-refresh`,
        tokenHashSecret:
            assertProductionValue("TOKEN_HASH_SECRET", rawTokenHashSecret, nodeEnv, {
                secret: true,
            }) ??
            `${jwtSecret}-token-hash`,
        otpHashSecret:
            assertProductionValue("OTP_HASH_SECRET", rawOtpHashSecret, nodeEnv, {
                secret: true,
            }) ??
            `${jwtSecret}-otp-hash`,
        cookieSecret,
        googleClientId: assertResolvedEnv("GOOGLE_CLIENT_ID", process.env.GOOGLE_CLIENT_ID),
        vnpayTmnCode: assertProductionValue("VNPAY_TMN_CODE", process.env.VNPAY_TMN_CODE, nodeEnv),
        vnpayHashSecret: assertProductionValue("VNPAY_HASH_SECRET", process.env.VNPAY_HASH_SECRET, nodeEnv, {
            secret: true,
        }),
        vnpayPaymentUrl,
        vnpayReturnUrl: assertProductionValue("VNPAY_RETURN_URL", process.env.VNPAY_RETURN_URL, nodeEnv),
        vnpayLocale: process.env.VNPAY_LOCALE ?? "vn",
        accessTokenTtlMinutes,
        refreshTokenTtlDays,
        refreshTokenTtlMs: refreshTokenTtlDays * 24 * 60 * 60 * 1000,
        refreshCookieName:
            process.env.REFRESH_TOKEN_COOKIE_NAME ??
            process.env.REFRESH_COOKIE_NAME ??
            "refreshToken",
        refreshCookiePath:
            process.env.REFRESH_TOKEN_COOKIE_PATH ??
            process.env.REFRESH_COOKIE_PATH ??
            "/api/auth",
        refreshCookieSameSite,
        refreshCookieSecure,
        allowRefreshTokenInBody: parseBoolean(
            "ALLOW_REFRESH_TOKEN_IN_BODY",
            process.env.ALLOW_REFRESH_TOKEN_IN_BODY,
            nodeEnv !== "production",
        ),
        allowRefreshTokenInHeader: parseBoolean(
            "ALLOW_REFRESH_TOKEN_IN_HEADER",
            process.env.ALLOW_REFRESH_TOKEN_IN_HEADER,
            nodeEnv !== "production",
        ),
        authDebugOtp: parseBoolean("AUTH_DEBUG_OTP", process.env.AUTH_DEBUG_OTP, false),
        otpTtlMinutes,
        otpRateLimitWindowMinutes,
        otpRateLimitMax,
        otpResendCooldownSeconds,
        otpMaxAttempts,
        clientOrigin,
        corsOrigins,
        requestBodyLimit: parseBodyLimit("REQUEST_BODY_LIMIT", process.env.REQUEST_BODY_LIMIT, "1mb"),
        globalRateLimitWindowMinutes: parsePositiveInteger(
            "GLOBAL_RATE_LIMIT_WINDOW_MINUTES",
            process.env.GLOBAL_RATE_LIMIT_WINDOW_MINUTES,
            15,
        ),
        globalRateLimitMax: parsePositiveInteger("GLOBAL_RATE_LIMIT_MAX", process.env.GLOBAL_RATE_LIMIT_MAX, 1000),
        authRateLimitWindowMinutes: parsePositiveInteger("AUTH_RATE_LIMIT_WINDOW_MINUTES", process.env.AUTH_RATE_LIMIT_WINDOW_MINUTES, 15),
        authRateLimitMax: parsePositiveInteger("AUTH_RATE_LIMIT_MAX", process.env.AUTH_RATE_LIMIT_MAX, 30),
        otpRateLimitWindowMinutesOverride: parsePositiveInteger(
            "OTP_HTTP_RATE_LIMIT_WINDOW_MINUTES",
            process.env.OTP_HTTP_RATE_LIMIT_WINDOW_MINUTES,
            otpRateLimitWindowMinutes,
        ),
        otpRateLimitMaxOverride: parsePositiveInteger("OTP_HTTP_RATE_LIMIT_MAX", process.env.OTP_HTTP_RATE_LIMIT_MAX, otpRateLimitMax),
        forgotPasswordRateLimitWindowMinutes: parsePositiveInteger(
            "FORGOT_PASSWORD_RATE_LIMIT_WINDOW_MINUTES",
            process.env.FORGOT_PASSWORD_RATE_LIMIT_WINDOW_MINUTES,
            15,
        ),
        forgotPasswordRateLimitMax: parsePositiveInteger("FORGOT_PASSWORD_RATE_LIMIT_MAX", process.env.FORGOT_PASSWORD_RATE_LIMIT_MAX, 5),
        paymentCallbackRateLimitWindowMinutes: parsePositiveInteger(
            "PAYMENT_CALLBACK_RATE_LIMIT_WINDOW_MINUTES",
            process.env.PAYMENT_CALLBACK_RATE_LIMIT_WINDOW_MINUTES,
            5,
        ),
        paymentCallbackRateLimitMax: parsePositiveInteger("PAYMENT_CALLBACK_RATE_LIMIT_MAX", process.env.PAYMENT_CALLBACK_RATE_LIMIT_MAX, 120),
        mailHost: assertProductionValue("MAIL_HOST", process.env.MAIL_HOST, nodeEnv),
        mailPort: parsePositiveInteger("MAIL_PORT", process.env.MAIL_PORT, 587),
        mailUser: assertProductionValue("MAIL_USER", process.env.MAIL_USER, nodeEnv),
        mailPassword: assertProductionValue("MAIL_PASSWORD", process.env.MAIL_PASSWORD, nodeEnv, {
            secret: true,
            minLength: 8,
        }),
        mailFrom: assertProductionValue("MAIL_FROM", process.env.MAIL_FROM, nodeEnv),
        allowProductionAutoSchemaSync: parseBoolean(
            "ALLOW_PRODUCTION_AUTO_SCHEMA_SYNC",
            process.env.ALLOW_PRODUCTION_AUTO_SCHEMA_SYNC,
            false,
        ),
    };
};
