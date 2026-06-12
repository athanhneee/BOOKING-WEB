import { useEffect, useState } from "react";
import { getListingReviews } from "../../../../services/listingService";
import { getMyHostListings, type HostListingSummary } from "../../../../services/hostService";
import { replyToReview } from "../../../../services/reviewService";
import type { ApiReview } from "../../../../models/entities/Review";
import { PageHeader } from "../shared";
import { formatDate, pageWrapperClass, primaryButtonClass, tableClassName, textareaClassName } from "../sharedStyles";

const DanhGia = () => {
    const [listings, setListings] = useState<HostListingSummary[]>([]);
    const [listingId, setListingId] = useState<number | "">("");
    const [reviews, setReviews] = useState<ApiReview[]>([]);
    const [replyDrafts, setReplyDrafts] = useState<Record<number, string>>({});
    const [loading, setLoading] = useState(true);
    const [savingId, setSavingId] = useState<number | null>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadListings = async () => {
            setError("");
            try {
                const result = await getMyHostListings({ page: 1, limit: 50 });
                setListings(result.items ?? []);
                setListingId((current) => current || result.items?.[0]?.listingId || "");
            } catch (fetchError) {
                setError(fetchError instanceof Error ? fetchError.message : "Không thể tải chỗ nghỉ.");
            }
        };

        void loadListings();
    }, []);

    useEffect(() => {
        const loadReviews = async () => {
            if (!listingId) {
                setLoading(false);
                return;
            }

            setLoading(true);
            setError("");

            try {
                const result = await getListingReviews(listingId, { page: 1, limit: 50 });
                setReviews(result.items ?? []);
            } catch (fetchError) {
                setError(fetchError instanceof Error ? fetchError.message : "Không thể tải đánh giá.");
            } finally {
                setLoading(false);
            }
        };

        void loadReviews();
    }, [listingId]);

    const submitReply = async (reviewId: number) => {
        const reply = replyDrafts[reviewId]?.trim();
        if (!reply) return;

        setSavingId(reviewId);
        setError("");

        try {
            await replyToReview(reviewId, reply);
            setReplyDrafts((current) => ({ ...current, [reviewId]: "" }));
            if (listingId) {
                const result = await getListingReviews(listingId, { page: 1, limit: 50 });
                setReviews(result.items ?? []);
            }
        } catch (submitError) {
            setError(submitError instanceof Error ? submitError.message : "Không thể phản hồi đánh giá.");
        } finally {
            setSavingId(null);
        }
    };

    return (
        <div className={pageWrapperClass}>
            <div className="mx-auto max-w-7xl space-y-6">
                <PageHeader title="Đánh giá" />

                {error ? <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div> : null}

                <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
                    <label className="block space-y-2">
                        <span className="text-sm font-medium text-gray-700">Chọn chỗ nghỉ</span>
                        <select value={listingId} onChange={(event) => setListingId(Number(event.target.value) || "")} className="w-full rounded-3xl border border-gray-200 px-3 py-2.5">
                            {listings.map((listing) => <option key={listing.listingId} value={listing.listingId}>{listing.title}</option>)}
                        </select>
                    </label>
                </section>

                <section className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
                    <table className={`${tableClassName} text-left text-sm`}>
                        <thead className="bg-gray-50 text-gray-500">
                            <tr><th className="px-4 py-3">Khách</th><th className="px-4 py-3">Sao</th><th className="px-4 py-3">Nội dung</th><th className="px-4 py-3">Ngày</th><th className="px-4 py-3">Phản hồi host</th></tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-10">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="mb-3 h-6 w-6 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent"></div>
                                            <span className="text-sm font-medium text-slate-500">Đang tải đánh giá...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : null}
                            {!loading && reviews.length === 0 ? <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-500">Chưa có đánh giá.</td></tr> : null}
                            {reviews.map((review) => (
                                <tr key={review.reviewId}>
                                    <td className="px-4 py-4 font-medium text-gray-900">{review.reviewerName ?? `User #${review.reviewerUserId ?? "ẩn"}`}</td>
                                    <td className="px-4 py-4 text-amber-500">{"★".repeat(Number(review.rating || 0))}</td>
                                    <td className="px-4 py-4 text-gray-600">{review.comment || "Không có nội dung"}</td>
                                    <td className="px-4 py-4 text-gray-500">{formatDate(review.createdAt.slice(0, 10))}</td>
                                    <td className="px-4 py-4">
                                        {review.hostReply ? (
                                            <p className="rounded-3xl bg-gray-50 p-3 text-gray-600">{review.hostReply}</p>
                                        ) : (
                                            <div className="space-y-2">
                                                <textarea value={replyDrafts[review.reviewId] ?? ""} onChange={(event) => setReplyDrafts((current) => ({ ...current, [review.reviewId]: event.target.value }))} className={`${textareaClassName} min-h-[80px]`} placeholder="Nhập phản hồi..." />
                                                <button type="button" disabled={savingId === review.reviewId} onClick={() => submitReply(review.reviewId)} className={primaryButtonClass}>Gửi phản hồi</button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>
            </div>
        </div>
    );
};

export default DanhGia;
