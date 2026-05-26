import { apiClient } from "./api/apiClient";
import type { ApiBooking, PaginatedBookings } from "../models/entities/Booking";

export type { ApiBooking, PaginatedBookings } from "../models/entities/Booking";

export const createBooking = (payload: {
    listingId: number;
    checkInDate: string;
    checkOutDate: string;
    guestCount: number;
    couponCode?: string;
    couponId?: number;
    bookingNote?: string;
}) => apiClient.post<ApiBooking>("/api/bookings", payload);

export const getMyBookings = (query: { status?: string; page?: number; limit?: number } = {}) =>
    apiClient.get<PaginatedBookings>("/api/bookings/mine", { query });

export const getBookingDetail = (bookingId: string | number) =>
    apiClient.get<ApiBooking>(`/api/bookings/${bookingId}`);

export const cancelBooking = (bookingId: string | number, reason?: string) =>
    apiClient.post<ApiBooking>(`/api/bookings/${bookingId}/cancel`, { reason });

export const getHostBookings = (query: { status?: string; page?: number; limit?: number } = {}) =>
    apiClient.get<PaginatedBookings>("/api/host/bookings", { query });

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
