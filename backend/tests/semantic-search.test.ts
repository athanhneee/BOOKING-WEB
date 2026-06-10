const assert = require("node:assert/strict");
const { afterEach, describe, it } = require("node:test");

process.env.NODE_ENV = "test";
process.env.JWT_SECRET_KEY = "test-secret";
process.env.SEMANTIC_FORCE_VUNG_TAU_ONLY = "true";

type PatchEntry = [Record<string, unknown>, string, unknown];

const patches: PatchEntry[] = [];

const patch = (target: Record<string, unknown>, key: string, value: unknown) => {
    patches.push([target, key, target[key]]);
    target[key] = value;
};

afterEach(() => {
    while (patches.length > 0) {
        const [target, key, value] = patches.pop()!;
        target[key] = value;
    }
});

describe("semantic search query understanding", () => {
    it("parses Vietnamese travel intent into hard filters and semantic hints", () => {
        const { parseSearchQuery } = require("../dist/modules/semantic-search/semantic-search.parser");

        const parsed = parseSearchQuery(
            "villa gan bien co ho boi cho 15 nguoi o Bai Sau cuoi tuan nay",
            [],
            new Date("2026-06-01T00:00:00.000Z"),
        );

        assert.equal(parsed.propertyType, "villa");
        assert.equal(parsed.guests, 15);
        assert.equal(parsed.capacity, 15);
        assert.equal(parsed.amenityCodes.includes("pool"), true);
        assert.equal(parsed.proximity.includes("near_beach"), true);
        assert.equal(parsed.locationIntent.areaKeys.includes("bai_sau"), true);
        assert.deepEqual(parsed.dateIntent, {
            label: "this_weekend",
            checkIn: "2026-06-06",
            checkOut: "2026-06-08",
        });
    });

    it("parses date ranges without silently rolling past dates into next year", () => {
        const { parseSearchQuery } = require("../dist/modules/semantic-search/semantic-search.parser");
        const now = new Date("2026-06-10T00:00:00+07:00");

        const pastRange = parseSearchQuery("villa vung tau 6/6 - 19/6", [], now);
        assert.equal(pastRange.dateIntent.reason, "PAST_DATE_IN_QUERY");
        assert.notEqual(pastRange.dateIntent.checkIn, "2027-06-06");
        assert.notEqual(pastRange.dateIntent.checkOut, "2027-06-07");

        const futureRange = parseSearchQuery("villa vung tau 15/6 - 19/6", [], now);
        assert.deepEqual(futureRange.dateIntent, {
            label: "date_range",
            checkIn: "2026-06-15",
            checkOut: "2026-06-19",
        });

        const shortRange = parseSearchQuery("villa bai sau 10-12/7", [], now);
        assert.deepEqual(shortRange.dateIntent, {
            label: "date_range",
            checkIn: "2026-07-10",
            checkOut: "2026-07-12",
        });

        const pastMonth = parseSearchQuery("villa vung tau 7/2025", [], now);
        assert.equal(pastMonth.dateIntent.reason, "PAST_DATE_NOT_ALLOWED");

        const thisWeekend = parseSearchQuery("villa cuoi tuan nay", [], now);
        assert.deepEqual(thisWeekend.dateIntent, {
            label: "this_weekend",
            checkIn: "2026-06-13",
            checkOut: "2026-06-15",
        });

        const tomorrow = parseSearchQuery("villa ngay mai", [], now);
        assert.deepEqual(tomorrow.dateIntent, {
            label: "tomorrow",
            checkIn: "2026-06-11",
            checkOut: "2026-06-12",
        });

        const crossYear = parseSearchQuery("villa vung tau 30/12 - 2/1", [], now);
        assert.deepEqual(crossYear.dateIntent, {
            label: "date_range",
            checkIn: "2026-12-30",
            checkOut: "2027-01-02",
        });
    });
});

