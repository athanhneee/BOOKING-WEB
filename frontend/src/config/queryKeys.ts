export const queryKeys = {
    auth: {
        me: ["auth", "me"] as const,
    },
    listings: {
        publicList: (query: unknown) => ["listings", "public", query] as const,
        publicDetail: (listingId?: string | number) => ["listings", "public", listingId] as const,
        availability: (listingId?: string | number, month?: number, year?: number) =>
            ["listings", "availability", listingId, month, year] as const,
        reviews: (listingId?: string | number, query?: unknown) => ["listings", "reviews", listingId, query] as const,
        rules: (listingId?: string | number) => ["listings", "rules", listingId] as const,
        hostMine: (query?: unknown) => ["host", "listings", query] as const,
        hostDetail: (listingId?: string | number) => ["host", "listings", listingId] as const,
        hostCalendar: (listingId?: string | number, month?: number, year?: number) =>
            ["host", "listings", listingId, "calendar", month, year] as const,
    },
    payments: {
        my: (query?: unknown) => ["payments", "my", query] as const,
        detail: (paymentId?: string | number) => ["payments", paymentId] as const,
    },
    conversations: {
        list: (query?: unknown) => ["conversations", query] as const,
        messages: (conversationId?: string | number, query?: unknown) => ["conversations", conversationId, "messages", query] as const,
    },
    verifications: {
        mine: (latestOnly?: boolean) => ["host", "verifications", latestOnly] as const,
        admin: (query?: unknown) => ["admin", "verifications", query] as const,
    },
    payouts: {
        accounts: ["host", "payout-accounts"] as const,
        host: (query?: unknown) => ["host", "payouts", query] as const,
        admin: (query?: unknown) => ["admin", "host-payouts", query] as const,
    },
};