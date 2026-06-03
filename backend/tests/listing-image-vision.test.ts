const assert = require("node:assert/strict");
const { describe, it } = require("node:test");

process.env.NODE_ENV = "test";
process.env.JWT_SECRET_KEY = "test-secret";

type VisionResult = {
    caption: string;
    roomType: string;
    objects: string[];
    amenities: string[];
    styleTags: string[];
    qualityTags: string[];
    searchTags: string[];
    confidence: number;
};

describe("listing image vision multi-label taxonomy", () => {
    it("maps bedroom, pool, BBQ, toilet, and sea-view uploads to canonical image tags", () => {
        const { mapVisionResultToTaxonomyTags } = require("../dist/modules/ai/listing-image-vision.service");
        const cases: Array<{ name: string; result: VisionResult; expectedTags: string[] }> = [
            {
                name: "bedroom upload",
                result: {
                    caption: "Phòng ngủ sáng, có giường đôi và máy lạnh.",
                    roomType: "bedroom",
                    objects: ["giường đôi", "máy lạnh"],
                    amenities: ["máy lạnh"],
                    styleTags: ["hiện đại"],
                    qualityTags: [],
                    searchTags: ["phòng ngủ", "giường đôi", "máy lạnh", "hiện đại"],
                    confidence: 0.93,
                },
                expectedTags: ["bedroom", "double_bed", "air_conditioner", "modern"],
            },
            {
                name: "pool upload",
                result: {
                    caption: "Hồ bơi ngoài trời cạnh sân vườn.",
                    roomType: "pool",
                    objects: [],
                    amenities: ["hồ bơi", "sân vườn"],
                    styleTags: [],
                    qualityTags: ["phù hợp gia đình"],
                    searchTags: ["hồ bơi", "sân vườn", "phù hợp gia đình"],
                    confidence: 0.91,
                },
                expectedTags: ["pool", "garden", "family_friendly"],
            },
            {
                name: "BBQ upload",
                result: {
                    caption: "Khu BBQ ngoài trời có bàn ăn dài.",
                    roomType: "bbq_area",
                    objects: ["bàn ăn"],
                    amenities: ["BBQ"],
                    styleTags: [],
                    qualityTags: ["phù hợp nhóm đông người"],
                    searchTags: ["BBQ", "bàn ăn", "phù hợp nhóm đông người"],
                    confidence: 0.88,
                },
                expectedTags: ["bbq", "dining_table", "large_group_friendly"],
            },
            {
                name: "toilet upload",
                result: {
                    caption: "Toilet sạch có bồn tắm.",
                    roomType: "bathroom",
                    objects: ["bồn tắm"],
                    amenities: ["toilet"],
                    styleTags: [],
                    qualityTags: [],
                    searchTags: ["toilet", "bồn tắm"],
                    confidence: 0.9,
                },
                expectedTags: ["toilet", "bathtub"],
            },
            {
                name: "sea view upload",
                result: {
                    caption: "Ban công nhìn ra biển.",
                    roomType: "balcony",
                    objects: [],
                    amenities: ["ban công"],
                    styleTags: ["sang trọng"],
                    qualityTags: [],
                    searchTags: ["ban công", "view biển", "sang trọng"],
                    confidence: 0.89,
                },
                expectedTags: ["balcony", "sea_view", "luxury"],
            },
        ];

        for (const item of cases) {
            const tags = mapVisionResultToTaxonomyTags(item.result).map((tag: { code: string }) => tag.code);

            for (const expectedTag of item.expectedTags) {
                assert.equal(tags.includes(expectedTag), true, `${item.name} should include ${expectedTag}`);
            }
        }
    });
});

export {};
