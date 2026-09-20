"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { SwapRequest } from "@/types";
import { swapService } from "@/services";
import { useAuth } from "@/hooks/useAuth";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Tabs } from "@/components/ui/Tabs";
import {
  ArrowRightLeft, Check, X, Clock, MessageSquare,
  AlertCircle, RefreshCw
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function RequestsPage() {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("received");
  const [receivedRequests, setReceivedRequests] = useState<SwapRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<SwapRequest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const [rec, sent] = await Promise.all([
        swapService.getReceivedRequests(),
        swapService.getSentRequests(),
      ]);
      setReceivedRequests(rec);
      setSentRequests(sent);
    } catch (err) {
      console.error("Failed to load requests:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchRequests();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const handleAccept = async (requestId: string) => {
    setActionLoading(requestId);
    try {
      await swapService.acceptRequest(requestId);
      await fetchRequests();
    } catch (err: any) {
      alert(err.message || "Failed to accept request");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDecline = async (requestId: string) => {
    setActionLoading(requestId);
    try {
      await swapService.declineRequest(requestId);
      await fetchRequests();
    } catch (err: any) {
      alert(err.message || "Failed to decline request");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (requestId: string) => {
    if (!confirm("Are you sure you want to cancel this swap proposal?")) return;
    setActionLoading(requestId);
    try {
      await swapService.cancelRequest(requestId);
      await fetchRequests();
    } catch (err: any) {
      alert(err.message || "Failed to cancel request");
    } finally {
      setActionLoading(null);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto py-24 text-center space-y-4">
        <ArrowRightLeft className="w-12 h-12 text-indigo-600 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Sign in to manage exchange requests</h2>
        <Link href="/login">
          <Button variant="primary">Log In</Button>
        </Link>
      </div>
    );
  }

  const pendingReceived = receivedRequests.filter((r) => r.status === "Pending");
  const pendingSent = sentRequests.filter((r) => r.status === "Pending");

  const tabItems = [
    { id: "received", label: "Received Requests", count: pendingReceived.length },
    { id: "sent", label: "Sent Proposals", count: pendingSent.length },
  ];

  const currentList = activeTab === "received" ? receivedRequests : sentRequests;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ArrowRightLeft className="w-6 h-6 text-indigo-600" />
            Skill Swap Requests
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review incoming exchange proposals or track proposals you've sent to other peers.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchRequests}>
          <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
        </Button>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabItems} activeTab={activeTab} onChange={setActiveTab} />

      {/* Requests List */}
      {isLoading ? (
        <div className="py-20 text-center text-slate-400 text-sm">Loading requests...</div>
      ) : currentList.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <ArrowRightLeft className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No {activeTab} requests found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {activeTab === "received"
              ? "You haven't received any swap requests yet. Enhance your profile skills to attract more peers!"
              : "You haven't sent any swap requests yet. Explore mentors and propose an exchange!"}
          </p>
          {activeTab === "sent" && (
            <Link href="/explore">
              <Button variant="primary" size="sm">
                Explore Community Mentors →
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {currentList.map((req) => {
            const isReceived = activeTab === "received";
            const otherName = isReceived ? req.sender_name : req.receiver_name;
            const otherUsername = isReceived ? req.sender_username : req.receiver_username;
            const otherAvatar = isReceived ? req.sender_avatar : req.receiver_avatar;

            const isPending = req.status === "Pending";

            return (
              <Card key={req.id} className="border-slate-200 shadow-xs hover:border-slate-300 transition-colors">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Peer info & dates */}
                    <div className="flex items-center space-x-3.5">
                      <Avatar src={otherAvatar} name={otherName} size="md" />
                      <div>
                        <Link
                          href={`/profile/${otherUsername}`}
                          className="font-bold text-sm text-slate-900 hover:text-indigo-600 transition-colors"
                        >
                          {otherName}
                        </Link>
                        <p className="text-xs text-slate-400">
                          @{otherUsername} • {formatDate(req.created_at)}
                        </p>
                      </div>
                    </div>

                    {/* Status badge */}
                    <div className="self-start sm:self-center">
                      <Badge
                        variant={
                          req.status === "Accepted"
                            ? "success"
                            : req.status === "Pending"
                            ? "warning"
                            : "secondary"
                        }
                      >
                        {req.status}
                      </Badge>
                    </div>
                  </div>

                  {/* Skills Exchange Details */}
                  <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                        {isReceived ? "They Will Teach You" : "You Will Teach"}
                      </span>
                      <p className="font-bold text-sm text-slate-900 mt-0.5">{req.offered_skill_name}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-violet-600 uppercase tracking-wider">
                        {isReceived ? "You Will Teach Them" : "You Will Learn"}
                      </span>
                      <p className="font-bold text-sm text-slate-900 mt-0.5">{req.requested_skill_name}</p>
                    </div>
                  </div>

                  {/* Proposal Note */}
                  {req.message && (
                    <div className="mt-3 text-xs text-slate-600 italic bg-white p-3 rounded-lg border border-slate-100">
                      "{req.message}"
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                    {req.status === "Accepted" ? (
                      <Link href="/chat">
                        <Button size="sm" variant="success" className="text-xs">
                          <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
                          Open Exchange Chat →
                        </Button>
                      </Link>
                    ) : isPending ? (
                      isReceived ? (
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="primary"
                            isLoading={actionLoading === req.id}
                            onClick={() => handleAccept(req.id)}
                            className="text-xs"
                          >
                            <Check className="w-3.5 h-3.5 mr-1" />
                            Accept Exchange
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            isLoading={actionLoading === req.id}
                            onClick={() => handleDecline(req.id)}
                            className="text-xs text-rose-600 hover:text-rose-700"
                          >
                            <X className="w-3.5 h-3.5 mr-1" />
                            Decline
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          isLoading={actionLoading === req.id}
                          onClick={() => handleCancel(req.id)}
                          className="text-xs text-slate-600"
                        >
                          Cancel Proposal
                        </Button>
                      )
                    ) : (
                      <span className="text-xs text-slate-400">Request closed</span>
                    )}

                    <Link
                      href={`/profile/${otherUsername}`}
                      className="text-xs text-slate-500 hover:text-indigo-600 font-medium"
                    >
                      View Profile
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
