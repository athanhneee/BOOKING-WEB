import { useCallback, useEffect, useMemo, useState } from "react";
import { FiEdit2, FiEye, FiEyeOff, FiPlus, FiRefreshCw, FiTrash2 } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { APP_ROUTES } from "../../../../config/routes";
import {
    deleteHostListing,
    getMyHostListings,
    hideHostListing,
    publishHostListing,
    submitHostListingForApproval,
    type HostListingStatus,
    type HostListingSummary,
} from "../../../../services/hostService";
import { PageHeader } from "../shared";
import { formatCurrency, pageWrapperClass, primaryButtonClass, secondaryButtonClass, tableClassName } from "../sharedStyles";

const statusLabels: Record<HostListingStatus, string> = {
    draft: "Bản nháp",
    pending_approval: "Chờ duyệt",
    published: "Đang hiển thị",
    hidden: "Đang ẩn",
};

const statusClassNames: Record<HostListingStatus, string> = {
    draft: "bg-slate-100 text-slate-700",
    pending_approval: "bg-amber-100 text-amber-700",
    published: "bg-emerald-100 text-emerald-700",
    hidden: "bg-gray-100 text-gray-700",
};

const filterOptions: Array<{ label: string; value: HostListingStatus | "all" }> = [
    { label: "Tất cả", value: "all" },
    { label: "Đang hiển thị", value: "published" },
    { label: "Chờ duyệt", value: "pending_approval" },
    { label: "Bản nháp", value: "draft" },
    { label: "Đang ẩn", value: "hidden" },
];

const getListingStatus = (listing: HostListingSummary): HostListingStatus => listing.status ?? "draft";

