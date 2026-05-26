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
        <section className="px-4 py-6 sm:px-6 lg:px-8">
            <PageHeader
                title="Tin nhắn"
                subtitle=""
            />

            <div className="mt-6 grid min-h-[640px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm lg:grid-cols-[340px_minmax(0,1fr)]">
                <aside className="border-b border-gray-200 bg-gray-50 lg:border-b-0 lg:border-r">
                    <div className="border-b border-gray-200 px-4 py-4">
                        <h2 className="text-sm font-semibold text-gray-900">Hội thoại</h2>
                    </div>

                    <div className="max-h-[584px] overflow-y-auto">
                        {isLoadingConversations ? (
                            <div className="px-4 py-8 text-sm text-gray-500">Đang tải hội thoại...</div>
                        ) : error ? (
                            <div className="px-4 py-8 text-sm text-rose-600">{error}</div>
                        ) : conversations.length === 0 ? (
                            <div className="px-4 py-12 text-center">
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
                                        className={`flex w-full gap-3 border-b border-gray-200 px-4 py-4 text-left transition-colors ${isActive ? "bg-white" : "hover:bg-white"}`}
                                    >
                                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-cyan-500 text-sm font-bold text-white">
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
                                            <span className="mt-1 flex items-center gap-2">
                                                <span className="truncate text-sm text-gray-500">
                                                    {conversation.lastMessage || "Chưa có tin nhắn."}
                                                </span>
                                                {conversation.unreadCount > 0 ? (
                                                    <span className="ml-auto rounded-full bg-cyan-500 px-2 py-0.5 text-[11px] font-bold text-white">
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

                <main className="flex min-w-0 flex-col">
                    {selectedConversation ? (
                        <>
                            <div className="flex items-center gap-3 border-b border-gray-200 px-5 py-4">
                                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-cyan-500 text-sm font-bold text-white">
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

                            <div className="min-h-0 flex-1 overflow-y-auto bg-[#f8fafc] px-5 py-5">
                                {isLoadingMessages ? (
                                    <div className="py-10 text-center text-sm text-gray-500">Đang tải tin nhắn...</div>
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
                                                    className={`max-w-[78%] rounded-2xl px-4 py-3 ${isMine ? "ml-auto bg-cyan-500 text-white" : "mr-auto bg-white text-gray-900 shadow-sm"}`}
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

                            <form onSubmit={handleSendMessage} className="border-t border-gray-200 bg-white px-5 py-4">
                                {messageError && messages.length > 0 ? (
                                    <p className="mb-3 text-sm text-rose-600">{messageError}</p>
                                ) : null}
                                <div className="flex gap-3">
                                    <textarea
                                        value={messageDraft}
                                        onChange={(event) => setMessageDraft(event.target.value)}
                                        rows={2}
                                        maxLength={2000}
                                        placeholder="Nhập phản hồi..."
                                        className="min-h-12 flex-1 resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-100"
                                    />
                                    <button
                                        type="submit"
                                        disabled={isSending}
                                        className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-cyan-500 text-white transition-colors hover:bg-cyan-500 disabled:cursor-not-allowed disabled:bg-cyan-300"
                                        aria-label="Gửi tin nhắn"
                                    >
                                        <FiSend />
                                    </button>
                                </div>
                            </form>
                        </>
                    ) : (
                        <div className="flex min-h-[520px] flex-1 items-center justify-center text-center">
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
