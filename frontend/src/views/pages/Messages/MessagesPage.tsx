import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { FiArrowLeft, FiChevronDown, FiInbox, FiSearch, FiSend } from "react-icons/fi";
import { useLocation } from "react-router-dom";
import {
    getConversationMessages,
    getConversations,
    markConversationRead,
    sendMessage,
    type Conversation,
    type ConversationMessage,
} from "../../../services/api/conversationsApi";
import {
    connectSocket,
    joinConversation,
    leaveConversation,
    offNewMessage,
    onNewMessage,
    type MessageNewEvent,
} from "../../../services/socket/socketClient";
import { getAccessToken, getCurrentUser } from "../../../store/authStore";

type ChatMessage = ConversationMessage & {
    pending?: boolean;
};

type MessagesLocationState = {
    selectedConversationId?: number | string;
};

type ConversationFilter = "all" | "unread";

const formatConversationTime = (value?: string | null) => {
    if (!value) {
        return "";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return "";
    }

    const today = new Date();
    const sameDay =
        date.getFullYear() === today.getFullYear() &&
        date.getMonth() === today.getMonth() &&
        date.getDate() === today.getDate();

    return new Intl.DateTimeFormat("vi-VN", sameDay ? { hour: "2-digit", minute: "2-digit" } : { day: "2-digit", month: "2-digit" }).format(date);
};

