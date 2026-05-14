export const normalizeVietnameseText = (value: string) =>
    value
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .toLowerCase()
        .trim()
        .replace(/đ/g, "d")
        .replace(/[^a-z0-9]+/g, " ")
        .replace(/\s+/g, " ");

export const normalizeKey = (value: string) => normalizeVietnameseText(value).replace(/\s+/g, "_");

export const uniqueNumbers = (values: number[]) =>
    Array.from(new Set(values.filter((value) => Number.isFinite(value))));

export const uniqueStrings = (values: string[]) =>
    Array.from(new Set(values.map((item) => item.trim()).filter(Boolean)));

export const toNumber = (value: unknown, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

export const listNights = (checkIn: string, checkOut: string) => {
    const dates: string[] = [];
    const cursor = new Date(`${checkIn}T00:00:00.000Z`);
    const end = new Date(`${checkOut}T00:00:00.000Z`);

    while (cursor < end) {
        dates.push(cursor.toISOString().slice(0, 10));
        cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    return dates;
};

export const getSemanticDefaultCity = () => process.env.SEMANTIC_DEFAULT_CITY || "Vũng Tàu";

export const shouldForceVungTauOnly = () =>
    (process.env.SEMANTIC_FORCE_VUNG_TAU_ONLY ?? "true").toLowerCase() !== "false";

type VungTauAreaDefinition = {
    key: string;
    displayName: string;
    aliases: string[];
};

const vungTauAreaDefinitions: VungTauAreaDefinition[] = [
    {
        key: "bai_truoc",
        displayName: "Bãi Trước",
        aliases: [
            "bai truoc",
            "front beach",
            "tam duong",
            "cong vien tam duong",
            "quang trung",
            "duong quang trung",
        ],
    },
    {
        key: "bai_sau",
        displayName: "Bãi Sau",
        aliases: [
            "bai sau",
            "back beach",
            "thuy van",
            "duong thuy van",
            "bien thuy van",
        ],
    },
    {
        key: "bai_long_cung",
        displayName: "Bãi Long Cung",
        aliases: [
            "bai long cung",
            "long cung",
            "bien long cung",
            "khu long cung",
        ],
    },
    {
        key: "bai_dau",
        displayName: "Bãi Dâu",
        aliases: [
            "bai dau",
            "tran phu bai dau",
            "duong tran phu",
            "bien bai dau",
        ],
    },
    {
        key: "bai_dua",
        displayName: "Bãi Dứa",
        aliases: [
            "bai dua",
            "duong ha long",
            "ha long bai dua",
            "bien bai dua",
        ],
    },
    {
        key: "bai_vong_nguyet",
        displayName: "Bãi Vọng Nguyệt / Mũi Nghinh Phong",
        aliases: [
            "bai vong nguyet",
            "vong nguyet",
            "mui nghinh phong",
            "nghinh phong",
        ],
    },
    {
        key: "chi_linh",
        displayName: "Chí Linh",
        aliases: [
            "chi linh",
            "bai chi linh",
            "khu do thi chi linh",
            "bien chi linh",
        ],
    },
    {
        key: "ho_tram_ho_coc",
        displayName: "Hồ Tràm / Hồ Cốc",
        aliases: [
            "ho tram",
            "ho coc",
            "xuyen moc",
            "bien ho tram",
            "bien ho coc",
        ],
    },
];

export const inferVungTauAreaKeys = (text: string) => {
    const normalized = normalizeVietnameseText(text);

    return uniqueStrings(
        vungTauAreaDefinitions
            .filter((area) =>
                area.aliases.some((alias) => normalized.includes(normalizeVietnameseText(alias))),
            )
            .map((area) => area.key),
    );
};

export const getVungTauAreaDisplayName = (key: string) =>
    vungTauAreaDefinitions.find((area) => area.key === key)?.displayName ?? key;

export const getVungTauAreaDisplayNames = (keys: string[]) =>
    keys.map(getVungTauAreaDisplayName);

export const isVungTauRelatedText = (text: string) => {
    const normalized = normalizeVietnameseText(text);

    if (
        normalized.includes("vung tau") ||
        normalized.includes("ba ria vung tau") ||
        normalized.includes("br vt")
    ) {
        return true;
    }

    return inferVungTauAreaKeys(text).length > 0;
};

export const buildLocationKeys = (input: {
    city: string;
    district: string;
    ward: string;
    addressLine: string;
    title?: string;
    description?: string;
}) => {
    const text = [
        input.city,
        input.district,
        input.ward,
        input.addressLine,
        input.title ?? "",
        input.description ?? "",
    ].join(" ");

    const keys = [
        normalizeKey(input.city),
        normalizeKey(input.district),
        normalizeKey(input.ward),
        ...inferVungTauAreaKeys(text),
    ];

    if (isVungTauRelatedText(text)) {
        keys.push("vung_tau");
    }

    return uniqueStrings(keys);
};