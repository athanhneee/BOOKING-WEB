import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { FaArrowLeft, FaMapMarkerAlt } from "react-icons/fa";
import { FiMessageCircle, FiSend } from "react-icons/fi";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { APP_ROUTES } from "../../../config/routes";
import type { ApiListingDetail, PopularDestination } from "../../../models/entities/Listing";
import {
    createOrGetConversation,
    getConversationMessages,
    markConversationRead,
    sendMessage,
    type Conversation,
    type ConversationMessage,
} from "../../../services/api/conversationsApi";
import { getListingById } from "../../../services/listingService";
import {
    connectSocket,
    joinConversation,
    leaveConversation,
    offNewMessage,
    onNewMessage,
    type MessageNewEvent,
} from "../../../services/socket/socketClient";
import { getAccessToken, getCurrentUser } from "../../../store/authStore";
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

type ChatMessage = ConversationMessage & {
    pending?: boolean;
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

const formatMessageTime = (value: string) =>
    new Intl.DateTimeFormat("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
    }).format(new Date(value));

const sortMessages = (messages: ChatMessage[]) =>
    [...messages].sort((left, right) => {
        const byDate = new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
        return byDate || left.id - right.id;
    });

const HostMessagePage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { villaId } = useParams();

    const routeState = location.state as HostMessageLocationState | null;
    const parsedSearch = useMemo(() => parseBookingSearchParams(location.search), [location.search]);

    const currentUser = getCurrentUser();
    const currentUserId = currentUser?.id ?? null;

    const [listing, setListing] = useState<PopularDestination | null>(null);
    const [rawListing, setRawListing] = useState<ApiListingDetail | null>(null);
    const [conversation, setConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [messageDraft, setMessageDraft] = useState("");
    const [messageNotice, setMessageNotice] = useState<string | null>(null);
    const [loadError, setLoadError] = useState("");

    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    const checkIn = routeState?.checkIn || parsedSearch.checkIn || createDateOffset(1);
    const checkOut = routeState?.checkOut || parsedSearch.checkOut || createDateOffset(4);

    const guestSummary =
        routeState?.guestSummary ||
        (routeState?.guests ? `${routeState.guests} khách` : "") ||
        buildGuestSummary(parsedSearch.guests.adults > 0 ? parsedSearch.guests : defaultGuestSelection, "1 khách");

    useEffect(() => {
        if (!currentUserId) {
            navigate(`${APP_ROUTES.login}?redirectTo=${encodeURIComponent(`${location.pathname}${location.search}`)}`, {
                replace: true,
            });
            return;
        }

        if (!villaId) {
            setListing(null);
            setRawListing(null);
            setIsLoading(false);
            setLoadError("Thiếu mã chỗ nghỉ.");
            return;
        }

        let ignore = false;

        const loadConversation = async () => {
            setIsLoading(true);
            setLoadError("");

            try {
                const result = await getListingById(villaId);

                if (!result) {
                    throw new Error("Không tìm thấy villa.");
                }

                if (String(result.raw.host?.userId ?? "") === String(currentUserId)) {
                    throw new Error("Bạn không thể nhắn tin cho chính chỗ nghỉ của mình.");
                }

                const conversationResult = await createOrGetConversation(result.raw.listingId);
                const messageResult = await getConversationMessages(conversationResult.conversation.id, {
                    page: 1,
                    limit: 50,
                });

                if (ignore) {
                    return;
                }

                setListing(result.destination);
                setRawListing(result.raw);
                setConversation(conversationResult.conversation);
                setMessages(sortMessages(messageResult.items));
            } catch (error) {
                if (!ignore) {
                    setLoadError(error instanceof Error ? error.message : "Không tải được hội thoại.");
                }
            } finally {
                if (!ignore) {
                    setIsLoading(false);
                }
            }
        };

        void loadConversation();

        return () => {
            ignore = true;
        };
    }, [currentUserId, location.pathname, location.search, navigate, villaId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, [messages.length]);

    useEffect(() => {
        const token = getAccessToken();

        if (!conversation || !token) {
            return;
        }

        connectSocket(token);
        joinConversation(conversation.id);

        const handleNewMessage = (payload: MessageNewEvent) => {
            if (Number(payload.conversationId) !== Number(conversation.id)) {
                return;
            }

            setMessages((currentMessages) => {
                if (currentMessages.some((message) => message.id === payload.message.id)) {
                    return currentMessages;
                }

                return sortMessages([...currentMessages, payload.message]);
            });

            void markConversationRead(conversation.id);
        };

        onNewMessage(handleNewMessage);

        return () => {
            offNewMessage(handleNewMessage);
            leaveConversation(conversation.id);
        };
    }, [conversation]);

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

    const handleSubmitHostMessage = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!conversation || !currentUser) {
            setMessageNotice("Vui lòng đăng nhập để gửi tin nhắn cho host.");
            return;
        }

        const nextMessage = messageDraft.trim();

        if (!nextMessage) {
            setMessageNotice("Bạn hãy nhập nội dung cần trao đổi với host.");
            return;
        }

        if (nextMessage.length > 2000) {
            setMessageNotice("Tin nhắn tối đa 2000 ký tự.");
            return;
        }

        const pendingId = -Date.now();

        const pendingMessage: ChatMessage = {
            id: pendingId,
            messageId: pendingId,
            conversationId: conversation.id,
            senderUserId: Number(currentUser.id),
            senderId: Number(currentUser.id),
            content: nextMessage,
            body: nextMessage,
            messageType: "text",
            attachments: [],
            createdAt: new Date().toISOString(),
            updatedAt: null,
            pending: true,
        };

        setIsSending(true);
        setMessageDraft("");
        setMessageNotice(null);
        setMessages((currentMessages) => sortMessages([...currentMessages, pendingMessage]));

        try {
            const result = await sendMessage(conversation.id, {
                content: nextMessage,
                messageType: "text",
            });

            setConversation(result.conversation);
            setMessages((currentMessages) => {
                const withoutPending = currentMessages.filter((message) => message.id !== pendingId);

                if (withoutPending.some((message) => message.id === result.message.id)) {
                    return sortMessages(withoutPending);
                }

                return sortMessages([...withoutPending, result.message]);
            });
        } catch (error) {
            setMessages((currentMessages) => currentMessages.filter((message) => message.id !== pendingId));
            setMessageDraft(nextMessage);
            setMessageNotice(error instanceof Error ? error.message : "Không gửi được tin nhắn.");
        } finally {
            setIsSending(false);
        }
    };

    if (isLoading) {
        return (
            <section className="min-h-screen bg-[#f4f0eb] px-4 pb-16 pt-28">
                <div className="mx-auto max-w-3xl rounded-[34px] border border-[#e8ddd1] bg-white p-8 text-center shadow-[0_24px_70px_-50px_rgba(71,47,23,0.38)]">
                    <p className="text-sm font-semibold text-zinc-500">Đang tải hội thoại...</p>
                </div>
            </section>
        );
    }

    if (loadError || !listing || !conversation) {
        return (
            <section className="min-h-screen bg-[#f4f0eb] px-4 pb-16 pt-28">
                <div className="mx-auto max-w-3xl rounded-[34px] border border-[#e8ddd1] bg-white p-8 text-center shadow-[0_24px_70px_-50px_rgba(71,47,23,0.38)]">
                    <h1 className="text-2xl font-bold text-zinc-900">Không mở được hội thoại</h1>

                    <p className="mt-3 text-sm leading-6 text-zinc-500">
                        {loadError || "Trang nhắn tin cần thông tin villa hợp lệ."}
                    </p>

                    <button
                        type="button"
                        onClick={handleBack}
                        className="mt-6 inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-cyan-500 px-6 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-cyan-500"
                    >
                        <FaArrowLeft />
                        Quay lại
                    </button>
                </div>
            </section>
        );
    }

    const hostName = rawListing?.host?.name || conversation.otherParticipant?.fullName || "host";

    return (
        <section className="min-h-screen bg-[#f4f0eb] px-4 pb-16 pt-28 text-zinc-900 sm:px-6">
            <div className="mx-auto max-w-7xl">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-[2.25rem] font-semibold leading-none tracking-tight text-[#231a12] sm:text-[3rem]">
                            Nhắn tin cho host
                        </h1>

                        <p className="mt-2 text-sm font-medium text-zinc-500">
                            {hostName} · {listing.name}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={handleBack}
                        className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border border-cyan-200 bg-white px-6 py-3 text-sm font-bold text-zinc-900 shadow-sm transition-colors hover:bg-cyan-50 sm:self-start"
                    >
                        <FiMessageCircle />
                        Thu gọn
                    </button>
                </div>

                <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
                    <div className="rounded-[34px] border border-[#e8ddd1] bg-white p-4 shadow-[0_30px_80px_-50px_rgba(71,47,23,0.38)] sm:p-6">
                        <div className="max-h-[520px] min-h-[320px] overflow-y-auto rounded-[30px] bg-[#f8f2ec] p-4">
                            {messages.length > 0 ? (
                                <div className="space-y-3">
                                    {messages.map((message) => {
                                        const isMine = String(message.senderUserId) === String(currentUser?.id);

                                        return (
                                            <div
                                                key={message.id}
                                                className={`max-w-[85%] px-4 py-3 shadow-sm ${isMine
                                                    ? "ml-auto rounded-[28px] rounded-br-lg bg-cyan-500 text-white"
                                                    : "mr-auto rounded-[28px] rounded-bl-lg bg-white text-zinc-900"
                                                    }`}
                                            >
                                                <p className="whitespace-pre-wrap text-sm leading-6">{message.content}</p>

                                                <p
                                                    className={`mt-1 text-right text-[11px] ${isMine ? "text-white/70" : "text-zinc-400"
                                                        }`}
                                                >
                                                    {message.pending ? "Đang gửi..." : formatMessageTime(message.createdAt)}
                                                </p>
                                            </div>
                                        );
                                    })}

                                    <div ref={messagesEndRef} />
                                </div>
                            ) : (
                                <div className="flex min-h-[288px] items-center justify-center text-center">
                                    <div className="max-w-md rounded-[30px] bg-white/70 px-6 py-8 shadow-sm">
                                        <FiMessageCircle className="mx-auto text-4xl text-cyan-500" />

                                        <p className="mt-4 text-base font-bold text-zinc-900">
                                            Bắt đầu trao đổi với host
                                        </p>

                                        <p className="mt-2 text-sm leading-7 text-zinc-500">
                                            Hỏi về lịch trống, nhận phòng hoặc nhu cầu riêng của nhóm bạn.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <form onSubmit={handleSubmitHostMessage} className="mt-5 space-y-3">
                            {messageNotice ? (
                                <p className="rounded-2xl bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-600">
                                    {messageNotice}
                                </p>
                            ) : null}

                            <div className="flex items-end gap-3 rounded-full border border-[#e0d1c1] bg-[#faf6f1] py-2 pl-6 pr-2 transition-all duration-200 focus-within:border-cyan-300 focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(6,182,212,0.1)]">
                                <textarea
                                    value={messageDraft}
                                    onChange={(event) => setMessageDraft(event.target.value)}
                                    rows={1}
                                    maxLength={2000}
                                    placeholder="Nhập tin nhắn cho host..."
                                    className="max-h-28 min-h-[48px] min-w-0 flex-1 resize-none border-0 bg-transparent py-3 text-sm leading-6 text-zinc-900 outline-none placeholder:text-zinc-400"
                                />
                                <button
                                    type="submit"
                                    disabled={isSending}
                                    className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-cyan-600 text-white shadow-md shadow-cyan-200/60 transition-all duration-200 hover:from-cyan-400 hover:to-cyan-500 hover:shadow-lg hover:shadow-cyan-200/80 active:scale-95 disabled:cursor-not-allowed disabled:from-gray-200 disabled:to-gray-300 disabled:text-gray-400 disabled:shadow-none"
                                    aria-label="Gửi tin nhắn"
                                >
                                    <FiSend size={18} className="-translate-x-px translate-y-px" />
                                </button>
                            </div>
                        </form>
                    </div>

                    <aside className="rounded-[34px] border border-[#e8ddd1] bg-white p-4 shadow-[0_30px_80px_-50px_rgba(71,47,23,0.38)] sm:p-5">
                        {listing.imageUrl ? (
                            <img
                                src={listing.imageUrl}
                                alt={listing.name}
                                className="aspect-[4/3] w-full rounded-[28px] object-cover"
                            />
                        ) : (
                            <div className="flex aspect-[4/3] w-full items-center justify-center rounded-[28px] bg-gray-100 text-sm text-zinc-500">
                                Đang cập nhật ảnh
                            </div>
                        )}

                        <h2 className="mt-5 text-xl font-bold text-zinc-900">{listing.name}</h2>

                        <p className="mt-3 flex items-start gap-2 text-sm leading-6 text-zinc-500">
                            <FaMapMarkerAlt className="mt-0.5 shrink-0 text-cyan-500" />
                            {listing.address}
                        </p>

                        <p className="mt-4 text-2xl font-bold text-cyan-700">
                            {currencyFormatter.format(listing.pricePerNight)} / đêm
                        </p>

                        <div className="mt-5 rounded-[26px] bg-cyan-50 px-5 py-4 text-sm font-bold leading-6 text-cyan-800">
                            {formatFieldDate(checkIn)} - {formatFieldDate(checkOut)} · {guestSummary}
                        </div>
                    </aside>
                </div>
            </div>
        </section>
    );
};

export default HostMessagePage;