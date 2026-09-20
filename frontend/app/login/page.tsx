"use client";

import Link from "next/link";
import { ArrowRight, Heart, Lock, Shield, Sparkles, Users } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="auth-page">
      <div className="auth-intro">
        <p className="eyebrow">Learn <span>•</span> Teach <span>•</span> Grow <span>•</span> Together</p>
        <h1>One Community.<br />Infinite <span className="text-gradient">Possibilities.</span></h1>
        <p className="auth-intro-copy">SkillSwap connects people who want to learn with people who love to teach. Share skills, build connections, and grow together.</p>
        <div className="auth-people" aria-label="SkillSwap community members">
          <div className="people-blob people-blob-one" /><div className="people-blob people-blob-two" />
          <div className="auth-person person-guitar"><img src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=480&q=85" alt="" /><span>Teaches:<br />Guitar</span></div>
          <div className="auth-person person-python"><img src="https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=480&q=85" alt="" /><span>Teaches:<br />Python</span></div>
          <div className="auth-person person-cooking"><img src="https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=480&q=85" alt="" /><span>Teaches:<br />Cooking</span></div>
          <span className="doodle doodle-top">✦</span><span className="doodle doodle-left">⌁</span>
        </div>
        <div className="auth-benefits">
          {[{ icon: Users, title: "Learn from real people", text: "Gain practical skills from a global community.", color: "mint" }, { icon: Sparkles, title: "Teach what you know", text: "Share your expertise and make a difference.", color: "lilac" }, { icon: Heart, title: "Build meaningful connections", text: "Meet like-minded learners and teachers.", color: "pink" }, { icon: TrendingUpIcon, title: "Track your progress", text: "Set goals, celebrate milestones, and keep growing.", color: "peach" }].map(({ icon: Icon, title, text, color }) => <div className="auth-benefit" key={title}><div className={`auth-benefit-icon ${color}`}><Icon /></div><div><h2>{title}</h2><p>{text}</p></div></div>)}
        </div>
        <div className="auth-stats"><span><strong>10K+</strong>Learners</span><span><strong>150+</strong>Countries</span><span><strong>500+</strong>Skills</span><span><strong>4.9/5</strong>Community Rating</span></div>
      </div>

      <div className="auth-panel">
        <div className="auth-logo"><div><Users /></div><h2>Welcome to SkillSwap</h2><p>Sign in to continue your journey of learning,<br className="hidden sm:block" /> teaching and meaningful connections.</p></div>
        <button type="button" className="microsoft-button"><span className="microsoft-mark"><i /><i /><i /><i /></span>Sign in with Microsoft <ArrowRight /></button>
        <div className="secure-callout"><Shield /><div><strong>Securely powered by Microsoft Entra ID</strong><span>Your account, security, and privacy are handled by Microsoft. We never store your credentials.</span></div></div>
        <div className="auth-perks"><span><b><Lock /></b>Secure<br />Authentication</span><span><b><Users /></b>Easy<br />Account Access</span><span><b><Shield /></b>Your Privacy<br />Our Priority</span></div>
        <p className="auth-signup">
          Don't have an account yet?{" "}
          <Link href="/signup">
            Sign up now
          </Link>
        </p>
        <p className="auth-legal">By signing in, you agree to our <a href="#terms">Terms of Service</a> and <a href="#privacy">Privacy Policy</a>.</p>
      </div>
    </div>
  );
}

function TrendingUpIcon() {
  return <span className="trending-icon">↗</span>;
}
