"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import {
  Sparkles, Users, MessageSquare, Calendar, TrendingUp,
  Bell, Settings, LogOut, Menu, X, ArrowRightLeft, Shield, Search
} from "lucide-react";
import { notificationService } from "@/services";

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [navSearch, setNavSearch] = useState("");

  useEffect(() => {
    if (isAuthenticated) {
      notificationService.getNotifications().then((notifs) => {
        const unread = notifs.filter((n) => !n.is_read).length;
        setUnreadNotifs(unread);
      }).catch(() => {});
    }
  }, [isAuthenticated, pathname]);

  if (pathname.startsWith("/dashboard")) return null;

  const navLinks = [
    { href: "/explore", label: "Explore People", icon: Users },
    { href: "/matches", label: "Matches", icon: Sparkles },
    { href: "/requests", label: "Requests", icon: ArrowRightLeft },
    { href: "/swaps", label: "Active Swaps", icon: ArrowRightLeft },
    { href: "/chat", label: "Chat", icon: MessageSquare },
    { href: "/sessions", label: "Sessions", icon: Calendar },
    { href: "/progress", label: "Progress", icon: TrendingUp },
  ];

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const handleNavSearch = (event: React.FormEvent) => {
    event.preventDefault();
    router.push(navSearch.trim() ? `/explore?q=${encodeURIComponent(navSearch.trim())}` : "/explore");
  };

  return (
    <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
                <ArrowRightLeft className="w-5 h-5" />
              </div>
              <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-700 bg-clip-text text-transparent">
                SkillSwap
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            {isAuthenticated ? (
              <div className="hidden md:flex items-center ml-8 space-x-1">
                {navLinks.map((link) => {
                  const isActive = pathname.startsWith(link.href);
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-indigo-50 text-indigo-700 font-semibold"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? "text-indigo-600" : "text-slate-400"}`} />
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="hidden md:flex items-center ml-20 space-x-7">
                {[{ href: "/", label: "Home" }, { href: "/explore", label: "Explore" }, { href: "/how-it-works", label: "How It Works" }, { href: "/about", label: "About" }, { href: "/faqs", label: "FAQs" }].map((link) => (
                  <Link key={link.href} href={link.href} className={`py-5 text-sm font-medium transition-colors ${pathname === link.href ? "border-b-2 border-violet-600 text-slate-900" : "text-slate-700 hover:text-violet-700"}`}>
                    {link.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Right Header: Auth / Profile */}
          <div className="hidden md:flex items-center space-x-3">
            {isAuthenticated && user ? (
              <>
                <form onSubmit={handleNavSearch} className="nav-search">
                  <Search className="w-4 h-4" />
                  <input
                    value={navSearch}
                    onChange={(event) => setNavSearch(event.target.value)}
                    placeholder="Search for skills, people or topics..."
                    aria-label="Search for skills, people or topics"
                  />
                </form>
                <Link
                  href="/notifications"
                  className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  {unreadNotifs > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white" />
                  )}
                </Link>

                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center space-x-2.5 p-1 rounded-full hover:ring-2 hover:ring-indigo-200 transition-all focus:outline-none"
                  >
                    <Avatar
                      src={user.profile?.avatar_url}
                      name={user.profile?.full_name || user.username}
                      size="sm"
                    />
                    <span className="text-sm font-medium text-slate-700 max-w-[120px] truncate">
                      {user.profile?.full_name?.split(" ")[0] || user.username}
                    </span>
                  </button>

                  {isUserMenuOpen && (
                    <div
                      className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-50 animate-in fade-in duration-100"
                      onMouseLeave={() => setIsUserMenuOpen(false)}
                    >
                      <div className="px-4 py-2 border-b border-slate-100">
                        <p className="text-xs font-semibold text-slate-900 truncate">
                          {user.profile?.full_name || user.username}
                        </p>
                        <p className="text-xs text-slate-400 truncate">@{user.username}</p>
                      </div>

                      <Link
                        href={`/profile/${user.username}`}
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center space-x-2 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      >
                        <Users className="w-4 h-4 text-slate-400" />
                        <span>My Profile & Skills</span>
                      </Link>

                      <Link
                        href="/settings"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center space-x-2 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      >
                        <Shield className="w-4 h-4 text-slate-400" />
                        <span>Privacy & Safety</span>
                      </Link>

                      <div className="border-t border-slate-100 my-1"></div>

                      <button
                        onClick={handleLogout}
                        className="flex items-center space-x-2 w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2.5">
                <form onSubmit={handleNavSearch} className="nav-search public-nav-search">
                  <Search className="w-4 h-4" />
                  <input
                    value={navSearch}
                    onChange={(event) => setNavSearch(event.target.value)}
                    placeholder="Search for skills, people or topics..."
                    aria-label="Search for skills, people or topics"
                  />
                </form>
                <Link
                  href="/notifications"
                  aria-label="Notifications"
                  className="public-notification-link"
                >
                  <Bell className="w-5 h-5" />
                </Link>
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Log in
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button variant="primary" size="sm">
                    Join SkillSwap
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger menu */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1">
          <div className="mobile-header-tools">
            <form onSubmit={(event) => { handleNavSearch(event); setIsMenuOpen(false); }} className="nav-search mobile-nav-search" role="search">
              <Search className="w-4 h-4" />
              <input
                value={navSearch}
                onChange={(event) => setNavSearch(event.target.value)}
                placeholder="Search for skills, people or topics..."
                aria-label="Search for skills, people or topics"
              />
            </form>
            <Link href="/notifications" onClick={() => setIsMenuOpen(false)} aria-label="Notifications" className="mobile-notification-link">
              <Bell className="w-5 h-5" />
              {unreadNotifs > 0 && <span />}
            </Link>
          </div>
          {isAuthenticated ? (
            <>
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-50"
                >
                  <link.icon className="w-4 h-4 text-slate-400" />
                  <span>{link.label}</span>
                </Link>
              ))}
              <div className="border-t border-slate-100 pt-2 mt-2">
                <Link
                  href={`/profile/${user?.username}`}
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg"
                >
                  View Profile
                </Link>
                <Link
                  href="/settings"
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg"
                >
                  Privacy & Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 rounded-lg"
                >
                  Sign Out
                </button>
              </div>
            </>
          ) : (
            <div className="pt-2 space-y-2">
              <Link href="/login" onClick={() => setIsMenuOpen(false)} className="block">
                <Button variant="outline" className="w-full">
                  Log in
                </Button>
              </Link>
              <Link href="/signup" onClick={() => setIsMenuOpen(false)} className="block">
                <Button variant="primary" className="w-full">
                  Join SkillSwap
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
