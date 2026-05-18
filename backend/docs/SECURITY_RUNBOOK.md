# Backend Security Runbook

## Secret Rotation

Rotate these secrets outside the repository whenever `.env` may have been exposed:

- `JWT_SECRET_KEY`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `TOKEN_HASH_SECRET`
- `OTP_HASH_SECRET`
- `COOKIE_SECRET`
- `VNPAY_HASH_SECRET`
- MySQL user password
- Google OAuth client secret if one is used by deployment tooling

After rotating token secrets, force logout existing users by clearing active rows in `refresh_sessions` or setting `revoked_at` for all active sessions.

## Production Startup

Production must run migrations and seed jobs through deployment scripts. The server blocks automatic schema sync by default when `NODE_ENV=production`.

Only set `ALLOW_PRODUCTION_AUTO_SCHEMA_SYNC=true` for a one-off controlled maintenance window, then set it back to `false`.

## CORS And Cookies

Set `CLIENT_ORIGIN` or `CORS_ORIGINS` to the exact production frontend origin. Do not use `*` with credentialed requests.

For HTTPS production:

- `REFRESH_TOKEN_COOKIE_SECURE=true`
- `REFRESH_TOKEN_COOKIE_SAME_SITE=lax` for same-site frontend/backend, or `none` only when cross-site cookies are required
- `ALLOW_REFRESH_TOKEN_IN_BODY=false` unless supporting a non-browser client
- `ALLOW_REFRESH_TOKEN_IN_HEADER=false` unless supporting a non-browser client

## Rate Limiting

The current limiter is in-memory. For multi-instance production, add a shared store such as Redis and configure all instances to use it, otherwise each instance enforces limits independently.

## Backup And Restore

Minimum operational checklist:

- Daily encrypted MySQL backup.
- Weekly restore drill into a non-production database.
- Verify backup contains `users`, `bookings`, `payments`, `refresh_sessions`, and payout tables.
- Keep VNPay callback/payment audit logs long enough for dispute handling.
- Restrict backup access to administrators only.
