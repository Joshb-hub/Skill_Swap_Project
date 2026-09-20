"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { MatchResult } from "@/types";
import { matchService } from "@/services";
import { useAuth } from "@/hooks/useAuth";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { RequestModal } from "@/components/requests/RequestModal";
import {
  Sparkles, ArrowRightLeft, CheckCircle2, BookOpen,
  MapPin, RefreshCw, AlertCircle
} from "lucide-react";

export default function MatchesPage() {
  const { user, isAuthenticated } = useAuth();
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedProfileForSwap, setSelectedProfileForSwap] = useState<any | null>(null);

  const fetchMatches = async () => {
    setIsLoading(true);
    try {
      const data = await matchService.getMatches(25);
      setMatches(data);
    } catch (err) {
      console.error("Failed to load match recommendations:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchMatches();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
        <Sparkles className="w-12 h-12 text-indigo-600 mx-auto" />
        <h2 className="text-2xl font-bold text-slate-900">Sign in to View Your Skill Matches</h2>
        <p className="text-sm text-slate-500">
          Our Python matching engine analyzes your teaching skills and learning goals against our entire community to find reciprocal pairs.
        </p>
        <Link href="/login">
          <Button variant="primary">Sign In to Continue</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Python-Powered Reciprocal Matching Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Top Compatible Skill Matches
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Ranked by mutual skill exchange alignment, experience calibration, availability, and learning mode.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={fetchMatches} className="flex items-center space-x-1.5 self-start">
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Recompute Matches</span>
        </Button>
      </div>

      {isLoading ? (
        <div className="py-24 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
          <p className="text-sm text-slate-500 font-medium">Computing compatibility scores across community...</p>
        </div>
      ) : matches.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-4 max-w-md mx-auto">
          <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Add Skills to Unlock Matches</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            You haven't added both teaching and learning skills to your profile yet. Add the skills you can teach and want to learn so our algorithm can match you!
          </p>
          <Link href={`/profile/${user?.username}`}>
            <Button variant="primary" size="sm">
              Manage My Skills →
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {matches.map((item) => {
              const p = item.user;
              return (
                <Card
                  key={p.user_id}
                  className="hover:shadow-lg transition-all duration-200 border-slate-200 flex flex-col justify-between overflow-hidden"
                >
                  <CardContent className="p-6 space-y-4">
                    {/* Top Bar: Avatar, Info & Match Score */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center space-x-3.5">
                        <Avatar
                          src={p.avatar_url}
                          name={p.full_name || p.username}
                          size="lg"
                        />
                        <div>
                          <Link
                            href={`/profile/${p.username}`}
                            className="font-bold text-base text-slate-900 hover:text-indigo-600 transition-colors"
                          >
                            {p.full_name}
                          </Link>
                          <p className="text-xs text-slate-500 font-medium">{p.profession}</p>
                          <div className="flex items-center space-x-1 text-xs text-slate-400 mt-0.5">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>{[p.city, p.country].filter(Boolean).join(", ")}</span>
                          </div>
                        </div>
                      </div>

                      {/* Percentage Badge */}
                      <div className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-500 text-white rounded-xl shadow-xs text-sm font-black shrink-0">
                        <Sparkles className="w-4 h-4" />
                        <span>{item.match_score}%</span>
                      </div>
                    </div>

                    {/* Explanation Box */}
                    <div className="p-3 bg-gradient-to-r from-indigo-50/90 to-violet-50/90 border border-indigo-100 rounded-xl space-y-1">
                      <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider">
                        Why this is a great exchange:
                      </span>
                      <p className="text-xs text-indigo-950 leading-relaxed font-medium">
                        {item.explanation}
                      </p>
                    </div>

                    {/* Mutual Overlap Breakdown */}
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      {/* You Teach */}
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
                        <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> You Can Teach
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {item.teach_matches.length > 0 ? (
                            item.teach_matches.map((sm, i) => (
                              <Badge key={i} variant="default" className="text-[11px] py-0.5">
                                {sm}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">General overlap</span>
                          )}
                        </div>
                      </div>

                      {/* They Teach */}
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
                        <span className="text-[10px] font-bold text-violet-600 uppercase tracking-wider flex items-center gap-1">
                          <BookOpen className="w-3 h-3" /> They Can Teach
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {item.learn_matches.length > 0 ? (
                            item.learn_matches.map((lm, i) => (
                              <Badge key={i} variant="secondary" className="text-[11px] py-0.5">
                                {lm}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">General overlap</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>

                  {/* Footer Actions */}
                  <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    <Link
                      href={`/profile/${p.username}`}
                      className="text-xs font-semibold text-slate-600 hover:text-slate-900"
                    >
                      View Profile →
                    </Link>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => setSelectedProfileForSwap(p)}
                      className="text-xs"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5 mr-1.5" />
                      Propose Swap
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Swap Request Modal */}
      {selectedProfileForSwap && (
        <RequestModal
          isOpen={!!selectedProfileForSwap}
          onClose={() => setSelectedProfileForSwap(null)}
          targetProfile={selectedProfileForSwap}
          onSuccess={() => {
            setSelectedProfileForSwap(null);
            fetchMatches();
          }}
        />
      )}
    </div>
  );
}
