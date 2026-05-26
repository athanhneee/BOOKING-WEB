import { useEffect, useMemo, useState } from "react";
import { FiCalendar, FiEdit2, FiEye, FiEyeOff, FiPlus, FiSend } from "react-icons/fi";
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
    secondaryButtonClass,
} from "../sharedStyles";

type PropertyFilter = "all" | HostListingStatus;

const filterOptions: Array<{ label: string; value: PropertyFilter }> = [
    { label: "Tất cả", value: "all" },
    { label: "Nháp", value: "draft" },
    { label: "Chờ duyệt", value: "pending_approval" },
    { label: "Đã duyệt", value: "published" },
    { label: "Đang ẩn", value: "hidden" },
];

const statusStyles: Record<HostListingStatus, string> = {
    draft: "bg-slate-100 text-slate-700",
    pending_approval: "bg-amber-100 text-amber-700",
    published: "bg-emerald-500 text-white",
    hidden: "bg-gray-900/75 text-white",
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

    const loadProperties = async () => {
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
    };

    useEffect(() => {
        void loadProperties();
    }, [filter]);

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
        <div className={pageWrapperClass}>
            <div className="mx-auto max-w-7xl space-y-6">
                <PageHeader
                    title="Chỗ nghỉ của bạn"
                    subtitle="Danh sách chỗ nghỉ"
                    actions={
                        <button
                            type="button"
                            onClick={() => navigate(APP_ROUTES.hostNewProperty)}
                            className={primaryButtonClass}
                        >
                            <span className="inline-flex items-center gap-2">
                                <FiPlus size={16} />
                                Thêm chỗ nghỉ
                            </span>
                        </button>
                    }
                />

                <FilterTabs options={filterOptions} value={filter} onChange={setFilter} underline />

                {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div> : null}
                {success ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{success}</div> : null}

                {loading ? (
                    <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center text-sm font-medium text-gray-500 shadow-sm">
                        Đang tải chỗ nghỉ từ ...
                    </div>
                ) : null}

                {!loading && filteredProperties.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center shadow-sm">
                        <p className="text-base font-semibold text-gray-900">Chưa có chỗ nghỉ nào</p>
                        <p className="mt-2 text-sm text-gray-500">Bấm "Thêm chỗ nghỉ" để tạo phòng."</p>
                    </div>
                ) : null}

                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {filteredProperties.map((property) => {
                        const status = property.status ?? "draft";
                        const isPublished = status === "published";

                        return (
                            <article key={property.listingId} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                                <div className="relative">
                                    {property.imageUrl ? (
                                        <img
                                            src={property.imageUrl}
                                            alt={property.title}
                                            className="aspect-video w-full rounded-t-2xl object-cover"
                                        />
                                    ) : (
                                        <div className="flex aspect-video w-full items-center justify-center rounded-t-2xl bg-slate-100 text-sm font-medium text-slate-500">
                                            Chưa có ảnh URL
                                        </div>
                                    )}
                                    <span
                                        className={`absolute right-4 top-4 rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[status]}`}
                                    >
                                        {statusLabels[status]}
                                    </span>
                                </div>

                                <div className="space-y-4 p-6">
                                    <div>
                                        <h2 className="text-lg font-semibold text-gray-900">{property.title}</h2>
                                        <div className="mt-2 inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                                            {property.propertyType}
                                        </div>
                                        <p className="mt-2 text-sm text-gray-500">{getAddress(property)}</p>
                                    </div>

                                    <p className="text-sm text-gray-600">
                                        {property.maxGuests} khách · {property.bedrooms} phòng ngủ · {formatCurrency(Number(property.basePrice || 0))}/đêm
                                    </p>

                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <button
                                            type="button"
                                            onClick={() => navigate(`${APP_ROUTES.hostNewProperty}?listingId=${property.listingId}`)}
                                            className={secondaryButtonClass}
                                        >
                                            <span className="inline-flex items-center gap-2">
                                                <FiEdit2 size={15} />
                                                Chỉnh sửa
                                            </span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => navigate(APP_ROUTES.hostCalendar)}
                                            className={secondaryButtonClass}
                                        >
                                            <span className="inline-flex items-center gap-2">
                                                <FiCalendar size={15} />
                                                Xem lịch
                                            </span>
                                        </button>

                                        {(status === "draft" || status === "hidden") ? (
                                            <button
                                                type="button"
                                                onClick={() => handleSubmitForApproval(property.listingId)}
                                                className={secondaryButtonClass}
                                            >
                                                <span className="inline-flex items-center gap-2">
                                                    <FiSend size={15} />
                                                    Gửi duyệt
                                                </span>
                                            </button>
                                        ) : null}

                                        {status === "published" || status === "hidden" ? (
                                            <button
                                                type="button"
                                                onClick={() => setDialogProperty(property)}
                                                className={secondaryButtonClass}
                                            >
                                                <span className="inline-flex items-center gap-2">
                                                    {isPublished ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                                                    {isPublished ? "Ẩn" : "Hiện"}
                                                </span>
                                            </button>
                                        ) : null}
                                    </div>
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
                        ? "Chỗ nghỉ sẽ tạm thời không hiển thị với khách trênminh thanh villa ."
                        : ""
                }
                confirmLabel={dialogProperty?.status === "published" ? "Ẩn chỗ nghỉ" : "Hiện chỗ nghỉ"}
            />
        </div>
    );
};

export default ChoNghi;