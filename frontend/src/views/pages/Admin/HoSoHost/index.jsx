import { useCallback, useEffect, useMemo, useState } from "react";
import { FiCheck, FiEye, FiRefreshCw, FiX } from "react-icons/fi";
import {
    approveHostApplication,
    getAdminHostApplicationDetail,
    getAdminHostApplications,
    rejectHostApplication,
} from "../../../../services/api/hostApplicationService";
import {
    pageWrapperClass,
    primaryButtonClass,
    reloadButtonClass,
    tableClassName,
} from "../../Host/sharedStyles";

const statusOptions = [
    { value: "pending", label: "Chờ duyệt" },
    { value: "approved", label: "Đã duyệt" },
    { value: "rejected", label: "Từ chối" },
    { value: "all", label: "Tất cả" },
];

const statusLabel = {
    pending: "Chờ duyệt",
    approved: "Đã duyệt",
    rejected: "Từ chối",
};

const profileTypeLabel = {
    individual: "Cá nhân",
    business: "Doanh nghiệp",
};

const documentTypeLabel = {
    cccd: "CCCD",
    cmnd: "CMND",
    passport: "Hộ chiếu",
    driver_license: "Giấy phép lái xe",
    business_license: "Giấy phép kinh doanh",
    other: "Khác",
};

const sideLabel = {
    front: "Mặt trước",
    back: "Mặt sau",
    single: "Một mặt",
    business_license: "Giấy phép kinh doanh",
};

const formatDate = (value) => {
    if (!value) return "-";
    return new Intl.DateTimeFormat("vi-VN", {
        dateStyle: "short",
        timeStyle: "short",
    }).format(new Date(value));
};

