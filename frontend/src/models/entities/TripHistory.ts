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
};