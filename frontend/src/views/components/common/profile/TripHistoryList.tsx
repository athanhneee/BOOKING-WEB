import { useState } from "react";
import { Link } from "react-router-dom";
import { LuCompass, LuPlane } from "react-icons/lu";
import { APP_ROUTES } from "../../../../config/routes";
import type { TripHistory } from "../../../../models/entities/TripHistory";
import TripHistoryCard from "./TripHistoryCard";
import ReviewModal from "./ReviewModal";

type TripHistoryListProps = {
    trips: TripHistory[];
};

const TripHistoryList = ({ trips }: TripHistoryListProps) => {
    const [reviewingTrip, setReviewingTrip] = useState<TripHistory | null>(null);

    if (trips.length === 0) {
        return (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
                <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-cyan-300/10 text-cyan-600">
                    <LuPlane size={34} />
                </span>
                <h3 className="mt-5 text-2xl font-semibold text-slate-900">Bạn chưa có chuyến đi nào</h3>
                <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
                    Hãy khám phá và đặt phòng ngay hôm nay để lưu lại những chuyến đi đáng nhớ tiếp theo của bạn.
                </p>
                <Link
                    to={APP_ROUTES.home}
                    className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-3xl bg-cyan-500 px-5 py-3 text-sm font-medium text-white transition-all duration-200 hover:bg-cyan-500"
                >
                    <LuCompass size={16} />
                    Khám phá nơi lưu trú
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {trips.map((trip) => (
                <TripHistoryCard
                    key={trip.id}
                    trip={trip}
                    onReview={() => setReviewingTrip(trip)}
                />
            ))}

            {reviewingTrip && (
                <ReviewModal
                    isOpen={Boolean(reviewingTrip)}
                    trip={reviewingTrip}
                    onClose={() => setReviewingTrip(null)}
                    onSuccess={() => {
                        setReviewingTrip(null);
                        // Optionally reload data here or show success toast
                        window.location.reload();
                    }}
                />
            )}
        </div>
    );
};

export default TripHistoryList;