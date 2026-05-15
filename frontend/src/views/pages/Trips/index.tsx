import { useEffect, useMemo, useState, type FormEvent } from "react";
import { FiRefreshCw, FiStar, FiXCircle } from "react-icons/fi";
import type { ApiBooking } from "../../../models/entities/Booking";
import type { ApiUser } from "../../../models/entities/User";
import { cancelBooking, getMyBookings } from "../../../services/bookingService";
import { createReview } from "../../../services/reviewService";
import { getMe, updateMe } from "../../../services/userService";
import { formatCurrency, formatDate } from "../Host/sharedStyles";

const canCancel = (booking: ApiBooking) => ["pending_payment", "pending_host_confirmation", "confirmed"].includes(booking.status);
const canReview = (booking: ApiBooking) => booking.status === "completed";

const ProfilePage = () => {
    const [user, setUser] = useState<ApiUser | null>(null);
    const [bookings, setBookings] = useState<ApiBooking[]>([]);
    const [profileDraft, setProfileDraft] = useState({ fullName: "", phone: "", bio: "" });
    const [reviewDrafts, setReviewDrafts] = useState<Record<number, { rating: number; comment: string }>>({});
    const [loading, setLoading] = useState(true);
    const [savingProfile, setSavingProfile] = useState(false);
    const [actionId, setActionId] = useState<number | null>(null);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const fetchData = async () => {
        setLoading(true);
        setError("");

        try {
            const [meResult, bookingResult] = await Promise.all([
                getMe(),
                getMyBookings({ page: 1, limit: 100 }),
            ]);
            setUser(meResult.user);
            setProfileDraft({
                fullName: meResult.user.fullName || meResult.user.name || "",
                phone: meResult.user.phone || "",
                bio: meResult.user.bio || "",
            });
            setBookings(bookingResult.items ?? []);
        } catch (fetchError) {
            setError(fetchError instanceof Error ? fetchError.message : "Không thể tải tài khoản/chuyến đi.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void fetchData();
    }, []);

    const stats = useMemo(() => {
        const paidAmount = bookings
            .filter((booking) => !booking.status.startsWith("cancelled"))
            .reduce((sum, booking) => sum + Number(booking.totalAmount || booking.totalPrice || 0), 0);

        return [
            { label: "Tổng chuyến đi", value: bookings.length },
            { label: "Đã hoàn tất", value: bookings.filter((booking) => booking.status === "completed").length },
            { label: "Đang hiệu lực", value: bookings.filter((booking) => ["confirmed", "checked_in"].includes(booking.status)).length },
            { label: "Tổng chi tiêu", value: formatCurrency(paidAmount) },
        ];
    }, [bookings]);

    const submitProfile = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSavingProfile(true);
        setError("");
        setSuccess("");

        try {
            const result = await updateMe({
                fullName: profileDraft.fullName,
                phone: profileDraft.phone || null,
                bio: profileDraft.bio || null,
            });
            setUser(result.user);
            setSuccess("Đã cập nhật hồ sơ cá nhân.");
        } catch (submitError) {
            setError(submitError instanceof Error ? submitError.message : "Không thể cập nhật hồ sơ.");
        } finally {
            setSavingProfile(false);
        }
    };

    const cancelMyBooking = async (bookingId: number) => {
        const reason = window.prompt("Lý do hủy booking?") || "Khách hủy từ trang cá nhân";
        setActionId(bookingId);
        setError("");
        setSuccess("");

        try {
            await cancelBooking(bookingId, reason);
            await fetchData();
            setSuccess("Đã hủy booking.");
        } catch (cancelError) {
            setError(cancelError instanceof Error ? cancelError.message : "Không thể hủy booking.");
        } finally {
            setActionId(null);
        }
    };

    const submitReview = async (bookingId: number) => {
        const draft = reviewDrafts[bookingId] ?? { rating: 5, comment: "" };
        setActionId(bookingId);
        setError("");
        setSuccess("");

        try {
            await createReview({ bookingId, rating: draft.rating, comment: draft.comment || undefined });
            setReviewDrafts((current) => ({ ...current, [bookingId]: { rating: 5, comment: "" } }));
            setSuccess("Đã gửi đánh giá.");
        } catch (reviewError) {
            setError(reviewError instanceof Error ? reviewError.message : "Không thể gửi đánh giá.");
        } finally {
            setActionId(null);
        }
    };

    return (
        <div className="min-h-screen bg-[#F7F8FA] px-4 py-8">
            <div className="mx-auto max-w-7xl space-y-6">
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Tài khoản & chuyến đi</h1>
                        <p className="mt-1 text-sm text-gray-500">Trang này dùng API thật /api/users/me, /api/bookings/mine, /api/reviews.</p>
                    </div>
                    <button type="button" onClick={fetchData} className="rounded-xl border border-gray-200 px-4 py-2.5 text-gray-700 hover:bg-white"><FiRefreshCw className="mr-2 inline" />Tải lại</button>
                </div>

                {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div> : null}
                {success ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{success}</div> : null}

                <div className="grid gap-4 md:grid-cols-4">
                    {stats.map((item) => <article key={item.label} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"><p className="text-sm text-gray-500">{item.label}</p><p className="mt-2 text-2xl font-bold text-gray-900">{loading ? "..." : item.value}</p></article>)}
                </div>

                <div className="grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
                    <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-gray-900">Thông tin cá nhân</h2>
                        {loading ? <p className="mt-4 text-sm text-gray-500">Đang tải hồ sơ...</p> : null}
                        {user ? (
                            <form onSubmit={submitProfile} className="mt-5 space-y-4">
                                <div><label className="text-sm font-medium text-gray-700">Email</label><input disabled value={user.email} className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-gray-500" /></div>
                                <div><label className="text-sm font-medium text-gray-700">Họ tên</label><input value={profileDraft.fullName} onChange={(e) => setProfileDraft((current) => ({ ...current, fullName: e.target.value }))} className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2.5" /></div>
                                <div><label className="text-sm font-medium text-gray-700">Số điện thoại</label><input value={profileDraft.phone} onChange={(e) => setProfileDraft((current) => ({ ...current, phone: e.target.value }))} className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2.5" /></div>
                                <div><label className="text-sm font-medium text-gray-700">Giới thiệu</label><textarea value={profileDraft.bio} onChange={(e) => setProfileDraft((current) => ({ ...current, bio: e.target.value }))} className="mt-2 min-h-[100px] w-full rounded-xl border border-gray-200 px-3 py-2.5" /></div>
                                <button disabled={savingProfile} type="submit" className="w-full rounded-xl bg-cyan-600 px-4 py-2.5 font-medium text-white hover:bg-cyan-700">{savingProfile ? "Đang lưu..." : "Lưu hồ sơ"}</button>
                            </form>
                        ) : null}
                    </section>

                    <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-gray-900">Lịch sử đặt phòng</h2>
                        <div className="mt-5 space-y-4">
                            {loading ? <p className="text-sm text-gray-500">Đang tải chuyến đi...</p> : null}
                            {!loading && bookings.length === 0 ? <div className="rounded-2xl bg-gray-50 p-8 text-center text-sm text-gray-500">Chưa có booking nào.</div> : null}
                            {bookings.map((booking) => {
                                const draft = reviewDrafts[booking.bookingId] ?? { rating: 5, comment: "" };
                                return (
                                    <article key={booking.bookingId} className="rounded-2xl border border-gray-100 p-4">
                                        <div className="flex flex-col gap-4 md:flex-row md:items-center">
                                            <img src={booking.listing?.imageUrl || "https://placehold.co/160x100?text=Villa"} alt={booking.listing?.title ?? "Booking"} className="h-28 w-full rounded-xl object-cover md:w-40" />
                                            <div className="min-w-0 flex-1">
                                                <p className="font-semibold text-gray-900">{booking.listing?.title ?? `Listing #${booking.listingId}`}</p>
                                                <p className="mt-1 text-sm text-gray-500">{formatDate(booking.checkInDate)} - {formatDate(booking.checkOutDate)} • {booking.guestCount ?? booking.guestsCount} khách</p>
                                                <p className="mt-1 text-sm text-gray-500">Booking #{booking.bookingId} • {booking.status}</p>
                                                <p className="mt-2 font-semibold text-cyan-700">{formatCurrency(Number(booking.totalAmount || booking.totalPrice || 0))}</p>
                                            </div>
                                            {canCancel(booking) ? <button disabled={actionId === booking.bookingId} type="button" onClick={() => cancelMyBooking(booking.bookingId)} className="rounded-xl border border-rose-200 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50"><FiXCircle className="mr-1 inline" />Hủy booking</button> : null}
                                        </div>
                                        {canReview(booking) ? (
                                            <div className="mt-4 rounded-2xl bg-gray-50 p-4">
                                                <p className="text-sm font-semibold text-gray-900">Đánh giá chuyến đi</p>
                                                <div className="mt-3 grid gap-3 md:grid-cols-[160px_minmax(0,1fr)_auto]">
                                                    <select value={draft.rating} onChange={(e) => setReviewDrafts((current) => ({ ...current, [booking.bookingId]: { ...draft, rating: Number(e.target.value) } }))} className="rounded-xl border border-gray-200 px-3 py-2.5">{[1,2,3,4,5].map((rating) => <option key={rating} value={rating}>{rating} sao</option>)}</select>
                                                    <input value={draft.comment} onChange={(e) => setReviewDrafts((current) => ({ ...current, [booking.bookingId]: { ...draft, comment: e.target.value } }))} placeholder="Nhận xét của bạn..." className="rounded-xl border border-gray-200 px-3 py-2.5" />
                                                    <button type="button" disabled={actionId === booking.bookingId} onClick={() => submitReview(booking.bookingId)} className="rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-cyan-700"><FiStar className="mr-1 inline" />Gửi</button>
                                                </div>
                                            </div>
                                        ) : null}
                                    </article>
                                );
                            })}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;