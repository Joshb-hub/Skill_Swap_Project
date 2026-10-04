"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AlertCircle, ArrowLeft, ArrowRight, ArrowRightLeft, BookOpen, Check, CheckCircle2, GraduationCap, Lightbulb, Palette, Send, ShieldCheck, Sparkles, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { profileService, swapService } from "@/services";
import { Profile } from "@/types";

const levels = ["Beginner", "Intermediate", "Advanced", "Professional"];

export default function NewSwapRequestPage() {
  const params = useParams();
  const username = params.username as string;
  const { user } = useAuth();
  const [target, setTarget] = useState<Profile | null>(null);
  const [myProfile, setMyProfile] = useState<Profile | null>(user?.profile || null);
  const [offeredSkillId, setOfferedSkillId] = useState("");
  const [requestedSkillId, setRequestedSkillId] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!user || !username) return;
    let cancelled = false;
    setLoading(true);
    Promise.all([
      profileService.getProfile(username),
      profileService.getProfile(user.username),
    ]).then(([targetProfile, ownProfile]) => {
      if (cancelled) return;
      setTarget(targetProfile);
      setMyProfile(ownProfile);
      setOfferedSkillId(ownProfile.skills_teach[0]?.skill_id || "");
      setRequestedSkillId(targetProfile.skills_teach[0]?.skill_id || "");
    }).catch((requestError: Error) => {
      if (!cancelled) setError(requestError.message || "Unable to load profiles.");
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [user, username]);

  const offeredSkill = myProfile?.skills_teach.find((skill) => skill.skill_id === offeredSkillId);
  const requestedSkill = target?.skills_teach.find((skill) => skill.skill_id === requestedSkillId);

  const submitRequest = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!target || !offeredSkillId || !requestedSkillId) return;
    setSubmitting(true);
    setError(null);
    try {
      await swapService.sendRequest({
        receiver_id: target.user_id,
        offered_skill_id: offeredSkillId,
        requested_skill_id: requestedSkillId,
        message: message.trim() || undefined,
      });
      setSent(true);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to send your request.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return <div className="swap-request-empty"><h1>Sign in to send a request</h1><Link href="/login"><Button variant="primary">Sign in</Button></Link></div>;
  }

  if (loading) return <div className="swap-request-empty" role="status">Loading exchange details...</div>;
  if (!target || !myProfile) {
    return <div className="swap-request-empty"><h1>Request unavailable</h1><p>{error || "We couldn't load both profiles."}</p><Link href="/explore"><Button variant="outline">Back to Explore</Button></Link></div>;
  }

  if (sent) {
    return (
      <main className="swap-request-page">
        <div className="swap-request-success"><span><CheckCircle2 /></span><h1>Request sent to {target.full_name}</h1><p>Your proposal is on its way. Once accepted, your conversation and exchange workspace will be ready.</p><div><Link href="/requests"><Button variant="outline">View Requests</Button></Link><Link href={`/profile/${target.username}`}><Button variant="primary">Back to Profile</Button></Link></div></div>
      </main>
    );
  }

  return (
    <main className="swap-request-page">
      <div className="swap-request-layout">
        <div className="swap-request-main">
          <Link className="swap-request-back" href={`/profile/${target.username}`}><ArrowLeft /> Back to Profile</Link>
          <section className="swap-recipient-banner">
            <div className="swap-banner-art" />
            <Avatar src={target.avatar_url} name={target.full_name} size="xl" className="swap-recipient-avatar" />
            <div className="swap-recipient-copy"><h1>{target.full_name}</h1><p>{target.profession} <span>·</span> {[target.city, target.country].filter(Boolean).join(", ")}</p><span className="swap-recipient-intro">Start with a skill you can share, and one you’re excited to learn.</span></div>
          </section>

          <form className="swap-request-form" onSubmit={submitRequest}>
            <header className="swap-form-heading"><span><Send /></span><div><h2>Send a Skill Swap Request</h2><p>Suggest an exchange and start a conversation with {target.full_name.split(" ")[0]}.</p></div></header>
            {error && <div className="swap-form-error"><AlertCircle /><span>{error}</span></div>}
            <div className="swap-selection-grid">
              <section className="swap-selection-card teach">
                <h3><span><GraduationCap /></span>I can teach</h3><p>Select a skill you can teach {target.full_name.split(" ")[0]}.</p>
                {myProfile.skills_teach.length ? <label className="swap-select-wrap"><select value={offeredSkillId} onChange={(event) => setOfferedSkillId(event.target.value)} required>{myProfile.skills_teach.map((skill) => <option key={skill.skill_id} value={skill.skill_id}>{skill.skill_name}</option>)}</select><ArrowRight /></label> : <p className="swap-no-skills">Add a teaching skill to your profile before sending a request.</p>}
                <span className="swap-level-label">Your listed level</span><div className="swap-level-options" aria-label="Skill experience levels">{levels.map((level) => <span key={level} className={offeredSkill?.experience_level === level ? "active" : ""}>{level}</span>)}</div>
              </section>
              <div className="swap-direction"><ArrowRightLeft /></div>
              <section className="swap-selection-card learn">
                <h3><span><Palette /></span>I want to learn</h3><p>Choose a skill you’d like to learn from {target.full_name.split(" ")[0]}.</p>
                {target.skills_teach.length ? <label className="swap-select-wrap"><select value={requestedSkillId} onChange={(event) => setRequestedSkillId(event.target.value)} required>{target.skills_teach.map((skill) => <option key={skill.skill_id} value={skill.skill_id}>{skill.skill_name}</option>)}</select><ArrowRight /></label> : <p className="swap-no-skills">This member has not listed a teaching skill yet.</p>}
                <span className="swap-level-label">Their listed level</span><div className="swap-level-options" aria-label="Partner skill experience levels">{levels.map((level) => <span key={level} className={requestedSkill?.experience_level === level ? "active" : ""}>{level}</span>)}</div>
              </section>
            </div>
            <div className="swap-note-heading"><label htmlFor="swap-message">Add a message <span>(optional)</span></label><small>{message.length}/500</small></div>
            <textarea id="swap-message" maxLength={500} rows={4} value={message} onChange={(event) => setMessage(event.target.value)} placeholder={`Hi ${target.full_name.split(" ")[0]}! I came across your profile and would love to learn ${requestedSkill?.skill_name || "a new skill"}. I can teach ${offeredSkill?.skill_name || "one of my skills"} in exchange.`} />
            <div className="swap-guidelines"><span><ShieldCheck /></span><div><strong>A few things to keep in mind</strong><ul><li>Be respectful and clear about your interests.</li><li>Swap requests are reviewed by the other person.</li><li>Contact details stay private until the request is accepted.</li></ul></div></div>
            <div className="swap-form-actions"><Link href={`/profile/${target.username}`}>Cancel</Link><Button type="submit" variant="primary" isLoading={submitting} disabled={!offeredSkillId || !requestedSkillId}><Send /> Send Request</Button></div>
          </form>
        </div>

        <aside className="swap-request-aside">
          <section className="swap-aside-card"><div className="swap-aside-profile"><Avatar src={target.avatar_url} name={target.full_name} size="lg" /><div><strong>{target.full_name}</strong><span>{[target.city, target.country].filter(Boolean).join(", ")}</span></div></div><h2>{target.full_name.split(" ")[0]}&apos;s Skills</h2><h3>Teaching</h3><div className="swap-aside-tags">{target.skills_teach.map((skill) => <Badge key={skill.id} variant="default">{skill.skill_name}</Badge>)}</div><h3>Learning</h3><div className="swap-aside-tags">{target.skills_learn.map((skill) => <Badge key={skill.id} variant="secondary">{skill.skill_name}</Badge>)}</div></section>
          <section className="swap-tips-card"><h2><Lightbulb />Tips for a great request</h2><ul><li><Check />Be specific about what you want to learn and what you can teach.</li><li><Check />Explain why you’re interested in learning from them.</li><li><Check />Keep your proposal friendly and professional.</li><li><Check />You can discuss timing and details later.</li></ul></section>
          <section className="swap-ready-card"><span><Users /></span><div><strong>Ready to grow together?</strong><p>Small skills create big opportunities.</p></div><Sparkles /></section>
        </aside>
      </div>
    </main>
  );
}
