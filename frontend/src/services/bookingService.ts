import { apiClient } from "./api/apiClient";
import type { ApiBooking, BookingStatusFilter, PaginatedBookings } from "../models/entities/Booking";

export type { ApiBooking, PaginatedBookings } from "../models/entities/Booking";

export const createBooking = (payload: {
    listingId: number;
    checkIn: string;
    checkOut: string;
    guests: number;
    couponCode?: string;
}) => apiClient.post<ApiBooking>("/api/bookings", payload);

export type BulkCreateBookingPayload = {
    items: Array<{
        listingId: number;
        checkIn: string;
        checkOut: string;
        guests: number;
        couponCode?: string;
    }>;
};

export type BulkCreateBookingResponse = {
    items: ApiBooking[];
};

export const createBulkBookings = (payload: BulkCreateBookingPayload) =>
    apiClient.post<BulkCreateBookingResponse>("/api/bookings/bulk", payload);

export const getMyBookings = (query: { status?: BookingStatusFilter | "all"; page?: number; limit?: number } = {}) =>
    apiClient.get<PaginatedBookings>("/api/bookings/mine", {
        query: {
            ...query,
            status: query.status === "all" ? undefined : query.status,
        },
    });

export const getBookingDetail = (bookingId: string | number) =>
    apiClient.get<ApiBooking>(`/api/bookings/${bookingId}`);

export const cancelBooking = (bookingId: string | number, reason?: string) =>
    apiClient.post<ApiBooking>(`/api/bookings/${bookingId}/cancel`, { reason });

export const getHostBookings = (query: { status?: BookingStatusFilter | "all"; page?: number; limit?: number } = {}) =>
    apiClient.get<PaginatedBookings>("/api/host/bookings", {
        query: {
            ...query,
            status: query.status === "all" ? undefined : query.status,
        },
    });

export const getHostBookingDetail = (bookingId: string | number) =>
    apiClient.get<ApiBooking>(`/api/host/bookings/${bookingId}`);

export const confirmHostBooking = (bookingId: string | number) =>
    apiClient.patch<ApiBooking>(`/api/host/bookings/${bookingId}/confirm`);

export const checkInHostBooking = (bookingId: string | number) =>
    apiClient.post<ApiBooking>(`/api/host/bookings/${bookingId}/check-in`);

export const checkOutHostBooking = (bookingId: string | number) =>
    apiClient.post<ApiBooking>(`/api/host/bookings/${bookingId}/check-out`);

export const cancelHostBooking = (bookingId: string | number, reason?: string) =>
    apiClient.patch<ApiBooking>(`/api/host/bookings/${bookingId}/cancel`, { reason });
