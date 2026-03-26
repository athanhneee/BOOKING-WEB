import type { PopularDestination } from "../config/popularDestinations";
import { APP_ROUTES } from "../config/routes";
import {
    buildGuestSummary,
    sanitizeBookingSearchState,
    type BookingSearchState,
} from "../views/components/search/searchState";

export type BookingDraft = {
    bookingId: string;
    listingId: string;
    listingName: string;
    listingAddress: string;
    listingImage: string;
    checkIn: string;
    checkOut: string;
    guests: BookingSearchState["guests"];
    guestSummary: string;
    nights: number;
    pricePerNight: number;
    subtotal: number;
    serviceFee: number;
    vatAmount: number;
    totalAmount: number;
    createdAt: string;
};

const BOOKING_STORAGE_KEY = "minhthanhvilla_pending_booking";

const canUseStorage = () => typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";

const getNights = (checkIn: string, checkOut: string) => {
    const start = new Date(`${checkIn}T00:00:00`);
    const end = new Date(`${checkOut}T00:00:00`);
    const diffInMs = end.getTime() - start.getTime();
    const diffInDays = Math.round(diffInMs / (1000 * 60 * 60 * 24));

    return Number.isFinite(diffInDays) && diffInDays > 0 ? diffInDays : 1;
};

const buildBookingId = (listingId: string) => {
    const compactListingId = listingId.replace(/[^a-z0-9]/gi, "").slice(-6).toUpperCase() || "VILLA";
    const timestamp = Date.now().toString().slice(-6);
    return `BK-${compactListingId}-${timestamp}`;
};

export const createBookingDraft = (listing: PopularDestination, state: BookingSearchState): BookingDraft => {
    const sanitizedState = sanitizeBookingSearchState(state);
    const nights = getNights(sanitizedState.checkIn, sanitizedState.checkOut);
    const subtotal = listing.pricePerNight * nights;
    const serviceFee = Math.round(subtotal * 0.1);
    const vatAmount = Math.round((subtotal + serviceFee) * 0.08);

    return {
        bookingId: buildBookingId(listing.id),
        listingId: listing.id,
        listingName: listing.name,
        listingAddress: listing.address,
        listingImage: listing.imageUrl,
        checkIn: sanitizedState.checkIn,
        checkOut: sanitizedState.checkOut,
        guests: sanitizedState.guests,
        guestSummary: buildGuestSummary(sanitizedState.guests, "1 khách"),
        nights,
        pricePerNight: listing.pricePerNight,
        subtotal,
        serviceFee,
        vatAmount,
        totalAmount: subtotal + serviceFee + vatAmount,
        createdAt: new Date().toISOString(),
    };
};

export const savePendingBookingDraft = (draft: BookingDraft) => {
    if (!canUseStorage()) {
        return;
    }

    window.sessionStorage.setItem(BOOKING_STORAGE_KEY, JSON.stringify(draft));
};

export const getPendingBookingDraft = (bookingId?: string) => {
    if (!canUseStorage()) {
        return null;
    }

    const rawValue = window.sessionStorage.getItem(BOOKING_STORAGE_KEY);
    if (!rawValue) {
        return null;
    }

    try {
        const parsed = JSON.parse(rawValue) as Partial<BookingDraft>;
        if (!parsed?.bookingId || !parsed.listingId || !parsed.listingName || !parsed.checkIn || !parsed.checkOut) {
            return null;
        }

        if (bookingId && parsed.bookingId !== bookingId) {
            return null;
        }

        return parsed as BookingDraft;
    } catch {
        return null;
    }
};

export const clearPendingBookingDraft = () => {
    if (!canUseStorage()) {
        return;
    }

    window.sessionStorage.removeItem(BOOKING_STORAGE_KEY);
};

export const buildGuestPaymentPath = (bookingId: string) => APP_ROUTES.guestPayment.replace(":bookingId", bookingId);
