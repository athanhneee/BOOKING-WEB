export type BookingStatus =
    | "pending"
    | "pending_host"
    | "pending_host_confirmation"
    | "pending_payment"
    | "confirmed"
    | "paid"
    | "checked_in"
    | "completed"
    | "cancelled"
    | "cancelled_by_guest"
    | "cancelled_by_host"
    | "host_cancelled"
    | "rejected"
    | "expired"
    | string;

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
    status: BookingStatus;
    internalStatus?: string;
    lockedUntil?: string | null;
    paymentExpiresAt?: string | null;
    remainingPaymentSeconds?: number;
    paymentStatus: string | null;
    currency: string;
    subtotalAmount: number;
    cleaningFeeAmount: number;
    serviceFeeAmount: number;
    discountAmount: number;
    totalAmount: number;
    totalPrice?: number;
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
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
};
