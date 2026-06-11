import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { FiInbox, FiMessageCircle, FiSend } from "react-icons/fi";
import {
    getConversationMessages,
    getConversations,
    markConversationRead,
    sendMessage,
    type Conversation,
    type ConversationMessage,
} from "../../../../services/api/conversationsApi";
import {
    connectSocket,
    joinConversation,
    leaveConversation,
    offNewMessage,
    onNewMessage,
    type MessageNewEvent,
} from "../../../../services/socket/socketClient";
import { getAccessToken, getCurrentUser } from "../../../../store/authStore";
import { cn } from "../../../../utils";
import { PageHeader } from "../shared";

type ChatMessage = ConversationMessage & {
    pending?: boolean;
};

const formatDateTime = (value?: string | null) => {
    if (!value) {
        return "";
    }

    return new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(value));
};

const getInitials = (name?: string | null) =>
    (name || "K")
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

const HostTinNhan = () => {
    const currentUser = getCurrentUser();
    const currentUserId = currentUser?.id ?? null;
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
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

    useEffect(() => {
        conversationsRef.current = conversations;
    }, [conversations]);

    const refreshConversations = useCallback(async () => {
        const result = await getConversations({ page: 1, limit: 100 });
        const nextConversations = sortConversations(result.items);

        setConversations(nextConversations);
        setSelectedConversationId((currentSelectedId) => {
            if (currentSelectedId && nextConversations.some((conversation) => Number(conversation.id) === Number(currentSelectedId))) {
                return currentSelectedId;
            }

            return nextConversations[0]?.id ?? null;
        });
    }, []);

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
            setMessageError("Bạn hãy nhập nội dung phản hồi.");
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
        <section className="px-3 py-4 sm:px-6 lg:px-8">
            <PageHeader
                title="Tin nhắn"
                subtitle=""
            />

            <div className="mt-5 grid overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)] lg:min-h-[640px] lg:grid-cols-[minmax(280px,360px)_minmax(0,1fr)]">
                <aside className="flex min-h-0 flex-col border-b border-gray-200 bg-slate-50/80 lg:border-b-0 lg:border-r">
                    <div className="flex items-center justify-between gap-3 border-b border-gray-200 bg-white/90 px-4 py-4">
                        <h2 className="text-sm font-semibold text-gray-900">Hội thoại</h2>
                        {conversations.length > 0 ? (
                            <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-semibold text-cyan-600">
                                {conversations.length}
                            </span>
                        ) : null}
                    </div>

                    <div className="max-h-[260px] space-y-2 overflow-y-auto p-3 sm:max-h-[320px] lg:max-h-none lg:flex-1">
                        {isLoadingConversations ? (
                            <div className="flex flex-col items-center justify-center rounded-2xl bg-white px-4 py-8">
                                <div className="mb-3 h-6 w-6 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent"></div>
                                <span className="text-sm font-medium text-slate-500">Đang tải hội thoại...</span>
                            </div>
                        ) : error ? (
                            <div className="rounded-2xl bg-white px-4 py-8 text-sm text-rose-600">{error}</div>
                        ) : conversations.length === 0 ? (
                            <div className="rounded-2xl bg-white px-4 py-12 text-center">
                                <FiInbox className="mx-auto text-3xl text-gray-400" />
                                <p className="mt-3 text-sm font-semibold text-gray-900">Chưa có tin nhắn nào từ khách.</p>
                            </div>
                        ) : (
                            conversations.map((conversation) => {
                                const guestName = conversation.otherParticipant?.fullName || "Khách";
                                const isActive = Number(conversation.id) === Number(selectedConversationId);

                                return (
                                    <button
                                        key={conversation.id}
                                        type="button"
                                        onClick={() => handleSelectConversation(conversation)}
                                        className={cn(
                                            "group flex w-full gap-3 rounded-2xl border px-3 py-3 text-left transition sm:px-4",
                                            isActive
                                                ? "border-cyan-200 bg-white shadow-sm ring-1 ring-cyan-100"
                                                : "border-transparent bg-white/60 hover:border-gray-200 hover:bg-white",
                                        )}
                                    >
                                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-cyan-500 text-sm font-bold text-white shadow-sm">
                                            {getInitials(guestName)}
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className="flex items-start justify-between gap-2">
                                                <span className="truncate text-sm font-semibold text-gray-900">{guestName}</span>
                                                <span className="shrink-0 text-[11px] text-gray-400">
                                                    {formatDateTime(conversation.lastMessageAt)}
                                                </span>
                                            </span>
                                            <span className="mt-1 block truncate text-xs font-medium text-gray-500">
                                                {conversation.listing?.title || "Chỗ nghỉ"}
                                            </span>
                                            <span className="mt-1 flex min-w-0 items-center gap-2">
                                                <span className="min-w-0 flex-1 truncate text-sm text-gray-500">
                                                    {conversation.lastMessage || "Chưa có tin nhắn."}
                                                </span>
                                                {conversation.unreadCount > 0 ? (
                                                    <span className="ml-auto shrink-0 rounded-full bg-cyan-500 px-2 py-0.5 text-[11px] font-bold text-white">
                                                        {conversation.unreadCount}
                                                    </span>
                                                ) : null}
                                            </span>
                                        </span>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </aside>

                <main className="flex min-w-0 flex-col bg-white lg:min-h-0">
                    {selectedConversation ? (
                        <>
                            <div className="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 sm:px-5 sm:py-4">
                                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-cyan-500 text-sm font-bold text-white shadow-sm">
                                    {getInitials(selectedConversation.otherParticipant?.fullName)}
                                </span>
                                <div className="min-w-0">
                                    <h2 className="truncate text-base font-semibold text-gray-900">
                                        {selectedConversation.otherParticipant?.fullName || "Khách"}
                                    </h2>
                                    <p className="truncate text-sm text-gray-500">
                                        {selectedConversation.listing?.title || "Chỗ nghỉ"}
                                    </p>
                                </div>
                            </div>

                            <div className="min-h-[360px] max-h-[56vh] flex-1 overflow-y-auto bg-[#f8fafc] px-3 py-4 sm:px-5 sm:py-5 lg:min-h-0 lg:max-h-none">
                                {isLoadingMessages ? (
                                    <div className="flex flex-col items-center justify-center py-10">
                                        <div className="mb-3 h-6 w-6 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent"></div>
                                        <span className="text-sm font-medium text-slate-500">Đang tải tin nhắn...</span>
                                    </div>
                                ) : messageError && messages.length === 0 ? (
                                    <div className="py-10 text-center text-sm text-rose-600">{messageError}</div>
                                ) : messages.length === 0 ? (
                                    <div className="flex min-h-[360px] items-center justify-center text-center">
                                        <div>
                                            <FiMessageCircle className="mx-auto text-4xl text-cyan-500" />
                                            <p className="mt-3 text-sm font-semibold text-gray-900">Chưa có tin nhắn trong hội thoại này.</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {messages.map((message) => {
                                            const isMine = String(message.senderUserId) === String(currentUserId);

                                            return (
                                                <div
                                                    key={message.id}
                                                    className={cn(
                                                        "max-w-[86%] break-words rounded-[22px] px-4 py-3 shadow-sm sm:max-w-[74%]",
                                                        isMine
                                                            ? "ml-auto bg-cyan-500 text-white"
                                                            : "mr-auto border border-gray-100 bg-white text-gray-900",
                                                    )}
                                                >
                                                    <p className="whitespace-pre-wrap text-sm leading-6">{message.content}</p>
                                                    <p className={`mt-1 text-right text-[11px] ${isMine ? "text-white/70" : "text-gray-400"}`}>
                                                        {message.pending ? "Đang gửi..." : formatDateTime(message.createdAt)}
                                                    </p>
                                                </div>
                                            );
                                        })}
                                        <div ref={messagesEndRef} />
                                    </div>
                                )}
                            </div>

                            <form onSubmit={handleSendMessage} className="border-t border-gray-200 bg-white px-3 py-3 sm:px-5 sm:py-4">
                                {messageError && messages.length > 0 ? (
                                    <p className="mb-3 text-sm text-rose-600">{messageError}</p>
                                ) : null}
                                <div className="flex items-end gap-3 rounded-full border border-gray-200 bg-slate-50/70 py-1.5 pl-5 pr-1.5 transition-all duration-200 focus-within:border-cyan-300 focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(6,182,212,0.1)]">
                                    <textarea
                                        value={messageDraft}
                                        onChange={(event) => setMessageDraft(event.target.value)}
                                        rows={1}
                                        maxLength={2000}
                                        placeholder="Nhập phản hồi..."
                                        className="max-h-24 min-h-[44px] min-w-0 flex-1 resize-none border-0 bg-transparent py-2.5 text-sm leading-relaxed outline-none placeholder:text-gray-400"
                                    />
                                    <button
                                        type="submit"
                                        disabled={isSending}
                                        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-cyan-600 text-white shadow-md shadow-cyan-200/60 transition-all duration-200 hover:from-cyan-400 hover:to-cyan-500 hover:shadow-lg hover:shadow-cyan-200/80 active:scale-95 disabled:cursor-not-allowed disabled:from-gray-200 disabled:to-gray-300 disabled:text-gray-400 disabled:shadow-none"
                                        aria-label="Gửi tin nhắn"
                                    >
                                        <FiSend size={17} className="-translate-x-px translate-y-px" />
                                    </button>
                                </div>
                            </form>
                        </>
                    ) : (
                        <div className="flex min-h-[360px] flex-1 items-center justify-center px-4 text-center sm:min-h-[520px]">
                            <div>
                                <FiInbox className="mx-auto text-4xl text-gray-400" />
                                <p className="mt-3 text-sm font-semibold text-gray-900">Chưa có tin nhắn nào từ khách.</p>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </section>
    );
};

export default HostTinNhan;
