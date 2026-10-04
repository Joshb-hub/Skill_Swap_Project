"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ChatPartnerProfile, Conversation, Message } from "@/types";
import { chatService } from "@/services";
import { useAuth } from "@/hooks/useAuth";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { PartnerSidebarPopup } from "@/components/chat/PartnerSidebarPopup";
import {
  Send, Paperclip, ArrowLeft, ArrowRightLeft,
  Calendar, Check, CheckCheck, Info, FileText, Video, Phone, MoreHorizontal, Search,
  Download, ShieldCheck, Clock3, Smile
} from "lucide-react";
import { formatDateTime, formatTimeAgo } from "@/lib/utils";

export default function ChatConversationPage() {
  const params = useParams();
  const conversationId = params.conversationId as string;
  const { user, isAuthenticated } = useAuth();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConv, setCurrentConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [partnerProfile, setPartnerProfile] = useState<ChatPartnerProfile | null>(null);
  const [conversationSearch, setConversationSearch] = useState("");
  const [conversationFilter, setConversationFilter] = useState<"all" | "unread">("all");
  const [inputContent, setInputContent] = useState<string>("");
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [partnerTyping, setPartnerTyping] = useState<boolean>(false);
  const [isPopupOpen, setIsPopupOpen] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [socketState, setSocketState] = useState<"connecting" | "connected" | "reconnecting" | "offline">("connecting");

  const socketRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Load conversation list and active messages
  useEffect(() => {
    if (!isAuthenticated) return;

    chatService.getConversations().then((convs) => {
      setConversations(convs);
      const active = convs.find((c) => c.id === conversationId);
      if (active) setCurrentConv(active);
    }).catch(console.error);

    chatService.getMessages(conversationId).then((msgs) => {
      setMessages((current) => {
        const byId = new Map([...msgs, ...current].map((message) => [message.id, message]));
        return Array.from(byId.values()).sort((left, right) => new Date(left.created_at).getTime() - new Date(right.created_at).getTime());
      });
      setTimeout(scrollToBottom, 100);
      chatService.markRead(conversationId).catch(() => {});
    }).catch(console.error);
    chatService.getPartnerProfile(conversationId).then(setPartnerProfile).catch(() => setPartnerProfile(null));
  }, [conversationId, isAuthenticated]);

  // Establish WebSocket connection
  useEffect(() => {
    if (!isAuthenticated || !conversationId) return;

    const token = localStorage.getItem("skillswap_access_token");
    if (!token) return;

    let disposed = false;
    let retryAttempt = 0;
    const baseUrl = process.env.NEXT_PUBLIC_WS_BASE_URL || "ws://localhost:8000/ws";
    const connect = () => {
      if (disposed) return;
      setSocketState(retryAttempt ? "reconnecting" : "connecting");
      const socket = new WebSocket(`${baseUrl}/chat/${conversationId}?token=${encodeURIComponent(token)}`);
      socketRef.current = socket;

      socket.onopen = () => {
        retryAttempt = 0;
        setSocketState("connected");
        socket.send(JSON.stringify({ type: "read" }));
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "message" && data.message) {
            setMessages((prev) => prev.some((message) => message.id === data.message.id) ? prev : [...prev, data.message]);
            setTimeout(scrollToBottom, 50);
            if (data.message.sender_id !== user?.id && socket.readyState === WebSocket.OPEN) {
              socket.send(JSON.stringify({ type: "read" }));
            }
          } else if (data.type === "typing" && data.user_id !== user?.id) {
            setPartnerTyping(data.is_typing);
          } else if (data.type === "presence" && data.user_id !== user?.id) {
            setCurrentConv((conversation) => conversation ? { ...conversation, is_online: data.status === "online" } : conversation);
          } else if (data.type === "read" && data.user_id !== user?.id) {
            setMessages((prev) => prev.map((message) => message.sender_id === user?.id ? { ...message, is_read: true } : message));
          }
        } catch (error) {
          console.error("Failed to parse websocket message:", error);
        }
      };

      socket.onclose = (event) => {
        if (socketRef.current === socket) socketRef.current = null;
        if (disposed) return;
        if (event.code === 1008) {
          setSocketState("offline");
          return;
        }
        retryAttempt += 1;
        if (retryAttempt > 6) {
          setSocketState("offline");
          return;
        }
        setSocketState("reconnecting");
        const delay = Math.min(1000 * 2 ** (retryAttempt - 1), 15000);
        reconnectTimeoutRef.current = setTimeout(connect, delay);
      };

      socket.onerror = () => socket.close();
    };

    connect();
    return () => {
      disposed = true;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [conversationId, isAuthenticated, user?.id]);

  const visibleConversations = conversations.filter((conversation) => {
    const matchesSearch = `${conversation.partner_name} ${conversation.partner_username}`.toLowerCase().includes(conversationSearch.toLowerCase());
    return matchesSearch && (conversationFilter === "all" || conversation.unread_count > 0);
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputContent.trim() || socketRef.current?.readyState !== WebSocket.OPEN) return;

    const text = inputContent.trim();
    socketRef.current.send(JSON.stringify({ type: "message", content: text, message_type: "text" }));
    setInputContent("");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputContent(e.target.value);

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      if (!isTyping) {
        setIsTyping(true);
        socketRef.current.send(JSON.stringify({ type: "typing", is_typing: true }));
      }
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        socketRef.current?.send(JSON.stringify({ type: "typing", is_typing: false }));
      }, 1500);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const newMsg = await chatService.uploadAttachment(conversationId, file);
      setMessages((prev) => prev.some((message) => message.id === newMsg.id) ? prev : [...prev, newMsg]);
      setTimeout(scrollToBottom, 100);
    } catch (err: any) {
      alert(err.message || "Failed to upload file attachment");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="chat-page">
      <div className="chat-workspace">
        {/* Left Sidebar (Conversations List) */}
        <div className="chat-conversation-rail">
          <div className="chat-rail-heading">
            <h3>Messages</h3>
            <Link href="/swaps" className="text-xs text-indigo-600 hover:underline">
              All Swaps
            </Link>
          </div>
          <label className="chat-search"><Search /><input placeholder="Search conversations..." aria-label="Search conversations" value={conversationSearch} onChange={(event) => setConversationSearch(event.target.value)} /></label>
          <div className="chat-filter-tabs" role="group" aria-label="Filter conversations"><button className={conversationFilter === "all" ? "active" : ""} onClick={() => setConversationFilter("all")}>All</button><button className={conversationFilter === "unread" ? "active" : ""} onClick={() => setConversationFilter("unread")}>Unread <span>{conversations.filter((conversation) => conversation.unread_count > 0).length}</span></button></div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {visibleConversations.map((conv) => {
              const isActive = conv.id === conversationId;
              return (
                <Link
                  key={conv.id}
                  href={`/chat/${conv.id}`}
                  className={`chat-conversation-row ${isActive ? "active" : ""}`}
                >
                  <Avatar
                    src={conv.partner_avatar}
                    name={conv.partner_name}
                    size="md"
                    isOnline={conv.is_online}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className={`font-bold text-xs truncate ${isActive ? "text-indigo-900" : "text-slate-900"}`}>
                        {conv.partner_name}
                      </p>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {formatTimeAgo(conv.last_message_time)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 truncate">{conv.last_message}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="chat-thread">
          {/* Header */}
          <div className="chat-thread-header">
            <div className="flex items-center space-x-3">
              <Link href="/chat" className="chat-mobile-back">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <Avatar
                src={currentConv?.partner_avatar}
                name={currentConv?.partner_name}
                size="md"
                isOnline={currentConv?.is_online}
              />
              <div>
                <h2 className="font-bold text-sm text-slate-900 leading-tight">
                  {currentConv?.partner_name || "Exchange Partner"}
                </h2>
                <p className={`chat-connection-state ${socketState}`}><i />{socketState === "connected" ? (currentConv?.is_online ? "Online" : "Connected") : socketState === "connecting" ? "Connecting..." : "Reconnecting..."}<span>·</span>{partnerTyping ? "Typing..." : "Live chat"}</p>
                {currentConv && (
                  <div className="flex items-center space-x-1.5 text-[11px] text-slate-500">
                    <span className="text-indigo-600 font-semibold">{currentConv.they_teach || "Skill"}</span>
                    <span>↔</span>
                    <span className="text-violet-600 font-semibold">{currentConv.i_teach || "Skill"}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="chat-header-actions">
              <button type="button" title="Video calls are not available yet" disabled><Video /></button>
              <button type="button" title="Voice calls are not available yet" disabled><Phone /></button>
              <button type="button" title="Exchange details" onClick={() => setIsPopupOpen(true)}><MoreHorizontal /></button>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="chat-message-feed">
            {messages.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 space-y-2">
                <ArrowRightLeft className="w-8 h-8 text-slate-300 mx-auto" />
                <p>Welcome to your active skill exchange workspace!</p>
                <p>Say hello, coordinate session times, or share resources to get started.</p>
              </div>
            ) : (
              messages.map((m, idx) => {
                const isMe = m.sender_id === user?.id;
                const showDate =
                  idx === 0 ||
                  new Date(messages[idx - 1].created_at).toDateString() !==
                    new Date(m.created_at).toDateString();

                return (
                  <React.Fragment key={m.id || idx}>
                    {showDate && (
                      <div className="flex items-center justify-center my-3">
                        <span className="px-3 py-1 bg-slate-200/60 rounded-full text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                          {new Date(m.created_at).toLocaleDateString([], {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    )}

                    <div className={`chat-message-row ${isMe ? "mine" : "theirs"}`}>
                      {!isMe && (
                        <Avatar
                          src={m.sender_avatar}
                          name={m.sender_name}
                          size="sm"
                          className="shrink-0 mb-1"
                        />
                      )}

                      <div
                        className={`chat-message-bubble ${isMe ? "mine" : "theirs"}`}
                      >
                        {/* If file or image */}
                        {m.message_type === "image" && m.file_url ? (
                          <div className="rounded-lg overflow-hidden my-1">
                            <img
                              src={m.file_url}
                              alt="Attachment"
                              className="chat-attachment-image"
                            />
                          </div>
                        ) : m.message_type === "file" && m.file_url ? (
                          <a
                            href={m.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex items-center space-x-2 p-2 rounded-lg text-xs font-semibold ${
                              isMe ? "bg-indigo-700/60 text-white" : "bg-slate-100 text-indigo-700"
                            }`}
                          >
                            <FileText className="w-4 h-4 shrink-0" />
                            <span className="truncate">{m.content}</span>
                          </a>
                        ) : (
                          <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                            {m.content}
                          </p>
                        )}

                        <div
                          className={`flex items-center justify-end space-x-1 text-[10px] ${
                            isMe ? "text-indigo-200" : "text-slate-400"
                          }`}
                        >
                          <span>
                            {new Date(m.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          {isMe && (
                            <span>
                              {m.is_read ? (
                                <CheckCheck className="w-3.5 h-3.5 text-emerald-300" />
                              ) : (
                                <Check className="w-3.5 h-3.5" />
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })
            )}

            {/* Partner Typing Indicator */}
            {partnerTyping && (
              <div className="flex items-center space-x-2 text-slate-400 text-xs pl-2 italic">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                <span>{currentConv?.partner_name || "Partner"} is typing...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Bar */}
          <div className="chat-composer-wrap">
            <form onSubmit={handleSendMessage} className="chat-composer">
              {/* File upload hidden input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="chat-attach-button"
                title="Share Document or Image"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              <input
                type="text"
                value={inputContent}
                onChange={handleInputChange}
                placeholder="Type a message, ask a question, or share resources..."
                className="chat-message-input"
                disabled={socketState !== "connected"}
              />

              <Button
                type="submit"
                variant="primary"
                size="icon"
                disabled={!inputContent.trim()}
                className="chat-send-button"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>

        <ChatContextRail conversation={currentConv} profile={partnerProfile} messages={messages} />
      </div>

      {/* Slide-out Partner Profile Popup */}
      <PartnerSidebarPopup
        conversationId={conversationId}
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
      />
    </div>
  );
}

function ChatContextRail({
  conversation,
  profile,
  messages,
}: {
  conversation: Conversation | null;
  profile: ChatPartnerProfile | null;
  messages: Message[];
}) {
  const files = messages.filter((message) => message.file_url).slice(-4).reverse();
  const apiOrigin = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api").replace(/\/api\/?$/, "");
  const resolveFileUrl = (url: string) => url.startsWith("http") ? url : `${apiOrigin}${url}`;

  return (
    <aside className="chat-context-rail">
      {conversation && (
        <section className="chat-partner-card">
          <div className="chat-partner-cover" />
          <Avatar src={conversation.partner_avatar} name={conversation.partner_name} size="xl" className="chat-partner-avatar" isOnline={conversation.is_online} />
          <h2>{conversation.partner_name}</h2>
          <p className="chat-partner-location">{profile?.partner_profession || conversation.partner_profession}</p>
          <Link href={`/profile/${conversation.partner_username}`} className="chat-partner-link">View profile <ArrowRightLeft /></Link>
        </section>
      )}
      {profile && (
        <section className="chat-context-card">
          <div className="chat-context-heading"><h3><ArrowRightLeft />Active Skill Swap</h3>{conversation?.swap_id && <Link href="/swaps">Details</Link>}</div>
          <div className="chat-swap-pair">
            <span><small>You Teach</small><strong>{profile.i_can_teach}</strong></span>
            <span><small>You Learn</small><strong>{profile.i_want_to_learn}</strong></span>
          </div>
          <div className="chat-progress-label"><span>Learning progress</span><strong>{profile.current_progress}%</strong></div>
          <div className="chat-progress-track"><i style={{ width: `${Math.min(profile.current_progress, 100)}%` }} /></div>
        </section>
      )}
      <section className="chat-context-card">
        <div className="chat-context-heading"><h3><FileText />Shared Files</h3><span>{files.length}</span></div>
        {files.length ? files.map((message) => (
          <a className="chat-shared-file" key={message.id} href={resolveFileUrl(message.file_url!)} target="_blank" rel="noreferrer">
            <span><FileText /><b>{message.content.replace("Shared attachment: ", "")}</b></span><Download />
          </a>
        )) : <p className="chat-context-empty">Files shared in this conversation will appear here.</p>}
      </section>
      {profile?.upcoming_session && (
        <section className="chat-context-card chat-upcoming-card">
          <div className="chat-context-heading"><h3><Calendar />Upcoming Session</h3><Link href="/sessions">View all</Link></div>
          <strong>{profile.upcoming_session.title}</strong>
          <p><Clock3 />{formatDateTime(profile.upcoming_session.date_time)}</p>
          {profile.upcoming_session.meeting_link && <a href={profile.upcoming_session.meeting_link} target="_blank" rel="noreferrer">Join session</a>}
        </section>
      )}
      <div className="chat-privacy-note"><ShieldCheck /><span>Messages and contact details follow your exchange privacy settings.</span></div>
    </aside>
  );
}
