import { useCallback, useEffect, useMemo, useState } from "react";
import { FiCalendar, FiEdit2, FiEye, FiEyeOff, FiPlus, FiSend, FiMapPin, FiUsers, FiHome } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import { APP_ROUTES } from "../../../../config/routes";
import {
    getMyHostListings,
    hideHostListing,
    publishHostListing,
    submitHostListingForApproval,
    type HostListingStatus,
    type HostListingSummary,
} from "../../../../services/hostService";
import { FilterTabs, PageHeader } from "../shared";
import {
    formatCurrency,
    pageWrapperClass,
    primaryButtonClass,
} from "../sharedStyles";

type PropertyFilter = "all" | HostListingStatus;

const filterOptions: Array<{ label: string; value: PropertyFilter }> = [
    { label: "Tất cả", value: "all" },
    { label: "Nháp", value: "draft" },
    { label: "Chờ duyệt", value: "pending_approval" },
    { label: "Đã duyệt", value: "published" },
    { label: "Đang ẩn", value: "hidden" },
];

const statusStyles = (status: HostListingStatus) => {
    switch (status) {
        case "draft": return "bg-slate-50 text-slate-700 ring-slate-600/20";
        case "pending_approval": return "bg-amber-50 text-amber-700 ring-amber-600/20";
        case "published": return "bg-emerald-50 text-emerald-700 ring-emerald-600/20";
        case "hidden": return "bg-gray-50 text-gray-700 ring-gray-600/20";
        default: return "bg-slate-50 text-slate-700 ring-slate-600/20";
    }
};

const statusLabels: Record<HostListingStatus, string> = {
    draft: "Nháp",
    pending_approval: "Chờ admin duyệt",
    published: "Đã duyệt",
    hidden: "Đang ẩn",
};

const getAddress = (property: HostListingSummary) =>
    [property.addressLine, property.ward, property.district, property.city].filter(Boolean).join(", ");