const formatFileSize = (bytes) => {
    if (!bytes) return "0 KB";
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const getErrorMessage = (error, fallback) => {
    if (error?.errors?.length) {
        return error.errors.map((item) => item.msg).join("; ");
    }

    return error instanceof Error ? error.message : fallback;
};

const HoSoHost = () => {
    const [status, setStatus] = useState("pending");
    const [applications, setApplications] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [detail, setDetail] = useState(null);
    const [loadingList, setLoadingList] = useState(true);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const selectedApplication = useMemo(
        () => applications.find((item) => item.applicationId === selectedId) ?? null,
        [applications, selectedId],
    );

    const fetchApplications = useCallback(async () => {
        setLoadingList(true);
        setError("");

        try {
            const result = await getAdminHostApplications(status, { page: 1, limit: 50 });
            setApplications(result.items ?? []);
        } catch (fetchError) {
            setError(getErrorMessage(fetchError, "Không thể tải danh sách hồ sơ host."));
        } finally {
            setLoadingList(false);
        }
    }, [status]);

    const fetchDetail = useCallback(async (applicationId) => {
        setLoadingDetail(true);
        setError("");
        setMessage("");
        setSelectedId(applicationId);
        setRejectReason("");

        try {
            const result = await getAdminHostApplicationDetail(applicationId);
            setDetail(result);
        } catch (fetchError) {
            setError(getErrorMessage(fetchError, "Không thể tải chi tiết hồ sơ host."));
            setDetail(null);
        } finally {
            setLoadingDetail(false);
        }
    }, []);

    useEffect(() => {
        void fetchApplications();
        setSelectedId(null);
        setDetail(null);
    }, [fetchApplications]);

    const runApprove = async () => {
        if (!detail?.applicationId) return;
        setActionLoading(true);
        setError("");
        setMessage("");

        try {
            await approveHostApplication(detail.applicationId);
            setMessage("Đã duyệt hồ sơ chủ nhà.");
            await fetchApplications();
            await fetchDetail(detail.applicationId);
        } catch (actionError) {
            setError(getErrorMessage(actionError, "Không thể duyệt hồ sơ."));
        } finally {
            setActionLoading(false);
        }
    };

    const runReject = async () => {
        if (!detail?.applicationId) return;

        if (!rejectReason.trim()) {
            setError("Vui lòng nhập lý do từ chối.");
            return;
        }

        setActionLoading(true);
        setError("");
        setMessage("");

        try {
            await rejectHostApplication(detail.applicationId, rejectReason.trim());
            setMessage("Đã từ chối hồ sơ chủ nhà.");
            await fetchApplications();
            await fetchDetail(detail.applicationId);
        } catch (actionError) {
            setError(getErrorMessage(actionError, "Không thể từ chối hồ sơ."));
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className={pageWrapperClass}>
            <div className="mx-auto max-w-7xl space-y-6">
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Hồ sơ host</h1>

                    </div>
                    <div className="flex flex-wrap gap-3">
                        <select
                            value={status}
                            onChange={(event) => setStatus(event.target.value)}
                            className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm"
                        >
                            {statusOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        <button type="button" onClick={fetchApplications} className={reloadButtonClass}>
                            <FiRefreshCw className="shrink-0" />
                            Tải lại
                        </button>
                    </div>
                </div>

                {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div> : null}
                {message ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{message}</div> : null}

                <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(420px,0.85fr)]">
                    <section className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
                        <table className={`${tableClassName} text-left text-sm`}>
                            <thead className="bg-gray-50 text-gray-500">
                                <tr>
                                    <th className="px-4 py-3">Người dùng</th>
                                    <th className="px-4 py-3">Số điện thoại</th>
                                    <th className="px-4 py-3">Loại hồ sơ</th>
                                    <th className="px-4 py-3">Trạng thái</th>
                                    <th className="px-4 py-3">Ngày gửi</th>
                                    <th className="px-4 py-3">Giấy tờ</th>
                                    <th className="px-4 py-3">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {loadingList ? (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-10 text-center text-gray-500">
                                            Đang tải...
                                        </td>
                                    </tr>
                                ) : null}

                                {!loadingList && applications.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-10 text-center text-gray-500">
                                            Không có hồ sơ host phù hợp.
                                        </td>
                                    </tr>
                                ) : null}

                                {applications.map((application) => (
                                    <tr
                                        key={application.applicationId}
                                        className={application.applicationId === selectedId ? "bg-cyan-50/40" : undefined}
                                    >
                                        <td className="px-4 py-4">
                                            <p className="font-semibold text-gray-900">
                                                {application.user?.name || application.contactName || "-"}
                                            </p>
                                            <p className="text-xs text-gray-500">{application.user?.email || application.contactEmail || "-"}</p>
                                        </td>
                                        <td className="px-4 py-4 text-gray-600">{application.phone || application.user?.phone || "-"}</td>
                                        <td className="px-4 py-4 text-gray-600">{profileTypeLabel[application.profileType] ?? application.profileType}</td>
                                        <td className="px-4 py-4">
                                            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                                                {statusLabel[application.status] ?? application.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-gray-600">{formatDate(application.createdAt)}</td>
                                        <td className="px-4 py-4 text-gray-600">{application.documentCount}</td>
                                        <td className="px-4 py-4">
                                            <button
                                                type="button"
                                                onClick={() => fetchDetail(application.applicationId)}
                                                className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                            >
                                                <FiEye className="mr-1 inline" />
                                                Xem chi tiết
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </section>

                    <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                        {!selectedId ? (
                            <div className="py-12 text-center text-sm text-gray-500">
                                Chọn một hồ sơ để xem giấy tờ bằng.
                            </div>
                        ) : null}

                        {selectedId && loadingDetail ? (
                            <div className="py-12 text-center text-sm text-gray-500">Đang tải chi tiết...</div>
                        ) : null}

                        {selectedId && !loadingDetail && detail ? (
                            <div className="space-y-5">
                                <div className="border-b border-gray-100 pb-4">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-900">
                                                {detail.user?.name || detail.contactName || "Hồ sơ host"}
                                            </h2>
                                            <p className="mt-1 text-sm text-gray-500">{detail.user?.email || detail.contactEmail || "-"}</p>
                                        </div>
                                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                                            {statusLabel[detail.status] ?? detail.status}
                                        </span>
                                    </div>
                                </div>

                                <dl className="grid gap-3 text-sm md:grid-cols-2">
                                    <div>
                                        <dt className="text-gray-500">Người liên hệ</dt>
                                        <dd className="font-medium text-gray-900">{detail.contactName || "-"}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-gray-500">Số điện thoại</dt>
                                        <dd className="font-medium text-gray-900">{detail.phone || detail.user?.phone || "-"}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-gray-500">Loại hồ sơ</dt>
                                        <dd className="font-medium text-gray-900">{profileTypeLabel[detail.profileType] ?? detail.profileType}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-gray-500">Ngày gửi</dt>
                                        <dd className="font-medium text-gray-900">{formatDate(detail.createdAt)}</dd>
                                    </div>
                                    <div className="md:col-span-2">
                                        <dt className="text-gray-500">Địa chỉ kinh doanh</dt>
                                        <dd className="font-medium text-gray-900">{detail.businessAddress || "-"}</dd>
                                    </div>
                                    <div className="md:col-span-2">
                                        <dt className="text-gray-500">Ghi chú</dt>
                                        <dd className="font-medium text-gray-900">{detail.note || "-"}</dd>
                                    </div>
                                    {detail.rejectReason ? (
                                        <div className="md:col-span-2">
                                            <dt className="text-gray-500">Lý do từ chối</dt>
                                            <dd className="rounded-xl bg-rose-50 p-3 font-medium text-rose-700">{detail.rejectReason}</dd>
                                        </div>
                                    ) : null}
                                </dl>

                                <div className="space-y-4">
                                    <h3 className="text-base font-bold text-gray-900">Giấy tờ xác minh</h3>
                                    {detail.documents?.length ? (
                                        detail.documents.map((document) => (
                                            <div key={document.id} className="rounded-xl border border-gray-100 p-4">
                                                <div className="mb-3 flex flex-wrap justify-between gap-2 text-sm">
                                                    <div>
                                                        <p className="font-semibold text-gray-900">
                                                            {documentTypeLabel[document.documentType] ?? document.documentType} - {sideLabel[document.side] ?? document.side}
                                                        </p>
                                                        <p className="text-gray-500">
                                                            {document.originalFilename || "document"} · {formatFileSize(document.fileSize)}
                                                        </p>
                                                    </div>
                                                    <p className="text-xs text-gray-500">
                                                        Hết hạn: {formatDate(document.signedUrlExpiresAt)}
                                                    </p>
                                                </div>

                                                {document.mimeType === "application/pdf" ? (
                                                    <div className="space-y-3">
                                                        <iframe
                                                            title={document.originalFilename || `document-${document.id}`}
                                                            src={document.signedUrl}
                                                            className="h-72 w-full rounded-xl border border-gray-200"
                                                        />
                                                        <a
                                                            href={document.signedUrl}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="inline-flex rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                                        >
                                                            Mở PDF trong tab mới
                                                        </a>
                                                    </div>
                                                ) : (
                                                    <img
                                                        src={document.signedUrl}
                                                        alt={document.originalFilename || document.documentType}
                                                        className="max-h-[420px] w-full rounded-xl border border-gray-200 object-contain"
                                                    />
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <p className="rounded-xl bg-gray-50 p-4 text-sm text-gray-500">Chưa có giấy tờ.</p>
                                    )}
                                </div>

                                <div className="space-y-3 border-t border-gray-100 pt-4">
                                    <textarea
                                        value={rejectReason}
                                        onChange={(event) => setRejectReason(event.target.value)}
                                        placeholder="Nhập lý do từ chối nếu hồ sơ không hợp lệ"
                                        className="min-h-[96px] w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
                                    />
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            type="button"
                                            disabled={actionLoading || detail.status === "approved"}
                                            onClick={runApprove}
                                            className={primaryButtonClass}
                                        >
                                            <FiCheck className="mr-1 inline" />
                                            Duyệt
                                        </button>
                                        <button
                                            type="button"
                                            disabled={actionLoading || detail.status === "rejected"}
                                            onClick={runReject}
                                            className="rounded-xl border border-rose-200 px-4 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            <FiX className="mr-1 inline" />
                                            Từ chối
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : null}

                        {selectedId && !loadingDetail && !detail && selectedApplication ? (
                            <p className="py-12 text-center text-sm text-gray-500">
                                Không thể tải chi tiết hồ sơ #{selectedApplication.applicationId}.
                            </p>
                        ) : null}
                    </section>
                </div>
            </div>
        </div>
    );
};

export default HoSoHost;
