import { z } from "zod";

export const listingIdParamSchema = z.object({
    listingId: z.coerce.number().int().positive(),
});

export const publicListingsQuerySchema = z.object({
    city: z.string().trim().min(1).optional(),
    district: z.string().trim().min(1).optional(),
    checkIn: z.string().optional(),
    checkOut: z.string().optional(),
    guests: z.coerce.number().int().positive().optional(),
    propertyType: z.enum(["apartment", "villa", "hotel", "homestay"]).optional(),
    roomType: z.enum(["entire_place", "private_room", "shared_room"]).optional(),
    minPrice: z.coerce.number().min(0).optional(),
    maxPrice: z.coerce.number().min(0).optional(),
    amenities: z.string().trim().min(1).optional(),
    sort: z.enum(["price_asc", "price_desc", "rating_desc", "newest"]).optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
});

