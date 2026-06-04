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
    parking: ["bai xe", "dau xe", "do xe", "parking", "cho dau xe", "nha xe"],
    air_conditioning: ["dieu hoa", "may lanh", "air conditioning", "air conditioner", "ac", "lanh"],
    kitchen: ["bep", "nau an", "kitchen", "co bep", "bep day du"],
    washer: ["may giat", "giat ui", "washer", "giat do"],
    tv: ["tv", "tivi", "truyen hinh"],
    balcony: ["ban cong", "balcony"],
    bathtub: ["bon tam", "bathtub", "bath tub", "bec tam", "jacuzzi", "tam bun", "spa", "hot tub"],
    breakfast: ["an sang", "bua sang", "buffet sang", "breakfast", "bua sang mien phi", "bao gom bua sang"],
    sea_view: ["view bien", "huong bien", "gan bien", "bien", "sea view", "ocean view", "nhin ra bien"],
    mountain_view: ["view nui", "huong nui", "mountain view"],
    garden: ["san vuon", "vuon", "garden", "co san", "co vuon", "san rong", "khuon vien"],
    desk: ["ban lam viec", "cong tac", "workspace", "desk", "lam viec", "remote work"],
    gym: ["phong gym", "gym", "fitness", "tap the duc"],
    bbq: ["bbq", "nuong", "bep nuong", "khu nuong", "lo nuong"],
    pet_friendly: ["cho thu cung", "thu cung", "mang cho", "cho meo", "thu nuoi", "pet"],
};

