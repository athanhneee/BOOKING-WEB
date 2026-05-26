import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import OpenAI from "openai";
import { z } from "zod";

import { ApiError } from "../../common/api-error";
import { getEnv } from "../../config/env";
import Listing from "../../models/listing";
import ListingImage from "../../models/listing-image";
import { checkListingOwner, type HostActor } from "../host-listings/host-listings.service";

const imageTypeValues = [
    "bedroom",
    "living_room",
    "kitchen",
    "bathroom",
    "pool",
    "balcony",
    "garden",
    "rooftop",
    "parking",
    "bbq_area",
    "dining_area",
    "front_view",
    "outdoor_area",
    "hallway",
    "stairs",
    "sea_view",
    "city_view",
    "other",
] as const;

export type AiImageType = (typeof imageTypeValues)[number];

const displayTitleByType: Record<AiImageType, string> = {
    bedroom: "Phòng ngủ",
    living_room: "Phòng khách",
    kitchen: "Nhà bếp",
    bathroom: "Phòng tắm",
    pool: "Hồ bơi",
    balcony: "Ban công",
    garden: "Sân vườn",
    rooftop: "Sân thượng",
    parking: "Chỗ đậu xe",
    bbq_area: "Khu BBQ",
    dining_area: "Khu vực ăn uống",
    front_view: "Mặt tiền villa",
    outdoor_area: "Không gian ngoài trời",
    hallway: "Hành lang",
    stairs: "Cầu thang",
    sea_view: "View biển",
    city_view: "View thành phố",
    other: "Ảnh chỗ nghỉ",
};

const aiVisionResponseSchema = z.object({
    isValidPropertyImage: z.boolean(),
    imageType: z.enum(imageTypeValues),
    displayTitleVi: z.string().trim().min(1).max(120),
    descriptionVi: z.string().trim().min(1).max(1000),
    sceneTags: z.array(z.string().trim().min(1).max(80)).max(12),
    amenityTags: z.array(z.string().trim().min(1).max(80)).max(12),
    confidence: z.number().min(0).max(1),
    qualityWarnings: z.array(z.string().trim().min(1).max(120)).max(8),
});

type AiVisionResponse = z.infer<typeof aiVisionResponseSchema>;

type AnalyzeListingImagesOptions = {
    force?: boolean;
};

const imageAnalysisJsonSchema = {
    type: "object",
    additionalProperties: false,
    required: [
        "isValidPropertyImage",
        "imageType",
        "displayTitleVi",
        "descriptionVi",
        "sceneTags",
        "amenityTags",
        "confidence",
        "qualityWarnings",
    ],
    properties: {
        isValidPropertyImage: { type: "boolean" },
        imageType: { type: "string", enum: imageTypeValues },
        displayTitleVi: { type: "string", minLength: 1, maxLength: 120 },
        descriptionVi: { type: "string", minLength: 1, maxLength: 1000 },
        sceneTags: {
            type: "array",
            maxItems: 12,
            items: { type: "string", minLength: 1, maxLength: 80 },
        },
        amenityTags: {
            type: "array",
            maxItems: 12,
            items: { type: "string", minLength: 1, maxLength: 80 },
        },
        confidence: { type: "number", minimum: 0, maximum: 1 },
        qualityWarnings: {
            type: "array",
            maxItems: 8,
            items: { type: "string", minLength: 1, maxLength: 120 },
        },
    },
};

const truncate = (value: string, maxLength: number) =>
    value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;

const cleanTagList = (values: string[]) =>
    Array.from(
        new Set(
            values
                .map((value) => value.trim().toLowerCase())
                .filter(Boolean),
        ),
    ).slice(0, 12);

const safeJsonArray = (value: unknown): string[] => {
    if (Array.isArray(value)) {
        return value.map(String).filter(Boolean);
    }

    if (typeof value === "string") {
        try {
            const parsed = JSON.parse(value) as unknown;
            return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : [];
        } catch {
            return [];
        }
    }

    return [];
};

const parseJsonObjectFromText = (text: string) => {
    try {
        return JSON.parse(text) as unknown;
    } catch {
        const match = text.match(/\{[\s\S]*\}/);
        if (!match) {
            throw new Error("AI response is not valid JSON");
        }

        return JSON.parse(match[0]) as unknown;
    }
};

const normalizeAiResult = (result: AiVisionResponse): AiVisionResponse => {
    const imageType = result.isValidPropertyImage ? result.imageType : "other";
    const displayTitleVi = displayTitleByType[imageType] ?? truncate(result.displayTitleVi.trim(), 120);
    const descriptionVi = truncate(result.descriptionVi.trim(), 1000) || displayTitleVi;
    const qualityWarnings = result.qualityWarnings.length ? result.qualityWarnings : ["none"];

    return {
        isValidPropertyImage: result.isValidPropertyImage,
        imageType,
        displayTitleVi: displayTitleVi || "Ảnh chỗ nghỉ",
        descriptionVi,
        sceneTags: cleanTagList(result.sceneTags),
        amenityTags: cleanTagList(result.amenityTags),
        confidence: Number(result.confidence.toFixed(4)),
        qualityWarnings: cleanTagList(qualityWarnings),
    };
};

