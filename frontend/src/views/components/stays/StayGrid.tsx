import type { PopularDestination } from "../../../config/popularDestinations";
import StayCard from "./StayCard";

type StayGridProps = {
    stays: PopularDestination[];
};

const StayGrid = ({ stays }: StayGridProps) => {
    if (stays.length === 0) {
        return (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
                <p className="text-lg font-semibold text-zinc-900">Chưa có nơi lưu trú phù hợp.</p>
                <p className="mt-2 text-sm text-zinc-500">Hãy thử chọn lại thời gian hoặc quay lại sau để xem thêm lựa chọn mới.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {stays.map((stay) => (
                <StayCard key={stay.id} stay={stay} />
            ))}
        </div>
    );
};

export default StayGrid;
