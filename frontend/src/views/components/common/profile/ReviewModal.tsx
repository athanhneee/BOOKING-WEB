import { useState } from "react";
import { LuStar, LuX } from "react-icons/lu";
import type { TripHistory } from "../../../../models/entities/TripHistory";
import { createReview } from "../../../../services/reviewService";
import { cn } from "../../../../utils";
import Modal from "../../ui/Modal";

type ReviewModalProps = {
    isOpen: boolean;
    trip: TripHistory;
    onClose: () => void;
    onSuccess: () => void;
};

const ReviewModal = ({ isOpen, trip, onClose, onSuccess }: ReviewModalProps) => {
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async () => {
        if (!trip.id) return;
        
        setIsSubmitting(true);
        setError("");

        try {
            await createReview({
                bookingId: Number(trip.id),
                rating,
                comment: comment.trim(),
            });
            onSuccess();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Có lỗi xảy ra khi gửi đánh giá.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (isSubmitting) return;
        setRating(5);
        setComment("");
        setError("");
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            panelClassName="mt-auto h-auto max-h-[92dvh] overflow-hidden rounded-t-[44px] border border-white/80 bg-white shadow-[0_34px_100px_-42px_rgba(15,23,42,0.6)] sm:mt-8 sm:max-h-[calc(100dvh-4rem)] sm:w-[min(680px,calc(100vw-2.5rem))] sm:rounded-[44px]"
        >
            <div className="flex h-full flex-col overflow-hidden rounded-t-[44px] bg-white sm:rounded-[44px]">
                <div className="flex shrink-0 items-start justify-between gap-4 rounded-t-[44px] border-b border-slate-100 bg-white px-5 py-5 sm:px-8 sm:py-6">
                    <div className="min-w-0">
                        <h2 className="text-2xl font-bold tracking-[-0.03em] text-slate-950 sm:text-[30px]">
                            Đánh giá chuyến đi
                        </h2>
                        <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-500">
                            Bạn đánh giá thế nào về kỳ nghỉ tại <span className="font-semibold text-slate-700">{trip.propertyName}</span>?
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={handleClose}
                        className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-50 hover:text-slate-900"
                        aria-label="Đóng"
                    >
                        <LuX size={19} />
                    </button>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto bg-[#f7f8fb] px-5 py-5 sm:px-8 sm:py-6">
                    <div className="rounded-[36px] border border-white/80 bg-white p-5 shadow-[0_12px_34px_rgba(15,23,42,0.06)] sm:p-6">
                        <div className="flex flex-col items-center">
                            <label className="block text-base font-bold text-slate-850">
                                Mức độ hài lòng của bạn
                            </label>
                            
                            <div className="mt-4 flex gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setRating(star)}
                                        className="p-1 transition-transform hover:scale-110"
                                    >
                                        <LuStar
                                            size={40}
                                            className={cn(
                                                "transition-colors",
                                                rating >= star
                                                    ? "fill-amber-400 text-amber-400"
                                                    : "fill-slate-100 text-slate-200"
                                            )}
                                        />
                                    </button>
                                ))}
                            </div>
                            <span className="mt-2 text-sm font-semibold text-amber-500">
                                {rating === 5 && "Tuyệt vời!"}
                                {rating === 4 && "Rất tốt"}
                                {rating === 3 && "Bình thường"}
                                {rating === 2 && "Tệ"}
                                {rating === 1 && "Rất tệ"}
                            </span>
                        </div>

                        <div className="mt-8">
                            <label className="block text-sm font-bold text-slate-850">
                                Chia sẻ trải nghiệm của bạn (Tùy chọn)
                            </label>
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Chia sẻ cảm nghĩ của bạn về chỗ nghỉ, tiện nghi, và sự hỗ trợ của chủ nhà..."
                                rows={4}
                                className="mt-4 w-full resize-none rounded-[34px] border border-slate-200 bg-white px-6 py-5 text-sm font-medium leading-6 text-slate-800 shadow-[0_10px_28px_rgba(15,23,42,0.06)] outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100"
                            />
                        </div>

                        {error && (
                            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                                {error}
                            </div>
                        )}
                    </div>
                </div>

                <div className="sticky bottom-0 shrink-0 rounded-b-[44px] border-t border-slate-100 bg-white px-5 py-4 shadow-[0_-18px_40px_-30px_rgba(15,23,42,0.45)] sm:px-8">
                    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={isSubmitting}
                            className="inline-flex min-h-13 items-center justify-center rounded-full border border-slate-200 bg-white px-7 py-3 text-sm font-bold text-slate-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50"
                        >
                            Hủy
                        </button>

                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="inline-flex min-h-13 items-center justify-center rounded-full bg-cyan-500 px-8 py-3 text-sm font-bold text-white shadow-[0_10px_24px_rgba(14,116,144,0.28)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-cyan-500 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-white disabled:shadow-none"
                        >
                            {isSubmitting ? "Đang gửi..." : "Gửi đánh giá"}
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default ReviewModal;
