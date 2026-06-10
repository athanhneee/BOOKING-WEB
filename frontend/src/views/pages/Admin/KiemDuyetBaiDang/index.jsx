import { useCallback, useEffect, useState } from "react";
import { FiRefreshCw } from "react-icons/fi";
import * as adminService from "../../../../services/adminService";
import { API_BASE_URL } from "../../../../services/api/apiClient";
import {
    formatCurrency,
    pageWrapperClass,
    reloadButtonClass,
    tableClassName,
} from "../../Host/sharedStyles";

const getAddress = (listing) =>
    [listing.addressLine, listing.ward, listing.district, listing.city].filter(Boolean).join(", ");

const imageUrlFields = ["url", "imageUrl", "image_url", "secureUrl", "publicUrl"];

const getImageUrlValue = (image) => {
    if (!image || typeof image !== "object") {
        return "";
    }

    for (const field of imageUrlFields) {
        const value = image[field];

        if (typeof value === "string" && value.trim()) {
            return value.trim();
        }
    }

    return "";
};

const resolveImageUrl = (url) => {
    if (typeof url !== "string" || !url.trim()) {
        return "";
    }

    const trimmedUrl = url.trim();

    if (/^(https?:|data:|blob:)/i.test(trimmedUrl)) {
        return trimmedUrl;
    }

    if (trimmedUrl.startsWith("//")) {
        return `${window.location.protocol}${trimmedUrl}`;
    }

    try {
        const baseUrl = API_BASE_URL || window.location.origin;
        return new URL(trimmedUrl.startsWith("/") ? trimmedUrl : `/${trimmedUrl}`, baseUrl).toString();
    } catch {
        return trimmedUrl;
    }
};

const getImageSrc = (image) => resolveImageUrl(getImageUrlValue(image));

const isCoverImage = (image) =>
    image?.isCover === true ||
    image?.is_cover === true ||
    image?.isCover === 1 ||
    image?.is_cover === 1 ||
    image?.isCover === "true" ||
    image?.is_cover === "true" ||
    image?.isCover === "1" ||
    image?.is_cover === "1";

const getImageSortOrder = (image) => {
    const sortOrder = Number(image?.sortOrder ?? image?.sort_order ?? 0);
    return Number.isFinite(sortOrder) ? sortOrder : 0;
};

const getListingCoverImageUrl = (listing) => {
    const directUrl =
        listing.coverImageUrl ||
        getImageUrlValue(listing.coverImage) ||
        listing.imageUrl ||
        listing.image_url ||
        listing.secureUrl ||
        listing.publicUrl;

    if (directUrl) {
        return resolveImageUrl(directUrl);
    }

    const images = Array.isArray(listing.images)
        ? [...listing.images].sort((left, right) => getImageSortOrder(left) - getImageSortOrder(right))
        : [];
    const coverImage = images.find(isCoverImage) ?? images[0];

    return getImageSrc(coverImage);
};

const getErrorMessage = (error, fallback) => {
    if (error?.response?.data?.message) {
        return error.response.data.message;
    }

    if (error?.errors?.length) {
        return error.errors.map((item) => item.msg).join("; ");
    }

    return error instanceof Error ? error.message : fallback;
};

const ruleToneClass = {
    allowed: "border-emerald-200 bg-emerald-50 text-emerald-700",
    denied: "border-rose-200 bg-rose-50 text-rose-700",
    neutral: "border-gray-200 bg-gray-50 text-gray-600",
};

const getRulePermission = (allowed) => {
    if (allowed === true) {
        return {
            value: "Cho phép",
            tone: "allowed",
        };
    }

    if (allowed === false) {
        return {
            value: "Không cho phép",
            tone: "denied",
        };
    }

    return {
        value: "Không quy định",
        tone: "neutral",
    };
};

