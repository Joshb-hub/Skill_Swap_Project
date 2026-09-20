"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Notification } from "@/types";
import { notificationService } from "@/services";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import {
  Bell, CheckCheck, Clock, ArrowRightLeft, MessageSquare,
  Calendar, Star, TrendingUp
} from "lucide-react";
import { formatTimeAgo } from "@/lib/utils";

export default function NotificationsPage() {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchNotifs = async () => {
    setIsLoading(true);
    try {
      const data = await notificationService.getNotifications();
      setNotifications(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifs();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const handleMarkRead = async (id: string) => {
    try {
      await notificationService.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "new_request":
      case "request_accepted":
        return <ArrowRightLeft className="w-4 h-4 text-indigo-600" />;
      case "new_message":
        return <MessageSquare className="w-4 h-4 text-violet-600" />;
      case "session_scheduled":
      case "session_rescheduled":
        return <Calendar className="w-4 h-4 text-emerald-600" />;
      case "review_received":
        return <Star className="w-4 h-4 text-amber-500 fill-amber-500" />;
      default:
        return <Bell className="w-4 h-4 text-slate-500" />;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto py-24 text-center space-y-4">
        <Bell className="w-12 h-12 text-indigo-600 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Sign in to view your notifications</h2>
        <Link href="/login">
          <Button variant="primary">Sign In</Button>
        </Link>
      </div>
    );
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Bell className="w-6 h-6 text-indigo-600" />
            Notifications
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time alerts for requests, messages, scheduled sessions, and milestone progress.
          </p>
        </div>

        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllRead} className="text-xs">
            <CheckCheck className="w-3.5 h-3.5 mr-1" />
            Mark all read
          </Button>
        )}
      </div>

      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardContent className="p-0 divide-y divide-slate-100">
          {isLoading ? (
            <div className="py-20 text-center text-xs text-slate-400">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="py-20 text-center text-xs text-slate-400 space-y-2">
              <Bell className="w-8 h-8 text-slate-300 mx-auto" />
              <p>No notifications yet. You're all caught up!</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => !n.is_read && handleMarkRead(n.id)}
                className={`p-4 sm:p-5 flex items-start justify-between gap-4 transition-colors ${
                  n.is_read ? "bg-white hover:bg-slate-50" : "bg-indigo-50/40 hover:bg-indigo-50/60"
                }`}
              >
                <div className="flex items-start space-x-3.5">
                  <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-xs mt-0.5">
                    {getIcon(n.type)}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-bold text-sm text-slate-900">{n.title}</h4>
                      {!n.is_read && (
                        <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>
                    <div className="flex items-center space-x-3 pt-1 text-[11px] text-slate-400">
                      <span>{formatTimeAgo(n.created_at)}</span>
                      {n.link && (
                        <Link href={n.link} className="text-indigo-600 font-semibold hover:underline">
                          View details →
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
