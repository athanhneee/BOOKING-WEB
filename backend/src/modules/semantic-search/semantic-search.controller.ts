import { RequestHandler } from "express";

import { asyncHandler } from "../../common/async-handler";
import { sendSuccess } from "../../common/http";
import { assertValidRequest, getValidatedBody } from "../../common/validation";
import { semanticSearchListings as searchService } from "./semantic-search.service";
import { SemanticSearchRequest } from "./semantic-search.types";

/**
 * Endpoint xử lý tìm kiếm ngữ nghĩa cho listing.
 * Chấp nhận các tham số lọc từ body (POST request).
 */
export const semanticSearchListings: RequestHandler = asyncHandler(async (req, res) => {
    // 1. Kiểm tra validation từ express-validator (đã định nghĩa ở routes)
    assertValidRequest(req);

    // 2. Lấy dữ liệu đã được validate và sanitize
    const payload = getValidatedBody<SemanticSearchRequest>(req);

    // 3. Gọi service xử lý logic tìm kiếm
    const result = await searchService(payload);

    // 4. Trả về kết quả thành công
    return sendSuccess(res, {
        data: result,
    });
});