const getListingRuleItems = (rules = {}) => {
    const normalizedRules = rules || {};
    const checkInFrom =
        typeof normalizedRules.checkInFrom === "string"
            ? normalizedRules.checkInFrom.trim()
            : normalizedRules.checkInFrom;
    const checkOutBefore =
        typeof normalizedRules.checkOutBefore === "string"
            ? normalizedRules.checkOutBefore.trim()
            : normalizedRules.checkOutBefore;
    const quietHours =
        typeof normalizedRules.quietHours === "string" ? normalizedRules.quietHours.trim() : normalizedRules.quietHours;

    return [
        {
            label: "Giờ nhận phòng",
            value: checkInFrom ? `Từ ${checkInFrom}` : "Không quy định",
            tone: "neutral",
        },
        {
            label: "Giờ trả phòng",
            value: checkOutBefore ? `Trước ${checkOutBefore}` : "Không quy định",
            tone: "neutral",
        },
        {
            label: "Hút thuốc",
            ...getRulePermission(normalizedRules.smokingAllowed),
        },
        {
            label: "Thú cưng",
            ...getRulePermission(normalizedRules.petsAllowed),
        },
        {
            label: "Tổ chức tiệc",
            ...getRulePermission(normalizedRules.partyAllowed),
        },
        {
            label: "Giờ yên tĩnh",
            value: quietHours ? quietHours : "Không quy định",
            tone: "neutral",
        },
    ];
};

// --- Skeleton rows for table ---
const TableSkeletonRows = ({ cols = 5, rows = 4 }) =>
    Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={rowIndex} className="border-b border-slate-100 animate-pulse">
            <td className="px-4 py-4">
                <div className="flex items-center gap-3">
                    <div className="h-20 w-32 shrink-0 rounded-xl bg-slate-200" />
                    <div className="space-y-2">
                        <div className="h-4 w-40 rounded bg-slate-200" />
                        <div className="h-3 w-20 rounded bg-slate-200" />
                    </div>
                </div>
            </td>
            {Array.from({ length: cols - 2 }).map((_, colIndex) => (
                <td key={colIndex} className="px-4 py-4">
                    <div className="h-4 w-28 rounded bg-slate-200" />
                </td>
            ))}
            <td className="px-4 py-4">
                <div className="flex gap-2">
                    <div className="h-9 w-24 rounded-xl bg-slate-200" />
                    <div className="h-9 w-16 rounded-xl bg-slate-200" />
                    <div className="h-9 w-20 rounded-xl bg-slate-200" />
                </div>
            </td>
        </tr>
    ));

