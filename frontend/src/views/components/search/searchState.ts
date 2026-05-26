import type { PopularDestination } from "../../../models/entities/Listing";
import {
    isLocationGroupName,
    isLatLngInVungTauBounds,
    MAP_SEARCH_RADIUS_METERS,
    normalizeVietnameseText,
    type LocationGroupName,
} from "../../../data/vungTauLocationGroups";
import type { GuestSelection } from "./booking/Guest";

export type BookingSearchState = {
    location: string;
    locationGroup: LocationGroupName | "";
    mapLat: string;
    mapLng: string;
    mapRadius: string;
    checkIn: string;
    checkOut: string;
    guests: GuestSelection;
};

export type GuestFieldConfig = {
    key: keyof GuestSelection;
    label: string;
    description: string;
    min: number;
    max: number;
};

export const defaultGuestSelection: GuestSelection = {
    adults: 1,
    children: 0,
    infants: 0,
    pets: 0,
};

export const guestFieldConfigs: GuestFieldConfig[] = [
    {
        key: "adults",
        label: "Người lớn",
        description: "Từ 13 tuổi trở lên",
        min: 1,
        max: 16,
    },
    {
        key: "children",
        label: "Trẻ em",
        description: "Từ 2 đến 12 tuổi",
        min: 0,
        max: 8,
    },
    {
        key: "infants",
        label: "Em bé",
        description: "Dưới 2 tuổi",
        min: 0,
        max: 5,
    },
    {
        key: "pets",
        label: "Thú cưng",
        description: "Mang theo thú cưng",
        min: 0,
        max: 5,
    },
];

export const createDefaultBookingSearchState = (): BookingSearchState => ({
    location: "",
    locationGroup: "",
    mapLat: "",
    mapLng: "",
    mapRadius: "",
    checkIn: "",
    checkOut: "",
    guests: { ...defaultGuestSelection },
});

export const toIsoDate = (date: Date) => {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");

    return `${year}-${month}-${day}`;
};

export const addDaysToIso = (isoDate: string, days: number) => {
    if (!isoDate) {
        return "";
    }

    const parsed = new Date(`${isoDate}T00:00:00`);
    parsed.setDate(parsed.getDate() + days);

    return toIsoDate(parsed);
};

const parsePositiveInteger = (value: string | null, fallback: number) => {
    const parsed = Number.parseInt(value ?? "", 10);
    return Number.isNaN(parsed) ? fallback : Math.max(0, parsed);
};

export const getGuestCount = (guests: GuestSelection) => Math.max(1, guests.adults) + Math.max(0, guests.children);

export const buildGuestSummary = (guests: GuestSelection, placeholder = "Thêm khách") => {
    const stayingGuests = getGuestCount(guests);

    if (stayingGuests <= 0) {
        return placeholder;
    }

    const fragments: string[] = [`${stayingGuests} khách`];

    if (guests.infants > 0) {
        fragments.push(`${guests.infants} em bé`);
    }

    if (guests.pets > 0) {
        fragments.push(`${guests.pets} thú cưng`);
    }

    return fragments.join(", ");
};