const buildVisionPrompt = () => `
Bạn là AI phân tích ảnh chỗ nghỉ/villa cho website booking.
Hãy nhìn ảnh và trả về duy nhất một JSON object hợp lệ, không markdown, không giải thích thêm.

Yêu cầu:
- Mô tả bằng tiếng Việt tự nhiên, ngắn gọn.
- Không bịa tiện ích nếu không nhìn thấy rõ.
- Nếu ảnh không phải ảnh chỗ nghỉ, đặt isValidPropertyImage=false, imageType="other", displayTitleVi="Ảnh chỗ nghỉ".
- sceneTags mô tả cảnh/không gian nhìn thấy.
- amenityTags chỉ ghi tiện ích nhìn thấy rõ.

Mapping displayTitleVi ưu tiên:
bedroom=Phòng ngủ, living_room=Phòng khách, kitchen=Nhà bếp, bathroom=Phòng tắm, pool=Hồ bơi,
balcony=Ban công, garden=Sân vườn, rooftop=Sân thượng, parking=Chỗ đậu xe, bbq_area=Khu BBQ,
dining_area=Khu vực ăn uống, front_view=Mặt tiền villa, outdoor_area=Không gian ngoài trời,
hallway=Hành lang, stairs=Cầu thang, sea_view=View biển, city_view=View thành phố, other=Ảnh chỗ nghỉ.

Schema bắt buộc:
{
  "isValidPropertyImage": true,
  "imageType": "bedroom",
  "displayTitleVi": "Phòng ngủ",
  "descriptionVi": "Phòng ngủ rộng có hai giường đôi, cửa kính lớn và ánh sáng tự nhiên.",
  "sceneTags": ["phòng ngủ", "ánh sáng tự nhiên", "không gian rộng"],
  "amenityTags": ["nhiều giường", "máy lạnh", "phù hợp nhóm đông"],
  "confidence": 0.92,
  "qualityWarnings": ["none"]
}

imageType chỉ được là một trong các giá trị: ${imageTypeValues.join(", ")}
`;

const buildR2Client = () => {
    const env = getEnv();

    if (!env.r2AccountId || !env.r2AccessKeyId || !env.r2SecretAccessKey || !env.r2Bucket) {
        return null;
    }

    return {
        bucket: env.r2Bucket,
        client: new S3Client({
            region: "auto",
            endpoint: `https://${env.r2AccountId}.r2.cloudflarestorage.com`,
            credentials: {
                accessKeyId: env.r2AccessKeyId,
                secretAccessKey: env.r2SecretAccessKey,
            },
        }),
    };
};

const getSignedR2ReadUrl = async (objectKey?: string | null) => {
    if (!objectKey) {
        return null;
    }

    const r2 = buildR2Client();
    if (!r2) {
        return null;
    }

    try {
        return await getSignedUrl(
            r2.client,
            new GetObjectCommand({
                Bucket: r2.bucket,
                Key: objectKey,
            }),
            { expiresIn: 300 },
        );
    } catch {
        return null;
    }
};

const getImageUrlForVision = async (image: ListingImage) => {
    const signedUrl = await getSignedR2ReadUrl(image.objectKey);
    return signedUrl ?? image.url;
};

const callOpenAiVision = async (image: ListingImage) => {
    const env = getEnv();

    if (!env.openaiApiKey) {
        throw new ApiError(503, "OPENAI_API_KEY is not configured");
    }

    const imageUrl = await getImageUrlForVision(image);
    const client = new OpenAI({ apiKey: env.openaiApiKey });
    const response = await client.responses.create({
        model: env.openaiVisionModel,
        temperature: 0.1,
        max_output_tokens: 700,
        store: false,
        instructions: "Bạn chỉ trả về JSON object hợp lệ theo schema đã cung cấp.",
        text: {
            format: {
                type: "json_schema",
                name: "listing_image_analysis",
                strict: true,
                schema: imageAnalysisJsonSchema,
            },
        },
        input: [
            {
                role: "user",
                content: [
                    {
                        type: "input_text",
                        text: buildVisionPrompt(),
                    },
                    {
                        type: "input_image",
                        image_url: imageUrl,
                        detail: "low",
                    },
                ],
            },
        ],
    });

    const content = response.output_text?.trim();
    if (!content) {
        throw new Error("OpenAI Vision response did not contain output text");
    }

    const parsed = aiVisionResponseSchema.parse(parseJsonObjectFromText(content));
    return normalizeAiResult(parsed);
};

const getListingForActor = async (listingId: number, actor: HostActor) => {
    const listing = await Listing.findOne({
        where: {
            listingId,
            deletedAt: null,
        },
    });

    if (!listing) {
        throw new ApiError(404, "Listing not found");
    }

    checkListingOwner(listing, actor);
    return listing;
};

