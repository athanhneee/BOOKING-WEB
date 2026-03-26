import { useMemo, useState } from "react";
import { properties, reviews } from "../../../../data/mockData.ts";
import {
    FilterTabs,
    PageHeader,
} from "../shared";
import {
    formatDate,
    getInitials,
    hostCardClass,
    inputClassName,
    pageWrapperClass,
    primaryButtonClass,
} from "../sharedStyles";

type ReviewFilter = "all" | "pending" | "replied";

const reviewFilters: Array<{ label: string; value: ReviewFilter }> = [
    { label: "Tất cả", value: "all" },
    { label: "Chưa trả lời", value: "pending" },
    { label: "Đã trả lời", value: "replied" },
];

const DanhGia = () => {
    const [filter, setFilter] = useState<ReviewFilter>("all");
    const [propertyId, setPropertyId] = useState("all");
    const [expanded, setExpanded] = useState<string[]>([]);
    const [replies, setReplies] = useState<Record<string, string>>({});

    const filteredReviews = useMemo(
        () =>
            reviews.filter((review) => {
                const matchesFilter =
                    filter === "all" || (filter === "pending" ? !review.replied : review.replied);
                const matchesProperty = propertyId === "all" || review.propertyId === propertyId;
                return matchesFilter && matchesProperty;
            }),
        [filter, propertyId],
    );

    const averageRating = (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1);

    return (
        <div className={pageWrapperClass}>
            <div className="mx-auto max-w-7xl space-y-6">
                <PageHeader title="Đánh giá" subtitle="Theo dõi chất lượng dịch vụ và phản hồi nhận xét của khách nhanh chóng." />

                <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
                    <section className={hostCardClass}>
                        <p className="text-sm font-medium text-gray-500">Điểm trung bình</p>
                        <div className="mt-4 flex items-end gap-3">
                            <span className="text-5xl font-bold text-gray-900">{averageRating}</span>
                            <span className="pb-2 text-2xl text-amber-500">⭐</span>
                        </div>
                        <div className="mt-6 space-y-3">
                            {[5, 4, 3, 2, 1].map((star) => {
                                const count = reviews.filter((review) => review.rating === star).length;
                                const percent = (count / reviews.length) * 100;
                                return (
                                    <div key={star} className="grid grid-cols-[42px_minmax(0,1fr)_48px] items-center gap-3 text-sm">
                                        <span className="text-gray-600">{star}★</span>
                                        <div className="h-2 rounded-full bg-gray-100">
                                            <div className="h-2 rounded-full bg-cyan-600" style={{ width: `${percent}%` }} />
                                        </div>
                                        <span className="text-right text-gray-500">{Math.round(percent)}%</span>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    <section className="space-y-5">
                        <div className={`${hostCardClass} space-y-4`}>
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                <FilterTabs options={reviewFilters} value={filter} onChange={setFilter} />
                                <select value={propertyId} onChange={(event) => setPropertyId(event.target.value)} className={`${inputClassName} max-w-xs`}>
                                    <option value="all">Tất cả chỗ nghỉ</option>
                                    {properties.map((property) => <option key={property.id} value={property.id}>{property.name}</option>)}
                                </select>
                            </div>
                        </div>

                        {filteredReviews.map((review) => {
                            const isExpanded = expanded.includes(review.id);
                            const shouldTrim = review.content.length > 200 && !isExpanded;
                            const content = shouldTrim ? `${review.content.slice(0, 200)}...` : review.content;

                            return (
                                <article key={review.id} className={hostCardClass}>
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                        <div className="flex items-start gap-4">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-600 text-sm font-semibold text-white">
                                                {getInitials(review.guestName)}
                                            </div>
                                            <div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h2 className="font-semibold text-gray-900">{review.guestName}</h2>
                                                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                                                        {review.propertyName}
                                                    </span>
                                                </div>
                                                <p className="mt-1 text-sm text-gray-500">{formatDate(review.date)}</p>
                                                <p className="mt-2 text-amber-500">{"⭐".repeat(review.rating)}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <p className="mt-4 text-sm leading-7 text-gray-600">
                                        {content}
                                        {review.content.length > 200 ? (
                                            <button type="button" onClick={() => setExpanded((current) => current.includes(review.id) ? current.filter((item) => item !== review.id) : [...current, review.id])} className="ml-2 font-medium text-cyan-700">
                                                {isExpanded ? "Thu gọn" : "Xem thêm"}
                                            </button>
                                        ) : null}
                                    </p>

                                    {!review.replied ? (
                                        <div className="mt-5 space-y-3">
                                            <textarea
                                                value={replies[review.id] ?? ""}
                                                onChange={(event) => setReplies((current) => ({ ...current, [review.id]: event.target.value }))}
                                                placeholder="Gửi phản hồi đến khách..."
                                                className="min-h-[120px] w-full rounded-xl border border-gray-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                                            />
                                            <div className="flex justify-end">
                                                <button type="button" className={primaryButtonClass}>Gửi phản hồi</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="mt-5 rounded-xl border-l-4 border-cyan-600 bg-cyan-300/12 p-4">
                                            <p className="text-sm font-semibold text-gray-900">Phản hồi từ BlueStay</p>
                                            <p className="mt-2 text-sm leading-7 text-gray-600">{review.replyText}</p>
                                        </div>
                                    )}
                                </article>
                            );
                        })}
                    </section>
                </div>
            </div>
        </div>
    );
};

export default DanhGia;
