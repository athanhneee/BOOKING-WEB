import { apiClient } from "./apiClient";

export type ListingImageAiResult = {
    imageId: number;
    listingId: number;
    url: string;
    displayTitle: string | null;
    altText: string | null;
    caption: string | null;
    aiImageType: string | null;
    aiSceneTags: string[];
    aiAmenityTags: string[];
    aiDescription: string | null;
    aiConfidence: number | null;
    aiQualityWarnings: string[];
    aiAnalysisStatus: "pending" | "analyzed" | "failed";
    aiErrorMessage: string | null;
    aiAnalyzedAt: string | null;
};

export type AnalyzeListingImagesResult = {
    listingId: number;
    totalImages: number;
    requestedImages: number;
    analyzedCount: number;
    failedCount: number;
    results: ListingImageAiResult[];
    summary: {
        aiImageTags: string[];
        aiImageSummary: string | null;
    } | null;
};

export const analyzeListingImage = (listingId: string | number, imageId: string | number) =>
    apiClient.post<ListingImageAiResult>(`/api/ai/listings/${listingId}/images/${imageId}/analyze`);

export const analyzeListingImages = (listingId: string | number, force = false) =>
    apiClient.post<AnalyzeListingImagesResult>(`/api/ai/listings/${listingId}/analyze-images`, undefined, {
        query: { force },
    });