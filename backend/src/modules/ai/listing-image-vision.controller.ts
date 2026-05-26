import type { RequestHandler } from "express";

import { asyncHandler } from "../../common/async-handler";
import { sendSuccess } from "../../common/http";
import { assertValidRequest, getValidatedParams, getValidatedQuery } from "../../common/validation";
import { toHostActor } from "../host-listings/host-listings.service";
import { analyzeListingImage, analyzeListingImages } from "./listing-image-vision.service";

export const analyzeSingleListingImage: RequestHandler = asyncHandler(async (req, res) => {
    assertValidRequest(req);

    const params = getValidatedParams<{ listingId: number; imageId: number }>(req);
    const result = await analyzeListingImage(params.listingId, params.imageId, toHostActor(req.user!));

    return sendSuccess(res, {
        message: result.aiAnalysisStatus === "analyzed" ? "Image analyzed" : "Image analysis failed",
        data: result,
    });
});

export const analyzeAllListingImages: RequestHandler = asyncHandler(async (req, res) => {
    assertValidRequest(req);

    const params = getValidatedParams<{ listingId: number }>(req);
    const query = getValidatedQuery<{ force?: boolean }>(req);
    const result = await analyzeListingImages(params.listingId, toHostActor(req.user!), {
        force: Boolean(query.force),
    });

    return sendSuccess(res, {
        message: `Analyzed ${result.analyzedCount} image(s), failed ${result.failedCount}`,
        data: result,
    });
});