describe("semantic listing search document", () => {
    it("includes listing fields, rules, beach distance, image AI tags, and review highlights", () => {
        const { buildListingSearchDocument } = require("../dist/modules/semantic-search/semantic-search.repository");
        const document = buildListingSearchDocument({
            listing: {
                listingId: 801,
                title: "Villa Bai Sau",
                description: "Large villa with private pool",
                addressLine: "12 Thuy Van",
                ward: "Ward 2",
                district: "Vung Tau",
                city: "Vung Tau",
                stateRegion: "Ba Ria - Vung Tau",
                latitude: 10.334,
                longitude: 107.087,
                propertyType: "villa",
                roomType: "entire_place",
                maxGuests: 15,
                bedrooms: 5,
                beds: 7,
                bathrooms: 4,
                basePrice: 3000000,
                weekendPrice: 4000000,
                currency: "VND",
                checkInFrom: "14:00",
                checkOutBefore: "12:00",
                smokingAllowed: false,
                petsAllowed: true,
                partyAllowed: false,
                quietHours: "22:00-07:00",
                aiImageTags: ["pool", "sea view"],
                aiImageSummary: "AI nhan dien co ho boi va ban cong.",
            },
            amenityIds: [5],
            amenityNames: ["Pool"],
            rules: {
                checkInFrom: "14:00",
                checkOutBefore: "12:00",
                smokingAllowed: false,
                petsAllowed: true,
                partyAllowed: false,
                quietHours: "22:00-07:00",
            },
            reviewSummary: {
                ratingAvg: 4.9,
                reviewCount: 8,
                reviewSnippets: ["Gan bien, ho boi sach"],
            },
        });

        assert.match(document, /title: Villa Bai Sau/);
        assert.match(document, /maxGuests: 15/);
        assert.match(document, /amenities: Pool/);
        assert.match(document, /rules:/);
        assert.match(document, /distanceToBeach:/);
        assert.match(document, /aiImageTags: pool, sea view/);
        assert.match(document, /aiImageSummary:/);
        assert.match(document, /reviewHighlights: Gan bien, ho boi sach/);
    });
});

