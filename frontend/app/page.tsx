"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ArrowRight, LockKeyhole, Search, TrendingUp, Users } from "lucide-react";

export default function HomePage() {
  const highlights = [
    { icon: Users, title: "Real People", text: "Connect with genuine learners and teachers", color: "bg-violet-100 text-violet-600" },
    { icon: Search, title: "Smart Search", text: "Find people by skill, experience, location and more", color: "bg-cyan-100 text-cyan-600" },
    { icon: LockKeyhole, title: "Safe & Secure", text: "Your privacy and safety come first", color: "bg-rose-100 text-rose-500" },
    { icon: TrendingUp, title: "Track Your Growth", text: "Set goals, track progress and celebrate milestones", color: "bg-amber-100 text-amber-600" },
  ];

  const people = [
    { src: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=560&q=85", label: "Teaches: Guitar", className: "hero-person hero-person-guitar" },
    { src: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=560&q=85", label: "Teaches: Coding", className: "hero-person hero-person-code" },
    { src: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=560&q=85", label: "Teaches: Painting", className: "hero-person hero-person-paint" },
    { src: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=560&q=85", label: "Teaches: Cooking", className: "hero-person hero-person-cook" },
  ];

  return (
    <div className="landing-page pb-16">
      <section className="landing-hero relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 pt-14 pb-10 lg:pt-20 lg:pb-14 grid lg:grid-cols-[0.92fr_1.08fr] gap-8 items-center">
          <div className="relative z-10">
            <p className="eyebrow">Learn <span>•</span> Teach <span>•</span> Grow <span>•</span> Together</p>
            <h1 className="mt-5 text-5xl sm:text-6xl xl:text-[72px] leading-[0.98] font-extrabold tracking-tight text-[#101e49]">Swap Skills.<br />Build a <span className="text-gradient">Brighter</span> You.</h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-slate-600">A community where anyone can learn and teach - any skill, at any age, from anywhere. Because everyone has something to share.</p>
            <div className="mt-8 flex flex-wrap gap-4"><Link href="/signup"><Button size="lg" className="rounded-full px-7 shadow-lg shadow-violet-200">Get Started <ArrowRight className="ml-2 h-4 w-4" /></Button></Link><Link href="/explore"><Button variant="outline" size="lg" className="rounded-full border-violet-300 px-7 text-violet-700">Explore People</Button></Link></div>
            <div className="mt-12 flex flex-wrap gap-x-7 gap-y-4 text-[#101e49]">{[['10K+', 'Learners'], ['8K+', 'Skills'], ['150+', 'Countries'], ['All Ages', 'From 10 to 100+']].map(([value, label]) => <div key={label} className="stat-item"><strong>{value}</strong><span>{label}</span></div>)}</div>
          </div>
          <div className="hero-collage" aria-label="People sharing their skills"><div className="collage-orb orb-one" /><div className="collage-orb orb-two" />{people.map((person) => <div key={person.label} className={person.className}><img src={person.src} alt="" /><span>{person.label}</span></div>)}</div>
        </div>
      </section>
      <section className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10"><div className="highlight-strip">{highlights.map(({ icon: Icon, title, text, color }) => <div key={title} className="highlight-item"><div className={`highlight-icon ${color}`}><Icon /></div><div><h2>{title}</h2><p>{text}</p></div></div>)}</div></section>
      <section className="max-w-4xl mx-auto px-5 sm:px-8 pt-16 text-center"><p className="eyebrow">A place for every person</p><h2 className="mt-3 text-4xl font-extrabold text-[#101e49]">Every Skill Matters</h2><p className="mt-4 text-slate-600">From music to math, design to languages, tech to traditional crafts - there&apos;s a place for every skill and every person.</p><div className="mx-auto mt-6 h-1.5 w-24 rounded-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-violet-500" /></section>
    </div>
  );
}
