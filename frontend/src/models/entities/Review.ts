export type ApiReview = {
    reviewId: number;
    bookingId?: number;
    listingId: number;
    reviewerUserId?: number;
    reviewerName?: string;
    rating: number;
    comment?: string | null;
    hostReply?: string | null;
    createdAt: string;
    updatedAt?: string;
};

export type PaginatedReviews = {
    items: ApiReview[];
    pagination: {
        page: number;
        limit: number;
        totalItems: number;
        totalPages: number;
    };
};

export type CreateReviewInput = {
    bookingId: number;
    rating: number;
    comment?: string;
};

export type ReplyReviewInput = {
    content: string;
};