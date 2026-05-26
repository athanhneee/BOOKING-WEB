import { apiClient } from "./apiClient";

export type CreatePresignedUploadUrlPayload = {
    folder: "listings" | "avatars" | "verifications" | "misc";
    filename: string;
    contentType: string;
    listingId?: string | number | null;
};

export type PresignedUploadUrl = {
    uploadUrl: string;
    publicUrl: string;
    key: string;
    expiresIn: number;
};

export type UploadFileToR2Options = {
    folder?: "listings" | "avatars" | "verifications" | "misc";
    listingId?: string | number | null;
    maxSizeBytes?: number;
};

const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

const getContentType = (file: File) => {
    if (file.type) {
        return file.type;
    }

    const extension = file.name.split(".").pop()?.toLowerCase();
    if (extension === "jpg" || extension === "jpeg") return "image/jpeg";
    if (extension === "png") return "image/png";
    if (extension === "webp") return "image/webp";
    if (extension === "gif") return "image/gif";

    return "";
};

export const createPresignedUploadUrl = (payload: CreatePresignedUploadUrlPayload) =>
    apiClient.post<PresignedUploadUrl>("/api/uploads/presign", payload);

export const uploadFileToR2 = async (file: File, options: UploadFileToR2Options = {}) => {
    const contentType = getContentType(file);

    if (!allowedImageTypes.has(contentType)) {
        throw new Error("Chi ho tro JPG, PNG, WebP hoac GIF.");
    }

    if (options.maxSizeBytes && file.size > options.maxSizeBytes) {
        throw new Error("Anh vuot qua dung luong cho phep.");
    }

    const presigned = await createPresignedUploadUrl({
        folder: options.folder ?? "listings",
        filename: file.name,
        contentType,
        listingId: options.listingId ?? null,
    });

    let response: Response;

    try {
        response = await fetch(presigned.uploadUrl, {
            method: "PUT",
            headers: {
                "Content-Type": contentType,
            },
            body: file,
        });
    } catch (error) {
        throw new Error(
            error instanceof TypeError
                ? "CORS chua cau hinh dung"
                : "Khong the upload anh len.",
        );
    }

    if (!response.ok) {
        throw new Error(
            response.status === 403
                ? "Tu choi upload. Kiem tra presigned URL, CORS va quyen ghi bucket."
                : `Khong the upload anh (${response.status}).`,
        );
    }

    return {
        publicUrl: presigned.publicUrl,
        key: presigned.key,
    };
};