const formatMessageTime = (value?: string | null) => {
    if (!value) {
        return "";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return "";
    }

    return new Intl.DateTimeFormat("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
};

const getInitials = (name?: string | null) =>
    (name || "U")
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase();

const sortConversations = (items: Conversation[]) =>
    [...items].sort((left, right) => {
        const leftDate = left.lastMessageAt || left.updatedAt || left.createdAt;
        const rightDate = right.lastMessageAt || right.updatedAt || right.createdAt;

        return new Date(rightDate).getTime() - new Date(leftDate).getTime();
    });

const sortMessages = (messages: ChatMessage[]) =>
    [...messages].sort((left, right) => {
        const byDate = new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
        return byDate || left.id - right.id;
    });

const ConversationAvatar = ({ conversation, size = "md" }: { conversation: Conversation; size?: "md" | "lg" }) => {
    const name = conversation.otherParticipant?.fullName;
    const avatarUrl = conversation.otherParticipant?.avatarUrl || conversation.listing?.coverImageUrl;
    const sizeClass = size === "lg" ? "h-14 w-14 text-base" : "h-12 w-12 text-sm";

    if (avatarUrl) {
        return <img src={avatarUrl} alt={name || "Người nhắn"} className={`${sizeClass} rounded-full object-cover`} />;
    }

    return (
        <span className={`${sizeClass} inline-flex shrink-0 items-center justify-center rounded-full bg-zinc-900 font-semibold text-white`}>
            {getInitials(name)}
        </span>
    );
};

const MessagesPage = () => {
    const location = useLocation();
    const routeState = location.state as MessagesLocationState | null;
    const requestedConversationId = Number(routeState?.selectedConversationId ?? 0);
    const currentUser = getCurrentUser();
    const currentUserId = currentUser?.id ?? null;
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [conversationFilter, setConversationFilter] = useState<ConversationFilter>("all");
    const [messageDraft, setMessageDraft] = useState("");
    const [isLoadingConversations, setIsLoadingConversations] = useState(true);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState("");
    const [messageError, setMessageError] = useState("");
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const conversationsRef = useRef<Conversation[]>([]);

    const selectedConversation = useMemo(
        () => conversations.find((conversation) => Number(conversation.id) === Number(selectedConversationId)) ?? null,
        [conversations, selectedConversationId],
    );

    const visibleConversations = useMemo(
        () =>
            conversationFilter === "unread"
                ? conversations.filter((conversation) => conversation.unreadCount > 0)
                : conversations,
        [conversationFilter, conversations],
    );

    useEffect(() => {
        conversationsRef.current = conversations;
    }, [conversations]);

    const refreshConversations = useCallback(async () => {
        const result = await getConversations({ page: 1, limit: 100 });
        const nextConversations = sortConversations(result.items);

        setConversations(nextConversations);
        setSelectedConversationId((currentSelectedId) => {
            if (
                Number.isInteger(requestedConversationId) &&
                requestedConversationId > 0 &&
                nextConversations.some((conversation) => Number(conversation.id) === Number(requestedConversationId))
            ) {
                return requestedConversationId;
            }

            if (currentSelectedId && nextConversations.some((conversation) => Number(conversation.id) === Number(currentSelectedId))) {
                return currentSelectedId;
            }

            return nextConversations[0]?.id ?? null;
        });
    }, [requestedConversationId]);

    useEffect(() => {
        let ignore = false;

        const load = async () => {
            setIsLoadingConversations(true);
            setError("");

            try {
                await refreshConversations();
            } catch (loadError) {
                if (!ignore) {
                    setError(loadError instanceof Error ? loadError.message : "Không thể tải danh sách hội thoại.");
                }
            } finally {
                if (!ignore) {
                    setIsLoadingConversations(false);
                }
            }
        };

        void load();

        return () => {
            ignore = true;
        };
    }, [refreshConversations]);

    useEffect(() => {
        if (!selectedConversationId) {
            setMessages([]);
            return;
        }

        let ignore = false;

        const loadMessages = async () => {
            setIsLoadingMessages(true);
            setMessageError("");

            try {
                const result = await getConversationMessages(selectedConversationId, { page: 1, limit: 80 });

                if (!ignore) {
                    setMessages(sortMessages(result.items));
                    setConversations((currentConversations) =>
                        currentConversations.map((conversation) =>
                            Number(conversation.id) === Number(selectedConversationId)
                                ? {
                                    ...conversation,
                                    unreadCount: 0,
                                }
                                : conversation,
                        ),
                    );
                    void markConversationRead(selectedConversationId);
                }
            } catch (loadError) {
                if (!ignore) {
                    setMessageError(loadError instanceof Error ? loadError.message : "Không thể tải tin nhắn.");
                }
            } finally {
                if (!ignore) {
                    setIsLoadingMessages(false);
                }
            }
        };

        void loadMessages();

        return () => {
            ignore = true;
        };
    }, [selectedConversationId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, [messages.length, selectedConversationId]);

    useEffect(() => {
        const token = getAccessToken();

        if (!currentUserId || !token) {
            return;
        }

        connectSocket(token);

        const handleNewMessage = (payload: MessageNewEvent) => {
            const payloadConversationId = Number(payload.conversationId);
            const isActiveConversation = Number(payloadConversationId) === Number(selectedConversationId);
            const conversationExists = conversationsRef.current.some(
                (conversation) => Number(conversation.id) === Number(payloadConversationId),
            );

            setConversations((currentConversations) => {
                const nextConversations = currentConversations.map((conversation) => {
                    if (Number(conversation.id) !== Number(payloadConversationId)) {
                        return conversation;
                    }

                    return {
                        ...conversation,
                        lastMessage: payload.conversation.lastMessage,
                        lastMessageAt: payload.conversation.lastMessageAt,
                        unreadCount:
                            isActiveConversation || String(payload.message.senderUserId) === String(currentUserId)
                                ? 0
                                : conversation.unreadCount + 1,
                    };
                });

                return sortConversations(nextConversations);
            });

            if (!conversationExists) {
                void refreshConversations();
            }

            if (isActiveConversation) {
                setMessages((currentMessages) => {
                    if (currentMessages.some((message) => message.id === payload.message.id)) {
                        return currentMessages;
                    }

                    return sortMessages([...currentMessages, payload.message]);
                });
                void markConversationRead(payloadConversationId);
            }
        };

        onNewMessage(handleNewMessage);

        return () => {
            offNewMessage(handleNewMessage);
        };
    }, [currentUserId, refreshConversations, selectedConversationId]);

    useEffect(() => {
        const token = getAccessToken();

        if (!selectedConversationId || !token) {
            return;
        }

        connectSocket(token);
        joinConversation(selectedConversationId);

        return () => {
            leaveConversation(selectedConversationId);
        };
    }, [selectedConversationId]);

    const handleSelectConversation = (conversation: Conversation) => {
        setSelectedConversationId(conversation.id);
        setConversations((currentConversations) =>
            currentConversations.map((item) =>
                Number(item.id) === Number(conversation.id)
                    ? {
                        ...item,
                        unreadCount: 0,
                    }
                    : item,
            ),
        );
    };

    const handleSendMessage = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!selectedConversation || !currentUserId) {
            return;
        }

        const nextMessage = messageDraft.trim();

        if (!nextMessage) {
            setMessageError("Bạn hãy nhập nội dung tin nhắn.");
            return;
        }

        if (nextMessage.length > 2000) {
            setMessageError("Tin nhắn tối đa 2000 ký tự.");
            return;
        }

        const pendingId = -Date.now();
        const pendingMessage: ChatMessage = {
            id: pendingId,
            messageId: pendingId,
            conversationId: selectedConversation.id,
            senderUserId: Number(currentUserId),
            senderId: Number(currentUserId),
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
        setMessageError("");
        setMessages((currentMessages) => sortMessages([...currentMessages, pendingMessage]));

        try {
            const result = await sendMessage(selectedConversation.id, {
                content: nextMessage,
                messageType: "text",
            });

            setMessages((currentMessages) => {
                const withoutPending = currentMessages.filter((message) => message.id !== pendingId);

                if (withoutPending.some((message) => message.id === result.message.id)) {
                    return sortMessages(withoutPending);
                }

                return sortMessages([...withoutPending, result.message]);
            });
            setConversations((currentConversations) =>
                sortConversations(
                    currentConversations.map((conversation) =>
                        Number(conversation.id) === Number(result.conversation.id)
                            ? {
                                ...result.conversation,
                                unreadCount: 0,
                            }
                            : conversation,
                    ),
                ),
            );
        } catch (sendError) {
            setMessages((currentMessages) => currentMessages.filter((message) => message.id !== pendingId));
            setMessageDraft(nextMessage);
            setMessageError(sendError instanceof Error ? sendError.message : "Không gửi được tin nhắn.");
        } finally {
            setIsSending(false);
        }
    };

    return (
        <section className="min-h-screen bg-white pt-16 text-zinc-950 sm:pt-20">
            <div className="mx-auto flex min-h-[calc(100vh-80px)] max-w-[1440px] border-x border-zinc-100">
                <aside className="hidden w-[360px] shrink-0 border-r border-zinc-200 bg-white md:flex md:flex-col">
                    <div className="px-6 pb-5 pt-7">
                        <div className="flex items-center justify-between gap-4">
                            <h1 className="text-3xl font-semibold tracking-tight">Tin nhắn</h1>
                            <button
                                type="button"
                                className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-zinc-100 text-zinc-900 transition hover:bg-zinc-200"
                                aria-label="Tìm kiếm tin nhắn"
                            >
                                <FiSearch size={21} />
                            </button>
                        </div>

                        <div className="mt-7 flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => setConversationFilter("all")}
                                className={`inline-flex min-h-12 items-center gap-2 rounded-full px-5 text-sm font-semibold transition ${conversationFilter === "all"
                                    ? "bg-gradient-to-r from-cyan-500 to-cyan-500 text-white shadow-sm shadow-cyan-200"
                                    : "border border-cyan-100 bg-white text-slate-700 hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-600"
                                    }`}
                            >
                                Tất cả
                                <FiChevronDown size={16} />
                            </button>
                            <button
                                type="button"
                                onClick={() => setConversationFilter("unread")}
                                className={`inline-flex min-h-12 items-center rounded-full px-5 text-sm font-semibold transition ${conversationFilter === "unread"
                                    ? "bg-gradient-to-r from-cyan-500 to-cyan-500 text-white shadow-sm shadow-cyan-200"
                                    : "border border-cyan-100 bg-white text-slate-700 hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-600"
                                    }`}
                            >
                                Chưa đọc
                            </button>
                        </div>
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-5">
                        {isLoadingConversations ? (
                            <div className="px-2 py-8 text-sm text-zinc-500">Đang tải hội thoại...</div>
                        ) : error ? (
                            <div className="px-2 py-8 text-sm text-rose-600">{error}</div>
                        ) : conversations.length === 0 ? (
                            <div className="px-2 py-12 text-center">
                                <FiInbox className="mx-auto text-4xl text-zinc-300" />
                                <p className="mt-3 text-sm font-semibold text-zinc-900">Bạn chưa có tin nhắn nào.</p>
                            </div>
                        ) : visibleConversations.length === 0 ? (
                            <div className="px-2 py-12 text-center text-sm font-semibold text-zinc-500">
                                Không có tin nhắn chưa đọc.
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {visibleConversations.map((conversation) => {
                                    const participantName = conversation.otherParticipant?.fullName || "Người dùng";
                                    const isActive = Number(conversation.id) === Number(selectedConversationId);

                                    return (
                                        <button
                                            key={conversation.id}
                                            type="button"
                                            onClick={() => handleSelectConversation(conversation)}
                                            className={`flex w-full gap-3 rounded-2xl px-3 py-3 text-left transition ${isActive
                                                ? "bg-cyan-50 ring-1 ring-cyan-100"
                                                : "hover:bg-cyan-50/70"
                                                }`}
                                        >
                                            <ConversationAvatar conversation={conversation} />
                                            <span className="min-w-0 flex-1">
                                                <span className="flex items-start justify-between gap-3">
                                                    <span className="truncate text-base font-semibold">{participantName}</span>
                                                    <span className="shrink-0 text-xs text-zinc-500">
                                                        {formatConversationTime(conversation.lastMessageAt || conversation.updatedAt)}
                                                    </span>
                                                </span>
                                                <span className="mt-1 block truncate text-sm text-zinc-500">
                                                    {conversation.lastMessage || "Chưa có tin nhắn."}
                                                </span>
                                                {conversation.listing?.title ? (
                                                    <span className="mt-1 block truncate text-xs font-medium text-zinc-400">
                                                        {conversation.listing.title}
                                                    </span>
                                                ) : null}
                                            </span>
                                            {conversation.unreadCount > 0 ? (
                                                <span className="mt-7 inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[11px] font-bold text-white">
                                                    {conversation.unreadCount}
                                                </span>
                                            ) : null}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </aside>

                <main className="flex min-w-0 flex-1 flex-col">
                    {/* Mobile: conversation list (shown when no conversation is selected) */}
                    <div className={`flex-1 flex-col bg-white md:hidden ${selectedConversationId ? "hidden" : "flex"}`}>
                        <div className="px-4 pb-3 pt-4">
                            <h1 className="text-xl font-semibold tracking-tight">Tin nhắn</h1>
                            <div className="mt-3 flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setConversationFilter("all")}
                                    className={`inline-flex min-h-9 items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition ${conversationFilter === "all"
                                        ? "bg-cyan-500 text-white shadow-sm"
                                        : "border border-zinc-200 bg-white text-slate-700 hover:bg-zinc-50"
                                        }`}
                                >
                                    Tất cả
                                    <FiChevronDown size={14} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setConversationFilter("unread")}
                                    className={`inline-flex min-h-9 items-center rounded-full px-4 text-sm font-semibold transition ${conversationFilter === "unread"
                                        ? "bg-cyan-500 text-white shadow-sm"
                                        : "border border-zinc-200 bg-white text-slate-700 hover:bg-zinc-50"
                                        }`}
                                >
                                    Chưa đọc
                                </button>
                            </div>
                        </div>
                        <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-5">
                            {isLoadingConversations ? (
                                <div className="px-2 py-8 text-sm text-zinc-500">Đang tải hội thoại...</div>
                            ) : error ? (
                                <div className="px-2 py-8 text-sm text-rose-600">{error}</div>
                            ) : conversations.length === 0 ? (
                                <div className="px-2 py-12 text-center">
                                    <FiInbox className="mx-auto text-4xl text-zinc-300" />
                                    <p className="mt-3 text-sm font-semibold text-zinc-900">Bạn chưa có tin nhắn nào.</p>
                                </div>
                            ) : visibleConversations.length === 0 ? (
                                <div className="px-2 py-12 text-center text-sm font-semibold text-zinc-500">
                                    Không có tin nhắn chưa đọc.
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    {visibleConversations.map((conversation) => {
                                        const participantName = conversation.otherParticipant?.fullName || "Người dùng";

                                        return (
                                            <button
                                                key={conversation.id}
                                                type="button"
                                                onClick={() => handleSelectConversation(conversation)}
                                                className="flex w-full gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-cyan-50/70 active:bg-cyan-50"
                                            >
                                                <ConversationAvatar conversation={conversation} />
                                                <span className="min-w-0 flex-1">
                                                    <span className="flex items-start justify-between gap-3">
                                                        <span className="truncate text-base font-semibold">{participantName}</span>
                                                        <span className="shrink-0 text-xs text-zinc-500">
                                                            {formatConversationTime(conversation.lastMessageAt || conversation.updatedAt)}
                                                        </span>
                                                    </span>
                                                    <span className="mt-1 block truncate text-sm text-zinc-500">
                                                        {conversation.lastMessage || "Chưa có tin nhắn."}
                                                    </span>
                                                    {conversation.listing?.title ? (
                                                        <span className="mt-1 block truncate text-xs font-medium text-zinc-400">
                                                            {conversation.listing.title}
                                                        </span>
                                                    ) : null}
                                                </span>
                                                {conversation.unreadCount > 0 ? (
                                                    <span className="mt-4 inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[11px] font-bold text-white">
                                                        {conversation.unreadCount}
                                                    </span>
                                                ) : null}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {selectedConversation ? (
                        <>
                            <header className="flex min-h-[72px] items-center gap-2 border-b border-zinc-200 bg-white px-2 sm:min-h-[88px] sm:gap-4 sm:px-4 md:px-9">
                                <button
                                    type="button"
                                    onClick={() => setSelectedConversationId(null)}
                                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-zinc-600 transition-colors hover:bg-zinc-100 md:hidden"
                                    aria-label="Quay lại danh sách"
                                >
                                    <FiArrowLeft size={22} />
                                </button>
                                <ConversationAvatar conversation={selectedConversation} size="lg" />
                                <div className="min-w-0">
                                    <h2 className="truncate text-lg font-semibold sm:text-2xl">
                                        {selectedConversation.otherParticipant?.fullName || "Người dùng"}
                                    </h2>
                                    <p className="mt-1 truncate text-sm text-zinc-500">
                                        {selectedConversation.listing?.title || "Hội thoại"}
                                    </p>
                                </div>
                            </header>

                            <div className="min-h-0 flex-1 overflow-y-auto bg-white px-5 py-6 md:px-10">
                                {isLoadingMessages ? (
                                    <div className="py-12 text-center text-sm text-zinc-500">Đang tải tin nhắn...</div>
                                ) : messageError && messages.length === 0 ? (
                                    <div className="py-12 text-center text-sm text-rose-600">{messageError}</div>
                                ) : messages.length === 0 ? (
                                    <div className="flex min-h-[360px] items-center justify-center text-center text-sm font-semibold text-zinc-500">
                                        Chưa có tin nhắn trong hội thoại này.
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {messages.map((message) => {
                                            const isMine = String(message.senderUserId) === String(currentUserId);

                                            return (
                                                <div key={message.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                                                    <div className={`max-w-[85%] sm:max-w-[78%] ${isMine ? "text-right" : "text-left"}`}>
                                                        <div
                                                            className={`rounded-[22px] px-5 py-3 text-[15px] leading-6 ${isMine ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-950"
                                                                }`}
                                                        >
                                                            <p className="whitespace-pre-wrap">{message.content}</p>
                                                        </div>
                                                        <p className="mt-1 px-2 text-xs text-zinc-500">
                                                            {message.pending ? "Đang gửi..." : formatMessageTime(message.createdAt)}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        <div ref={messagesEndRef} />
                                    </div>
                                )}
                            </div>

                            <form onSubmit={handleSendMessage} className="border-t border-zinc-200 bg-white px-5 py-5 md:px-9">
                                {messageError && messages.length > 0 ? (
                                    <p className="mb-3 text-sm text-rose-600">{messageError}</p>
                                ) : null}
                                <div className="flex items-end gap-3 rounded-full border border-zinc-200 bg-zinc-50/70 py-1.5 pl-5 pr-1.5 transition-all duration-200 focus-within:border-zinc-300 focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(0,0,0,0.04)]">
                                    <textarea
                                        value={messageDraft}
                                        onChange={(event) => setMessageDraft(event.target.value)}
                                        rows={1}
                                        maxLength={2000}
                                        placeholder="Soạn tin nhắn..."
                                        className="min-h-[44px] max-h-24 flex-1 resize-none border-0 bg-transparent py-2.5 text-base leading-relaxed outline-none placeholder:text-zinc-400"
                                    />
                                    <button
                                        type="submit"
                                        disabled={isSending}
                                        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-cyan-600 text-white shadow-md shadow-cyan-200/60 transition-all duration-200 hover:from-cyan-400 hover:to-cyan-500 hover:shadow-lg hover:shadow-cyan-200/80 active:scale-95 disabled:cursor-not-allowed disabled:from-slate-200 disabled:to-slate-300 disabled:text-slate-400 disabled:shadow-none"
                                        aria-label="Gửi tin nhắn"
                                    >
                                        <FiSend size={19} className="-translate-x-px translate-y-px" />
                                    </button>
                                </div>
                            </form>
                        </>
                    ) : (
                        <div className="flex min-h-[520px] flex-1 items-center justify-center px-6 text-center">
                            <div>
                                <FiInbox className="mx-auto text-5xl text-zinc-300" />
                                <p className="mt-4 text-base font-semibold text-zinc-900">
                                    {conversations.length === 0 ? "Bạn chưa có tin nhắn nào." : "Chọn một cuộc trò chuyện để bắt đầu"}
                                </p>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </section>
    );
};

export default MessagesPage;
