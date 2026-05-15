import { useCallback, useEffect, useState } from "react";
import {
    addBookingQueueItem,
    readBookingQueueItems,
    removeBookingQueueItem,
    type BookingQueueItem,
} from "./bookingQueueStorage";

export const useBookingQueue = () => {
    const [items, setItems] = useState<BookingQueueItem[]>(() => readBookingQueueItems());

    useEffect(() => {
        const refresh = () => setItems(readBookingQueueItems());

        window.addEventListener("storage", refresh);
        window.addEventListener("booking_queue_items:updated", refresh);

        return () => {
            window.removeEventListener("storage", refresh);
            window.removeEventListener("booking_queue_items:updated", refresh);
        };
    }, []);

    const addItem = useCallback((item: BookingQueueItem) => {
        const result = addBookingQueueItem(item);
        setItems(result.items);
        return result;
    }, []);

    const removeItem = useCallback((listingId: string) => {
        const nextItems = removeBookingQueueItem(listingId);
        setItems(nextItems);
    }, []);

    const hasItem = useCallback((listingId: string) => items.some((item) => item.listingId === listingId), [items]);

    return {
        items,
        addItem,
        removeItem,
        hasItem,
    };
};