const propertyTypeSynonyms: Record<PropertyType, string[]> = {
    villa: ["villa", "biet thu", "biet thu nghi duong", "nha rieng lon"],
    apartment: ["can ho", "apartment", "chung cu", "studio"],
    hotel: ["khach san", "hotel"],
    homestay: ["homestay", "home stay", "nha nghi homestay", "nha nghi"],
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

/**
 * Parse a specific date string like "15/6", "15-6", "15/6/2025", or "15 tháng 6".
 * Returns a Date in UTC or null if invalid.
 */
const parseSpecificDateParts = (
    dayStr: string,
    monthStr: string,
    yearStr: string | undefined,
    now: Date,
): Date | null => {
    const day = parseInt(dayStr, 10);
    const month = parseInt(monthStr, 10) - 1; // 0-indexed
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    if (day < 1 || day > 31 || month < 0 || month > 11) {
        return null;
    }

    const year = yearStr ? parseInt(yearStr, 10) : now.getUTCFullYear();
    let candidate = new Date(Date.UTC(year, month, day));

    // Validate – if month overflows (e.g., 31/2), getUTCMonth() won't match
    if (candidate.getUTCMonth() !== month) {
        return null;
    }

    // If no year was specified and the date is in the past, try next year
    if (!yearStr && candidate < today) {
        candidate = new Date(Date.UTC(year + 1, month, day));
        if (candidate.getUTCMonth() !== month) {
            return null;
        }
    }

    return candidate;
};

const parseDateIntent = (normalized: string, now = new Date()): ParsedQueryFilters["dateIntent"] | undefined => {
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    // ── Relative keywords ──────────────────────────────────────────────────────

    if (normalized.includes("hom nay")) {
        return {
            label: "today",
            checkIn: formatDate(today),
            checkOut: formatDate(addDays(today, 1)),
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

    if (normalized.includes("cuoi tuan sau") || normalized.includes("cuoi tuan toi")) {
        const daysUntilNextSaturday = ((6 - today.getUTCDay() + 7) % 7) + 7;
        const checkIn = addDays(today, daysUntilNextSaturday);
        return {
            label: "next_weekend",
            checkIn: formatDate(checkIn),
            checkOut: formatDate(addDays(checkIn, 2)),
        };
    }

    if (normalized.includes("cuoi tuan")) {
        const daysUntilSaturday = (6 - today.getUTCDay() + 7) % 7 || 7;
        const checkIn = addDays(today, daysUntilSaturday);
        return {
            label: "this_weekend",
            checkIn: formatDate(checkIn),
            checkOut: formatDate(addDays(checkIn, 2)),
        };
    }

    if (normalized.includes("tuan toi") || normalized.includes("tuan sau")) {
        const dow = today.getUTCDay(); // 0=Sun
        const daysUntilNextMonday = dow === 0 ? 1 : 8 - dow;
        const checkIn = addDays(today, daysUntilNextMonday);
        return {
            label: "next_week",
            checkIn: formatDate(checkIn),
            checkOut: formatDate(addDays(checkIn, 2)),
        };
    }

    // ── Specific date: "ngày 15 tháng 6", "15 tháng 6 năm 2025" ──────────────
    const textDateMatch = normalized.match(
        /(?:ngay\s+)?(\d{1,2})\s+thang\s+(\d{1,2})(?:\s+(?:nam\s+)?(\d{4}))?/,
    );
    if (textDateMatch) {
        const date = parseSpecificDateParts(textDateMatch[1], textDateMatch[2], textDateMatch[3], now);
        if (date) {
            return {
                label: "specific_date",
                checkIn: formatDate(date),
                checkOut: formatDate(addDays(date, 1)),
            };
        }
    }

    // ── Specific date: "15/6", "ngày 15/6", "15-6", "15/6/2025" ─────────────
    // Use word boundaries to avoid matching prices like "150k"
    const slashDateMatch = normalized.match(
        /(?:ngay\s+)?(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{4}))?\b/,
    );
    if (slashDateMatch) {
        const date = parseSpecificDateParts(slashDateMatch[1], slashDateMatch[2], slashDateMatch[3], now);
        if (date) {
            return {
                label: "specific_date",
                checkIn: formatDate(date),
                checkOut: formatDate(addDays(date, 1)),
            };
        }
    }

    // ── Month only: "tháng sau" ────────────────────────────────────────────────
    if (normalized.includes("thang sau")) {
        const nextMonthIndex = (today.getUTCMonth() + 1) % 12;
        const nextMonthYear =
            today.getUTCMonth() === 11 ? today.getUTCFullYear() + 1 : today.getUTCFullYear();
        const firstOfNextMonth = new Date(Date.UTC(nextMonthYear, nextMonthIndex, 1));
        // Find first Saturday
        const dayOfWeek = firstOfNextMonth.getUTCDay();
        const daysToSaturday = (6 - dayOfWeek + 7) % 7 || 7;
        const checkIn = addDays(firstOfNextMonth, daysToSaturday);
        return {
            label: "next_month",
            checkIn: formatDate(checkIn),
            checkOut: formatDate(addDays(checkIn, 2)),
        };
    }

    // ── Month only: "tháng 6", "tháng 7 năm 2025" ────────────────────────────
    const monthOnlyMatch = normalized.match(/thang\s+(\d{1,2})(?:\s+(?:nam\s+)?(\d{4}))?/);
    if (monthOnlyMatch) {
        const month = parseInt(monthOnlyMatch[1], 10) - 1; // 0-indexed
        const yearInput = monthOnlyMatch[2] ? parseInt(monthOnlyMatch[2], 10) : null;

        if (month >= 0 && month <= 11) {
            let year = yearInput ?? now.getUTCFullYear();
            let firstOfMonth = new Date(Date.UTC(year, month, 1));

            // If month already passed and no year given, try next year
            if (!yearInput && firstOfMonth < today) {
                year += 1;
                firstOfMonth = new Date(Date.UTC(year, month, 1));
            }

            // Find first Saturday of that month
            const dayOfWeek = firstOfMonth.getUTCDay();
            const daysToSaturday = (6 - dayOfWeek + 7) % 7 || 7;
            let checkIn = addDays(firstOfMonth, daysToSaturday);

            // Ensure checkIn is not in the past
            if (checkIn < today) {
                checkIn = today;
            }

            return {
                label: `month_${month + 1}`,
                checkIn: formatDate(checkIn),
                checkOut: formatDate(addDays(checkIn, 2)),
            };
        }
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

    // ── City detection ─────────────────────────────────────────────────────────
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

    // ── Price ──────────────────────────────────────────────────────────────────
    const underPriceMatch = normalized.match(
        /(?:duoi|nho hon|khong qua|toi da|max|<=?)\s*(\d+(?:[,\.]\d+)?)\s*(trieu|m|million|k|nghin|ngan)?/,
    );
    if (underPriceMatch) {
        filters.maxPrice = parsePriceToVnd(underPriceMatch[1], underPriceMatch[2]);
    }

    const fromPriceMatch = normalized.match(
        /(?:tu|tren|lon hon|min|>=?)\s*(\d+(?:[,\.]\d+)?)\s*(trieu|m|million|k|nghin|ngan)?/,
    );
    if (fromPriceMatch) {
        filters.minPrice = parsePriceToVnd(fromPriceMatch[1], fromPriceMatch[2]);
    }

    // ── Guests ────────────────────────────────────────────────────────────────
    const guestMatch = normalized.match(/(\d+)\s*(?:nguoi|khach|guest)/);
    if (guestMatch) {
        filters.guests = Number(guestMatch[1]);
        filters.capacity = filters.guests;
    }

    // Large-group hints without explicit count
    if (
        !filters.guests &&
        (normalized.includes("nhom lon") ||
            normalized.includes("doan") ||
            normalized.includes("ca nha") ||
            normalized.includes("nguyen can"))
    ) {
        filters.guests = 8;
        filters.capacity = 8;
        filters.proximity.push("large_group");
    }

    // ── Property type ─────────────────────────────────────────────────────────
    for (const [propertyType, synonyms] of Object.entries(propertyTypeSynonyms) as Array<[PropertyType, string[]]>) {
        if (synonyms.some((word) => normalized.includes(normalizeVietnameseText(word)))) {
            filters.propertyType = propertyType;
            break;
        }
    }

    // ── Amenities ─────────────────────────────────────────────────────────────
    const mergedAmenitySynonyms = {
        ...amenitySynonyms,
        ...normalizeSynonymRows(synonymRows),
    };

    for (const [code, synonyms] of Object.entries(mergedAmenitySynonyms)) {
        if (synonyms.some((word) => normalized.includes(normalizeVietnameseText(word)))) {
            filters.amenityCodes.push(code);
        }
    }

    // ── Proximity / context ───────────────────────────────────────────────────
    if (
        normalized.includes("gan bien") ||
        normalized.includes("sat bien") ||
        normalized.includes("di bo ra bien") ||
        normalized.includes("ven bien") ||
        normalized.includes("bo bien") ||
        normalized.includes("gan bo bien")
    ) {
        filters.proximity.push("near_beach");
    }

    if (normalized.includes("view bien") || normalized.includes("huong bien") || normalized.includes("nhin ra bien")) {
        filters.proximity.push("sea_view");
    }

    if (
        normalized.includes("yen tinh") ||
        normalized.includes("rieng tu") ||
        normalized.includes("binh yen") ||
        normalized.includes("khong gian rieng")
    ) {
        filters.proximity.push("quiet");
    }

    if (
        normalized.includes("sang trong") ||
        normalized.includes("cao cap") ||
        normalized.includes("luxury") ||
        normalized.includes("xa xi") ||
        normalized.includes("5 sao")
    ) {
        filters.proximity.push("luxury");
    }

    if (
        normalized.includes("binh dan") ||
        normalized.includes("gia re") ||
        normalized.includes("tiet kiem") ||
        normalized.includes("gia tot") ||
        normalized.includes("gia ca hop ly")
    ) {
        filters.proximity.push("budget");
    }

    if (
        normalized.includes("gia dinh co con") ||
        normalized.includes("tre em") ||
        normalized.includes("em be") ||
        normalized.includes("con nho")
    ) {
        filters.proximity.push("family_kids");
    }

    if (
        normalized.includes("lam viec") ||
        normalized.includes("cong tac") ||
        normalized.includes("remote") ||
        normalized.includes("work") ||
        normalized.includes("doanh nhan")
    ) {
        filters.proximity.push("workation");
    }

    // ── Date intent ───────────────────────────────────────────────────────────
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

    // ── Guest context ─────────────────────────────────────────────────────────
    if (guests === 2) {
        parts.push("Phu hop cho cap doi hoac hai nguoi.");
    } else if (guests && guests >= 4 && guests <= 6) {
        parts.push("Phu hop cho gia dinh hoac nhom ban.");
    } else if (guests && guests > 6) {
        parts.push("Can khong gian rong, phu hop cho nhom dong nguoi hoac gia dinh lon.");
    }

    // ── Amenity context ───────────────────────────────────────────────────────
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
        parts.push("Co bon tam, jacuzzi hoac spa, phu hop nghi duong lang man.");
    }

    if (amenityCodes.includes("desk") || parsed.proximity.includes("workation")) {
        parts.push("Phu hop khach cong tac, lam viec tu xa, co khu vuc lam viec yen tinh.");
    }

    if (amenityCodes.includes("bbq")) {
        parts.push("Co khu vuc BBQ nuong ngoai troi.");
    }

    if (amenityCodes.includes("garden")) {
        parts.push("Co san vuon, khuon vien xanh, khong gian ngoai troi rong.");
    }

    if (amenityCodes.includes("kitchen")) {
        parts.push("Co bep day du tien nghi de tu nau an.");
    }

    if (amenityCodes.includes("pet_friendly")) {
        parts.push("Cho phep mang theo thu cung.");
    }

    // ── Style / vibe context ──────────────────────────────────────────────────
    if (parsed.proximity.includes("quiet")) {
        parts.push("Khong gian yen tinh, rieng tu, tranh xa on ao.");
    }

    if (parsed.proximity.includes("luxury")) {
        parts.push("Phong cach sang trong, cao cap, tien nghi day du.");
    }

    if (parsed.proximity.includes("budget")) {
        parts.push("Gia ca phai chang, tiet kiem, phu hop ngan sach.");
    }

    if (parsed.proximity.includes("family_kids")) {
        parts.push("An toan cho tre em, phu hop gia dinh co con nho.");
    }

    if (parsed.proximity.includes("large_group")) {
        parts.push("Khong gian rong, phong ngu nhieu, phu hop doan dong.");
    }

    // ── Property type context ─────────────────────────────────────────────────
    const propertyType = input.propertyType ?? parsed.propertyType;
    if (propertyType) {
        parts.push(`Loai cho o mong muon: ${propertyType}.`);
    }

    // ── Date context ──────────────────────────────────────────────────────────
    if (parsed.dateIntent?.label) {
        parts.push(`Ngu canh thoi gian: ${parsed.dateIntent.label}.`);
    }

    // ── Location context ──────────────────────────────────────────────────────
    const matchedLocationGroups = detectLocationGroupsFromQuery(input.query);
    if (matchedLocationGroups.length > 0) {
        parts.push("Uu tien luu tru tai khu vuc duoc nhan dien tu dia chi hoac ten duong.");

        for (const groupName of matchedLocationGroups) {
            parts.push(buildLocationSemanticBoost(groupName));
        }
    }

    return parts.join(" ").replace(/\s+/g, " ").trim();
};
