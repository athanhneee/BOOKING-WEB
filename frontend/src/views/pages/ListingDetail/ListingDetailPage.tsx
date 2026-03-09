import { FaArrowLeft, FaMapMarkerAlt, FaStar } from "react-icons/fa";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { popularDestinations } from "../../../config/popularDestinations";

type ListingDetailLocationState = {
    returnTo?: string;
};

const ListingDetailPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { villaId } = useParams();
    const destination = popularDestinations.find((item) => item.id === villaId);

    const handleBack = () => {
        const state = location.state as ListingDetailLocationState | null;
        const fromState = state?.returnTo;
        const fromStorage = sessionStorage.getItem("popular_return_to");
        const returnTo = fromState || fromStorage;

        if (returnTo) {
            navigate(returnTo);
            return;
        }

        navigate("/");
    };

    if (!destination) {
        return (
            <section className="mx-auto max-w-3xl px-4 py-28 text-center">
                <h1 className="text-3xl font-bold text-zinc-900">Không tìm thấy villa</h1>
                <button
                    type="button"
                    onClick={() => navigate("/")}
                    className="mt-6 inline-flex items-center gap-2 rounded-full border border-zinc-300 bg-white px-6 py-3 text-sm font-semibold text-zinc-900 transition-colors hover:bg-zinc-100"
                >
                    <FaArrowLeft />
                    Về trang chủ
                </button>
            </section>
        );
    }

    return (
        <section className="mx-auto max-w-5xl px-4 pb-16 pt-24 sm:pt-28">
            <button
                type="button"
                onClick={handleBack}
                className="inline-flex items-center gap-2 rounded-full border border-zinc-300 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-900 transition-colors hover:bg-zinc-100"
            >
                <FaArrowLeft />
                Quay lại
            </button>

            <div className="mt-6 overflow-hidden rounded-3xl bg-zinc-200">
                {destination.imageUrl ? (
                    <img src={destination.imageUrl} alt={destination.name} className="h-[42vh] w-full object-cover sm:h-[56vh]" />
                ) : (
                    <div className="flex h-[42vh] items-center justify-center text-sm font-medium text-zinc-500 sm:h-[56vh]">
                        Chưa có hình ảnh
                    </div>
                )}
            </div>

            <div className="mt-6 rounded-3xl border border-zinc-200 bg-white p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <h1 className="text-2xl font-bold text-zinc-900 sm:text-3xl">{destination.name}</h1>
                    <div className="inline-flex items-center gap-1 rounded-xl bg-zinc-900 px-3 py-1 text-sm font-semibold text-white">
                        <FaStar className="text-yellow-300" />
                        {destination.rating.toFixed(1)}
                    </div>
                </div>

                <p className="mt-3 flex items-center gap-2 text-zinc-600">
                    <FaMapMarkerAlt className="text-zinc-400" />
                    {destination.address}
                </p>

                <p className="mt-4 text-2xl font-bold text-zinc-900">
                    {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                        maximumFractionDigits: 0,
                    }).format(destination.pricePerNight)}
                    <span className="ml-2 text-sm font-medium text-zinc-500">/ đêm</span>
                </p>
            </div>
        </section>
    );
};

export default ListingDetailPage;
