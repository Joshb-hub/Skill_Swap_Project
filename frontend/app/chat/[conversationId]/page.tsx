"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Conversation, Message } from "@/types";
import { chatService } from "@/services";
import { useAuth } from "@/hooks/useAuth";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { PartnerSidebarPopup } from "@/components/chat/PartnerSidebarPopup";
import {
  Send, Paperclip, ArrowLeft, ArrowRightLeft,
  Calendar, Check, CheckCheck, Info, FileText, Image as ImageIcon
} from "lucide-react";
import { formatDateTime, formatTimeAgo } from "@/lib/utils";

export default function ChatConversationPage() {
  const params = useParams();
  const conversationId = params.conversationId as string;
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConv, setCurrentConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputContent, setInputContent] = useState<string>("");
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [partnerTyping, setPartnerTyping] = useState<boolean>(false);
  const [isPopupOpen, setIsPopupOpen] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const socketRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
      setMessages(msgs);
      setTimeout(scrollToBottom, 100);
      chatService.markRead(conversationId).catch(() => {});
    }).catch(console.error);
  }, [conversationId, isAuthenticated]);

  // Establish WebSocket connection
  useEffect(() => {
    if (!isAuthenticated || !conversationId) return;

    const token = localStorage.getItem("skillswap_access_token");
    if (!token) return;

    const wsUrl = `${process.env.NEXT_PUBLIC_WS_BASE_URL || "ws://localhost:8000/ws"}/chat/${conversationId}?token=${token}`;
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log("Connected to SkillSwap real-time chat socket");
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "message" && data.message) {
          setMessages((prev) => [...prev, data.message]);
          setTimeout(scrollToBottom, 50);
          // Send read receipt if received from partner
          if (data.message.sender_id !== user?.id) {
            socket.send(JSON.stringify({ type: "read" }));
          }
        } else if (data.type === "typing") {
          if (data.user_id !== user?.id) {
            setPartnerTyping(data.is_typing);
          }
        } else if (data.type === "read") {
          setMessages((prev) =>
            prev.map((m) => (m.sender_id === user?.id ? { ...m, is_read: true } : m))
          );
        }
      } catch (err) {
        console.error("Failed to parse websocket message:", err);
      }
    };

    socket.onerror = (err) => {
      console.warn("WebSocket connection error, fallback available:", err);
    };

    socket.onclose = () => {
      console.log("WebSocket connection closed");
    };

    return () => {
      socket.close();
    };
  }, [conversationId, isAuthenticated, user?.id]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputContent.trim()) return;

    const text = inputContent.trim();
    setInputContent("");

    // Broadcast through WebSocket if connected
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: "message",
          content: text,
          message_type: "text",
        })
      );
    }
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
      setMessages((prev) => [...prev, newMsg]);
      setTimeout(scrollToBottom, 100);
    } catch (err: any) {
      alert(err.message || "Failed to upload file attachment");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-[82vh] grid grid-cols-1 md:grid-cols-3">
        {/* Left Sidebar (Conversations List) */}
        <div className="hidden md:flex flex-col border-r border-slate-200 bg-slate-50/50">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white">
            <h3 className="font-bold text-sm text-slate-900">Exchange Chats</h3>
            <Link href="/swaps" className="text-xs text-indigo-600 hover:underline">
              All Swaps
            </Link>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {conversations.map((conv) => {
              const isActive = conv.id === conversationId;
              return (
                <Link
                  key={conv.id}
                  href={`/chat/${conv.id}`}
                  className={`flex items-center space-x-3.5 p-4 transition-colors ${
                    isActive ? "bg-indigo-50/70 border-l-4 border-indigo-600" : "hover:bg-white"
                  }`}
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
        <div className="md:col-span-2 flex flex-col h-full bg-slate-50/30">
          {/* Header */}
          <div className="p-3.5 sm:px-6 bg-white border-b border-slate-200 flex items-center justify-between z-10">
            <div className="flex items-center space-x-3">
              <Link href="/chat" className="md:hidden text-slate-400 hover:text-slate-600">
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
                {currentConv && (
                  <div className="flex items-center space-x-1.5 text-[11px] text-slate-500">
                    <span className="text-indigo-600 font-semibold">{currentConv.they_teach || "Skill"}</span>
                    <span>↔</span>
                    <span className="text-violet-600 font-semibold">{currentConv.i_teach || "Skill"}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPopupOpen(true)}
                className="text-xs flex items-center gap-1.5"
              >
                <Info className="w-3.5 h-3.5 text-indigo-600" />
                <span>Exchange Profile</span>
              </Button>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
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

                    <div className={`flex items-end space-x-2 ${isMe ? "justify-end" : "justify-start"}`}>
                      {!isMe && (
                        <Avatar
                          src={m.sender_avatar}
                          name={m.sender_name}
                          size="sm"
                          className="shrink-0 mb-1"
                        />
                      )}

                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-2.5 shadow-xs space-y-1 ${
                          isMe
                            ? "bg-indigo-600 text-white rounded-br-xs"
                            : "bg-white text-slate-900 border border-slate-200 rounded-bl-xs"
                        }`}
                      >
                        {/* If file or image */}
                        {m.message_type === "image" && m.file_url ? (
                          <div className="rounded-lg overflow-hidden my-1">
                            <img
                              src={m.file_url}
                              alt="Attachment"
                              className="max-h-60 rounded-lg object-cover"
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
          <div className="p-3 bg-white border-t border-slate-200">
            <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
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
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                title="Share Document or Image"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              <input
                type="text"
                value={inputContent}
                onChange={handleInputChange}
                placeholder="Type a message, ask a question, or share resources..."
                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />

              <Button
                type="submit"
                variant="primary"
                size="icon"
                disabled={!inputContent.trim()}
                className="rounded-xl shrink-0"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>
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
