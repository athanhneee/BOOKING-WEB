import { ParsedQueryFilters, SemanticSearchRequest } from "./semantic-search.types";
import { normalizeVietnameseText, uniqueStrings } from "./semantic-search.utils";

const cityAliases: Record<string, string> = {
        "ho chi minh": "TP Hồ Chí Minh",
    "tp ho chi minh": "TP Hồ Chí Minh",
    "sai gon": "TP Hồ Chí Minh",
    "saigon": "TP Hồ Chí Minh",
    "vung tau": "Vũng Tàu",
    "vungtau": "Vũng Tàu",
    "tp vung tau": "Vũng Tàu",
    "thanh pho vung tau": "Vũng Tàu",

};

/**
 * Chỉ phục vụ semantic search cho Vũng Tàu.
 * Không thêm field mới vào ParsedQueryFilters để tránh phải sửa type/schema/service khác.
 * File này chỉ dùng các alias này để:
 * 1. Tự nhận city = Vũng Tàu nếu người dùng chỉ gõ "Bãi Sau", "Bãi Trước",...
 * 2. Bổ sung ngữ cảnh vào semantic query để vector search hiểu đúng khu vực.
 */
type VungTauAreaProfile = {
    displayName: string;
    aliases: string[];
    semanticBoost: string;
};

const vungTauAreaProfiles: Record<string, VungTauAreaProfile> = {
    bai_truoc: {
        displayName: "Bãi Trước",
        aliases: [
            "bai truoc",
            "front beach",
            "tam duong",
            "cong vien tam duong",
            "duong quang trung",
            "gan bai truoc",
            "gan bien bai truoc",
        ],
        semanticBoost:
            "Ưu tiên khu Bãi Trước Vũng Tàu, gần công viên Tam Dương, đường Quang Trung, trung tâm thành phố, thuận tiện đi dạo biển và ăn uống.",
    },

    bai_sau: {
        displayName: "Bãi Sau",
        aliases: [
            "bai sau",
            "back beach",
            "thuy van",
            "duong thuy van",
            "bien thuy van",
            "gan bai sau",
            "gan bien bai sau",
            "khu bai sau",
        ],
        semanticBoost:
            "Ưu tiên khu Bãi Sau Vũng Tàu, gần biển Thùy Vân, phù hợp tắm biển, nghỉ dưỡng, căn hộ khách sạn gần biển.",
    },

    bai_long_cung: {
        displayName: "Bãi Long Cung",
        aliases: [
            "bai long cung",
            "long cung",
            "bien long cung",
            "khu long cung",
            "gan bai long cung",
            "gan bien long cung",
        ],
        semanticBoost:
            "Ưu tiên khu Bãi Long Cung Vũng Tàu, không gian nghỉ dưỡng yên tĩnh, gần biển Long Cung, phù hợp gia đình hoặc nhóm bạn.",
    },

    bai_dau: {
        displayName: "Bãi Dâu",
        aliases: [
            "bai dau",
            "bien bai dau",
            "khu bai dau",
            "gan bai dau",
            "gan bien bai dau",
            "tran phu bai dau",
            "duong tran phu bai dau",
        ],
        semanticBoost:
            "Ưu tiên khu Bãi Dâu Vũng Tàu, đường Trần Phú, không gian yên tĩnh, gần biển, phù hợp nghỉ dưỡng riêng tư.",
    },

    bai_dua: {
        displayName: "Bãi Dứa",
        aliases: [
            "bai dua",
            "bien bai dua",
            "khu bai dua",
            "gan bai dua",
            "gan bien bai dua",
            "ha long bai dua",
            "duong ha long bai dua",
        ],
        semanticBoost:
            "Ưu tiên khu Bãi Dứa Vũng Tàu, gần đường Hạ Long, gần biển, phù hợp nghỉ dưỡng, ngắm biển và di chuyển ra trung tâm.",
    },

    bai_vong_nguyet: {
        displayName: "Bãi Vọng Nguyệt",
        aliases: [
            "bai vong nguyet",
            "vong nguyet",
            "mui nghinh phong",
            "nghinh phong",
            "gan mui nghinh phong",
            "gan bai vong nguyet",
        ],
        semanticBoost:
            "Ưu tiên khu Bãi Vọng Nguyệt, Mũi Nghinh Phong Vũng Tàu, phù hợp ngắm cảnh, check-in, gần biển và không gian nghỉ dưỡng.",
    },

    chi_linh: {
        displayName: "Chí Linh",
        aliases: [
            "chi linh",
            "bai chi linh",
            "bien chi linh",
            "khu chi linh",
            "gan bai chi linh",
            "khu do thi chi linh",
        ],
        semanticBoost:
            "Ưu tiên khu Chí Linh Vũng Tàu, gần biển, khu đô thị yên tĩnh, phù hợp căn hộ nghỉ dưỡng hoặc lưu trú gia đình.",
    },

    ho_tram_ho_coc: {
        displayName: "Hồ Tràm / Hồ Cốc",
        aliases: [
            "ho tram",
            "ho coc",
            "bien ho tram",
            "bien ho coc",
            "gan ho tram",
            "gan ho coc",
            "xuyen moc",
        ],
        semanticBoost:
            "Ưu tiên khu Hồ Tràm hoặc Hồ Cốc gần Vũng Tàu, phù hợp resort, nghỉ dưỡng biển, không gian yên tĩnh và cao cấp.",
    },
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

    /**
     * Giữ sea_view như cũ nhưng lưu ý:
     * - "bien" rất rộng.
     * - Với Vũng Tàu, các khu Bãi Sau/Bãi Trước/Bãi Dâu/... sẽ được boost riêng
     *   bằng vungTauAreaProfiles phía trên.
     */
    sea_view: ["view bien", "huong bien", "gan bien", "bien", "sea view", "ocean view"],

    mountain_view: ["view nui", "huong nui", "mountain view"],
    garden: ["san vuon", "vuon", "garden"],
    desk: ["ban lam viec", "cong tac", "workspace", "desk"],
    gym: ["phong gym", "gym", "fitness"],
};

const getMatchedVungTauAreas = (normalizedQuery: string): VungTauAreaProfile[] => {
    const matched = Object.values(vungTauAreaProfiles).filter((area) =>
        area.aliases.some((alias) => normalizedQuery.includes(normalizeVietnameseText(alias))),
    );

    const seen = new Set<string>();

    return matched.filter((area) => {
        if (seen.has(area.displayName)) {
            return false;
        }

        seen.add(area.displayName);
        return true;
    });
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

    /**
     * Nếu user chỉ nhập:
     * - "khách sạn gần Bãi Sau"
     * - "villa Bãi Long Cung"
     * - "homestay Bãi Dâu"
     *
     * Thì vẫn tự hiểu city = Vũng Tàu.
     */
    const matchedVungTauAreas = getMatchedVungTauAreas(normalized);

    if (matchedVungTauAreas.length > 0 && !filters.city) {
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
    const normalized = normalizeVietnameseText(input.query);
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

    /**
     * Boost ngữ cảnh semantic cho riêng Vũng Tàu.
     * Không cần thêm field mới vào ParsedQueryFilters.
     */
    const matchedVungTauAreas = getMatchedVungTauAreas(normalized);

    if (matchedVungTauAreas.length > 0) {
        parts.push("Ưu tiên lưu trú tại thành phố Vũng Tàu.");

        for (const area of matchedVungTauAreas) {
            parts.push(area.semanticBoost);
        }
    }

    return parts.join(" ").replace(/\s+/g, " ").trim();
};