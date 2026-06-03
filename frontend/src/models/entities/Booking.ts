export type BookingLifecycleStatus =
    | "pending_payment"
    | "payment_expired"
    | "paid"
    | "confirmed"
    | "checked_in"
    | "checked_out"
    | "completed"
    | "cancelled_by_guest"
    | "cancelled_by_host"
    | "cancelled_by_admin"
    | "rejected";

export type BookingFinancialStatus =
    | "refund_pending"
    | "refunded"
    | "payout_pending"
    | "payout_paid";

export type LegacyBookingStatus =
    | "pending"
    | "pending_host"
    | "pending_host_confirmation"
    | "cancelled"
    | "host_cancelled"
    | "expired";

export type BookingStatus = BookingLifecycleStatus | BookingFinancialStatus | LegacyBookingStatus | "unknown";
export type BookingStatusFilter = BookingLifecycleStatus | LegacyBookingStatus;

export type PaymentStatus = "pending" | "paid" | "failed" | "cancelled" | "expired" | "refunded";
export type RefundStatus = "pending" | "processing" | "succeeded" | "failed" | "cancelled";
export type PayoutStatus = "pending" | "approved" | "processing" | "paid" | "failed" | "rejected" | "cancelled";

export type BookingPriceBreakdown = {
    totalNights: number;
    weekdayNights: number;
    weekendNights: number;
    nightlyPrice: number;
    weekendPrice: number | null;
    nightlyPrices: Array<{
        date: string;
        amount: number;
        source: "basePrice" | "weekendPrice" | "calendar";
        isWeekend: boolean;
    }>;
    subtotalAmount: number;
    subtotal: number;
    cleaningFeeAmount: number;
    cleaningFee: number;
    serviceFeeAmount: number;
    serviceFee: number;
    extraGuestFeeAmount: number;
    extraGuestFee: number;
    discountAmount: number;
    discount: number;
    totalAmount: number;
    couponId: number | null;
    couponCode: string | null;
    extraGuest: {
        includedGuests: number;
        extraGuests: number;
        feePerGuestPerNight: number;
    };
};

export type ApiBooking = {
    bookingId: number;
    listingId: number;
    guestUserId: string | number;
    hostUserId: string | number;
    listingTitle?: string | null;
    listing: {
        listingId: number;
        title: string;
        city: string;
        district: string;
        addressLine: string;
        imageUrl: string | null;
        coverImageUrl?: string | null;
        coverImage?: {
            imageId: number;
            url: string;
            displayTitle?: string | null;
            altText?: string | null;
            caption?: string | null;
        } | null;
        images?: Array<{
            imageId: number;
            url: string;
            displayTitle?: string | null;
            altText?: string | null;
            caption?: string | null;
            isCover?: boolean;
            sortOrder?: number;
        }>;
    } | null;
    checkInDate: string;
    checkOutDate: string;
    guests?: number;
    guestCount: number;
    guestsCount?: number;
    nights: number;
    totalNights?: number;
    status: BookingStatus;
    persistedStatus?: BookingStatus;
    internalStatus?: string;
    displayStatus?: {
        code?: string;
        normalizedStatus: string;
        label: string;
        tone: "warning" | "danger" | "success" | "info" | "muted";
        reason?: string | null;
        isTerminal?: boolean;
        canHostConfirm?: boolean;
        canHostCancel?: boolean;
    };
    lockedUntil?: string | null;
    paymentStartedAt?: string | null;
    paymentExpiresAt?: string | null;
    remainingPaymentSeconds?: number;
    paymentStatus: PaymentStatus | null;
    refundStatus?: RefundStatus | null;
    payoutStatus?: PayoutStatus | null;
    currency: string;
    subtotalAmount: number;
    cleaningFeeAmount: number;
    serviceFeeAmount: number;
    extraGuestFeeAmount?: number;
    discountAmount: number;
    totalAmount: number;
    totalPrice?: number;
    priceBreakdown?: BookingPriceBreakdown;
    couponId: number | null;
    bookingNote: string | null;
    cancellationReason: string | null;
    cancelledByUserId: string | number | null;
    cancelledAt?: string | null;
    checkedInAt: string | null;
    checkedOutAt: string | null;
    paidAt?: string | null;
    createdAt: string;
    updatedAt: string;
};

export type PaginatedBookings = {
    items: ApiBooking[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
};
