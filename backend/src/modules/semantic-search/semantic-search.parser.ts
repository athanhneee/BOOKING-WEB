import {
    detectLocationGroupsFromQuery,
    type LocationGroupName,
} from "../../common/vung-tau-location-groups";
import { ParsedQueryFilters, SemanticSearchRequest } from "./semantic-search.types";
import { normalizeVietnameseText, uniqueStrings } from "./semantic-search.utils";

const cityAliases: Record<string, string> = {
    "ho chi minh": "TP Hồ Chí Minh",
    "tp ho chi minh": "TP Hồ Chí Minh",
    "sai gon": "TP Hồ Chí Minh",
    saigon: "TP Hồ Chí Minh",
    "vung tau": "Vũng Tàu",
    vungtau: "Vũng Tàu",
    "tp vung tau": "Vũng Tàu",
    "thanh pho vung tau": "Vũng Tàu",
};

const locationSemanticBoosts: Record<LocationGroupName, string> = {
    "Bãi Sau":
        "Ưu tiên khu Bãi Sau Vũng Tàu, gồm Thùy Vân, Hoàng Hoa Thám, Phan Chu Trinh, Lê Hồng Phong, Võ Thị Sáu và các tuyến gần biển.",
    "Bãi Trước / Dâu":
        "Ưu tiên khu Bãi Trước / Dâu Vũng Tàu, gồm Trần Phú, Hạ Long, Quang Trung, Ba Cu, Lê Lợi, Vi Ba và các tuyến trung tâm ven biển.",
    "Long Cung":
        "Ưu tiên khu Long Cung Vũng Tàu, gồm Hoành Sơn, Chí Linh, Hà Huy Tập, Nguyễn Hữu Cảnh, 3 Tháng 2, An Hải và Thùy Dương.",
    "Hồ Tràm / Long Hải / Phước Hải":
        "Ưu tiên khu Hồ Tràm, Long Hải, Phước Hải, đường ven biển, đường bờ kè hoặc Lộc An - Bình Châu, phù hợp resort và nghỉ dưỡng biển.",
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

export const parseSearchQuery = (query: string): ParsedQueryFilters => {
    const normalized = normalizeVietnameseText(query);
    const filters: ParsedQueryFilters = {
        amenityCodes: [],
    };

    for (const [alias, city] of Object.entries(cityAliases)) {
        if (normalized.includes(alias)) {
            filters.city = city;
            break;
        }
    }

    const matchedLocationGroups = detectLocationGroupsFromQuery(query);

    if (matchedLocationGroups.length > 0 && !filters.city) {
        filters.city = "Vũng Tàu";
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
    }

    for (const [code, synonyms] of Object.entries(amenitySynonyms)) {
        if (synonyms.some((word) => normalized.includes(normalizeVietnameseText(word)))) {
            filters.amenityCodes.push(code);
        }
    }

    filters.amenityCodes = uniqueStrings(filters.amenityCodes);

    return filters;
};

export const buildSemanticQuery = (input: SemanticSearchRequest, parsed: ParsedQueryFilters) => {
    const parts = [input.query.trim()];
    const guests = input.guests ?? parsed.guests;

    if (guests === 2) {
        parts.push("Phù hợp cho cặp đôi hoặc hai người.");
    } else if (guests && guests >= 4) {
        parts.push("Phù hợp cho gia đình hoặc nhóm bạn.");
    }

    const amenityCodes = uniqueStrings([
        ...(parsed.amenityCodes ?? []),
        ...((input.amenities ?? []).map(String)),
    ]);

    if (amenityCodes.includes("sea_view")) {
        parts.push("Ưu tiên gần biển, hướng biển, view biển, nghỉ dưỡng.");
    }

    if (amenityCodes.includes("pool")) {
        parts.push("Có hồ bơi hoặc bể bơi.");
    }

    if (amenityCodes.includes("bathtub")) {
        parts.push("Có bồn tắm, phù hợp nghỉ dưỡng lãng mạn.");
    }

    if (amenityCodes.includes("desk")) {
        parts.push("Phù hợp khách công tác, có khu vực làm việc.");
    }

    const matchedLocationGroups = detectLocationGroupsFromQuery(input.query);

    if (matchedLocationGroups.length > 0) {
        parts.push("Ưu tiên lưu trú tại khu vực kinh doanh được nhận diện từ địa chỉ hoặc tên đường.");

        for (const groupName of matchedLocationGroups) {
            parts.push(locationSemanticBoosts[groupName]);
        }
    }

    return parts.join(" ").replace(/\s+/g, " ").trim();
};