describe("semantic search fallback and scoring", () => {
    it("falls back to keyword search and returns only repository-backed listings", async () => {
        const embedding = require("../dist/modules/semantic-search/embedding.service");
        const repository = require("../dist/modules/semantic-search/semantic-search.repository");
        const service = require("../dist/modules/semantic-search/semantic-search.service");

        patch(embedding, "generateEmbedding", async () => {
            throw new Error("OpenAI down");
        });
        patch(repository, "listSemanticSynonymRows", async () => []);
        patch(repository, "resolveAmenityIds", async () => []);
        patch(repository, "recordSemanticSearchLog", async () => undefined);
        patch(repository, "keywordSearchFallback", async () => [
            {
                listingId: 901,
                title: "Villa Bai Sau",
                description: "Villa gan bien co ho boi",
                basePrice: 3000000,
                weekendPrice: null,
                currency: "VND",
                ratingAvg: 5,
                reviewCount: 9,
                isAvailable: true,
                addressLine: "12 Thuy Van",
                ward: "Ward 2",
                district: "Vung Tau",
                city: "Vung Tau",
                vungTauAreas: ["Bai Sau"],
                vungTauAreaKeys: ["bai_sau"],
                propertyType: "villa",
                roomType: "entire_place",
                maxGuests: 15,
                bedrooms: 5,
                beds: 7,
                bathrooms: 4,
                imageUrl: null,
                semanticScore: 0.35,
                keywordScore: 0,
                locationScore: 0,
                availabilityScore: 1,
                popularityScore: 0,
                finalScore: 0,
                scoreBreakdown: {
                    semanticScore: 0.35,
                    keywordScore: 0,
                    locationScore: 0,
                    availabilityScore: 1,
                    popularityScore: 0,
                },
                matchedReasons: [],
            },
        ]);

        const result = await service.semanticSearchListings({
            query: "villa gan bien Bai Sau",
            guests: 10,
            limit: 5,
        });

        assert.equal(result.mode, "keyword_fallback");
        assert.equal(result.fallback, true);
        assert.deepEqual(result.items.map((item: { listingId: number }) => item.listingId), [901]);
        assert.equal(result.items[0].scoreBreakdown.availabilityScore, 1);
        assert.equal(result.items[0].finalScore > 0, true);
        assert.equal(result.searchMeta.parsedFilters.propertyType, "villa");
    });

    it("falls back to keyword search when all vector hits are below semantic threshold", async () => {
        const embedding = require("../dist/modules/semantic-search/embedding.service");
        const qdrant = require("../dist/modules/semantic-search/qdrant-vector.service");
        const repository = require("../dist/modules/semantic-search/semantic-search.repository");
        const service = require("../dist/modules/semantic-search/semantic-search.service");

        patch(embedding, "generateEmbedding", async () => [0.1, 0.2, 0.3]);
        patch(qdrant, "searchListingVectors", async () => [
            {
                id: 902,
                score: 0.12,
                payload: { listing_id: 902 },
            },
        ]);
        patch(repository, "listSemanticSynonymRows", async () => []);
        patch(repository, "resolveAmenityIds", async () => []);
        patch(repository, "recordSemanticSearchLog", async () => undefined);
        patch(repository, "keywordSearchFallback", async () => [
            {
                listingId: 902,
                title: "Villa Vung Tau",
                description: "Villa active tai Vung Tau",
                basePrice: 3000000,
                weekendPrice: null,
                currency: "VND",
                ratingAvg: 4.8,
                reviewCount: 3,
                isAvailable: true,
                addressLine: "12 Thuy Van",
                ward: "Ward 2",
                district: "Vung Tau",
                city: "Vung Tau",
                vungTauAreas: ["Bai Sau"],
                vungTauAreaKeys: ["bai_sau"],
                propertyType: "villa",
                roomType: "entire_place",
                maxGuests: 10,
                bedrooms: 4,
                beds: 5,
                bathrooms: 4,
                imageUrl: null,
                semanticScore: 0,
                keywordScore: 0,
                locationScore: 0,
                availabilityScore: 1,
                popularityScore: 0,
                finalScore: 0,
                scoreBreakdown: {
                    semanticScore: 0,
                    keywordScore: 0,
                    locationScore: 0,
                    availabilityScore: 1,
                    popularityScore: 0,
                },
                matchedReasons: [],
            },
        ]);

        const result = await service.semanticSearchListings({
            query: "villa vung tau",
            limit: 5,
        });

        assert.equal(result.mode, "keyword_fallback");
        assert.equal(result.fallback, true);
        assert.deepEqual(result.items.map((item: { listingId: number }) => item.listingId), [902]);
    });

    it("rejects invalid intent and unsupported cities before returning Vung Tau listings", async () => {
        const embedding = require("../dist/modules/semantic-search/embedding.service");
        const repository = require("../dist/modules/semantic-search/semantic-search.repository");
        const service = require("../dist/modules/semantic-search/semantic-search.service");

        patch(embedding, "generateEmbedding", async () => {
            throw new Error("Embedding should not be called for rejected searches");
        });
        patch(repository, "listSemanticSynonymRows", async () => []);
        patch(repository, "resolveAmenityIds", async () => []);
        patch(repository, "recordSemanticSearchLog", async () => undefined);
        patch(repository, "keywordSearchFallback", async () => {
            throw new Error("Keyword fallback should not run for rejected searches");
        });

        const invalid = await service.semanticSearchListings({ query: "hello" });
        assert.equal(invalid.reason, "INVALID_SEARCH_INTENT");
        assert.equal(invalid.items.length, 0);

        const unsupported = await service.semanticSearchListings({ query: "villa nha trang" });
        assert.equal(unsupported.reason, "UNSUPPORTED_LOCATION");
        assert.equal(unsupported.items.length, 0);
    });

    it("treats central tourism queries as soft area preference for fallback search", async () => {
        const embedding = require("../dist/modules/semantic-search/embedding.service");
        const repository = require("../dist/modules/semantic-search/semantic-search.repository");
        const service = require("../dist/modules/semantic-search/semantic-search.service");

        let capturedFilters: any = null;

        patch(embedding, "generateEmbedding", async () => {
            throw new Error("Qdrant unavailable");
        });
        patch(repository, "listSemanticSynonymRows", async () => []);
        patch(repository, "resolveAmenityIds", async () => []);
        patch(repository, "recordSemanticSearchLog", async () => undefined);
        patch(repository, "keywordSearchFallback", async (filters: Record<string, unknown>) => {
            capturedFilters = filters;
            return [];
        });

        const result = await service.semanticSearchListings({ query: "villa trung tam", limit: 5 });

        assert.equal(result.mode, "keyword_fallback");
        assert.equal(capturedFilters?.locationAreaFilterMode, "soft");
        assert.equal((capturedFilters?.vungTauAreaKeys as string[]).includes("trung_tam"), true);
        assert.equal((capturedFilters?.vungTauAreaKeys as string[]).includes("bai_sau"), true);
        assert.equal((capturedFilters?.vungTauAreaKeys as string[]).includes("thuy_van"), true);
    });
});

export {};
