export type TripHistoryStatus = "completed" | "pending_review" | "active" | "cancelled";

export type TripHistory = {
    id: string;
    propertyName: string;
    location: string;
    imageUrl: string;
    checkIn: string;
    checkOut: string;
    nights: number;
    totalPrice: number;
    currency: string;
    status: TripHistoryStatus;
    canReview: boolean;
    canRebook: boolean;
    guestCount?: number;
    address?: string;
    paymentStatus?: string | null;
    subtotalAmount?: number;
    cleaningFeeAmount?: number;
    serviceFeeAmount?: number;
    discountAmount?: number;
    bookingNote?: string | null;
    cancellationReason?: string | null;
    createdAt?: string;
    paidAt?: string | null;
    checkedInAt?: string | null;
    checkedOutAt?: string | null;
};
