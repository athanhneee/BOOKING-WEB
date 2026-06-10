/**
 * Returns true if a Google OAuth client ID is configured and
 * the GoogleOAuthProvider is active. When false, Google login
 * buttons should be hidden or disabled.
 */
export const isGoogleOAuthAvailable = (): boolean =>
    Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);