export const formatSearchDate = (isoDate: string, fallback = "Thêm ngày") => {
    if (!isoDate) {
        return fallback;
    }

    const parsed = new Date(`${isoDate}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) {
        return fallback;
    }

    return new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
    }).format(parsed);
};

export const formatSearchDateRange = (checkIn: string, checkOut: string) => {
    if (checkIn && checkOut) {
        return `${formatSearchDate(checkIn)} - ${formatSearchDate(checkOut)}`;
    }

    if (checkIn) {
        return `Từ ${formatSearchDate(checkIn)}`;
    }

    if (checkOut) {
        return `Đến ${formatSearchDate(checkOut)}`;
    }

    return "Thêm ngày";
};

export const sanitizeBookingSearchState = (state: BookingSearchState): BookingSearchState => {
    const trimmedLocation = state.location.trim();
    const locationGroup =
        state.locationGroup && isLocationGroupName(state.locationGroup)
            ? state.locationGroup
            : "";
    let mapLat = state.mapLat?.trim() ?? "";
    let mapLng = state.mapLng?.trim() ?? "";
    let mapRadius = state.mapRadius?.trim() ?? "";
    const adults = Math.max(1, state.guests.adults || 1);
    const children = Math.max(0, state.guests.children || 0);
    const infants = Math.max(0, state.guests.infants || 0);
    const pets = Math.max(0, state.guests.pets || 0);

    let nextCheckIn = state.checkIn;
    let nextCheckOut = state.checkOut;

    if (nextCheckOut && !nextCheckIn) {
        nextCheckIn = nextCheckOut;
    }

    if (nextCheckIn && !nextCheckOut) {
        nextCheckOut = addDaysToIso(nextCheckIn, 1);
    }

    if (nextCheckIn && nextCheckOut && nextCheckOut < nextCheckIn) {
        nextCheckOut = addDaysToIso(nextCheckIn, 1);
    }

    if (mapLat || mapLng) {
        const parsedLat = Number(mapLat);
        const parsedLng = Number(mapLng);

        if (!isLatLngInVungTauBounds({ lat: parsedLat, lng: parsedLng })) {
            mapLat = "";
            mapLng = "";
            mapRadius = "";
        }
    }

    return {
        location: trimmedLocation,
        locationGroup,
        mapLat,
        mapLng,
        mapRadius,
        checkIn: nextCheckIn,
        checkOut: nextCheckOut,
        guests: {
            adults,
            children,
            infants,
            pets,
        },
    };
};

export const parseBookingSearchParams = (paramsLike: URLSearchParams | string) => {
    const params = typeof paramsLike === "string" ? new URLSearchParams(paramsLike) : paramsLike;
    const locationGroupParam = params.get("locationGroup") ?? "";

    return sanitizeBookingSearchState({
        location: params.get("location") ?? "",
        locationGroup: isLocationGroupName(locationGroupParam) ? locationGroupParam : "",
        mapLat: params.get("lat") ?? "",
        mapLng: params.get("lng") ?? "",
        mapRadius: params.get("radius") ?? "",
        checkIn: params.get("checkIn") ?? "",
        checkOut: params.get("checkOut") ?? "",
        guests: {
            adults: Math.max(1, parsePositiveInteger(params.get("adults"), defaultGuestSelection.adults)),
            children: parsePositiveInteger(params.get("children"), defaultGuestSelection.children),
            infants: parsePositiveInteger(params.get("infants"), defaultGuestSelection.infants),
            pets: parsePositiveInteger(params.get("pets"), defaultGuestSelection.pets),
        },
    });
};

export const buildBookingSearchParams = (state: BookingSearchState) => {
    const sanitizedState = sanitizeBookingSearchState(state);
    const params = new URLSearchParams();

    if (sanitizedState.location) {
        params.set("location", sanitizedState.location);
    }

    if (sanitizedState.locationGroup) {
        params.set("locationGroup", sanitizedState.locationGroup);
    }

    if (sanitizedState.mapLat && sanitizedState.mapLng) {
        params.set("lat", sanitizedState.mapLat);
        params.set("lng", sanitizedState.mapLng);
        params.set("radius", sanitizedState.mapRadius || String(MAP_SEARCH_RADIUS_METERS));
    }

    if (sanitizedState.checkIn) {
        params.set("checkIn", sanitizedState.checkIn);
    }

    if (sanitizedState.checkOut) {
        params.set("checkOut", sanitizedState.checkOut);
    }

    params.set("adults", String(sanitizedState.guests.adults));

    if (sanitizedState.guests.children > 0) {
        params.set("children", String(sanitizedState.guests.children));
    }

    if (sanitizedState.guests.infants > 0) {
        params.set("infants", String(sanitizedState.guests.infants));
    }

    if (sanitizedState.guests.pets > 0) {
        params.set("pets", String(sanitizedState.guests.pets));
    }

    return params;
};

export const normalizeSearchText = (value: string) =>
    normalizeVietnameseText(value);

export const isMapSearchState = (state: BookingSearchState) =>
    Boolean(state.mapLat && state.mapLng);

export const filterStaysByBookingSearch = (stays: PopularDestination[], state: BookingSearchState) => {
    const normalizedLocation =
        state.locationGroup || isMapSearchState(state)
            ? ""
            : normalizeSearchText(state.location);
    const requiredGuests = getGuestCount(state.guests);

    return stays.filter((stay) => {
        const matchesLocation =
            !normalizedLocation ||
            [stay.name, stay.address, stay.category, stay.description]
                .map(normalizeSearchText)
                .some((fieldValue) => fieldValue.includes(normalizedLocation));

        const matchesGuests = stay.guests >= requiredGuests;

        return matchesLocation && matchesGuests;
    });
};