const ChoNghi = () => {
    const navigate = useNavigate();
    const [filter, setFilter] = useState<PropertyFilter>("all");
    const [properties, setProperties] = useState<HostListingSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [dialogProperty, setDialogProperty] = useState<HostListingSummary | null>(null);

    const loadProperties = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const result = await getMyHostListings({ status: filter, page: 1, limit: 50 });
            setProperties(result.items ?? []);
        } catch (loadError) {
            setError(loadError instanceof Error ? loadError.message : "Không thể tải danh sách chỗ nghỉ.");
            setProperties([]);
        } finally {
            setLoading(false);
        }
    }, [filter]);

    useEffect(() => {
        void loadProperties();
    }, [loadProperties]);

    const filteredProperties = useMemo(() => properties, [properties]);

    const runListingAction = async (action: () => Promise<unknown>, message: string) => {
        setError("");
        setSuccess("");

        try {
            await action();
            setSuccess(message);
            await loadProperties();
        } catch (actionError) {
            setError(actionError instanceof Error ? actionError.message : "Không thể cập nhật chỗ nghỉ.");
        }
    };

    const handleToggleVisibility = async () => {
        if (!dialogProperty) {
            return;
        }

        const listingId = dialogProperty.listingId;
        const isPublished = dialogProperty.status === "published";
        setDialogProperty(null);

        await runListingAction(
            () => (isPublished ? hideHostListing(listingId) : publishHostListing(listingId)),
            isPublished ? "Đã ẩn chỗ nghỉ." : "Đã gửi yêu cầu hiện lại chỗ nghỉ.",
        );
    };

    const handleSubmitForApproval = (listingId: string | number) =>
        runListingAction(
            () => submitHostListingForApproval(listingId),
            "Đã gửi chỗ nghỉ cho admin duyệt.",
        );

    return (
        <div className={`${pageWrapperClass} bg-slate-50/50 min-h-screen`}>
            <div className="mx-auto max-w-[1400px] space-y-6">
                <PageHeader
                    title="Chỗ nghỉ của bạn"
                    subtitle="Danh sách chỗ nghỉ"
                    actions={
                        <button
                            type="button"
                            onClick={() => navigate(APP_ROUTES.hostNewProperty)}
                            className={`${primaryButtonClass} shadow-md transition-transform hover:-translate-y-0.5`}
                        >
                            <span className="inline-flex items-center gap-2">
                                <FiPlus size={18} />
                                Thêm chỗ nghỉ
                            </span>
                        </button>
                    }
                />

                <FilterTabs options={filterOptions} value={filter} onChange={setFilter} underline />

                {error ? (
                    <div className="animate-in fade-in slide-in-from-top-2 rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700 shadow-sm">
                        {error}
                    </div>
                ) : null}
                {success ? (
                    <div className="animate-in fade-in slide-in-from-top-2 rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700 shadow-sm">
                        {success}
                    </div>
                ) : null}

                {loading ? (
                    <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-100 bg-white py-20 shadow-sm">
                        <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-cyan-600 border-t-transparent"></div>
                        <p className="text-sm font-medium text-slate-500">Đang tải chỗ nghỉ của bạn...</p>
                    </div>
                ) : null}

                {!loading && filteredProperties.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white py-20 text-center shadow-sm">
                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 ring-8 ring-slate-50/50">
                            <FiHome className="text-2xl text-slate-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900">Chưa có chỗ nghỉ nào</h3>
                        <p className="mt-2 text-sm text-slate-500">Bấm "Thêm chỗ nghỉ" để tạo phòng và bắt đầu cho thuê.</p>
                        <button
                            type="button"
                            onClick={() => navigate(APP_ROUTES.hostNewProperty)}
                            className="mt-6 rounded-3xl bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-cyan-700"
                        >
                            Thêm chỗ nghỉ ngay
                        </button>
                    </div>
                ) : null}

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 items-start">
                    {filteredProperties.map((property) => {
                        const status = property.status ?? "draft";
                        const isPublished = status === "published";

                        return (
                            <article
                                key={property.listingId}
                                className="group flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-cyan-200"
                            >
                                <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
                                    {property.imageUrl ? (
                                        <img
                                            src={property.imageUrl}
                                            alt={property.title}
                                            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center font-medium text-slate-400">
                                            Chưa có ảnh
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-slate-900/10 opacity-60 transition-opacity group-hover:opacity-40"></div>

                                    {/* Status Badge */}
                                    <span className={`absolute left-4 top-4 inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold backdrop-blur-md bg-white/95 shadow-sm ring-1 ring-inset ${statusStyles(status)}`}>
                                        <div className={`mr-1.5 h-1.5 w-1.5 rounded-full ${status === 'published' ? 'bg-emerald-500' : status === 'pending_approval' ? 'bg-amber-500' : 'bg-slate-400'}`}></div>
                                        {statusLabels[status]}
                                    </span>
                                </div>

                                <div className="flex flex-1 flex-col p-5">
                                    <div className="mb-3 flex items-start justify-between gap-2">
                                        <span className="inline-flex items-center rounded-3xl bg-slate-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-600 ring-1 ring-inset ring-slate-500/10">
                                            {property.propertyType}
                                        </span>
                                        <span className="text-right text-sm font-bold text-slate-900">
                                            {formatCurrency(Number(property.basePrice || 0))}
                                            <span className="block text-[11px] font-medium text-slate-500">/ đêm</span>
                                        </span>
                                    </div>

                                    <h2 className="text-lg font-bold text-slate-900 line-clamp-1 transition-colors group-hover:text-cyan-700">
                                        {property.title}
                                    </h2>

                                    <p className="mt-2 flex items-start gap-1.5 text-sm text-slate-500 line-clamp-2 min-h-[40px]">
                                        <FiMapPin className="mt-0.5 shrink-0 text-slate-400" />
                                        <span className="leading-relaxed">{getAddress(property)}</span>
                                    </p>

                                    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-100 pt-4 text-[13px] font-medium text-slate-600">
                                        <div className="flex items-center gap-1.5"><FiUsers className="text-slate-400" /> {property.maxGuests} khách</div>
                                        <div className="flex items-center gap-1.5"><FiHome className="text-slate-400" /> {property.bedrooms} phòng ngủ</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 bg-slate-50/80 p-4 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={() => navigate(`${APP_ROUTES.hostNewProperty}?listingId=${property.listingId}`)}
                                        className="flex items-center justify-center gap-2 rounded-3xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700 active:scale-95"
                                    >
                                        <FiEdit2 size={14} /> Chỉnh sửa
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => navigate(APP_ROUTES.hostCalendar)}
                                        className="flex items-center justify-center gap-2 rounded-3xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700 active:scale-95"
                                    >
                                        <FiCalendar size={14} /> Lịch
                                    </button>

                                    {(status === "draft" || status === "hidden") ? (
                                        <button
                                            type="button"
                                            onClick={() => handleSubmitForApproval(property.listingId)}
                                            className="col-span-2 flex items-center justify-center gap-2 rounded-3xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700 active:scale-95"
                                        >
                                            <FiSend size={14} /> Gửi duyệt
                                        </button>
                                    ) : null}

                                    {status === "published" || status === "hidden" ? (
                                        <button
                                            type="button"
                                            onClick={() => setDialogProperty(property)}
                                            className="col-span-2 flex items-center justify-center gap-2 rounded-3xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 active:scale-95"
                                        >
                                            {isPublished ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                                            {isPublished ? "Ẩn chỗ nghỉ" : "Hiện lại chỗ nghỉ"}
                                        </button>
                                    ) : null}
                                </div>
                            </article>
                        );
                    })}
                </div>
            </div>

            <ConfirmDialog
                isOpen={Boolean(dialogProperty)}
                onClose={() => setDialogProperty(null)}
                onConfirm={handleToggleVisibility}
                title={dialogProperty?.status === "published" ? "Ẩn chỗ nghỉ này?" : "Hiện lại chỗ nghỉ này?"}
                description={
                    dialogProperty?.status === "published"
                        ? "Chỗ nghỉ sẽ tạm thời không hiển thị với khách trên hệ thống."
                        : ""
                }
                confirmLabel={dialogProperty?.status === "published" ? "Ẩn chỗ nghỉ" : "Hiện chỗ nghỉ"}
            />
        </div>
    );
};

export default ChoNghi;