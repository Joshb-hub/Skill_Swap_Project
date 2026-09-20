"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Conversation } from "@/types";
import { chatService } from "@/services";
import { useAuth } from "@/hooks/useAuth";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { MessageSquare, ArrowRightLeft, Clock, Search } from "lucide-react";
import { formatTimeAgo } from "@/lib/utils";

export default function ChatIndexPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");

  useEffect(() => {
    if (isAuthenticated) {
      chatService
        .getConversations()
        .then((data) => {
          setConversations(data);
          // If on desktop and conversations exist, could auto-open first
        })
        .catch(console.error)
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto py-24 text-center space-y-4">
        <MessageSquare className="w-12 h-12 text-indigo-600 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Sign in to access your exchange chats</h2>
        <Link href="/login">
          <Button variant="primary">Sign In</Button>
        </Link>
      </div>
    );
  }

  const filtered = conversations.filter(
    (c) =>
      c.partner_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.partner_username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[75vh] grid grid-cols-1 md:grid-cols-3">
        {/* Left Sidebar */}
        <div className="border-r border-slate-200 flex flex-col h-full bg-slate-50/50">
          <div className="p-4 border-b border-slate-200 space-y-3 bg-white">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-indigo-600" />
                Conversations
              </h2>
              <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 rounded-full text-slate-600">
                {conversations.length}
              </span>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {isLoading ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading chats...</div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                {searchTerm ? "No conversations match your search." : "No active exchange conversations yet."}
              </div>
            ) : (
              filtered.map((conv) => (
                <Link
                  key={conv.id}
                  href={`/chat/${conv.id}`}
                  className="flex items-center space-x-3.5 p-4 hover:bg-white transition-colors group cursor-pointer"
                >
                  <Avatar
                    src={conv.partner_avatar}
                    name={conv.partner_name}
                    size="md"
                    isOnline={conv.is_online}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="font-bold text-xs text-slate-900 truncate group-hover:text-indigo-600">
                        {conv.partner_name}
                      </p>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {formatTimeAgo(conv.last_message_time)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 truncate">{conv.last_message}</p>
                  </div>
                  {conv.unread_count > 0 && (
                    <span className="px-2 py-0.5 bg-indigo-600 text-white font-bold rounded-full text-[10px]">
                      {conv.unread_count}
                    </span>
                  )}
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Right Placeholder Screen */}
        <div className="hidden md:flex flex-col items-center justify-center p-8 text-center bg-slate-50/30 col-span-2 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <MessageSquare className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-lg text-slate-900">Your Skill Exchange Messages</h3>
          <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
            Select an ongoing exchange from the sidebar to chat in real-time, coordinate learning schedules, and share learning resources.
          </p>
          <Link href="/swaps">
            <Button variant="outline" size="sm" className="text-xs">
              View Active Swaps
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
