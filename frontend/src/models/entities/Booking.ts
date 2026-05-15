export type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed" | string;

export type ApiBooking = {
    bookingId: number;
    listingId: number;
    guestUserId: string | number;
    hostUserId: string | number;
    listing: {
        listingId: number;
        title: string;
        city: string;
        district: string;
        addressLine: string;
        imageUrl: string | null;
    } | null;
    checkInDate: string;
    checkOutDate: string;
    guestCount: number;
    guestsCount?: number;
    nights: number;
    status: BookingStatus;
    internalStatus?: string;
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
    cancelledAt: string | null;
    checkedInAt: string | null;
    checkedOutAt: string | null;
    paidAt: string | null;
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