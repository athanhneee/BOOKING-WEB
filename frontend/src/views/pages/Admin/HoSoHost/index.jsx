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

const getStatusBadgeClass = (status) => {
    switch (status) {
        case "pending": return "bg-amber-50 text-amber-700 ring-amber-600/20";
        case "approved": return "bg-emerald-50 text-emerald-700 ring-emerald-600/20";
        case "rejected": return "bg-rose-50 text-rose-700 ring-rose-600/20";
        default: return "bg-gray-50 text-gray-700 ring-gray-600/20";
    }
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
        <div className={`${pageWrapperClass} bg-slate-50/50 min-h-screen`}>
            <div className="mx-auto max-w-[1400px] space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Hồ sơ đăng ký Host</h1>
                        <p className="mt-1.5 text-sm text-slate-500">Quản lý và xét duyệt các yêu cầu trở thành chủ nhà.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <select
                            value={status}
                            onChange={(event) => setStatus(event.target.value)}
                            className="rounded-3xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-all hover:bg-slate-50 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                        >
                            {statusOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        <button
                            type="button"
                            onClick={fetchApplications}
                            className="flex items-center gap-2 rounded-3xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:text-cyan-600 active:scale-95"
                        >
                            <FiRefreshCw className={`shrink-0 ${loadingList ? "animate-spin" : ""}`} />
                            Tải lại
                        </button>
                    </div>
                </div>

                {/* Alerts */}
                {error ? (
                    <div className="animate-in fade-in slide-in-from-top-2 rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700 shadow-sm">
                        {error}
                    </div>
                ) : null}
                {message ? (
                    <div className="animate-in fade-in slide-in-from-top-2 rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700 shadow-sm">
                        {message}
                    </div>
                ) : null}

                {/* Main Content Grid */}
                <div className="flex flex-col xl:flex-row gap-6 items-start">
                    {/* Left Pane - List */}
                    <section className="flex-1 w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md">
                        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                            <table className={`${tableClassName} w-full text-left text-sm whitespace-nowrap`}>
                                <thead className="border-b border-slate-100 bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-500 sticky top-0 z-10">
                                    <tr>
                                        <th className="px-5 py-4">Người dùng</th>
                                        <th className="px-5 py-4">Liên hệ</th>
                                        <th className="px-5 py-4">Hồ sơ</th>
                                        <th className="px-5 py-4">Trạng thái</th>
                                        <th className="px-5 py-4">Ngày gửi</th>
                                        <th className="px-5 py-4 text-center">Giấy tờ</th>
                                        <th className="px-5 py-4 text-right">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {loadingList ? (
                                        <tr>
                                            <td colSpan={7} className="px-5 py-12 text-center text-slate-500">
                                                <div className="flex justify-center mb-3">
                                                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-600 border-t-transparent"></div>
                                                </div>
                                                Đang tải danh sách...
                                            </td>
                                        </tr>
                                    ) : null}

                                    {!loadingList && applications.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-5 py-16 text-center text-slate-500">
                                                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                                                    <FiEye className="text-xl text-slate-400" />
                                                </div>
                                                <p className="font-medium text-slate-600">Không có hồ sơ host phù hợp</p>
                                            </td>
                                        </tr>
                                    ) : null}

                                    {applications.map((application) => {
                                        const isSelected = application.applicationId === selectedId;
                                        return (
                                            <tr
                                                key={application.applicationId}
                                                className={`group transition-colors duration-200 ${isSelected ? "bg-cyan-50/50" : "hover:bg-slate-50"}`}
                                            >
                                                <td className="px-5 py-4">
                                                    <p className={`font-semibold transition-colors ${isSelected ? "text-cyan-800" : "text-slate-900 group-hover:text-cyan-700"}`}>
                                                        {application.user?.name || application.contactName || "-"}
                                                    </p>
                                                    <p className="mt-0.5 text-xs text-slate-500 truncate max-w-[150px]">{application.user?.email || application.contactEmail || "-"}</p>
                                                </td>
                                                <td className="px-5 py-4 text-slate-600 font-medium">
                                                    {application.phone || application.user?.phone || "-"}
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span className="inline-flex items-center rounded-3xl bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/10">
                                                        {profileTypeLabel[application.profileType] ?? application.profileType}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${getStatusBadgeClass(application.status)}`}>
                                                        {statusLabel[application.status] ?? application.status}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4 text-slate-500">{formatDate(application.createdAt)}</td>
                                                <td className="px-5 py-4 text-center">
                                                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                                                        {application.documentCount}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4 text-right">
                                                    <button
                                                        type="button"
                                                        onClick={() => fetchDetail(application.applicationId)}
                                                        className={`inline-flex items-center justify-center rounded-3xl border px-3 py-2 text-sm font-medium transition-all active:scale-95 ${isSelected
                                                            ? "border-cyan-200 bg-cyan-100 text-cyan-800"
                                                            : "border-slate-200 bg-white text-slate-700 hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700 shadow-sm hover:shadow"
                                                            }`}
                                                    >
                                                        <FiEye className="mr-1.5" />
                                                        Chi tiết
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* Right Pane - Detail View */}
                    <section className="w-full xl:w-[480px] shrink-0 xl:sticky xl:top-24 rounded-3xl border border-slate-200 bg-white p-6 shadow-lg xl:max-h-[calc(100vh-8rem)] xl:overflow-y-auto custom-scrollbar transition-all duration-300">
                        {!selectedId ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 ring-8 ring-slate-50/50">
                                    <FiEye className="text-2xl text-slate-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-900">Chưa chọn hồ sơ</h3>
                                <p className="mt-2 text-sm text-slate-500 max-w-[250px]">
                                    Chọn một hồ sơ từ danh sách bên trái để xem chi tiết thông tin và giấy tờ xác minh.
                                </p>
                            </div>
                        ) : null}

                        {selectedId && loadingDetail ? (
                            <div className="flex flex-col items-center justify-center py-20">
                                <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-cyan-600 border-t-transparent"></div>
                                <p className="text-sm font-medium text-slate-500">Đang tải thông tin chi tiết...</p>
                            </div>
                        ) : null}

                        {selectedId && !loadingDetail && detail ? (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                                {/* Detail Header */}
                                <div className="border-b border-slate-100 pb-5">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                                                {detail.user?.name || detail.contactName || "Hồ sơ host"}
                                            </h2>
                                            <div className="mt-1.5 flex items-center gap-2 text-sm text-slate-500">
                                                <span className="truncate">{detail.user?.email || detail.contactEmail || "Không có email"}</span>
                                            </div>
                                        </div>
                                        <span className={`shrink-0 inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ring-1 ring-inset ${getStatusBadgeClass(detail.status)}`}>
                                            {statusLabel[detail.status] ?? detail.status}
                                        </span>
                                    </div>
                                </div>

                                {/* Detail Info Grid */}
                                <div className="grid gap-x-4 gap-y-5 rounded-3xl bg-slate-50/50 p-5 ring-1 ring-inset ring-slate-100 md:grid-cols-2">
                                    <div>
                                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Người liên hệ</p>
                                        <p className="mt-1 text-sm font-semibold text-slate-900">{detail.contactName || "-"}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Số điện thoại</p>
                                        <p className="mt-1 text-sm font-semibold text-slate-900">{detail.phone || detail.user?.phone || "-"}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Loại hồ sơ</p>
                                        <p className="mt-1 text-sm font-semibold text-slate-900">{profileTypeLabel[detail.profileType] ?? detail.profileType}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Ngày gửi</p>
                                        <p className="mt-1 text-sm font-semibold text-slate-900">{formatDate(detail.createdAt)}</p>
                                    </div>
                                    <div className="md:col-span-2">
                                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Địa chỉ kinh doanh</p>
                                        <p className="mt-1 text-sm font-medium text-slate-900 leading-relaxed">{detail.businessAddress || "-"}</p>
                                    </div>
                                    <div className="md:col-span-2">
                                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Ghi chú</p>
                                        <div className="mt-1 rounded-3xl bg-white p-3 text-sm text-slate-700 shadow-sm ring-1 ring-slate-200/50 min-h-[60px] italic">
                                            {detail.note || "Không có ghi chú"}
                                        </div>
                                    </div>
                                    {detail.rejectReason ? (
                                        <div className="md:col-span-2 mt-2">
                                            <p className="text-xs font-semibold text-rose-600 uppercase tracking-wider mb-1">Lý do từ chối trước đó</p>
                                            <div className="rounded-3xl bg-rose-50 p-3.5 text-sm font-medium text-rose-800 ring-1 ring-inset ring-rose-200">
                                                {detail.rejectReason}
                                            </div>
                                        </div>
                                    ) : null}
                                </div>

                                {/* Documents Section */}
                                <div>
                                    <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-slate-900">
                                        <span className="flex h-7 w-7 items-center justify-center rounded-3xl bg-cyan-100 text-cyan-700">
                                            <FiCheck size={14} />
                                        </span>
                                        Giấy tờ xác minh ({detail.documents?.length || 0})
                                    </h3>

                                    <div className="space-y-4">
                                        {detail.documents?.length ? (
                                            detail.documents.map((document) => (
                                                <div key={document.id} className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md hover:border-cyan-200">
                                                    <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-3 flex flex-wrap justify-between items-center gap-2">
                                                        <div>
                                                            <p className="font-semibold text-slate-900 text-sm">
                                                                {documentTypeLabel[document.documentType] ?? document.documentType} <span className="text-slate-400 font-normal mx-1">/</span> {sideLabel[document.side] ?? document.side}
                                                            </p>
                                                            <p className="mt-0.5 text-xs text-slate-500">
                                                                {formatFileSize(document.fileSize)} · Hết hạn: {formatDate(document.signedUrlExpiresAt)}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="p-4 bg-slate-50/30 flex justify-center">
                                                        {document.mimeType === "application/pdf" ? (
                                                            <div className="w-full space-y-3">
                                                                <div className="relative rounded-3xl border border-slate-200 overflow-hidden bg-white shadow-sm">
                                                                    <iframe
                                                                        title={document.originalFilename || `document-${document.id}`}
                                                                        src={document.signedUrl}
                                                                        className="h-64 w-full"
                                                                    />
                                                                </div>
                                                                <a
                                                                    href={document.signedUrl}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="flex w-full items-center justify-center gap-2 rounded-3xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:text-cyan-600 active:scale-95"
                                                                >
                                                                    <FiEye /> Mở PDF trong tab mới
                                                                </a>
                                                            </div>
                                                        ) : (
                                                            <a href={document.signedUrl} target="_blank" rel="noreferrer" className="block w-full">
                                                                <img
                                                                    src={document.signedUrl}
                                                                    alt={document.originalFilename || document.documentType}
                                                                    className="max-h-[360px] w-full rounded-3xl object-contain shadow-sm ring-1 ring-slate-200 transition-transform duration-300 group-hover:scale-[1.01]"
                                                                />
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 py-10">
                                                <div className="mb-2 h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                                                    <FiX className="text-slate-400" />
                                                </div>
                                                <p className="text-sm font-medium text-slate-500">Không có giấy tờ đính kèm.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Actions Section */}
                                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm mt-6">
                                    <h3 className="mb-3 text-sm font-bold text-slate-900">Quyết định xét duyệt</h3>
                                    <div className="space-y-4">
                                        <textarea
                                            value={rejectReason}
                                            onChange={(event) => setRejectReason(event.target.value)}
                                            placeholder="Nhập lý do nếu bạn muốn từ chối hồ sơ này..."
                                            className="min-h-[100px] w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all"
                                        />
                                        <div className="flex flex-col sm:flex-row gap-3">
                                            <button
                                                type="button"
                                                disabled={actionLoading || detail.status === "approved"}
                                                onClick={runApprove}
                                                className={`flex-1 flex items-center justify-center gap-2 rounded-3xl px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all active:scale-95 ${actionLoading || detail.status === "approved"
                                                    ? "bg-emerald-400 cursor-not-allowed opacity-80"
                                                    : "bg-emerald-500 hover:bg-emerald-600 hover:shadow-md hover:-translate-y-0.5"
                                                    }`}
                                            >
                                                {actionLoading ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <FiCheck size={16} />}
                                                Phê duyệt hồ sơ
                                            </button>
                                            <button
                                                type="button"
                                                disabled={actionLoading || detail.status === "rejected"}
                                                onClick={runReject}
                                                className={`flex-1 flex items-center justify-center gap-2 rounded-3xl border px-5 py-3 text-sm font-semibold transition-all active:scale-95 ${actionLoading || detail.status === "rejected"
                                                    ? "border-rose-200 bg-rose-50 text-rose-400 cursor-not-allowed"
                                                    : "border-rose-200 bg-white text-rose-600 hover:bg-rose-50 hover:border-rose-300 shadow-sm"
                                                    }`}
                                            >
                                                {actionLoading ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-rose-600 border-t-transparent" /> : <FiX size={16} />}
                                                Từ chối
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : null}

                        {selectedId && !loadingDetail && !detail && selectedApplication ? (
                            <div className="rounded-3xl border border-rose-200 bg-rose-50 py-10 text-center">
                                <p className="text-sm font-medium text-rose-700">
                                    Không thể tải chi tiết hồ sơ #{selectedApplication.applicationId}.
                                </p>
                            </div>
                        ) : null}
                    </section>
                </div>
            </div>
        </div>
    );
};

export default HoSoHost;
