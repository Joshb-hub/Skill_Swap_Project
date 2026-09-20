"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Profile, SkillCategory } from "@/types";
import { searchService, skillService } from "@/services";
import { RequestModal } from "@/components/requests/RequestModal";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import {
  BookOpen, BriefcaseBusiness, CalendarDays, Check, ChevronDown, Grid2X2,
  Heart, Languages, MapPin, Menu, Music2, Palette, Search, SlidersHorizontal,
  Sparkles, TrendingUp, Utensils, Users, X
} from "lucide-react";

const fallbackProfiles: Profile[] = [
  { user_id: "demo-priya", username: "priya-sharma", full_name: "Priya Sharma", profession: "UX Designer", country: "India", city: "Kolkata", avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=85", languages: ["English"], availability: ["Weekends"], preferred_learning_mode: "Either", skills_teach: [{ id: "p1", skill_id: "p1", skill_name: "UI/UX Design", skill_type: "TEACH" }, { id: "p2", skill_id: "p2", skill_name: "Figma", skill_type: "TEACH" }], skills_learn: [{ id: "p3", skill_id: "p3", skill_name: "Python", skill_type: "LEARN" }], rating_average: 4.9, reviews_count: 32, bio: "Design enthusiast who loves teaching and learning new tech skills!" },
  { user_id: "demo-arjun", username: "arjun-mehta", full_name: "Arjun Mehta", profession: "Data Analyst", country: "India", city: "Bangalore", avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=85", languages: ["English"], availability: ["Evenings"], preferred_learning_mode: "Online", skills_teach: [{ id: "a1", skill_id: "a1", skill_name: "Python", skill_type: "TEACH" }, { id: "a2", skill_id: "a2", skill_name: "Machine Learning", skill_type: "TEACH" }], skills_learn: [{ id: "a3", skill_id: "a3", skill_name: "Guitar", skill_type: "LEARN" }], rating_average: 4.8, reviews_count: 27, bio: "Software engineer who loves open source and helping others learn." },
  { user_id: "demo-ishita", username: "ishita-roy", full_name: "Ishita Roy", profession: "Product Designer", country: "India", city: "Delhi", avatar_url: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=600&q=85", languages: ["English"], availability: ["Weekdays"], preferred_learning_mode: "Either", skills_teach: [{ id: "i1", skill_id: "i1", skill_name: "Graphic Design", skill_type: "TEACH" }, { id: "i2", skill_id: "i2", skill_name: "Illustration", skill_type: "TEACH" }], skills_learn: [{ id: "i3", skill_id: "i3", skill_name: "Web Development", skill_type: "LEARN" }], rating_average: 4.7, reviews_count: 21, bio: "Turning ideas into visuals and always eager to learn new things!" },
  { user_id: "demo-rohan", username: "rohan-singh", full_name: "Rohan Singh", profession: "Software Engineer", country: "India", city: "Mumbai", avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=85", languages: ["English"], availability: ["Evenings"], preferred_learning_mode: "Online", skills_teach: [{ id: "r1", skill_id: "r1", skill_name: "Guitar", skill_type: "TEACH" }, { id: "r2", skill_id: "r2", skill_name: "Music Theory", skill_type: "TEACH" }], skills_learn: [{ id: "r3", skill_id: "r3", skill_name: "Public Speaking", skill_type: "LEARN" }], rating_average: 4.8, reviews_count: 18, bio: "Music keeps me sane. Let’s learn and grow together!" },
  { user_id: "demo-ananya", username: "ananya-das", full_name: "Ananya Das", profession: "Home Chef", country: "India", city: "Pune", avatar_url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=85", languages: ["English"], availability: ["Weekends"], preferred_learning_mode: "Either", skills_teach: [{ id: "n1", skill_id: "n1", skill_name: "Cooking", skill_type: "TEACH" }, { id: "n2", skill_id: "n2", skill_name: "Baking", skill_type: "TEACH" }], skills_learn: [{ id: "n3", skill_id: "n3", skill_name: "Photography", skill_type: "LEARN" }], rating_average: 4.9, reviews_count: 40, bio: "Good food, good vibes, good people!" },
  { user_id: "demo-kunal", username: "kunal-verma", full_name: "Kunal Verma", profession: "Web Developer", country: "India", city: "Hyderabad", avatar_url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=85", languages: ["English"], availability: ["Weekdays"], preferred_learning_mode: "Online", skills_teach: [{ id: "k1", skill_id: "k1", skill_name: "Web Development", skill_type: "TEACH" }, { id: "k2", skill_id: "k2", skill_name: "Next.js", skill_type: "TEACH" }], skills_learn: [{ id: "k3", skill_id: "k3", skill_name: "UI/UX Design", skill_type: "LEARN" }], rating_average: 4.6, reviews_count: 15, bio: "Love building things and meeting people who are curious like me." },
  { user_id: "demo-sneha", username: "sneha-kapoor", full_name: "Sneha Kapoor", profession: "Communication Coach", country: "India", city: "Chennai", avatar_url: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=600&q=85", languages: ["English"], availability: ["Evenings"], preferred_learning_mode: "Either", skills_teach: [{ id: "s1", skill_id: "s1", skill_name: "English", skill_type: "TEACH" }, { id: "s2", skill_id: "s2", skill_name: "Communication", skill_type: "TEACH" }], skills_learn: [{ id: "s3", skill_id: "s3", skill_name: "Spanish", skill_type: "LEARN" }], rating_average: 4.8, reviews_count: 25, bio: "Let’s talk, learn and explore the world through languages!" },
  { user_id: "demo-aditya", username: "aditya-rao", full_name: "Aditya Rao", profession: "Photographer", country: "India", city: "Jaipur", avatar_url: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=600&q=85", languages: ["English"], availability: ["Weekends"], preferred_learning_mode: "Either", skills_teach: [{ id: "d1", skill_id: "d1", skill_name: "Photography", skill_type: "TEACH" }, { id: "d2", skill_id: "d2", skill_name: "Photo Editing", skill_type: "TEACH" }], skills_learn: [{ id: "d3", skill_id: "d3", skill_name: "Digital Marketing", skill_type: "LEARN" }], rating_average: 4.7, reviews_count: 19, bio: "Capturing moments and learning something new every day." },
];

const sidebarCategories = [
  "Technology",
  "Design",
  "Business",
  "Languages",
  "Music",
  "Arts & Crafts",
  "Cooking",
  "Health & Fitness",
];

export default function ExplorePage() {
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") || "";
  const initialCategory = searchParams.get("category") || "";

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [categories, setCategories] = useState<SkillCategory[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showFilters, setShowFilters] = useState<boolean>(false);

  // Filters State
  const [searchKeyword, setSearchKeyword] = useState<string>(initialQ);
  const [selectedSkill, setSelectedSkill] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [selectedProfession, setSelectedProfession] = useState<string>("");
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [selectedExp, setSelectedExp] = useState<string>("");
  const [selectedMode, setSelectedMode] = useState<string>("");
  const [selectedAvailability, setSelectedAvailability] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("best_match");
  const { user } = useAuth();
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);

  useEffect(() => {
    skillService.getCategories().then(setCategories).catch(() => {});
  }, []);

  const fetchProfiles = async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string> = {
        sort_by: sortBy,
      };
      if (searchKeyword.trim()) params.q = searchKeyword.trim();
      if (selectedSkill.trim()) params.skill = selectedSkill.trim();
      if (selectedCategory) params.category = selectedCategory;
      if (selectedProfession.trim()) params.profession = selectedProfession.trim();
      if (selectedLocation.trim()) params.city = selectedLocation.trim();
      if (selectedExp) params.experience_level = selectedExp;
      if (selectedMode) params.learning_mode = selectedMode;
      if (selectedAvailability) params.availability = selectedAvailability;

      const results = await searchService.searchProfiles(params);
      setProfiles(results);
    } catch (err) {
      console.error("Failed to load profiles:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, [selectedCategory, selectedExp, selectedMode, selectedAvailability, sortBy]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProfiles();
  };

  const clearAllFilters = () => {
    setSearchKeyword("");
    setSelectedSkill("");
    setSelectedCategory("");
    setSelectedProfession("");
    setSelectedLocation("");
    setSelectedExp("");
    setSelectedMode("");
    setSelectedAvailability("");
    setSortBy("best_match");
    setTimeout(fetchProfiles, 50);
  };

  const hasActiveFilters = !!(
    searchKeyword || selectedSkill || selectedCategory ||
    selectedProfession || selectedLocation || selectedExp ||
    selectedMode || selectedAvailability
  );
  const displayProfiles = profiles.length ? profiles : hasActiveFilters ? [] : fallbackProfiles;

  return (
    <div className="explore-page">
      <section className="explore-hero"><div><h1>Explore <span>People</span></h1><p>Find learners and teachers who share your interests.<br />Connect, exchange skills and grow together.</p><div className="explore-steps"><span><BookOpen />Learn</span><span><Users />Teach</span><span><Sparkles />Connect</span><span><TrendingUp />Grow</span></div></div><div className="explore-hero-art"><div /><img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=500&q=85" alt="" /></div></section>
      <div className="explore-layout">
        <aside className={`explore-filters ${showFilters ? "mobile-open" : ""}`}>
          <div className="filter-heading"><h2>Filters</h2><button onClick={clearAllFilters}>Clear all</button></div>
          <FilterLabel icon={Search} label="Search" /><input className="explore-input" value={searchKeyword} onChange={(event) => setSearchKeyword(event.target.value)} onKeyDown={(event) => event.key === "Enter" && fetchProfiles()} placeholder="Search by name, skill, or keyword..." />
          <FilterLabel icon={Sparkles} label="Skills" /><div className="teach-toggle"><button className="selected">Teach</button><button>Learn</button></div><input className="explore-input" value={selectedSkill} onChange={(event) => setSelectedSkill(event.target.value)} onBlur={fetchProfiles} placeholder="Select skills" />
          <FilterLabel icon={BriefcaseBusiness} label="Categories" /><div className="category-list"><label><input type="checkbox" checked={!selectedCategory} onChange={() => setSelectedCategory("")} /> <GridIcon /> All categories</label>{Array.from(new Set([...sidebarCategories, ...categories.map((category) => category.name)])).slice(0, 8).map((category) => <label key={category}><input type="checkbox" checked={selectedCategory === category} onChange={() => setSelectedCategory(selectedCategory === category ? "" : category)} /> <GridIcon /> {category}</label>)}</div><button className="show-more">Show more <ChevronDown /></button>
          <FilterLabel icon={MapPin} label="Location" /><select className="explore-input" value={selectedLocation} onChange={(event) => setSelectedLocation(event.target.value)} onBlur={fetchProfiles}><option value="">Any location</option><option>India</option><option>United States</option><option>United Kingdom</option></select>
          <FilterLabel icon={CalendarDays} label="Availability" /><select className="explore-input" value={selectedAvailability} onChange={(event) => setSelectedAvailability(event.target.value)}><option value="">Any time</option><option>Weekdays</option><option>Weekends</option><option>Evenings</option></select>
          <FilterLabel icon={TrendingUp} label="Experience Level" /><div className="level-list">{["Beginner", "Intermediate", "Advanced", "Professional"].map((level) => <label key={level}><input type="checkbox" checked={selectedExp === level} onChange={() => setSelectedExp(selectedExp === level ? "" : level)} /> {level}</label>)}</div><Button onClick={fetchProfiles} className="apply-filters">Apply Filters</Button>
        </aside>
        <main className="explore-results"><div className="explore-result-toolbar"><p>{isLoading ? "Finding people..." : `${displayProfiles.length || 234} people found`}</p><div><label>Sort by <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}><option value="best_match">Best Match</option><option value="newest">Newest</option><option value="most_experienced">Most Experienced</option></select></label><button className="view-toggle active"><Grid2X2 /></button><button className="view-toggle"><Menu /></button><button className="filter-mobile" onClick={() => setShowFilters(!showFilters)}><SlidersHorizontal /></button></div></div>{isLoading ? <div className="explore-empty">Finding people who match your skills...</div> : displayProfiles.length ? <div className="explore-cards">{displayProfiles.map((profile) => <ExploreProfileCard key={profile.user_id} profile={profile} onConnect={() => setSelectedProfile(profile)} />)}</div> : <div className="explore-empty"><Search /><h2>No matching people found</h2><p>Try clearing a filter to discover more people.</p><Button variant="outline" onClick={clearAllFilters}>Clear filters</Button></div>}</main>
      </div>{selectedProfile && <RequestModal isOpen={!!selectedProfile} targetProfile={selectedProfile} onClose={() => setSelectedProfile(null)} onSuccess={fetchProfiles} />}
    </div>
  );
}

function FilterLabel({ icon: Icon, label }: { icon: typeof Search; label: string }) { return <h3 className="filter-label"><Icon />{label}</h3>; }
function GridIcon() { return <span className="category-glyph">◈</span>; }
function ExploreProfileCard({ profile, onConnect }: { profile: Profile; onConnect: () => void }) { const teach = profile.skills_teach.slice(0, 2).map((skill) => skill.skill_name); const learn = profile.skills_learn.slice(0, 2).map((skill) => skill.skill_name); return <article className="explore-card"><div className="explore-card-image"><img src={profile.avatar_url || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=500&q=80"} alt={profile.full_name} /><span className="online-status"><i />Online</span><button aria-label={`Save ${profile.full_name}`}><Heart /></button></div><div className="explore-card-body"><div className="explore-name-row"><div><h2>{profile.full_name}</h2><p>{profile.profession}</p></div><span className="rating">★ {(profile.rating_average || 4.8).toFixed(1)} <small>({profile.reviews_count || 18})</small></span></div><p className="card-location"><MapPin /> {[profile.city, profile.country].filter(Boolean).join(", ") || "India"}</p><small className="card-label">Teaches</small><div className="card-tags">{teach.map((skill) => <span key={skill}>{skill}</span>)}</div><small className="card-label">Wants to Learn</small><div className="card-tags learn-tags">{learn.map((skill) => <span key={skill}>{skill}</span>)}</div>{profile.bio && <p className="card-bio">“{profile.bio}”</p>}<div className="explore-card-actions"><a href={`/profile/${profile.username}`}>View Profile</a><button onClick={onConnect}>Connect</button></div></div></article>; }
