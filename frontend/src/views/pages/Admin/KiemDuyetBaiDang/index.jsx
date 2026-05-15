import { useCallback, useEffect, useState } from "react";
import { FiCheck, FiRefreshCw, FiX } from "react-icons/fi";
import { approveListing, getPendingListings, rejectListing } from "../../../../services/adminService";
import { formatCurrency, pageWrapperClass, primaryButtonClass, secondaryButtonClass, tableClassName } from "../../Host/sharedStyles";

const KiemDuyetBaiDang = () => {
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [actionId, setActionId] = useState(null);

    const fetchListings = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const result = await getPendingListings({ page: 1, limit: 100 });
            setListings(result.items ?? []);
        } catch (fetchError) {
            setError(fetchError instanceof Error ? fetchError.message : "Không thể tải bài chờ duyệt.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { void fetchListings(); }, [fetchListings]);

    const runAction = async (listingId, action) => {
        setActionId(listingId);
        setError("");
        try {
            await action();
            await fetchListings();
        } catch (actionError) {
            setError(actionError instanceof Error ? actionError.message : "Không thể xử lý bài đăng.");
        } finally {
            setActionId(null);
        }
    };

    return (
        <div className={pageWrapperClass}>
            <div className="mx-auto max-w-7xl space-y-6">
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                    <div><h1 className="text-2xl font-bold text-gray-900">Kiểm duyệt bài đăng</h1><p className="mt-1 text-sm text-gray-500">Gọi API thật /api/admin/listings/pending, approve, reject.</p></div>
                    <button type="button" onClick={fetchListings} className={secondaryButtonClass}><FiRefreshCw className="mr-2 inline" />Tải lại</button>
                </div>
                {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div> : null}
                <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                    <table className={`${tableClassName} text-left text-sm`}>
                        <thead className="bg-gray-50 text-gray-500"><tr><th className="px-4 py-3">Listing</th><th className="px-4 py-3">Địa chỉ</th><th className="px-4 py-3">Loại</th><th className="px-4 py-3">Giá</th><th className="px-4 py-3">Hành động</th></tr></thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {loading ? <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-500">Đang tải...</td></tr> : null}
                            {!loading && listings.length === 0 ? <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-500">Không có listing chờ duyệt.</td></tr> : null}
                            {listings.map((listing) => (
                                <tr key={listing.listingId}>
                                    <td className="px-4 py-4"><div className="flex items-center gap-3"><img src={listing.imageUrl || "https://placehold.co/160x100?text=Villa"} alt={listing.title} className="h-16 w-24 rounded-xl object-cover" /><div><p className="font-semibold text-gray-900">{listing.title}</p><p className="text-xs text-gray-500">ID: {listing.listingId}</p></div></div></td>
                                    <td className="px-4 py-4 text-gray-600">{[listing.addressLine, listing.ward, listing.district, listing.city].filter(Boolean).join(", ")}</td>
                                    <td className="px-4 py-4 text-gray-600">{listing.propertyType}</td>
                                    <td className="px-4 py-4 text-gray-600">{formatCurrency(Number(listing.basePrice || 0))}</td>
                                    <td className="px-4 py-4"><div className="flex flex-wrap gap-2"><button type="button" disabled={actionId === listing.listingId} onClick={() => runAction(listing.listingId, () => approveListing(listing.listingId))} className={primaryButtonClass}><FiCheck className="mr-1 inline" />Duyệt</button><button type="button" disabled={actionId === listing.listingId} onClick={() => { const reason = window.prompt("Lý do từ chối bài đăng?"); if (reason) void runAction(listing.listingId, () => rejectListing(listing.listingId, reason)); }} className="rounded-xl border border-rose-200 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50"><FiX className="mr-1 inline" />Từ chối</button></div></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>
            </div>
        </div>
    );
};

export default KiemDuyetBaiDang;