const KiemDuyetBaiDang = () => {
    const [listings, setListings] = useState([]);
    // Tách loading table vs loading từng action row
    const [isLoadingTable, setIsLoadingTable] = useState(true);
    const [processingListingId, setProcessingListingId] = useState(null); // ID đang approve/reject
    const [isModalActionLoading, setIsModalActionLoading] = useState(false);
    const [error, setError] = useState("");
    const [selectedListingDetail, setSelectedListingDetail] = useState(null);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [viewedListingIds, setViewedListingIds] = useState(() => new Set());
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [rejectTarget, setRejectTarget] = useState(null);
    const [rejectReason, setRejectReason] = useState("");
    const [failedImageUrls, setFailedImageUrls] = useState(() => new Set());

    const fetchPendingListings = useCallback(async () => {
        setIsLoadingTable(true);
        setError("");

        try {
            const result = await adminService.getPendingListings({
                page: 1,
                limit: adminService.ADMIN_LISTINGS_MAX_PAGE_LIMIT,
            });
            setFailedImageUrls(new Set());
            setListings(result.items ?? []);
        } catch (fetchError) {
            setError(getErrorMessage(fetchError, "Không thể tải bài chờ duyệt."));
        } finally {
            setIsLoadingTable(false);
        }
    }, []);

    useEffect(() => {
        void fetchPendingListings();
    }, [fetchPendingListings]);

    const handleViewDetail = async (listingId) => {
        try {
            setIsModalActionLoading(true);
            setError("");
            const detail = await adminService.getAdminListingDetail(listingId);
            setSelectedListingDetail(detail);
            setViewedListingIds((prev) => {
                const next = new Set(prev);
                next.add(Number(listingId));
                return next;
            });
            setDetailModalOpen(true);
        } catch (viewError) {
            setError(getErrorMessage(viewError, "Không tải được chi tiết căn."));
        } finally {
            setIsModalActionLoading(false);
        }
    };

    const handleApprove = async (listingId) => {
        if (!viewedListingIds.has(Number(listingId))) {
            setError("Vui lòng xem chi tiết căn trước khi duyệt.");
            return;
        }

        // Chống double-click
        if (processingListingId === listingId || isModalActionLoading) return;

        try {
            setProcessingListingId(listingId);
            setIsModalActionLoading(true);
            setError("");
            await adminService.approveListing(listingId);
            setDetailModalOpen(false);
            setSelectedListingDetail(null);
            await fetchPendingListings();
        } catch (approveError) {
            setError(getErrorMessage(approveError, "Duyệt căn thất bại."));
        } finally {
            setProcessingListingId(null);
            setIsModalActionLoading(false);
        }
    };

    const openRejectModal = (listing) => {
        setRejectTarget(listing);
        setRejectReason("");
        setError("");
        setRejectModalOpen(true);
    };

    const handleReject = async () => {
        if (!rejectTarget) return;

        if (!rejectReason.trim()) {
            setError("Vui lòng nhập lý do từ chối.");
            return;
        }

        // Chống double-click
        if (isModalActionLoading) return;

        try {
            setProcessingListingId(rejectTarget.listingId);
            setIsModalActionLoading(true);
            setError("");
            await adminService.rejectListing(rejectTarget.listingId, rejectReason.trim());
            setRejectModalOpen(false);
            setRejectTarget(null);
            setRejectReason("");
            await fetchPendingListings();
        } catch (rejectError) {
            setError(getErrorMessage(rejectError, "Từ chối căn thất bại."));
        } finally {
            setProcessingListingId(null);
            setIsModalActionLoading(false);
        }
    };

    const handleListingImageError = useCallback((imageUrl) => {
        setFailedImageUrls((prev) => {
            const next = new Set(prev);
            next.add(imageUrl);
            return next;
        });
    }, []);

    return (
        <div className={pageWrapperClass}>
            <div className="mx-auto max-w-7xl space-y-6">
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Kiểm duyệt bài đăng</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Duyệt hoặc từ chối các chỗ nghỉ host đã gửi lên.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={fetchPendingListings}
                        disabled={isLoadingTable}
                        className={`${reloadButtonClass} disabled:opacity-60`}
                    >
                        <FiRefreshCw className={`shrink-0 ${isLoadingTable ? "animate-spin" : ""}`} />
                        {isLoadingTable ? "Đang tải..." : "Tải lại"}
                    </button>
                </div>

                {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div> : null}

                <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                    <div className="overflow-x-auto">
                    <table className={`${tableClassName} text-left text-sm`}>
                        <thead className="bg-gray-50 text-gray-500">
                            <tr>
                                <th className="px-4 py-3">Listing</th>
                                <th className="px-4 py-3">Địa chỉ</th>
                                <th className="px-4 py-3">Loại</th>
                                <th className="px-4 py-3">Giá</th>
                                <th className="px-4 py-3">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {isLoadingTable ? (
                                <TableSkeletonRows cols={5} rows={4} />
                            ) : null}

                            {!isLoadingTable && listings.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-10 text-center text-gray-500">
                                        Không có listing chờ duyệt.
                                    </td>
                                </tr>
                            ) : null}

                            {listings.map((listing) => {
                                const coverImageUrl = getListingCoverImageUrl(listing);
                                const shouldShowCoverImage = coverImageUrl && !failedImageUrls.has(coverImageUrl);
                                const isThisRowProcessing = processingListingId === listing.listingId;

                                return (
                                    <tr
                                        key={listing.listingId}
                                        className={isThisRowProcessing ? "opacity-60" : ""}
                                    >
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-3">
                                                {shouldShowCoverImage ? (
                                                    <img
                                                        src={coverImageUrl}
                                                        alt={listing.title}
                                                        className="h-20 w-32 shrink-0 rounded-xl object-cover"
                                                        loading="lazy"
                                                        onError={() => handleListingImageError(coverImageUrl)}
                                                    />
                                                ) : (
                                                    <div className="flex h-20 w-32 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xs font-medium text-slate-500">
                                                        Chưa có ảnh
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="font-semibold text-gray-900">{listing.title}</p>
                                                    <p className="text-xs text-gray-500">ID: {listing.listingId}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-gray-600">{getAddress(listing)}</td>
                                        <td className="px-4 py-4 text-gray-600">{listing.propertyType}</td>
                                        <td className="px-4 py-4 text-gray-600">{formatCurrency(Number(listing.basePrice || 0))}</td>
                                        <td className="px-4 py-4">
                                            <div className="flex flex-wrap gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handleViewDetail(listing.listingId)}
                                                    disabled={isThisRowProcessing || isModalActionLoading}
                                                    className="rounded-xl border border-blue-200 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
                                                >
                                                    {isModalActionLoading && !isThisRowProcessing ? "..." : "Xem chi tiết"}
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => handleApprove(listing.listingId)}
                                                    disabled={isThisRowProcessing || isLoadingTable}
                                                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                                                >
                                                    {isThisRowProcessing ? (
                                                        <>
                                                            <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                                            Đang duyệt...
                                                        </>
                                                    ) : (
                                                        "Duyệt"
                                                    )}
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => openRejectModal(listing)}
                                                    disabled={isThisRowProcessing || isLoadingTable}
                                                    className="rounded-xl bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                                                >
                                                    Từ chối
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    </div>
                </section>
            </div>

            {detailModalOpen && selectedListingDetail && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-2 sm:p-4">
                    <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white p-4 shadow-xl sm:p-6">
                        <div className="mb-4 flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">
                                    {selectedListingDetail.title}
                                </h2>
                                <p className="text-sm text-gray-500">
                                    {selectedListingDetail.addressLine}, {selectedListingDetail.ward},{" "}
                                    {selectedListingDetail.district}, {selectedListingDetail.city}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setDetailModalOpen(false)}
                                className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
                            >
                                Đóng
                            </button>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <section className="rounded-xl border p-4">
                                <h3 className="mb-2 font-semibold text-gray-900">Thông tin host</h3>
                                <p>Họ tên: {selectedListingDetail.host?.fullName || "Chưa có"}</p>
                                <p>Email: {selectedListingDetail.host?.email || "Chưa có"}</p>
                                <p>SĐT: {selectedListingDetail.host?.phone || "Chưa có"}</p>
                                <p>
                                    Xác minh host:{" "}
                                    {selectedListingDetail.host?.isHostVerified ? "Đã xác minh" : "Chưa xác minh"}
                                </p>
                            </section>

                            <section className="rounded-xl border p-4">
                                <h3 className="mb-2 font-semibold text-gray-900">Giá & sức chứa</h3>
                                <p>Giá thường: {Number(selectedListingDetail.basePrice || 0).toLocaleString("vi-VN")}đ</p>
                                <p>Giá cuối tuần: {Number(selectedListingDetail.weekendPrice || 0).toLocaleString("vi-VN")}đ</p>
                                <p>Phí dọn dẹp: {Number(selectedListingDetail.cleaningFee || 0).toLocaleString("vi-VN")}đ</p>
                                <p>Khách tối đa: {selectedListingDetail.maxGuests}</p>
                                <p>Phòng ngủ: {selectedListingDetail.bedrooms}</p>
                                <p>Giường: {selectedListingDetail.beds}</p>
                                <p>Phòng tắm: {selectedListingDetail.bathrooms}</p>
                            </section>
                        </div>

                        <section className="mt-4 rounded-xl border p-4">
                            <h3 className="mb-2 font-semibold text-gray-900">Mô tả</h3>
                            <p className="whitespace-pre-line text-gray-700">
                                {selectedListingDetail.description || "Chưa có mô tả"}
                            </p>
                        </section>

                        <section className="mt-4 rounded-xl border p-4">
                            <h3 className="mb-3 font-semibold text-gray-900">Ảnh căn</h3>
                            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                                {(selectedListingDetail.images || []).map((image) => {
                                    const imageSrc = getImageSrc(image);

                                    if (!imageSrc) {
                                        return null;
                                    }

                                    return (
                                        <img
                                            key={
                                                image.listingImageId ||
                                                image.imageId ||
                                                image.id ||
                                                image.url ||
                                                image.imageUrl ||
                                                image.image_url
                                            }
                                            src={imageSrc}
                                            alt={selectedListingDetail.title}
                                            className="h-44 w-full rounded-xl object-cover"
                                        />
                                    );
                                })}
                            </div>
                        </section>

                        <section className="mt-4 rounded-xl border p-4">
                            <h3 className="mb-2 font-semibold text-gray-900">Tiện ích</h3>
                            <div className="flex flex-wrap gap-2">
                                {(selectedListingDetail.amenities || []).map((amenity) => (
                                    <span
                                        key={amenity.amenityId || amenity.name}
                                        className="rounded-full bg-gray-100 px-3 py-1 text-sm"
                                    >
                                        {amenity.name}
                                    </span>
                                ))}
                            </div>
                        </section>

                        <section className="mt-4 rounded-xl border p-4">
                            <h3 className="mb-3 font-semibold text-gray-900">Nội quy</h3>
                            <div className="grid gap-3 sm:grid-cols-2">
                                {getListingRuleItems(selectedListingDetail.rules).map((rule) => (
                                    <div
                                        key={rule.label}
                                        className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm"
                                    >
                                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                            {rule.label}
                                        </p>
                                        <span
                                            className={`mt-2 inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${ruleToneClass[rule.tone]}`}
                                        >
                                            {rule.value}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setDetailModalOpen(false)}
                                className="rounded-xl border px-4 py-2 hover:bg-gray-50"
                            >
                                Đóng
                            </button>

                            <button
                                type="button"
                                onClick={() => handleApprove(selectedListingDetail.listingId)}
                                disabled={isModalActionLoading}
                                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                                {isModalActionLoading ? (
                                    <>
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                        Đang xử lý...
                                    </>
                                ) : (
                                    "Duyệt căn này"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {rejectModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
                        <h2 className="text-xl font-bold text-gray-900">Từ chối căn</h2>
                        <p className="mt-1 text-sm text-gray-500">
                            Nhập lý do từ chối để host biết cần chỉnh sửa gì.
                        </p>

                        <textarea
                            value={rejectReason}
                            onChange={(event) => setRejectReason(event.target.value)}
                            disabled={isModalActionLoading}
                            rows={5}
                            className="mt-4 w-full rounded-xl border border-gray-300 p-3 outline-none focus:border-red-500 disabled:opacity-60"
                            placeholder="Ví dụ: Ảnh chưa rõ, thiếu thông tin địa chỉ, giá chưa hợp lệ..."
                        />

                        <div className="mt-5 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setRejectModalOpen(false)}
                                disabled={isModalActionLoading}
                                className="rounded-xl border px-4 py-2 hover:bg-gray-50 disabled:opacity-60"
                            >
                                Hủy
                            </button>

                            <button
                                type="button"
                                onClick={handleReject}
                                disabled={isModalActionLoading}
                                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                                {isModalActionLoading ? (
                                    <>
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                        Đang xử lý...
                                    </>
                                ) : (
                                    "Xác nhận từ chối"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default KiemDuyetBaiDang;
