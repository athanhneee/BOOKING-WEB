import {
    getGuestCount,
    sanitizeBookingSearchState,
    type BookingSearchState,
} from "../../views/components/search/searchState";

export type SearchHistoryItem = {
    id: string;
    state: BookingSearchState;
    searchedAt: number;
};

export const SEARCH_HISTORY_STORAGE_KEY = "booking_search_history";
export const SEARCH_HISTORY_LIMIT = 8;

const canUseSessionStorage = () => typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";

const hasSearchIntent = (state: BookingSearchState) =>
    Boolean(state.location || state.checkIn || state.checkOut) ||
    getGuestCount(state.guests) > 1 ||
    state.guests.infants > 0 ||
    state.guests.pets > 0;

const createSearchId = (state: BookingSearchState) =>
    [
        state.location,
        state.checkIn,
        state.checkOut,
        state.guests.adults,
        state.guests.children,
        state.guests.infants,
        state.guests.pets,
    ].join("|");

const isValidHistoryItem = (value: Partial<SearchHistoryItem> | null | undefined): value is SearchHistoryItem => {
    if (!value?.state || typeof value.searchedAt !== "number") {
        return false;
    }

    return Boolean(value.id);
};

export const readSearchHistoryItems = (): SearchHistoryItem[] => {
    if (!canUseSessionStorage()) {
        return [];
    }

    const rawValue = window.sessionStorage.getItem(SEARCH_HISTORY_STORAGE_KEY);
    if (!rawValue) {
        return [];
    }

    try {
        const parsed = JSON.parse(rawValue) as Array<Partial<SearchHistoryItem>>;
        if (!Array.isArray(parsed)) {
            return [];
        }

        return parsed
            .filter(isValidHistoryItem)
            .map((item) => ({
                ...item,
                state: sanitizeBookingSearchState(item.state),
            }))
            .filter((item) => hasSearchIntent(item.state))
            .sort((first, second) => second.searchedAt - first.searchedAt)
            .slice(0, SEARCH_HISTORY_LIMIT);
    } catch {
        return [];
    }
};

export const writeSearchHistoryItems = (items: SearchHistoryItem[]) => {
    if (!canUseSessionStorage()) {
        return;
    }

    window.sessionStorage.setItem(
        SEARCH_HISTORY_STORAGE_KEY,
        JSON.stringify(items.slice(0, SEARCH_HISTORY_LIMIT)),
    );
};

export const addSearchHistoryItem = (state: BookingSearchState) => {
    const sanitizedState = sanitizeBookingSearchState(state);
    if (!hasSearchIntent(sanitizedState)) {
        return readSearchHistoryItems();
    }

    const id = createSearchId(sanitizedState);
    const nextItem: SearchHistoryItem = {
        id,
        state: sanitizedState,
        searchedAt: Date.now(),
    };

    const nextItems = [
        nextItem,
        ...readSearchHistoryItems().filter((item) => item.id !== id),
    ].slice(0, SEARCH_HISTORY_LIMIT);

    writeSearchHistoryItems(nextItems);
    return nextItems;
};