import { useEffect, useMemo, useState, type FormEvent } from "react";
import { FaArrowLeft, FaMapMarkerAlt } from "react-icons/fa";
import { FiMessageCircle, FiSend } from "react-icons/fi";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { APP_ROUTES } from "../../../config/routes";
import { getListingById } from "../../../services/listingService";
import { getCurrentUser } from "../../../store/authStore";
import type { PopularDestination } from "../../../models/entities/Listing";
import {
    buildGuestSummary,
    defaultGuestSelection,
    parseBookingSearchParams,
    toIsoDate,
} from "../../components/search/searchState";

type HostMessageLocationState = {
    returnTo?: string;
    checkIn?: string;
    checkOut?: string;
    guests?: number;
    guestSummary?: string;
};

type LocalMessage = {
    id: string;
    content: string;
    createdAt: string;
    senderName: string;
};

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
});

const formatDateInput = (date: Date) => {
    const safeDate = new Date(date);
    safeDate.setHours(12, 0, 0, 0);
    return toIsoDate(safeDate);
};

const createDateOffset = (offsetDays: number) => {
    const date = new Date();
    date.setDate(date.getDate() + offsetDays);
    return formatDateInput(date);
};

const formatFieldDate = (isoDate: string) => {
    if (!isoDate) {
        return "Thêm ngày";
    }

    const parsed = new Date(`${isoDate}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) {
        return "Thêm ngày";
    }

    return new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(parsed);
};

const HostMessagePage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { villaId } = useParams();
    const routeState = location.state as HostMessageLocationState | null;
    const parsedSearch = useMemo(() => parseBookingSearchParams(location.search), [location.search]);
    const currentUser = getCurrentUser();
    const [listing, setListing] = useState<PopularDestination | null>(null);
    const [isLoadingListing, setIsLoadingListing] = useState(true);
    const [messageDraft, setMessageDraft] = useState("");
    const [messageNotice, setMessageNotice] = useState<string | null>(null);
    const [localMessages, setLocalMessages] = useState<LocalMessage[]>([]);

    useEffect(() => {
        if (!villaId) {
            setListing(null);
            setIsLoadingListing(false);
            return;
        }

        let ignore = false;

        const loadListing = async () => {
            setIsLoadingListing(true);

            try {
                const result = await getListingById(villaId);
                if (!ignore) {
                    setListing(result?.destination ?? null);
                }
            } catch {
                if (!ignore) {
                    setListing(null);
                }
            } finally {
                if (!ignore) {
                    setIsLoadingListing(false);
                }
            }
        };

        void loadListing();

        return () => {
            ignore = true;
        };
    }, [villaId]);

    const checkIn = routeState?.checkIn || parsedSearch.checkIn || createDateOffset(1);
    const checkOut = routeState?.checkOut || parsedSearch.checkOut || createDateOffset(4);
    const guestSummary = routeState?.guestSummary || (routeState?.guests ? `${routeState.guests} khách` : "") || buildGuestSummary(
        parsedSearch.guests.adults > 0 ? parsedSearch.guests : defaultGuestSelection,
        "1 khách",
    );

    const handleBack = () => {
        if (routeState?.returnTo) {
            navigate(routeState.returnTo);
            return;
        }

        if (listing || villaId) {
            navigate(APP_ROUTES.villaDetail(listing?.id ?? villaId ?? ""));
            return;
        }

        navigate(APP_ROUTES.home);
    };

    const handleSubmitHostMessage = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const nextMessage = messageDraft.trim();

        if (!nextMessage) {
            setMessageNotice("Bạn hãy nhập nội dung cần trao đổi với host.");
            return;
        }

        if (!currentUser) {
            setMessageNotice("Vui lòng đăng nhập để gửi tin nhắn cho host.");
            return;
        }

        setLocalMessages((messages) => [
            ...messages,
            {
                id: `${Date.now()}`,
                content: nextMessage,
                createdAt: new Date().toISOString(),
                senderName: currentUser.name,
            },
        ]);
        setMessageDraft("");
        setMessageNotice("Tin nhắn đã được lưu tạm trên giao diện. Kết nối chat thật cần backend/API.");
    };

    if (isLoadingListing) {
        return (
            <section className="min-h-screen bg-[#f4f0eb] px-4 pb-16 pt-28">
                <div className="mx-auto max-w-3xl rounded-2xl border border-[#e8ddd1] bg-white p-8 text-center shadow-sm">
                    <p className="text-sm font-semibold text-zinc-500">Đang tải thông tin villa...</p>
                </div>
            </section>
        );
    }

    if (!listing) {
        return (
            <section className="min-h-screen bg-[#f4f0eb] px-4 pb-16 pt-28">
                <div className="mx-auto max-w-3xl rounded-2xl border border-[#e8ddd1] bg-white p-8 text-center shadow-sm">
                    <h1 className="text-2xl font-semibold text-zinc-900">Không tìm thấy villa</h1>
                    <p className="mt-3 text-sm text-zinc-500">Trang nhắn tin cần thông tin villa hợp lệ để tiếp tục.</p>
                    <button
                        type="button"
                        onClick={handleBack}
                        className="mt-6 inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-cyan-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-cyan-700"
                    >
                        <FaArrowLeft />
                        Quay lại
                    </button>
                </div>
            </section>
        );
    }

    return (
        <section className="min-h-screen bg-[#f4f0eb] px-4 pb-16 pt-28 text-zinc-900 sm:px-6">
            <div className="mx-auto max-w-7xl">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <h1 className="text-[2.75rem] leading-none tracking-tight text-[#231a12] sm:text-[3.35rem]">
                        Nhắn tin cho host
                    </h1>
                    <button
                        type="button"
                        onClick={handleBack}
                        className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-cyan-200 bg-white px-5 py-3 text-sm font-semibold text-zinc-900 transition-colors hover:bg-cyan-50 sm:self-start"
                    >
                        <FiMessageCircle />
                        Thu gọn
                    </button>
                </div>

                <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
                    <div className="rounded-2xl border border-[#e8ddd1] bg-white p-4 shadow-[0_30px_80px_-50px_rgba(71,47,23,0.38)] sm:p-6">
                        <div className="min-h-[260px] rounded-2xl bg-[#f8f2ec] p-4 sm:min-h-[300px]">
                            {localMessages.length > 0 ? (
                                <div className="space-y-3">
                                    {localMessages.map((message) => (
                                        <div key={message.id} className="ml-auto max-w-[85%] rounded-2xl bg-cyan-600 px-4 py-3 text-white">
                                            <p className="text-sm leading-6">{message.content}</p>
                                            <p className="mt-1 text-right text-[11px] text-white/70">
                                                {message.senderName} · {new Date(message.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex min-h-[228px] items-center justify-center text-center sm:min-h-[268px]">
                                    <div className="max-w-md">
                                        <FiMessageCircle className="mx-auto text-4xl text-cyan-600" />
                                        <p className="mt-4 text-base font-semibold text-zinc-900">Bắt đầu trao đổi với host</p>
                                        <p className="mt-2 text-sm leading-7 text-zinc-500">
                                            Hỏi về lịch trống, nhận phòng hoặc nhu cầu riêng của nhóm bạn.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <form onSubmit={handleSubmitHostMessage} className="mt-5 space-y-4">
                            <textarea
                                value={messageDraft}
                                onChange={(event) => setMessageDraft(event.target.value)}
                                rows={4}
                                placeholder="Nhập tin nhắn cho host..."
                                className="w-full resize-none rounded-2xl border border-[#e0d1c1] bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-100"
                            />
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                {messageNotice ? <p className="text-sm text-zinc-500">{messageNotice}</p> : <span />}
                                <button
                                    type="submit"
                                    className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-cyan-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-cyan-700"
                                >
                                    <FiSend />
                                    Gửi tin nhắn
                                </button>
                            </div>
                        </form>
                    </div>

                    <aside className="rounded-2xl border border-[#e8ddd1] bg-white p-4 shadow-[0_30px_80px_-50px_rgba(71,47,23,0.38)] sm:p-5">
                        {listing.imageUrl ? (
                            <img src={listing.imageUrl} alt={listing.name} className="aspect-[4/3] w-full rounded-xl object-cover" />
                        ) : (
                            <div className="flex aspect-[4/3] w-full items-center justify-center rounded-xl bg-gray-100 text-sm text-zinc-500">
                                Đang cập nhật ảnh
                            </div>
                        )}
                        <h2 className="mt-5 text-xl font-semibold text-zinc-900">{listing.name}</h2>
                        <p className="mt-3 flex items-start gap-2 text-sm text-zinc-500">
                            <FaMapMarkerAlt className="mt-0.5 shrink-0 text-cyan-600" />
                            {listing.address}
                        </p>
                        <p className="mt-4 text-2xl font-bold text-cyan-700">{currencyFormatter.format(listing.pricePerNight)} / đêm</p>
                        <div className="mt-5 rounded-xl bg-cyan-50 px-4 py-4 text-sm font-medium text-cyan-800">
                            {formatFieldDate(checkIn)} - {formatFieldDate(checkOut)} · {guestSummary}
                        </div>
                    </aside>
                </div>
            </div>
        </section>
    );
};

export default HostMessagePage;