const getImageForListing = async (listingId: number, imageId: number) => {
    const image = await ListingImage.findOne({
        where: {
            id: imageId,
            listingId,
        },
    });

    if (!image) {
        throw new ApiError(404, "Image not found");
    }

    return image;
};

const serializeAnalyzedImage = (image: ListingImage) => ({
    imageId: Number(image.id),
    id: Number(image.id),
    listingId: image.listingId,
    url: image.url,
    displayTitle: image.displayTitle ?? null,
    altText: image.altText ?? null,
    caption: image.caption ?? null,
    aiImageType: image.aiImageType ?? null,
    aiSceneTags: safeJsonArray(image.aiSceneTags),
    aiAmenityTags: safeJsonArray(image.aiAmenityTags),
    aiDescription: image.aiDescription ?? null,
    aiConfidence: image.aiConfidence === null ? null : Number(image.aiConfidence),
    aiQualityWarnings: safeJsonArray(image.aiQualityWarnings),
    aiAnalysisStatus: image.aiAnalysisStatus,
    aiErrorMessage: image.aiErrorMessage ?? null,
    aiAnalyzedAt: image.aiAnalyzedAt ?? null,
});

const markImageFailed = async (image: ListingImage, error: unknown) => {
    const message = error instanceof Error ? error.message : "Unknown AI image analysis error";

    await image.update({
        aiAnalysisStatus: "failed",
        aiErrorMessage: truncate(message, 5000),
        aiAnalyzedAt: new Date(),
    });

    return serializeAnalyzedImage(image);
};

export const analyzeListingImage = async (listingId: number, imageId: number, actor: HostActor) => {
    await getListingForActor(listingId, actor);
    const image = await getImageForListing(listingId, imageId);

    try {
        const result = await callOpenAiVision(image);

        await image.update({
            displayTitle: result.displayTitleVi,
            altText: truncate(result.descriptionVi, 500),
            caption: result.descriptionVi,
            aiImageType: result.imageType,
            aiSceneTags: result.sceneTags,
            aiAmenityTags: result.amenityTags,
            aiDescription: result.descriptionVi,
            aiConfidence: result.confidence,
            aiQualityWarnings: result.qualityWarnings,
            aiAnalysisStatus: "analyzed",
            aiErrorMessage: null,
            aiAnalyzedAt: new Date(),
        });

        return serializeAnalyzedImage(image);
    } catch (error) {
        return markImageFailed(image, error);
    }
};

export const summarizeListingImageTags = async (listingId: number) => {
    const listing = await Listing.findOne({
        where: {
            listingId,
            deletedAt: null,
        },
    });

    if (!listing) {
        return null;
    }

    const analyzedImages = await ListingImage.findAll({
        where: {
            listingId,
            aiAnalysisStatus: "analyzed",
        },
        order: [
            ["isCover", "DESC"],
            ["sortOrder", "ASC"],
            ["id", "ASC"],
        ],
    });

    const tagSet = new Set<string>();
    const titleSet = new Set<string>();

    for (const image of analyzedImages) {
        if (image.displayTitle) {
            titleSet.add(image.displayTitle);
            tagSet.add(image.displayTitle.toLowerCase());
        }

        for (const tag of [...safeJsonArray(image.aiSceneTags), ...safeJsonArray(image.aiAmenityTags)]) {
            tagSet.add(tag.toLowerCase());
        }
    }

    const titles = Array.from(titleSet);
    const tags = Array.from(tagSet).slice(0, 40);
    const summary = titles.length ? `AI nhận diện listing có: ${titles.join(", ")}.` : null;

    listing.aiImageTags = tags;
    listing.aiImageSummary = summary;
    await listing.save();

    return {
        aiImageTags: tags,
        aiImageSummary: summary,
    };
};

export const analyzeListingImages = async (
    listingId: number,
    actor: HostActor,
    options: AnalyzeListingImagesOptions = {},
) => {
    await getListingForActor(listingId, actor);

    const images = await ListingImage.findAll({
        where: {
            listingId,
        },
        order: [
            ["isCover", "DESC"],
            ["sortOrder", "ASC"],
            ["id", "ASC"],
        ],
    });

    const targetImages = options.force
        ? images
        : images.filter((image) => image.aiAnalysisStatus !== "analyzed");
    const results = [];

    for (const image of targetImages) {
        results.push(await analyzeListingImage(listingId, Number(image.id), actor));
    }

    const summary = await summarizeListingImageTags(listingId);

    return {
        listingId,
        totalImages: images.length,
        requestedImages: targetImages.length,
        analyzedCount: results.filter((item) => item.aiAnalysisStatus === "analyzed").length,
        failedCount: results.filter((item) => item.aiAnalysisStatus === "failed").length,
        results,
        summary,
    };
};
