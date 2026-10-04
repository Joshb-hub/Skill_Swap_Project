"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft, ArrowRight, ArrowRightLeft, BookOpen, BriefcaseBusiness,
  CalendarDays, Check, Clock3, Edit3, Eye, Globe2, Laptop, MapPin, MessageCircle,
  Pencil, Phone, Plus, ShieldCheck, Star, Trash2, Users,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SkillFormModal } from "@/components/skills/SkillFormModal";
import { profileService, reviewService, skillService } from "@/services";
import { Profile, Review } from "@/types";

type ProfileTab = "about" | "skills" | "goals" | "availability" | "reviews";

const tabs: { id: ProfileTab; label: string }[] = [
  { id: "about", label: "About" },
  { id: "skills", label: "Skills" },
  { id: "goals", label: "Learning Goals" },
  { id: "availability", label: "Availability" },
  { id: "reviews", label: "Reviews" },
];

function InfoItem({ icon: Icon, label, value }: { icon: typeof MapPin; label: string; value: string }) {
  return (
    <div className="profile-info-item">
      <Icon aria-hidden="true" />
      <span><strong>{label}</strong><small>{value || "Not provided"}</small></span>
    </div>
  );
}

export default function ProfileDetailPage() {
  const params = useParams();
  const username = params.username as string;
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [activeTab, setActiveTab] = useState<ProfileTab>("about");
  const [isLoading, setIsLoading] = useState(true);
  const [skillOpen, setSkillOpen] = useState(false);
  const [skillType, setSkillType] = useState<"TEACH" | "LEARN">("TEACH");
  const isOwner = user?.username === username;

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const result = await profileService.getProfile(username);
      setProfile(result);
      setReviews(await reviewService.getUserReviews(result.user_id));
    } catch (error) {
      console.error("Failed to load profile:", error);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (username) void loadProfile();
  }, [username]);

  const handleDeleteSkill = async (skillId: string) => {
    if (!window.confirm("Remove this skill from your profile?")) return;
    try {
      await skillService.removeUserSkill(skillId);
      await loadProfile();
    } catch {
      window.alert("Failed to remove skill.");
    }
  };

  if (isLoading) {
    return <div className="profile-loading" role="status">Loading profile...</div>;
  }

  if (!profile) {
    return (
      <div className="profile-empty">
        <h1>Profile not found</h1>
        <p>This profile may have been removed or is no longer available.</p>
        <Link href="/explore"><Button variant="outline">Browse people</Button></Link>
      </div>
    );
  }

  const location = [profile.city, profile.state, profile.country].filter(Boolean).join(", ");
  const allSkills = [...profile.skills_teach, ...profile.skills_learn];
  const statItems = isOwner
    ? [
        { icon: Users, value: allSkills.length, label: "Skills listed" },
        { icon: CalendarDays, value: profile.availability.length, label: "Availability slots" },
        { icon: ShieldCheck, value: profile.languages.length, label: "Languages" },
      ]
    : [
        { icon: Users, value: profile.skills_teach.length, label: "Skills to teach" },
        { icon: BookOpen, value: profile.skills_learn.length, label: "Skills to learn" },
        { icon: Check, value: reviews.length, label: "Reviews" },
      ];

  const openSkillForm = (type: "TEACH" | "LEARN") => {
    setSkillType(type);
    setSkillOpen(true);
  };

  return (
    <main className="profile-page">
      <div className={`profile-layout ${isOwner ? "is-owner" : "is-visitor"}`}>
        <div className="profile-main-column">
          {!isOwner && (
            <Link className="profile-back-link" href="/explore"><ArrowLeft /> Back to Explore</Link>
          )}

          <section className="profile-hero" aria-label={`${profile.full_name}'s profile`}>
            <div className="profile-cover" />
            <div className="profile-hero-content">
              <div className="profile-identity">
                <Avatar
                  src={profile.avatar_url}
                  name={profile.full_name || profile.username}
                  size="xl"
                  className="profile-avatar"
                />
                <div className="profile-heading-copy">
                  <h1>{profile.full_name}</h1>
                  <div className="profile-subtitle">
                    <span><MapPin />{location || "Location not added"}</span>
                    <span><BriefcaseBusiness />{profile.profession || "Member"}</span>
                  </div>
                  <p className="profile-bio-preview">{profile.bio || "Building new skills and meeting thoughtful people through learning."}</p>
                  <div className="profile-chip-row">
                    {profile.skills_teach.slice(0, 4).map((skill) => <Badge key={skill.id} variant="default">{skill.skill_name}</Badge>)}
                    {profile.skills_learn.slice(0, 2).map((skill) => <Badge key={skill.id} variant="secondary">{skill.skill_name}</Badge>)}
                    {allSkills.length > 6 && <span className="profile-more-chip">+{allSkills.length - 6} more</span>}
                  </div>
                </div>
              </div>
              <div className="profile-actions">
                {isOwner ? (
                  <Link href="/profile/edit"><Button variant="outline" size="sm"><Edit3 /> Edit Profile</Button></Link>
                ) : (
                  <>
                    <Link className="profile-request-button" href={`/requests/new/${profile.username}`}><ArrowRightLeft /> Send Request</Link>
                    <Link href="/chat" aria-label={`Message ${profile.full_name}`} className="profile-icon-action"><MessageCircle /></Link>
                  </>
                )}
              </div>
            </div>
            <div className="profile-stats">
              <div className="profile-rating"><Star /><span><strong>{(profile.rating_average || 5).toFixed(1)}</strong><small>({reviews.length} reviews)</small></span></div>
              {statItems.map(({ icon: Icon, value, label }) => (
                <div className="profile-stat" key={label}><Icon /><span><strong>{value}</strong><small>{label}</small></span></div>
              ))}
            </div>
          </section>

          <section className="profile-content-panel">
            <nav className="profile-tabs" aria-label="Profile sections">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={activeTab === tab.id ? "active" : ""}
                  aria-current={activeTab === tab.id ? "page" : undefined}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </nav>

            {activeTab === "about" && (
              <div className="profile-about-grid">
                <section className="profile-about-card">
                  <h2>About Me</h2>
                  <p className="profile-about-copy">{profile.bio || "This member has not added a bio yet."}</p>
                  <div className="profile-info-grid">
                    <InfoItem icon={BriefcaseBusiness} label="Profession" value={profile.profession} />
                    <InfoItem icon={Clock3} label="Availability" value={profile.availability.join(", ")} />
                    <InfoItem icon={Laptop} label="Learning mode" value={profile.preferred_learning_mode} />
                    <InfoItem icon={Globe2} label="Languages" value={profile.languages.join(", ")} />
                    <InfoItem icon={MapPin} label="Location" value={location} />
                    <InfoItem icon={ShieldCheck} label="Member" value="SkillSwap community" />
                  </div>
                  {isOwner && (
                    <Link href="/profile/edit" className="profile-edit-inline"><Pencil /> Edit profile details</Link>
                  )}
                </section>
                <div className="profile-about-aside">
                  <section className="profile-highlight-card teach-highlight">
                    <h2><span><Users /></span>What I Can Teach</h2>
                    {profile.skills_teach.length ? (
                      <ul>{profile.skills_teach.slice(0, 4).map((skill) => <li key={skill.id}>{skill.skill_name}<small>{skill.experience_level || "Ready to share"}</small></li>)}</ul>
                    ) : <p>No teaching skills listed yet.</p>}
                  </section>
                  <section className="profile-highlight-card learn-highlight">
                    <h2><span><BookOpen /></span>What I Want to Learn</h2>
                    {profile.skills_learn.length ? (
                      <ul>{profile.skills_learn.slice(0, 4).map((skill) => <li key={skill.id}>{skill.skill_name}<small>{skill.target_level || "Open to learning"}</small></li>)}</ul>
                    ) : <p>No learning goals listed yet.</p>}
                  </section>
                </div>
              </div>
            )}

            {activeTab === "skills" && (
              <div className="profile-skill-columns">
                <SkillList title="Skills I Can Teach" skills={profile.skills_teach} isOwner={isOwner} onDelete={handleDeleteSkill} onAdd={() => openSkillForm("TEACH")} />
                <SkillList title="Skills I Want to Learn" skills={profile.skills_learn} isOwner={isOwner} onDelete={handleDeleteSkill} onAdd={() => openSkillForm("LEARN")} />
              </div>
            )}

            {activeTab === "goals" && (
              <section className="profile-tab-section">
                <div className="profile-section-heading"><div><h2>Learning Goals</h2><p>Skills this member is excited to explore.</p></div>{isOwner && <button className="profile-add-button" onClick={() => openSkillForm("LEARN")}><Plus /> Add goal</button>}</div>
                {profile.skills_learn.length ? <div className="profile-goal-list">{profile.skills_learn.map((skill) => <article key={skill.id}><BookOpen /><div><h3>{skill.skill_name}</h3><p>{skill.description || `Current target: ${skill.target_level || "Intermediate"}`}</p></div>{isOwner && <button title="Remove learning goal" onClick={() => handleDeleteSkill(skill.id)}><Trash2 /></button>}</article>)}</div> : <p className="profile-muted">No learning goals listed yet.</p>}
              </section>
            )}

            {activeTab === "availability" && (
              <section className="profile-tab-section">
                <div className="profile-section-heading"><div><h2>Availability</h2><p>Preferred learning mode: {profile.preferred_learning_mode}</p></div></div>
                <div className="profile-availability-list">{profile.availability.length ? profile.availability.map((slot) => <span key={slot}><Check />{slot}</span>) : <p className="profile-muted">Availability has not been added yet.</p>}</div>
                <div className="profile-location-row"><MapPin /><span><strong>{location || "Location not added"}</strong><small>Location shared on profile</small></span></div>
              </section>
            )}

            {activeTab === "reviews" && (
              <section className="profile-tab-section">
                <div className="profile-section-heading"><div><h2>Reviews</h2><p>Feedback from completed skill exchanges.</p></div><span className="profile-review-average"><Star />{(profile.rating_average || 5).toFixed(1)} <small>({reviews.length})</small></span></div>
                {reviews.length ? <div className="profile-review-list">{reviews.map((review) => <article key={review.id}><Avatar src={review.reviewer_avatar} name={review.reviewer_name} size="sm" /><div className="profile-review-content"><div><strong>{review.reviewer_name}</strong><time>{new Date(review.created_at).toLocaleDateString()}</time></div><span className="profile-review-stars"><Star />{review.overall_rating.toFixed(1)}</span>{review.comment && <p>{review.comment}</p>}</div></article>)}</div> : <p className="profile-muted">No reviews submitted yet.</p>}
              </section>
            )}
          </section>
        </div>

        <aside className="profile-sidebar">
          <section className="profile-side-card">
            <div className="profile-side-heading"><h2><Users />Skills</h2><button onClick={() => setActiveTab("skills")}>View all <ArrowRight /></button></div>
            <h3>Teaching</h3><div className="profile-side-tags">{profile.skills_teach.length ? profile.skills_teach.slice(0, 5).map((skill) => <Badge key={skill.id} variant="default">{skill.skill_name}</Badge>) : <span className="profile-muted">None added</span>}</div>
            <h3>Learning</h3><div className="profile-side-tags">{profile.skills_learn.length ? profile.skills_learn.slice(0, 5).map((skill) => <Badge key={skill.id} variant="secondary">{skill.skill_name}</Badge>) : <span className="profile-muted">None added</span>}</div>
            {isOwner && <button className="profile-edit-inline" onClick={() => openSkillForm("TEACH")}><Plus /> Add a skill</button>}
          </section>
          <section className="profile-side-card">
            <div className="profile-side-heading"><h2><CalendarDays />Availability</h2><button onClick={() => setActiveTab("availability")}>Details <ArrowRight /></button></div>
            <p className="profile-side-caption">Available for sessions</p>
            <div className="profile-day-chips">{profile.availability.length ? profile.availability.map((day) => <span key={day}>{day}</span>) : <span>Not set</span>}</div>
          </section>
          <section className="profile-side-card profile-location-card">
            <div className="profile-side-heading"><h2><MapPin />Location</h2></div>
            <p>{location || "Location not added"}</p><small>{profile.preferred_learning_mode} sessions</small>
          </section>
          <section className="profile-connect-card">
            <h2><ShieldCheck />Connect</h2>
            <p>{isOwner ? "Your contact details stay protected by your privacy settings." : "Start a conversation or propose a skill swap to connect."}</p>
            {!isOwner && <Link className="profile-request-button" href={`/requests/new/${profile.username}`}><ArrowRightLeft /> Send a request</Link>}
            {isOwner && <Link href="/settings"><Eye /> Privacy settings <ArrowRight /></Link>}
          </section>
          {isOwner && (
            <section className="profile-side-card profile-privacy-card">
              <div className="profile-side-heading"><h2><ShieldCheck />Privacy Settings</h2><Link href="/settings">Edit <ArrowRight /></Link></div>
              <div className="profile-privacy-row"><span><Eye />Email visibility</span><strong>{profile.email_privacy || "Hidden"}</strong></div>
              <div className="profile-privacy-row"><span><Phone />Phone visibility</span><strong>{profile.phone_privacy || "Hidden"}</strong></div>
            </section>
          )}
          {!isOwner && <div className="profile-sidebar-note" aria-hidden="true"><span className="note-sun" /><span className="note-leaf">✳</span></div>}
        </aside>
      </div>

      {skillOpen && <SkillFormModal isOpen={skillOpen} onClose={() => setSkillOpen(false)} defaultType={skillType} onSuccess={loadProfile} />}
    </main>
  );
}

function SkillList({
  title,
  skills,
  isOwner,
  onDelete,
  onAdd,
}: {
  title: string;
  skills: Profile["skills_teach"];
  isOwner: boolean;
  onDelete: (skillId: string) => void;
  onAdd: () => void;
}) {
  return (
    <section className="profile-skill-list-card">
      <div className="profile-section-heading"><div><h2>{title}</h2><p>{skills.length} {skills.length === 1 ? "skill" : "skills"}</p></div>{isOwner && <button className="profile-add-button" onClick={onAdd}><Plus /> Add</button>}</div>
      {skills.length ? skills.map((skill) => <article className="profile-skill-row" key={skill.id}><div><strong>{skill.skill_name}</strong><Badge variant="default">{skill.experience_level || skill.target_level || "Intermediate"}</Badge>{skill.description && <p>{skill.description}</p>}</div>{isOwner && <button title={`Remove ${skill.skill_name}`} onClick={() => onDelete(skill.id)}><Trash2 /></button>}</article>) : <p className="profile-muted">Nothing listed here yet.</p>}
    </section>
  );
}