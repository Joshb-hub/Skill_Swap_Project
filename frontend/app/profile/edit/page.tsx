
"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  Eye,
  MapPin,
  Save,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserRound,
  X,
} from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { profileService, skillService, safetyService } from "@/services";
import type { Profile, UserSkill } from "@/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const MAX_BIO_LENGTH = 300;
const MAX_AVATAR_SIZE = 5 * 1024 * 1024;

const initialForm = {
  full_name: "",
  profession: "",
  country: "India",
  state: "",
  city: "",
  bio: "",
  avatar_url: "",
  preferred_learning_mode: "Online" as Profile["preferred_learning_mode"],
  email_privacy: "Visible After Request Acceptance" as NonNullable<
    Profile["email_privacy"]
  >,
  phone_privacy: "Hidden" as NonNullable<Profile["phone_privacy"]>,
  languages: ["English"],
  availability: ["Mon", "Tue", "Wed", "Thu", "Fri"],
};

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function EditProfilePage() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState(initialForm);
  const [teachSkills, setTeachSkills] = useState<UserSkill[]>([]);
  const [learnSkills, setLearnSkills] = useState<UserSkill[]>([]);
  const [teachInput, setTeachInput] = useState("");
  const [learnInput, setLearnInput] = useState("");
  const [languagesInput, setLanguagesInput] = useState("");
  const [avatarPreview, setAvatarPreview] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSkillsLoading, setIsSkillsLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [skillsError, setSkillsError] = useState("");
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      if (!user) {
        setHasLoaded(true);
        return;
      }

      const profile = user.profile;

      if (profile && active) {
        setFormData({
          full_name: profile.full_name || "",
          profession: profile.profession || "",
          country: profile.country || "India",
          state: profile.state || "",
          city: profile.city || "",
          bio: profile.bio || "",
          avatar_url: profile.avatar_url || "",
          preferred_learning_mode:
            profile.preferred_learning_mode || "Online",
          email_privacy:
            profile.email_privacy ||
            "Visible After Request Acceptance",
          phone_privacy: profile.phone_privacy || "Hidden",
          languages: profile.languages || ["English"],
          availability: profile.availability || [],
        });

        setAvatarPreview(profile.avatar_url || "");
        setTeachSkills(profile.skills_teach || []);
        setLearnSkills(profile.skills_learn || []);

        // Read privacy preferences from the existing privacy endpoint.
        try {
          const privacy = await safetyService.getPrivacySettings();
          if (active) {
            setFormData((previous) => ({
              ...previous,
              email_privacy: privacy.email_privacy as typeof previous.email_privacy,
              phone_privacy: privacy.phone_privacy as typeof previous.phone_privacy,
            }));
          }
        } catch (privacyError) {
          // Keep the profile's privacy values if the separate endpoint fails.
          console.warn("Could not load privacy preferences:", privacyError);
        }
      }

      if (active) setHasLoaded(true);
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, [user]);

  useEffect(() => {
    return () => {
      if (avatarPreview.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  function updateField<K extends keyof typeof initialForm>(
    field: K,
    value: (typeof initialForm)[K]
  ) {
    setFormData((previous) => ({ ...previous, [field]: value }));
  }

  function toggleDay(day: string) {
    setFormData((previous) => ({
      ...previous,
      availability: previous.availability.includes(day)
        ? previous.availability.filter((item) => item !== day)
        : [...previous.availability, day],
    }));
  }

  function addLanguage() {
    const language = languagesInput.trim();
    if (!language) return;

    if (
      !formData.languages.some(
        (item) => item.toLowerCase() === language.toLowerCase()
      )
    ) {
      updateField("languages", [...formData.languages, language]);
    }

    setLanguagesInput("");
  }

  function removeLanguage(language: string) {
    updateField(
      "languages",
      formData.languages.filter((item) => item !== language)
    );
  }

  function handlePhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }

    if (file.size > MAX_AVATAR_SIZE) {
      setError("Choose an image smaller than 5 MB.");
      return;
    }

    setError("");

    setAvatarPreview((previous) => {
      if (previous.startsWith("blob:")) URL.revokeObjectURL(previous);
      return URL.createObjectURL(file);
    });

    // This is a local preview only. A persistent upload requires a backend
    // upload endpoint, which is not part of the supplied service definitions.
  }

  function removePhoto() {
    if (avatarPreview.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreview);
    }
    setAvatarPreview("");
    updateField("avatar_url", "");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function addSkill(skillName: string, type: "TEACH" | "LEARN") {
    const name = skillName.trim();
    if (!name) return;

    const currentSkills = type === "TEACH" ? teachSkills : learnSkills;

    if (
      currentSkills.some(
        (skill) => skill.skill_name.toLowerCase() === name.toLowerCase()
      )
    ) {
      if (type === "TEACH") setTeachInput("");
      else setLearnInput("");
      return;
    }

    setIsSkillsLoading(true);
    setSkillsError("");

    try {
      const created = await skillService.addUserSkill({
        skill_name: name,
        skill_type: type,
      });

      if (type === "TEACH") {
        setTeachSkills((previous) => [...previous, created]);
        setTeachInput("");
      } else {
        setLearnSkills((previous) => [...previous, created]);
        setLearnInput("");
      }
    } catch (err) {
      setSkillsError(
        err instanceof Error ? err.message : "Could not add this skill."
      );
    } finally {
      setIsSkillsLoading(false);
    }
  }

  async function removeSkill(skill: UserSkill, type: "TEACH" | "LEARN") {
    setSkillsError("");

    try {
      await skillService.removeUserSkill(skill.id);

      if (type === "TEACH") {
        setTeachSkills((previous) =>
          previous.filter((item) => item.id !== skill.id)
        );
      } else {
        setLearnSkills((previous) =>
          previous.filter((item) => item.id !== skill.id)
        );
      }
    } catch (err) {
      setSkillsError(
        err instanceof Error ? err.message : "Could not remove this skill."
      );
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const profileUpdate: Partial<Profile> = {
        full_name: formData.full_name.trim(),
        profession: formData.profession.trim(),
        country: formData.country.trim(),
        state: formData.state.trim(),
        city: formData.city.trim(),
        bio: formData.bio.trim(),
        avatar_url: formData.avatar_url,
        preferred_learning_mode: formData.preferred_learning_mode,
        languages: formData.languages,
        availability: formData.availability,
      };

      await profileService.updateMyProfile(profileUpdate);

      // Use the dedicated privacy endpoint rather than relying on the
      // profile endpoint to update contact visibility.
      await safetyService.updatePrivacySettings({
        email_privacy: formData.email_privacy,
        phone_privacy: formData.phone_privacy,
      });

      await refreshUser();
      setSuccess("Profile information saved successfully.");

      // Do not redirect immediately; let the user see the confirmation.
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save your profile."
      );
    } finally {
      setIsLoading(false);
    }
  }

  const location = [formData.city, formData.state, formData.country]
    .filter(Boolean)
    .join(", ");

  const publicProfileHref = user?.username
    ? `/profile/${user.username}`
    : "/profile/edit";

  if (!hasLoaded) {
    return (
      <main className="min-h-screen bg-slate-50 p-8">
        <p className="mx-auto max-w-4xl text-sm text-slate-500">
          Loading your profile...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f8ff] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">
        <header className="mb-7 flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link
              href={publicProfileHref}
              className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-indigo-700"
            >
              <ArrowLeft size={16} />
              Back to Profile
            </Link>

            <h1 className="text-3xl font-bold tracking-tight text-indigo-950">
              Edit Profile
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Show the real you. A better profile helps you connect with the
              right people.
            </p>
          </div>

          <Link
            href={publicProfileHref}
            className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-white px-4 py-2.5 text-sm font-semibold text-indigo-700 shadow-sm hover:bg-indigo-50"
          >
            <Eye size={16} />
            View Public Profile
          </Link>
        </header>

        <form onSubmit={handleSubmit}>
          {error && (
            <div
              role="alert"
              className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"
            >
              {error}
            </div>
          )}

          {success && (
            <div
              role="status"
              className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"
            >
              <CheckCircle2 size={17} />
              {success}
            </div>
          )}

          <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-2">
              <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <SectionTitle title="Profile Photo" icon={<Camera size={19} />} />

                <div className="mt-5 flex flex-wrap items-center gap-5">
                  <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-indigo-50 bg-indigo-50">
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Profile preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <UserRound size={42} className="text-indigo-400" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800">
                      Upload a clear photo
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      A friendly photo helps build trust in the SkillSwap
                      community. Maximum size: 5 MB.
                    </p>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoChange}
                    />

                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Camera size={15} className="mr-2" />
                        Change Photo
                      </Button>

                      <button
                        type="button"
                        onClick={removePhoto}
                        className="rounded-lg px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 size={14} className="mr-1 inline" />
                        Remove
                      </button>
                    </div>
                    <p className="mt-2 text-[11px] text-amber-700">
                      Photo changes are preview-only until photo upload is
                      connected.
                    </p>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <SectionTitle title="Basic Information" icon={<UserRound size={19} />} />

                <div className="mt-4 space-y-4">
                  <Input
                    label="Full Name"
                    value={formData.full_name}
                    onChange={(event) =>
                      updateField("full_name", event.target.value)
                    }
                    required
                  />

                  <Input
                    label="Profession / Role"
                    value={formData.profession}
                    onChange={(event) =>
                      updateField("profession", event.target.value)
                    }
                    placeholder="e.g. Software Engineer"
                    required
                  />

                  <div>
                    <Input
                      label="Headline"
                      value={formData.profession}
                      onChange={(event) =>
                        updateField("profession", event.target.value)
                      }
                      maxLength={100}
                      placeholder="A short introduction"
                    />
                    <p className="mt-1 text-right text-xs text-slate-400">
                      {formData.profession.length}/100
                    </p>
                    <p className="mt-1 text-xs text-amber-700">
                      Headline currently uses the profession field because
                      there is no separate headline field in the supplied
                      Profile type.
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="profile-bio"
                      className="mb-1.5 block text-sm font-medium text-slate-700"
                    >
                      Bio
                    </label>
                    <textarea
                      id="profile-bio"
                      rows={4}
                      maxLength={MAX_BIO_LENGTH}
                      value={formData.bio}
                      onChange={(event) =>
                        updateField("bio", event.target.value)
                      }
                      placeholder="Tell others about your interests and what you want to learn..."
                      className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    />
                    <p className="mt-1 text-right text-xs text-slate-400">
                      {formData.bio.length}/{MAX_BIO_LENGTH}
                    </p>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <SectionTitle title="Personal Details" icon={<MapPin size={19} />} />

                <div className="mt-4 space-y-4">
                  <Input
                    label="City"
                    value={formData.city}
                    onChange={(event) =>
                      updateField("city", event.target.value)
                    }
                    placeholder="e.g. Kolkata"
                  />

                  <Input
                    label="State / Region"
                    value={formData.state}
                    onChange={(event) =>
                      updateField("state", event.target.value)
                    }
                    placeholder="e.g. West Bengal"
                  />

                  <Input
                    label="Country"
                    value={formData.country}
                    onChange={(event) =>
                      updateField("country", event.target.value)
                    }
                    required
                  />

                  <div>
                    <label
                      htmlFor="languages-input"
                      className="mb-1.5 block text-sm font-medium text-slate-700"
                    >
                      Languages
                    </label>
                    <div className="flex gap-2">
                      <input
                        id="languages-input"
                        value={languagesInput}
                        onChange={(event) =>
                          setLanguagesInput(event.target.value)
                        }
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            addLanguage();
                          }
                        }}
                        placeholder="Add a language"
                        className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                      />
                      <Button type="button" variant="outline" onClick={addLanguage}>
                        Add
                      </Button>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {formData.languages.map((language) => (
                        <span
                          key={language}
                          className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1.5 text-xs font-medium text-indigo-800"
                        >
                          {language}
                          <button
                            type="button"
                            aria-label={`Remove ${language}`}
                            onClick={() => removeLanguage(language)}
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Preferred Learning Mode
                    </label>
                    <select
                      value={formData.preferred_learning_mode}
                      onChange={(event) =>
                        updateField(
                          "preferred_learning_mode",
                          event.target.value as Profile["preferred_learning_mode"]
                        )
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-indigo-400"
                    >
                      <option value="Online">Online</option>
                      <option value="In Person">In Person</option>
                      <option value="Either">Either Online / In Person</option>
                    </select>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <SectionTitle title="Availability" icon={<Sparkles size={19} />} />

                <p className="mt-4 text-sm font-medium text-slate-700">
                  Available Days
                </p>

                <div className="mt-2 flex flex-wrap gap-2">
                  {days.map((day) => {
                    const selected = formData.availability.includes(day);

                    return (
                      <button
                        key={day}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => toggleDay(day)}
                        className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                          selected
                            ? "border-indigo-600 bg-indigo-600 text-white"
                            : "border-slate-200 bg-white text-slate-600 hover:border-indigo-300"
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-5">
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Email Visibility
                  </label>
                  <select
                    value={formData.email_privacy}
                    onChange={(event) =>
                      updateField(
                        "email_privacy",
                        event.target.value as typeof formData.email_privacy
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-400"
                  >
                    <option value="Hidden">Hidden (Never shown)</option>
                    <option value="Visible After Request Acceptance">
                      Visible After Request Acceptance
                    </option>
                    <option value="Visible With Permission">
                      Visible With Permission
                    </option>
                  </select>
                </div>

                <div className="mt-4">
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Phone Visibility
                  </label>
                  <select
                    value={formData.phone_privacy}
                    onChange={(event) =>
                      updateField(
                        "phone_privacy",
                        event.target.value as typeof formData.phone_privacy
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-400"
                  >
                    <option value="Hidden">Hidden (Never shown)</option>
                    <option value="Visible After Request Acceptance">
                      Visible After Request Acceptance
                    </option>
                    <option value="Visible With Permission">
                      Visible With Permission
                    </option>
                  </select>
                </div>

                <div className="mt-4 rounded-xl bg-indigo-50 p-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-indigo-900">
                    <ShieldCheck size={17} />
                    Contact Privacy
                  </div>
                  <p className="mt-1 text-xs leading-5 text-indigo-800">
                    Contact visibility is managed separately from public
                    profile information.
                  </p>
                </div>
              </section>

              <SkillsSection
                title="Skills I Can Teach"
                description="Add skills you can share with others."
                skills={teachSkills}
                value={teachInput}
                setValue={setTeachInput}
                type="TEACH"
                loading={isSkillsLoading}
                onAdd={addSkill}
                onRemove={removeSkill}
              />

              <SkillsSection
                title="Skills I Want to Learn"
                description="Add skills you want to learn from others."
                skills={learnSkills}
                value={learnInput}
                setValue={setLearnInput}
                type="LEARN"
                loading={isSkillsLoading}
                onAdd={addSkill}
                onRemove={removeSkill}
              />

              {skillsError && (
                <div
                  role="alert"
                  className="lg:col-span-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"
                >
                  {skillsError}
                </div>
              )}
            </div>

            <aside className="space-y-5 xl:sticky xl:top-5">
              <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <h2 className="text-base font-bold text-slate-900">
                  Profile Preview
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  This is how your profile information will look.
                </p>

                <div className="mt-4 rounded-2xl border border-slate-100 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-indigo-50">
                      {avatarPreview ? (
                        <img
                          src={avatarPreview}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <UserRound size={32} className="text-indigo-400" />
                      )}
                    </div>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                      Profile Preview
                    </span>
                  </div>

                  <h3 className="mt-4 break-words text-xl font-bold text-slate-900">
                    {formData.full_name || "Your Name"}
                  </h3>
                  <p className="mt-1 break-words text-sm text-slate-600">
                    {formData.profession || "Your profession or role"}
                  </p>

                  {location && (
                    <p className="mt-3 flex items-start gap-1.5 text-xs text-slate-500">
                      <MapPin size={14} className="mt-0.5 shrink-0" />
                      {location}
                    </p>
                  )}

                  <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">
                    {formData.bio || "Your bio will appear here."}
                  </p>

                  {formData.languages.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {formData.languages.map((language) => (
                        <span
                          key={language}
                          className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs text-slate-700"
                        >
                          {language}
                        </span>
                      ))}
                    </div>
                  )}

                  <SkillPreview title="Teaches" skills={teachSkills} />
                  <SkillPreview title="Learns" skills={learnSkills} />

                  <Link
                    href={publicProfileHref}
                    className="mt-5 flex items-center justify-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-2.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-100"
                  >
                    <Eye size={15} />
                    Open Public Profile
                  </Link>
                </div>
              </section>

              <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <h2 className="text-base font-bold text-slate-900">
                  Profile Tips
                </h2>
                <ul className="mt-4 space-y-3 text-sm text-slate-600">
                  {[
                    "Use a clear and friendly photo",
                    "Write a short and genuine bio",
                    "Add at least 3 skills you can teach",
                    "Add skills you want to learn",
                    "Keep your availability updated",
                    "Be specific about your interests",
                  ].map((tip) => (
                    <li key={tip} className="flex items-start gap-2">
                      <CheckCircle2
                        size={17}
                        className="mt-0.5 shrink-0 text-indigo-600"
                      />
                      {tip}
                    </li>
                  ))}
                </ul>
              </section>
            </aside>
          </div>

          <footer className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <Link
              href={publicProfileHref}
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </Link>

            <Button type="submit" variant="primary" isLoading={isLoading}>
              <Save size={16} className="mr-2" />
              Save Changes
            </Button>
          </footer>
        </form>
      </div>
    </main>
  );
}

function SectionTitle({
  title,
  icon,
}: {
  title: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
        {icon}
      </span>
      <h2 className="text-base font-bold text-slate-900">{title}</h2>
    </div>
  );
}

function SkillsSection({
  title,
  description,
  skills,
  value,
  setValue,
  type,
  loading,
  onAdd,
  onRemove,
}: {
  title: string;
  description: string;
  skills: UserSkill[];
  value: string;
  setValue: (value: string) => void;
  type: "TEACH" | "LEARN";
  loading: boolean;
  onAdd: (name: string, type: "TEACH" | "LEARN") => Promise<void>;
  onRemove: (skill: UserSkill, type: "TEACH" | "LEARN") => Promise<void>;
}) {
  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <SectionTitle
        title={title}
        icon={<Sparkles size={19} />}
      />
      <p className="mt-2 text-xs text-slate-500">{description}</p>

      <form
        className="mt-4 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          void onAdd(value, type);
        }}
      >
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Search or add a skill..."
          maxLength={80}
          className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        />
        <Button
          type="submit"
          variant="outline"
          disabled={loading || !value.trim()}
          isLoading={loading}
        >
          Add
        </Button>
      </form>

      <div className="mt-4 flex flex-wrap gap-2">
        {skills.map((skill) => (
          <span
            key={skill.id}
            className="inline-flex max-w-full items-center gap-1.5 rounded-lg bg-indigo-50 px-2.5 py-2 text-xs font-medium text-indigo-800"
          >
            <span className="break-words">{skill.skill_name}</span>
            <button
              type="button"
              aria-label={`Remove ${skill.skill_name}`}
              onClick={() => void onRemove(skill, type)}
              className="shrink-0 rounded p-0.5 hover:bg-indigo-100"
            >
              <X size={12} />
            </button>
          </span>
        ))}

        {skills.length === 0 && (
          <p className="text-xs text-slate-400">
            No skills added yet.
          </p>
        )}
      </div>
    </section>
  );
}

function SkillPreview({
  title,
  skills,
}: {
  title: string;
  skills: UserSkill[];
}) {
  if (skills.length === 0) return null;

  return (
    <div className="mt-4">
      <p className="mb-2 text-xs font-semibold text-slate-500">{title}</p>
      <div className="flex flex-wrap gap-2">
        {skills.map((skill) => (
          <span
            key={skill.id}
            className="rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs text-emerald-800"
          >
            {skill.skill_name}
          </span>
        ))}
      </div>
    </div>
  );
}
