import { apiClient } from "./apiClient";

export type ImageAiTag = {
    id?: number;
    imageId?: number;
    listingId?: number;
    tag: string;
    code?: string;
    labelVi: string;
    tagGroup: string;
    confidence: number | null;
    source: "ai" | "host" | "admin";
    createdAt?: string;
};

export type ImageTagTaxonomy = {
    code: string;
    labelVi: string;
    group: string;
    aliases: string[];
    isSearchable: boolean;
};

export type ImageAnalysisResult = {
    id: number;
    imageId: number;
    provider: string | null;
    model: string | null;
    status: "pending" | "analyzed" | "failed";
    caption: string | null;
    roomType: string | null;
    detectedObjects: string[];
    amenities: string[];
    styleTags: string[];
    qualityTags: string[];
    confidence: number | null;
    errorMessage: string | null;
    analyzedAt: string | null;
    createdAt: string;
    updatedAt: string;
};

export type ListingImageAiResult = {
    imageId: number;
    id?: number;
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
    sortOrder?: number;
    isCover?: boolean;
    tags?: ImageAiTag[];
    aiTags?: ImageAiTag[];
    analysis?: ImageAnalysisResult | null;
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

export type ListingImageAnalysisResult = {
    listingId: number;
    images: ListingImageAiResult[];
    tagTaxonomies: ImageTagTaxonomy[];
    summary: {
        aiImageTags: string[];
        aiImageSummary: string | null;
    } | null;
};

export const analyzeListingImage = (listingId: string | number, imageId: string | number) =>
    apiClient.post<ListingImageAiResult>(`/api/host/listings/${listingId}/images/${imageId}/analyze`);

export const analyzeListingImages = (listingId: string | number, force = false) =>
    apiClient.post<AnalyzeListingImagesResult>(`/api/ai/listings/${listingId}/analyze-images`, undefined, {
        query: { force },
    });

export const reanalyzeAdminImage = (imageId: string | number) =>
    apiClient.post<ListingImageAiResult>(`/api/admin/images/${imageId}/reanalyze`);

export const getListingImageAnalysis = (listingId: string | number) =>
    apiClient.get<ListingImageAnalysisResult>(`/api/host/listings/${listingId}/images/analysis`);

export const updateListingImageTags = (imageId: string | number, tags: string[]) =>
    apiClient.patch<ListingImageAiResult>(`/api/host/images/${imageId}/tags`, { tags });

export const deleteHostImage = (imageId: string | number) =>
    apiClient.delete<{ imageId: number; listingId: number }>(`/api/host/images/${imageId}`);
