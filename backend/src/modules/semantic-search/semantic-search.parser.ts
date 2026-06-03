import {
    detectLocationGroupsFromQuery,
    getLocationGroupAreaKey,
    type LocationGroupName,
} from "../../common/vung-tau-location-groups";
import type { PropertyType } from "../../models/listing";
import { ParsedQueryFilters, SemanticSearchRequest } from "./semantic-search.types";
import { normalizeVietnameseText, uniqueStrings } from "./semantic-search.utils";

const cityAliases: Record<string, string> = {
    "ho chi minh": "TP Ho Chi Minh",
    "tp ho chi minh": "TP Ho Chi Minh",
    "sai gon": "TP Ho Chi Minh",
    saigon: "TP Ho Chi Minh",
    "vung tau": "Vung Tau",
    vungtau: "Vung Tau",
    "tp vung tau": "Vung Tau",
    "thanh pho vung tau": "Vung Tau",
};

const amenitySynonyms: Record<string, string[]> = {
    wifi: ["wifi", "wi fi", "internet", "mang"],
    pool: ["ho boi", "be boi", "pool", "swimming pool", "co the boi"],
    parking: ["bai xe", "dau xe", "do xe", "parking"],
    air_conditioning: ["dieu hoa", "may lanh", "air conditioning", "air conditioner", "ac"],
    kitchen: ["bep", "nau an", "kitchen"],
    washer: ["may giat", "giat ui", "washer"],
    tv: ["tv", "tivi", "truyen hinh"],
    balcony: ["ban cong", "balcony"],
    bathtub: ["bon tam", "bathtub", "bath tub"],
    breakfast: ["an sang", "bua sang", "buffet sang", "breakfast"],
    sea_view: ["view bien", "huong bien", "gan bien", "bien", "sea view", "ocean view"],
    mountain_view: ["view nui", "huong nui", "mountain view"],
    garden: ["san vuon", "vuon", "garden"],
    desk: ["ban lam viec", "cong tac", "workspace", "desk"],
    gym: ["phong gym", "gym", "fitness"],
};

const propertyTypeSynonyms: Record<PropertyType, string[]> = {
    villa: ["villa", "biet thu", "biet thu nghi duong"],
    apartment: ["can ho", "apartment", "chung cu", "studio"],
    hotel: ["khach san", "hotel"],
    homestay: ["homestay", "home stay", "nha nghi homestay"],
};

type SemanticSynonymInput = {
    keyword: string;
    synonyms: string[] | string;
};

const parsePriceToVnd = (amount: string, unit?: string) => {
    const numeric = Number(amount.replace(/,/g, "."));

    if (!Number.isFinite(numeric)) {
        return undefined;
    }

    const normalizedUnit = normalizeVietnameseText(unit ?? "");

    if (["trieu", "m", "million"].includes(normalizedUnit)) {
        return Math.round(numeric * 1_000_000);
    }

    if (["k", "nghin", "ngan"].includes(normalizedUnit)) {
        return Math.round(numeric * 1_000);
    }

    return Math.round(numeric);
};

const formatDate = (date: Date) => date.toISOString().slice(0, 10);

const addDays = (date: Date, days: number) => {
    const next = new Date(date);
    next.setUTCDate(next.getUTCDate() + days);
    return next;
};

const parseDateIntent = (normalized: string, now = new Date()): ParsedQueryFilters["dateIntent"] | undefined => {
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    if (normalized.includes("cuoi tuan nay")) {
        const daysUntilSaturday = (6 - today.getUTCDay() + 7) % 7;
        const checkIn = addDays(today, daysUntilSaturday);

        return {
            label: "this_weekend",
            checkIn: formatDate(checkIn),
            checkOut: formatDate(addDays(checkIn, 2)),
        };
    }

    if (normalized.includes("cuoi tuan sau")) {
        const daysUntilNextSaturday = ((6 - today.getUTCDay() + 7) % 7) + 7;
        const checkIn = addDays(today, daysUntilNextSaturday);

        return {
            label: "next_weekend",
            checkIn: formatDate(checkIn),
            checkOut: formatDate(addDays(checkIn, 2)),
        };
    }

    if (normalized.includes("ngay mai")) {
        const checkIn = addDays(today, 1);

        return {
            label: "tomorrow",
            checkIn: formatDate(checkIn),
            checkOut: formatDate(addDays(checkIn, 1)),
        };
    }

    if (normalized.includes("hom nay")) {
        return {
            label: "today",
            checkIn: formatDate(today),
            checkOut: formatDate(addDays(today, 1)),
        };
    }

    return undefined;
};

const normalizeSynonymRows = (synonymRows: SemanticSynonymInput[]) => {
    const normalized: Record<string, string[]> = {};

    for (const row of synonymRows) {
        const synonyms = Array.isArray(row.synonyms)
            ? row.synonyms
            : (() => {
                  try {
                      const parsed = JSON.parse(row.synonyms) as unknown;
                      return Array.isArray(parsed) ? parsed.map(String) : [];
                  } catch {
                      return [];
                  }
              })();

        normalized[row.keyword] = [row.keyword, ...synonyms];
    }

    return normalized;
};

