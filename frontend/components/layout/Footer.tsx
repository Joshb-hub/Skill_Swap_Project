"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRightLeft, ShieldCheck, Heart } from "lucide-react";

export function Footer() {
  const pathname = usePathname();
  if (pathname.startsWith("/dashboard")) return null;

  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                <ArrowRightLeft className="w-4 h-4" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">SkillSwap</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              A secure peer-to-peer skill exchange community where curious minds teach what they know and master what they desire.
            </p>
            <div className="flex items-center space-x-1.5 text-xs text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Contact details protected by server-side privacy</span>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-200 uppercase tracking-wider mb-4">Discover</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/explore?category=Programming+%26+Tech" className="hover:text-white transition-colors">Programming & AI</Link></li>
              <li><Link href="/explore?category=Design+%26+Creative" className="hover:text-white transition-colors">Design & UI/UX</Link></li>
              <li><Link href="/explore?category=Languages" className="hover:text-white transition-colors">Languages & Culture</Link></li>
              <li><Link href="/explore?category=Technical+Trades" className="hover:text-white transition-colors">Carpentry & Trades</Link></li>
              <li><Link href="/explore?category=Business+%26+Finance" className="hover:text-white transition-colors">Business & Accounting</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-200 uppercase tracking-wider mb-4">Platform</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/explore" className="hover:text-white transition-colors">Explore People</Link></li>
              <li><Link href="/matches" className="hover:text-white transition-colors">Reciprocal Matching</Link></li>
              <li><Link href="/requests" className="hover:text-white transition-colors">Exchange Requests</Link></li>
              <li><Link href="/chat" className="hover:text-white transition-colors">Live Exchange Chat</Link></li>
              <li><Link href="/sessions" className="hover:text-white transition-colors">Session Scheduler</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-200 uppercase tracking-wider mb-4">Safety & Terms</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/settings" className="hover:text-white transition-colors">Privacy Preferences</Link></li>
              <li><span className="text-slate-500">Community Guidelines</span></li>
              <li><span className="text-slate-500">Terms of Service</span></li>
              <li><span className="text-slate-500">Privacy Policy</span></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-12 pt-6 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500">
          <p>© {new Date().getFullYear()} SkillSwap Inc. All rights reserved.</p>
          <p className="flex items-center mt-2 md:mt-0">
            Crafted with modern web technologies for lifelong learners.
          </p>
        </div>
      </div>
    </footer>
  );
}
