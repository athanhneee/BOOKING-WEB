import type { PopularDestination } from "../../config/popularDestinations";

export const BOOKING_QUEUE_STORAGE_KEY = "booking_queue_items";
export const BOOKING_QUEUE_LIMIT = 5;

export type BookingQueueItem = {
    listingId: string;
    title: string;
    imageUrl: string;
    basePrice: number;
    location: string;
    checkIn?: string;
    checkOut?: string;
    guests?: number;
    guestSummary?: string;
};

type BookingQueueMutationResult = {
    status: "added" | "exists" | "full";
    items: BookingQueueItem[];
};

const canUseLocalStorage = () => typeof window !== "undefined" && typeof window.localStorage !== "undefined";

const notifyBookingQueueUpdated = () => {
    if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("booking_queue_items:updated"));
    }
};

const isValidQueueItem = (value: Partial<BookingQueueItem> | null | undefined): value is BookingQueueItem =>
    Boolean(
        value?.listingId &&
            value.title &&
            typeof value.basePrice === "number" &&
            value.location,
    );

export const readBookingQueueItems = (): BookingQueueItem[] => {
    if (!canUseLocalStorage()) {
        return [];
    }

    const rawValue = window.localStorage.getItem(BOOKING_QUEUE_STORAGE_KEY);
    if (!rawValue) {
        return [];
    }

    try {
        const parsed = JSON.parse(rawValue) as Array<Partial<BookingQueueItem>>;
        if (!Array.isArray(parsed)) {
            return [];
        }

        return parsed.filter(isValidQueueItem).slice(0, BOOKING_QUEUE_LIMIT);
    } catch {
        return [];
    }
};

export const writeBookingQueueItems = (items: BookingQueueItem[]) => {
    if (!canUseLocalStorage()) {
        return;
    }

    window.localStorage.setItem(BOOKING_QUEUE_STORAGE_KEY, JSON.stringify(items.slice(0, BOOKING_QUEUE_LIMIT)));
    notifyBookingQueueUpdated();
};

export const createBookingQueueItem = (
    listing: PopularDestination,
    selection?: Pick<BookingQueueItem, "checkIn" | "checkOut" | "guests" | "guestSummary">,
): BookingQueueItem => ({
    listingId: listing.id,
    title: listing.name,
    imageUrl: listing.imageUrl,
    basePrice: listing.pricePerNight,
    location: listing.address,
    ...selection,
});

export const addBookingQueueItem = (item: BookingQueueItem): BookingQueueMutationResult => {
    const currentItems = readBookingQueueItems();
    if (currentItems.some((currentItem) => currentItem.listingId === item.listingId)) {
        return {
            status: "exists",
            items: currentItems,
        };
    }

    if (currentItems.length >= BOOKING_QUEUE_LIMIT) {
        return {
            status: "full",
            items: currentItems,
        };
    }

    const nextItems = [item, ...currentItems].slice(0, BOOKING_QUEUE_LIMIT);
    writeBookingQueueItems(nextItems);

    return {
        status: "added",
        items: nextItems,
    };
};

export const removeBookingQueueItem = (listingId: string) => {
    const nextItems = readBookingQueueItems().filter((item) => item.listingId !== listingId);
    writeBookingQueueItems(nextItems);
    return nextItems;
};

export const mergeBookingQueueItems = (items: BookingQueueItem[]) => {
    const uniqueItems = items.reduce<BookingQueueItem[]>((result, item) => {
        if (!result.some((currentItem) => currentItem.listingId === item.listingId)) {
            result.push(item);
        }

        return result;
    }, []);

    return uniqueItems.slice(0, BOOKING_QUEUE_LIMIT);
};
