import { useLocation, useNavigate } from "react-router-dom";
import { APP_ROUTES } from "../../config/routes";
import ListingCard from "../../views/components/listing/ListingCard";
import { useRecentlyViewed } from "./useRecentlyViewed";

const RecentlyViewedSection = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { items } = useRecentlyViewed();

    if (items.length === 0) {
        return null;
    }

    const handleOpenDetail = (villaId: string) => {
        const returnTo = `${location.pathname}${location.search}`;
        navigate(APP_ROUTES.villaDetail(villaId), {
            state: { returnTo },
        });
    };

    return (
        <section className="bg-white py-12 sm:py-14">
            <div className="mx-auto w-full max-w-[74rem] px-4 md:px-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-600">Lịch sử xem</p>
                        <h2 className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">Đã xem gần đây</h2>
                    </div>
                    <p className="max-w-xl text-sm leading-6 text-zinc-500">
                        Những villa bạn vừa mở sẽ được giữ lại trên thiết bị này để quay lại nhanh hơn.
                    </p>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-4 min-[520px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {items.map((listing) => (
                        <ListingCard
                            key={listing.id}
                            listing={listing}
                            onClick={() => handleOpenDetail(listing.id)}
                            className="h-full cursor-pointer shadow-sm hover:shadow-md"
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default RecentlyViewedSection;