export const parseSearchQuery = (
    query: string,
    synonymRows: SemanticSynonymInput[] = [],
    now = new Date(),
): ParsedQueryFilters => {
    const normalized = normalizeVietnameseText(query);
    const filters: ParsedQueryFilters = {
        amenityCodes: [],
        proximity: [],
    };

    for (const [alias, city] of Object.entries(cityAliases)) {
        if (normalized.includes(alias)) {
            filters.city = city;
            break;
        }
    }

    const matchedLocationGroups = detectLocationGroupsFromQuery(query);

    if (matchedLocationGroups.length > 0 && !filters.city) {
        filters.city = "Vung Tau";
    }

    if (matchedLocationGroups.length > 0) {
        filters.locationIntent = {
            city: filters.city,
            locationGroups: matchedLocationGroups,
            areaKeys: matchedLocationGroups.map(getLocationGroupAreaKey),
        };
    }

    const underPriceMatch = normalized.match(
        /(?:duoi|nho hon|khong qua|toi da|max|<=?)\s*(\d+(?:[\.,]\d+)?)\s*(trieu|m|million|k|nghin|ngan)?/,
    );

    if (underPriceMatch) {
        filters.maxPrice = parsePriceToVnd(underPriceMatch[1], underPriceMatch[2]);
    }

    const fromPriceMatch = normalized.match(
        /(?:tu|tren|lon hon|min|>=?)\s*(\d+(?:[\.,]\d+)?)\s*(trieu|m|million|k|nghin|ngan)?/,
    );

    if (fromPriceMatch) {
        filters.minPrice = parsePriceToVnd(fromPriceMatch[1], fromPriceMatch[2]);
    }

    const guestMatch = normalized.match(/(\d+)\s*(?:nguoi|khach|guest)/);

    if (guestMatch) {
        filters.guests = Number(guestMatch[1]);
        filters.capacity = filters.guests;
    }

    for (const [propertyType, synonyms] of Object.entries(propertyTypeSynonyms) as Array<[PropertyType, string[]]>) {
        if (synonyms.some((word) => normalized.includes(normalizeVietnameseText(word)))) {
            filters.propertyType = propertyType;
            break;
        }
    }

    const mergedAmenitySynonyms = {
        ...amenitySynonyms,
        ...normalizeSynonymRows(synonymRows),
    };

    for (const [code, synonyms] of Object.entries(mergedAmenitySynonyms)) {
        if (synonyms.some((word) => normalized.includes(normalizeVietnameseText(word)))) {
            filters.amenityCodes.push(code);
        }
    }

    if (
        normalized.includes("gan bien") ||
        normalized.includes("sat bien") ||
        normalized.includes("di bo ra bien") ||
        normalized.includes("ven bien")
    ) {
        filters.proximity.push("near_beach");
    }

    if (normalized.includes("view bien") || normalized.includes("huong bien")) {
        filters.proximity.push("sea_view");
    }

    filters.dateIntent = parseDateIntent(normalized, now);
    filters.amenityCodes = uniqueStrings(filters.amenityCodes);
    filters.proximity = uniqueStrings(filters.proximity);

    return filters;
};

const buildLocationSemanticBoost = (groupName: LocationGroupName) =>
    `Uu tien khu vuc ${groupName} Vung Tau va cac dia chi lien quan trong cung location group.`;

export const buildSemanticQuery = (input: SemanticSearchRequest, parsed: ParsedQueryFilters) => {
    const parts = [input.query.trim()];
    const guests = input.guests ?? parsed.guests;

    if (guests === 2) {
        parts.push("Phu hop cho cap doi hoac hai nguoi.");
    } else if (guests && guests >= 4) {
        parts.push("Phu hop cho gia dinh hoac nhom ban.");
    }

    const amenityCodes = uniqueStrings([
        ...(parsed.amenityCodes ?? []),
        ...((input.amenities ?? []).map(String)),
    ]);

    if (amenityCodes.includes("sea_view")) {
        parts.push("Uu tien gan bien, huong bien, view bien, nghi duong.");
    }

    if (parsed.proximity.includes("near_beach")) {
        parts.push("Uu tien cho o gan bien, di chuyen nhanh ra bai tam.");
    }

    if (amenityCodes.includes("pool")) {
        parts.push("Co ho boi hoac be boi.");
    }

    if (amenityCodes.includes("bathtub")) {
        parts.push("Co bon tam, phu hop nghi duong lang man.");
    }

    if (amenityCodes.includes("desk")) {
        parts.push("Phu hop khach cong tac, co khu vuc lam viec.");
    }

    const propertyType = input.propertyType ?? parsed.propertyType;

    if (propertyType) {
        parts.push(`Loai cho o mong muon: ${propertyType}.`);
    }

    if (parsed.dateIntent?.label) {
        parts.push(`Ngu canh thoi gian: ${parsed.dateIntent.label}.`);
    }

    const matchedLocationGroups = detectLocationGroupsFromQuery(input.query);

    if (matchedLocationGroups.length > 0) {
        parts.push("Uu tien luu tru tai khu vuc duoc nhan dien tu dia chi hoac ten duong.");

        for (const groupName of matchedLocationGroups) {
            parts.push(buildLocationSemanticBoost(groupName));
        }
    }

    return parts.join(" ").replace(/\s+/g, " ").trim();
};