const ChoNghi = () => {
    const navigate = useNavigate();
    const [status, setStatus] = useState<HostListingStatus | "all">("all");
    const [items, setItems] = useState<HostListingSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [actionId, setActionId] = useState<number | null>(null);

    const fetchListings = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const result = await getMyHostListings({ status, page: 1, limit: 100 });
            setItems(result.items ?? []);
        } catch (fetchError) {
            setError(fetchError instanceof Error ? fetchError.message : "Không thể tải danh sách chỗ nghỉ.");
        } finally {
            setLoading(false);
        }
    }, [status]);

    useEffect(() => {
        void fetchListings();
    }, [fetchListings]);

    const summary = useMemo(() => {
        const counts = items.reduce(
            (acc, item) => {
                acc[getListingStatus(item)] += 1;
                return acc;
            },
            { draft: 0, pending_approval: 0, published: 0, hidden: 0 } as Record<HostListingStatus, number>,
        );

        return [
            { label: "Tổng chỗ nghỉ", value: items.length },
            { label: "Đang hiển thị", value: counts.published },
            { label: "Chờ duyệt", value: counts.pending_approval },
            { label: "Bản nháp/ẩn", value: counts.draft + counts.hidden },
        ];
    }, [items]);

    const runAction = async (listingId: number, action: () => Promise<unknown>) => {
        setActionId(listingId);
        setError("");

        try {
            await action();
            await fetchListings();
        } catch (actionError) {
            setError(actionError instanceof Error ? actionError.message : "Không thể cập nhật chỗ nghỉ.");
        } finally {
            setActionId(null);
        }
    };

    return (
        <div className={pageWrapperClass}>
            <div className="mx-auto max-w-7xl space-y-6">
                <PageHeader
                    title="Chỗ nghỉ của tôi"
                    subtitle="Danh sách này lấy trực tiếp từ backend /api/host/listings/mine, không còn dùng mock data."
                    actions={
                        <>
                            <button type="button" onClick={fetchListings} className={secondaryButtonClass}>
                                <FiRefreshCw className="mr-2 inline" /> Tải lại
                            </button>
                            <button type="button" onClick={() => navigate(APP_ROUTES.hostNewProperty)} className={primaryButtonClass}>
                                <FiPlus className="mr-2 inline" /> Thêm chỗ nghỉ
                            </button>
                        </>
                    }
                />

                {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div> : null}

                <div className="grid gap-4 md:grid-cols-4">
                    {summary.map((item) => (
                        <article key={item.label} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                            <p className="text-sm text-gray-500">{item.label}</p>
                            <p className="mt-2 text-3xl font-bold text-gray-900">{item.value}</p>
                        </article>
                    ))}
                </div>

                <div className="flex flex-wrap gap-2 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
                    {filterOptions.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => setStatus(option.value)}
                            className={`rounded-xl px-4 py-2 text-sm font-medium ${status === option.value ? "bg-cyan-50 text-cyan-700" : "text-gray-500 hover:bg-gray-50"}`}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>

                <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                    <table className={`${tableClassName} text-left text-sm`}>
                        <thead className="bg-gray-50 text-gray-500">
                            <tr>
                                <th className="px-4 py-3 font-medium">Chỗ nghỉ</th>
                                <th className="px-4 py-3 font-medium">Loại</th>
                                <th className="px-4 py-3 font-medium">Giá/đêm</th>
                                <th className="px-4 py-3 font-medium">Sức chứa</th>
                                <th className="px-4 py-3 font-medium">Trạng thái</th>
                                <th className="px-4 py-3 font-medium">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-10 text-center text-gray-500">Đang tải chỗ nghỉ...</td>
                                </tr>
                            ) : items.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-10 text-center text-gray-500">Chưa có chỗ nghỉ phù hợp bộ lọc.</td>
                                </tr>
                            ) : (
                                items.map((listing) => {
                                    const listingStatus = getListingStatus(listing);
                                    const isBusy = actionId === listing.listingId;

                                    return (
                                        <tr key={listing.listingId}>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        src={listing.imageUrl || "https://placehold.co/160x100?text=Villa"}
                                                        alt={listing.title}
                                                        className="h-16 w-24 rounded-xl object-cover"
                                                    />
                                                    <div>
                                                        <p className="font-semibold text-gray-900">{listing.title}</p>
                                                        <p className="mt-1 text-xs text-gray-500">{[listing.addressLine, listing.ward, listing.district, listing.city].filter(Boolean).join(", ")}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-gray-600">{listing.propertyType}</td>
                                            <td className="px-4 py-4 text-gray-600">{formatCurrency(Number(listing.basePrice || 0))}</td>
                                            <td className="px-4 py-4 text-gray-600">{listing.maxGuests} khách</td>
                                            <td className="px-4 py-4">
                                                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClassNames[listingStatus]}`}>
                                                    {statusLabels[listingStatus]}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex flex-wrap gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => navigate(`${APP_ROUTES.hostNewProperty}?listingId=${listing.listingId}`)}
                                                        className={secondaryButtonClass}
                                                    >
                                                        <FiEdit2 className="mr-1 inline" /> Sửa
                                                    </button>
                                                    {listingStatus === "draft" ? (
                                                        <button
                                                            type="button"
                                                            disabled={isBusy}
                                                            onClick={() => runAction(listing.listingId, () => submitHostListingForApproval(listing.listingId))}
                                                            className={primaryButtonClass}
                                                        >
                                                            Gửi duyệt
                                                        </button>
                                                    ) : null}
                                                    {listingStatus === "published" ? (
                                                        <button
                                                            type="button"
                                                            disabled={isBusy}
                                                            onClick={() => runAction(listing.listingId, () => hideHostListing(listing.listingId))}
                                                            className={secondaryButtonClass}
                                                        >
                                                            <FiEyeOff className="mr-1 inline" /> Ẩn
                                                        </button>
                                                    ) : null}
                                                    {listingStatus === "hidden" ? (
                                                        <button
                                                            type="button"
                                                            disabled={isBusy}
                                                            onClick={() => runAction(listing.listingId, () => publishHostListing(listing.listingId))}
                                                            className={secondaryButtonClass}
                                                        >
                                                            <FiEye className="mr-1 inline" /> Hiện
                                                        </button>
                                                    ) : null}
                                                    <button
                                                        type="button"
                                                        disabled={isBusy}
                                                        onClick={() => {
                                                            if (window.confirm("Bạn chắc chắn muốn xóa chỗ nghỉ này?")) {
                                                                void runAction(listing.listingId, () => deleteHostListing(listing.listingId));
                                                            }
                                                        }}
                                                        className="rounded-xl border border-rose-200 px-4 py-2.5 text-sm text-rose-600 transition-colors hover:bg-rose-50"
                                                    >
                                                        <FiTrash2 className="mr-1 inline" /> Xóa
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ChoNghi;