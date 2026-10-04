"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowRightLeft, Bell, CalendarDays, Check, CheckCheck, MessageCircle, Settings, ShieldCheck, Sparkles, Star, TrendingUp, Users } from "lucide-react";
import { Notification } from "@/types";
import { notificationService } from "@/services";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { formatTimeAgo } from "@/lib/utils";

type NotificationCategory = "Requests" | "Sessions" | "Messages" | "Reviews" | "System";
type NotificationTab = "All" | "Unread" | NotificationCategory;
const categories: NotificationCategory[] = ["Requests", "Sessions", "Messages", "Reviews", "System"];
const tabs: NotificationTab[] = ["All", "Unread", ...categories];

function categoryFor(type: string): NotificationCategory {
  if (type.startsWith("request_") || type === "new_request") return "Requests";
  if (type.startsWith("session_")) return "Sessions";
  if (type.includes("message")) return "Messages";
  if (type.includes("review")) return "Reviews";
  return "System";
}

function NotificationIcon({ type }: { type: string }) {
  const category = categoryFor(type);
  if (category === "Requests") return <ArrowRightLeft />;
  if (category === "Sessions") return <CalendarDays />;
  if (category === "Messages") return <MessageCircle />;
  if (category === "Reviews") return <Star />;
  if (type.includes("progress") || type.includes("milestone")) return <TrendingUp />;
  return <Bell />;
}

function actionLabel(notification: Notification) {
  const category = categoryFor(notification.type);
  if (category === "Requests") return "View request";
  if (category === "Sessions") return "View session";
  if (category === "Messages") return "Reply";
  if (category === "Reviews") return "View review";
  return "View details";
}

export default function NotificationsPage() {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [tab, setTab] = useState<NotificationTab>("All");
  const [selectedCategories, setSelectedCategories] = useState<Set<NotificationCategory>>(new Set(categories));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const loadNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      setNotifications(await notificationService.getNotifications());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load notifications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) void loadNotifications();
    else setLoading(false);
  }, [isAuthenticated]);

  const unreadCount = notifications.filter((notification) => !notification.is_read).length;
  const counts = useMemo(() => {
    const result: Record<NotificationCategory, number> = { Requests: 0, Sessions: 0, Messages: 0, Reviews: 0, System: 0 };
    notifications.forEach((notification) => { result[categoryFor(notification.type)] += 1; });
    return result;
  }, [notifications]);
  const visibleNotifications = notifications.filter((notification) => {
    const category = categoryFor(notification.type);
    if (!selectedCategories.has(category)) return false;
    if (tab === "Unread") return !notification.is_read;
    if (categories.includes(tab as NotificationCategory)) return category === tab;
    return true;
  });

  const markRead = async (notification: Notification) => {
    if (notification.is_read) return;
    setMarkingId(notification.id);
    setError(null);
    try {
      await notificationService.markRead(notification.id);
      setNotifications((current) => current.map((item) => item.id === notification.id ? { ...item, is_read: true } : item));
    } catch (markError) {
      setError(markError instanceof Error ? markError.message : "Could not mark notification as read.");
    } finally {
      setMarkingId(null);
    }
  };

  const markAllRead = async () => {
    setMarkingAll(true);
    setError(null);
    try {
      await notificationService.markAllRead();
      setNotifications((current) => current.map((item) => ({ ...item, is_read: true })));
    } catch (markError) {
      setError(markError instanceof Error ? markError.message : "Could not mark all as read.");
    } finally {
      setMarkingAll(false);
    }
  };

  const toggleCategory = (category: NotificationCategory) => {
    setSelectedCategories((current) => {
      const next = new Set(current);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  };

  if (!isAuthenticated) return <div className="notifications-empty-auth"><Bell /><h1>Sign in to view notifications</h1><Link href="/login"><Button variant="primary">Sign in</Button></Link></div>;

  return (
    <main className="notifications-dashboard-page">
      <div className="notifications-dashboard-layout">
        <section className="notifications-main-column">
          <header className="notifications-dashboard-header"><div><h1>Notifications</h1><p>Stay updated with your skill swap journey.</p></div><span className="notifications-header-note">Good things happen <span>♡</span></span></header>
          <nav className="notifications-tabs" aria-label="Notification category tabs">{tabs.map((item) => <button key={item} className={tab === item ? "active" : ""} onClick={() => { setTab(item); if (item === "All" || item === "Unread") setSelectedCategories(new Set(categories)); else setSelectedCategories(new Set([item])); }}>{item}<span>{item === "All" ? notifications.length : item === "Unread" ? unreadCount : counts[item]}</span></button>)}</nav>
          {error && <div className="notifications-inline-error">{error}</div>}
          {loading ? <div className="notifications-loading" role="status">Loading notifications...</div> : visibleNotifications.length ? <div className="notification-list">{visibleNotifications.map((notification) => <article className={`notification-card ${notification.is_read ? "read" : "unread"}`} key={notification.id}><span className={`notification-icon ${categoryFor(notification.type).toLowerCase()}`}><NotificationIcon type={notification.type} /></span><div className="notification-copy"><div className="notification-title-row"><h2>{notification.title}</h2>{!notification.is_read && <i aria-label="Unread" />}</div><p>{notification.message}</p><div className="notification-meta"><span>{formatTimeAgo(notification.created_at)}</span>{notification.link && <Link onClick={() => void markRead(notification)} href={notification.link}>{actionLabel(notification)} <ArrowRight /></Link>}</div></div><div className="notification-actions">{!notification.is_read && <button disabled={markingId === notification.id} onClick={() => void markRead(notification)} title="Mark as read" aria-label="Mark as read"><Check /></button>}<button title="Notification options" aria-label="Notification options">···</button></div></article>)}</div> : <div className="notifications-empty-list"><span><Bell /></span><h2>{tab === "Unread" ? "You’re all caught up" : "No notifications here"}</h2><p>{tab === "Unread" ? "There are no unread notifications." : "Updates in this category will appear here."}</p></div>}
        </section>

        <aside className="notifications-dashboard-aside">
          <section className="notifications-unread-summary"><span><Bell /></span><div><strong>{unreadCount} Unread Notifications</strong><p>{unreadCount ? `You have ${unreadCount} new ${unreadCount === 1 ? "notification" : "notifications"}` : "You’re all caught up"}</p></div><button onClick={() => void markAllRead()} disabled={!unreadCount || markingAll}>{markingAll ? "Marking..." : "Mark all as read"}</button></section>
          <section className="notification-filter-panel"><h2><span><ArrowRightLeft /></span>Notification Filters</h2><label className="notification-filter-row all"><input type="checkbox" checked={selectedCategories.size === categories.length} onChange={() => setSelectedCategories(selectedCategories.size === categories.length ? new Set() : new Set(categories))} /><span>All Notifications</span><b>{notifications.length}</b></label>{categories.map((category) => <label className="notification-filter-row" key={category}><input type="checkbox" checked={selectedCategories.has(category)} onChange={() => toggleCategory(category)} /><span>{category === "Requests" ? "Skill Swap Requests" : category === "Sessions" ? "Session Updates" : category === "System" ? "Platform Updates" : category}</span><b>{counts[category]}</b></label>)}</section>
          <Link href="/settings" className="notification-preferences-card"><span><Settings /></span><div><strong>Notification Preferences</strong><small>Manage how and when you’re notified.</small></div><ArrowRight /></Link>
          <div className="notifications-aside-art"><span>Never miss an opportunity to learn</span><i /><i /></div>
          <p className="notifications-aside-caption">Same skills. New perspectives.</p>
        </aside>
      </div>
    </main>
  );
}