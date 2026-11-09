"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRightLeft,
  Bell,
  Check,
  ChevronRight,
  CircleHelp,
  Globe2,
  Lock,
  LogOut,
  Mail,
  Moon,
  Palette,
  Pencil,
  Shield,
  ShieldCheck,
  Sun,
  Target,
  UserRound,
  UserRoundX,
  Users,
  MapPin,
  Eye,
  Phone,
  Database,
  Laptop,
  Flag,
} from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { profileService, safetyService } from "@/services";

type SettingsSection =
  | "Account"
  | "Privacy"
  | "Notifications"
  | "Appearance"
  | "Learning Preferences"
  | "Blocked Users"
  | "Help & Support";

type LocalNotificationPreference =
  | "Skill Swap Requests"
  | "Messages"
  | "Session Updates"
  | "Reviews"
  | "Platform Updates";

type ContactPrivacy =
  | "Hidden"
  | "Visible After Request Acceptance"
  | "Visible With Permission";

const notificationPreferenceKeys: LocalNotificationPreference[] = [
  "Skill Swap Requests",
  "Messages",
  "Session Updates",
  "Reviews",
  "Platform Updates",
];

const storageKey = "skillswap_notification_preferences";

const settingSections: {
  name: SettingsSection;
  description: string;
  icon: typeof UserRound;
}[] = [
  { name: "Account", description: "Update your profile and personal info", icon: UserRound },
  { name: "Privacy", description: "Control who can see your information", icon: Shield },
  { name: "Notifications", description: "Manage your notification preferences", icon: Bell },
  { name: "Appearance", description: "Choose your theme and display settings", icon: Palette },
  { name: "Learning Preferences", description: "Set your skill interests and goals", icon: Target },
  { name: "Blocked Users", description: "Manage blocked accounts", icon: UserRoundX },
  { name: "Help & Support", description: "Get help or contact us", icon: CircleHelp },
];

function readNotificationPreferences(): Record<LocalNotificationPreference, boolean> {
  const defaults = Object.fromEntries(
    notificationPreferenceKeys.map((key) => [key, true]),
  ) as Record<LocalNotificationPreference, boolean>;

  try {
    const stored = localStorage.getItem(storageKey);
    return stored ? { ...defaults, ...JSON.parse(stored) } : defaults;
  } catch {
    return defaults;
  }
}

export default function SettingsPage() {
  const { user, isAuthenticated, refreshUser, logout } = useAuth();
  const router = useRouter();

  const [section, setSection] = useState<SettingsSection>("Privacy");
  const [emailPrivacy, setEmailPrivacy] =
    useState<ContactPrivacy>("Visible After Request Acceptance");
  const [phonePrivacy, setPhonePrivacy] = useState<ContactPrivacy>("Hidden");
  const [privacyBusy, setPrivacyBusy] = useState(false);
  const [privacyMessage, setPrivacyMessage] = useState<string | null>(null);

  const [blockedUsers, setBlockedUsers] = useState<
    Array<{ id: string; blocked_id: string; blocked_username: string }>
  >([]);
  const [blockedError, setBlockedError] = useState<string | null>(null);
  const [unblockingId, setUnblockingId] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [learningMode, setLearningMode] = useState<"Online" | "In Person" | "Either">(
    user?.profile?.preferred_learning_mode || "Online",
  );
  const [learningBusy, setLearningBusy] = useState(false);
  const [learningSaved, setLearningSaved] = useState(false);

  const [notificationPreferences, setNotificationPreferences] = useState<
    Record<LocalNotificationPreference, boolean>
  >({
    "Skill Swap Requests": true,
    Messages: true,
    "Session Updates": true,
    Reviews: true,
    "Platform Updates": true,
  });

  const [theme, setTheme] = useState<"Light" | "Dark">("Light");
  const [language, setLanguage] = useState("English");

  useEffect(() => {
    if (!isAuthenticated) return;

    safetyService
      .getPrivacySettings()
      .then((settings) => {
        setEmailPrivacy(settings.email_privacy as ContactPrivacy);
        setPhonePrivacy(settings.phone_privacy as ContactPrivacy);
      })
      .catch(() => {
        setPrivacyMessage("Could not load saved privacy preferences.");
      });

    safetyService
      .listBlocked()
      .then(setBlockedUsers)
      .catch(() => setBlockedError("Unable to load blocked users right now."));

    setNotificationPreferences(readNotificationPreferences());

    const storedTheme = localStorage.getItem("skillswap_theme");
    if (storedTheme === "Dark" || storedTheme === "Light") setTheme(storedTheme);

    const storedLanguage = localStorage.getItem("skillswap_language");
    if (storedLanguage) setLanguage(storedLanguage);
  }, [isAuthenticated]);

  useEffect(() => {
    if (user?.profile?.preferred_learning_mode) {
      setLearningMode(user.profile.preferred_learning_mode);
    }
  }, [user?.profile?.preferred_learning_mode]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme.toLowerCase();
    localStorage.setItem("skillswap_theme", theme);
  }, [theme]);

  const savePrivacy = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPrivacyBusy(true);
    setPrivacyMessage(null);

    try {
      await safetyService.updatePrivacySettings({
        email_privacy: emailPrivacy,
        phone_privacy: phonePrivacy,
      });
      setPrivacyMessage("Email and phone privacy preferences saved.");
    } catch (error) {
      setPrivacyMessage(
        error instanceof Error ? error.message : "Unable to save privacy preferences.",
      );
    } finally {
      setPrivacyBusy(false);
    }
  };

  const changePassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordError(null);
    setPasswordMessage(null);

    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("The new passwords do not match.");
      return;
    }

    setPasswordBusy(true);
    try {
      await safetyService.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordMessage("Password updated successfully.");
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : "Unable to update password.");
    } finally {
      setPasswordBusy(false);
    }
  };

  const toggleNotification = (key: LocalNotificationPreference) => {
    setNotificationPreferences((current) => {
      const next = { ...current, [key]: !current[key] };
      localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  };

  const saveLearningPreference = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLearningBusy(true);
    setLearningSaved(false);
    try {
      await profileService.updateMyProfile({ preferred_learning_mode: learningMode });
      await refreshUser();
      setLearningSaved(true);
    } catch {
      setLearningSaved(false);
    } finally {
      setLearningBusy(false);
    }
  };

  const unblock = async (blockedId: string) => {
    setUnblockingId(blockedId);
    setBlockedError(null);
    try {
      await safetyService.unblockUser(blockedId);
      setBlockedUsers((current) => current.filter((item) => item.blocked_id !== blockedId));
    } catch (error) {
      setBlockedError(error instanceof Error ? error.message : "Unable to unblock this user.");
    } finally {
      setUnblockingId(null);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  if (!isAuthenticated) {
    return (
      <div className="settings-empty">
        <ShieldCheck />
        <h1>Sign in to manage settings</h1>
        <Link href="/login">
          <Button variant="primary">Sign in</Button>
        </Link>
      </div>
    );
  }

  const profile = user?.profile;

  const renderPrivacySection = () => (
    <section className="privacy-security-dashboard">
      <header className="privacy-security-heading">
        <div>
          <h1>Privacy &amp; Security</h1>
          <p>Control your information, keep your account safe, and learn with peace of mind.</p>
        </div>
        <span className="privacy-handwritten">Your Privacy<br />Our Priority ♥</span>
      </header>

      <div className="privacy-security-grid">
        <div className="privacy-security-main">
          <section className="privacy-security-card">
            <PanelHeading
              title="Profile Visibility"
              subtitle="Choose what information others can see on your profile."
              icon={Eye}
            />
            <form onSubmit={savePrivacy}>
              <PrivacySelectRow
                icon={<Eye />}
                title="Profile Visibility"
                description="Let others find and view your profile"
                value="Public"
                options={["Public", "Private"]}
                disabled
              />
              <PrivacySelectRow
                icon={<Mail />}
                title="Email Address"
                description="Show your email on your profile"
                value={emailPrivacy}
                options={[
                  "Hidden",
                  "Visible After Request Acceptance",
                  "Visible With Permission",
                ]}
                onChange={(value) => setEmailPrivacy(value as ContactPrivacy)}
              />
              <PrivacySelectRow
                icon={<Phone />}
                title="Phone Number"
                description="Show your phone number on your profile"
                value={phonePrivacy}
                options={[
                  "Hidden",
                  "Visible After Request Acceptance",
                  "Visible With Permission",
                ]}
                onChange={(value) => setPhonePrivacy(value as ContactPrivacy)}
              />
              <PrivacySelectRow
                icon={<MapPin />}
                title="Location"
                description="Show your city or location"
                value="Public"
                options={["Public", "Private"]}
                disabled
              />
              <PrivacySelectRow
                icon={<Users />}
                title="Online Status"
                description="Show when you're online"
                value="Visible After Request Acceptance"
                options={[
                  "Hidden",
                  "Visible After Request Acceptance",
                  "Visible With Permission",
                ]}
                disabled
              />
              <div className="privacy-save-row">
                <Button type="submit" variant="primary" size="sm" isLoading={privacyBusy}>
                  Save Privacy Settings
                </Button>
                {privacyMessage && <p className="settings-feedback" role="status">{privacyMessage}</p>}
              </div>
            </form>
          </section>

          <section className="privacy-security-card">
            <PanelHeading
              title="Account Security"
              subtitle="Keep your account secure with these settings."
              icon={Lock}
            />
            <PrivacyActionRow
              icon={<Lock />}
              title="Password"
              description="Manage your account password"
              action="Change Password"
              onClick={() => setSection("Account")}
            />
            <PrivacyToggleRow
              icon={<ShieldCheck />}
              title="Two-Factor Authentication (2FA)"
              description="Add an extra layer of security"
              checked={false}
              disabled
            />
            <PrivacyActionRow
              icon={<Laptop />}
              title="Active Sessions"
              description="Manage your logged-in devices"
              action="View Sessions"
              onClick={() => router.push("/sessions")}
            />
            <PrivacyToggleRow
              icon={<Bell />}
              title="Login Alerts"
              description="Get notified about new logins"
              checked
              disabled
            />
            <p className="privacy-unavailable-note">
              2FA, login alerts, and active-session management require backend or identity-provider integration.
            </p>
          </section>
        </div>

        <div className="privacy-security-middle">
          <section className="privacy-security-card">
            <PanelHeading
              title="Data &amp; Activity"
              subtitle="Manage your data and activity privacy."
              icon={Database}
            />
            <PrivacyToggleRow
              title="Allow others to see your learning activity"
              description="e.g. skills you are learning, milestones"
              checked
              disabled
            />
            <PrivacyToggleRow
              title="Allow others to see your reviews"
              description="Show reviews you've received"
              checked
              disabled
            />
            <PrivacyToggleRow
              title="Allow profile indexing"
              description="Let your profile appear in search results"
              checked
              disabled
            />
            <PrivacyToggleRow
              title="Share anonymized data"
              description="Help us improve SkillSwap (no personal info)"
              checked={false}
              disabled
            />
            <p className="privacy-unavailable-note">
              These switches are disabled until account-level persistence is implemented.
            </p>
          </section>

          <section className="privacy-security-card">
            <PanelHeading
              title="Blocked Users"
              subtitle="Manage users you've blocked."
              icon={UserRoundX}
            />
            {blockedError && <p className="settings-error" role="alert">{blockedError}</p>}
            {blockedUsers.length ? (
              blockedUsers.slice(0, 3).map((blocked) => (
                <div className="privacy-blocked-user" key={blocked.id}>
                  <span className="privacy-blocked-avatar"><UserRound /></span>
                  <div className="privacy-blocked-info">
                    <strong>{blocked.blocked_username}</strong>
                    <small>Blocked account</small>
                  </div>
                  <button
                    type="button"
                    className="privacy-outline-button"
                    disabled={unblockingId === blocked.blocked_id}
                    onClick={() => void unblock(blocked.blocked_id)}
                  >
                    {unblockingId === blocked.blocked_id ? "Working…" : "Unblock"}
                  </button>
                </div>
              ))
            ) : (
              !blockedError && <p className="settings-muted">You haven't blocked any users.</p>
            )}
            <button
              type="button"
              className="privacy-view-all"
              onClick={() => setSection("Blocked Users")}
            >
              View All Blocked Users <ChevronRight size={16} />
            </button>
          </section>
        </div>

        <aside className="privacy-security-aside">
          <section className="privacy-safety-card">
            <span className="privacy-shield-large"><ShieldCheck size={34} /></span>
            <h2>Your Safety Matters</h2>
            <p>We are committed to providing a safe, respectful and trustworthy learning community.</p>
          </section>

          <section className="privacy-security-card privacy-tips-card">
            <PanelHeading title="Quick Tips" subtitle="" icon={ShieldCheck} />
            <ul>
              <li>Use a strong and unique password</li>
              <li>Be cautious when sharing personal info</li>
              <li>Report any suspicious behavior</li>
              <li>Keep your profile visibility to trusted users</li>
              <li>Review your privacy settings regularly</li>
            </ul>
            <p className="privacy-handwritten">Learn. Connect. Stay Safe. ♥</p>
          </section>

          <section className="privacy-security-card privacy-help-card">
            <PanelHeading
              title="Need Help?"
              subtitle="If you face any issues or feel unsafe, we're here to help."
              icon={CircleHelp}
            />
            <Link className="privacy-help-button" href="/faqs#support">
              <Mail size={17} /> Support Information
            </Link>
            <button
              type="button"
              className="privacy-report-button"
              onClick={() => setSection("Help & Support")}
            >
              <Flag size={16} /> Report a User
            </button>
            <p className="privacy-unavailable-note">
              Find current support and account-recovery information in the FAQs.
            </p>
          </section>
        </aside>
      </div>
    </section>
  );

  const renderSection = () => {
    if (section === "Privacy") return renderPrivacySection();

    if (section === "Notifications") {
      return (
        <section className="settings-center-panel">
          <PanelHeading
            title="Notification Preferences"
            subtitle="Choose which activity appears in your in-app notifications."
            icon={Bell}
          />
          <p className="settings-local-note">
            These preferences are saved in this browser. Notification delivery settings are not synced to your account yet.
          </p>
          {notificationPreferenceKeys.map((key) => (
            <PreferenceToggle
              key={key}
              title={key}
              description={notificationDescription(key)}
              checked={notificationPreferences[key]}
              onChange={() => toggleNotification(key)}
            />
          ))}
        </section>
      );
    }

    if (section === "Appearance") {
      return (
        <section className="settings-center-panel">
          <PanelHeading title="Appearance" subtitle="Choose the appearance used in this browser." icon={Palette} />
          <ThemePicker theme={theme} onChange={setTheme} />
          <p className="settings-local-note">Theme preference is stored on this device.</p>
        </section>
      );
    }

    if (section === "Learning Preferences") {
      return (
        <section className="settings-center-panel">
          <PanelHeading title="Learning Preferences" subtitle="Set the format you prefer for skill exchanges." icon={Target} />
          <form className="settings-form" onSubmit={saveLearningPreference}>
            <label>
              Preferred session format
              <select value={learningMode} onChange={(event) => setLearningMode(event.target.value as "Online" | "In Person" | "Either")}>
                <option>Online</option>
                <option>In Person</option>
                <option>Either</option>
              </select>
            </label>
            <Button type="submit" variant="primary" size="sm" isLoading={learningBusy}>Save Preferences</Button>
            {learningSaved && <p className="settings-feedback">Learning preference saved.</p>}
          </form>
          <Link className="settings-inline-link" href={`/profile/${user?.username}`}>
            Manage skills and learning goals <ChevronRight />
          </Link>
        </section>
      );
    }

    if (section === "Blocked Users") {
      return (
        <section className="settings-center-panel">
          <PanelHeading title="Blocked Users" subtitle="Manage accounts you've blocked." icon={UserRoundX} />
          {blockedError && <p className="settings-error" role="alert">{blockedError}</p>}
          {blockedUsers.length ? blockedUsers.map((blocked) => (
            <div className="settings-blocked-row" key={blocked.id}>
              <span>@{blocked.blocked_username}</span>
              <button
                type="button"
                disabled={unblockingId === blocked.blocked_id}
                onClick={() => void unblock(blocked.blocked_id)}
              >
                {unblockingId === blocked.blocked_id ? "Working…" : "Unblock"}
              </button>
            </div>
          )) : !blockedError && <p className="settings-muted">You haven't blocked any users.</p>}
        </section>
      );
    }

    if (section === "Help & Support") {
      return (
        <section className="settings-center-panel">
          <PanelHeading title="Help & Support" subtitle="Find help with your account or skill exchanges." icon={CircleHelp} />
          <Link className="settings-inline-link" href="/faqs">Frequently asked questions <ChevronRight /></Link>
          <Link className="settings-inline-link" href="/faqs#support">Support information <ChevronRight /></Link>
        </section>
      );
    }

    return (
      <>
        <section className="settings-center-panel">
          <header className="settings-panel-header">
            <PanelHeading title="Account Settings" subtitle="Update your personal information and profile details." icon={UserRound} />
            <Link href="/profile/edit" className="settings-edit-link"><Pencil /> Edit Profile</Link>
          </header>
          <div className="settings-profile-top">
            <Avatar src={profile?.avatar_url} name={profile?.full_name || user?.username} size="xl" />
            <div>
              <h2>{profile?.full_name || user?.username}</h2>
              <p>{profile?.profession || "SkillSwap member"}</p>
              <span><Globe2 /> {[profile?.city, profile?.country].filter(Boolean).join(", ") || "Location not added"}</span>
            </div>
          </div>
          <div className="settings-account-rows">
            <InfoRow icon={Mail} label="Email" value={user?.email || "Not provided"} />
            <InfoRow icon={Shield} label="Phone" value={profile?.phone_number || "Not provided"} />
            <InfoRow
              icon={Users}
              label="Skills"
              value={[...(profile?.skills_teach || []).map((skill) => skill.skill_name), ...(profile?.skills_learn || []).map((skill) => skill.skill_name)].slice(0, 4).join(", ") || "Add skills to your profile"}
            />
            <InfoRow icon={Pencil} label="Bio" value={profile?.bio || "Add a short introduction"} />
          </div>
        </section>

        <section className="settings-center-panel">
          <PanelHeading title="Change Password" subtitle="Keep your account secure with a strong password." icon={Lock} />
          <p className="settings-local-note">
            Password updates are handled securely within SkillSwap using your custom FastAPI authentication flow.
          </p>
          {passwordError && <p className="settings-error" role="alert">{passwordError}</p>}
          {passwordMessage && <p className="settings-feedback" role="status">{passwordMessage}</p>}
          <form className="settings-form password-form" onSubmit={changePassword}>
            <Input label="Current password" type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required />
            <Input label="New password" type="password" autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required />
            <Input label="Confirm new password" type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required />
            <Button type="submit" variant="primary" size="sm" isLoading={passwordBusy}>Update Password</Button>
          </form>
        </section>
      </>
    );
  };

  return (
    <main className="settings-dashboard-page">
      <div className="settings-dashboard-layout">
        <header className="settings-dashboard-title">
          <h1>Settings</h1>
          <p>Manage your account, preferences and privacy.</p>
        </header>

        <nav className="settings-section-nav" aria-label="Settings sections">
          {settingSections.map(({ name, description, icon: Icon }) => (
            <button
              type="button"
              key={name}
              className={section === name ? "active" : ""}
              onClick={() => setSection(name)}
            >
              <Icon />
              <span><strong>{name}</strong><small>{description}</small></span>
              <ChevronRight />
            </button>
          ))}
        </nav>

        <div className="settings-dashboard-center">{renderSection()}</div>

        <aside className="settings-dashboard-aside">
          <section className="settings-side-panel">
            <PanelHeading title="Notification Preferences" subtitle="Choose what you want to be notified about." icon={Bell} />
            {notificationPreferenceKeys.map((key) => (
              <PreferenceToggle
                key={key}
                title={key}
                description={notificationDescription(key)}
                checked={notificationPreferences[key]}
                onChange={() => toggleNotification(key)}
                compact
              />
            ))}
          </section>
          <section className="settings-side-panel">
            <PanelHeading title="Theme" subtitle="Choose your preferred theme." icon={Palette} />
            <ThemePicker theme={theme} onChange={setTheme} compact />
          </section>
          <section className="settings-side-panel">
            <PanelHeading title="Language" subtitle="Select your preferred language." icon={Globe2} />
            <select
              className="settings-language-select"
              value={language}
              onChange={(event) => {
                const nextLanguage = event.target.value;
                setLanguage(nextLanguage);
                localStorage.setItem("skillswap_language", nextLanguage);
                document.documentElement.lang =
                  nextLanguage === "English" ? "en" : nextLanguage === "Español" ? "es" : "hi";
              }}
            >
              <option>English</option>
              <option>Español</option>
              <option>हिन्दी</option>
            </select>
            <p className="settings-local-note">Language preference is saved locally; translations are not available yet.</p>
          </section>
          <Button variant="outline" size="sm" className="settings-logout-button" onClick={handleLogout}>
            <LogOut /> Log Out
          </Button>
        </aside>
      </div>
    </main>
  );
}

function PanelHeading({
  title,
  subtitle,
  icon: Icon,
}: {
  title: string;
  subtitle: string;
  icon: typeof UserRound;
}) {
  return (
    <div className="settings-panel-heading">
      <span><Icon /></span>
      <div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>
    </div>
  );
}

function PrivacySelectRow({
  icon,
  title,
  description,
  value,
  options,
  onChange,
  disabled = false,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  value: string;
  options: string[];
  onChange?: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="privacy-setting-row">
      <span className="privacy-row-icon">{icon}</span>
      <div className="privacy-setting-copy"><strong>{title}</strong><small>{description}</small></div>
      <select
        aria-label={title}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange?.(event.target.value)}
      >
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </div>
  );
}

function PrivacyToggleRow({
  icon,
  title,
  description,
  checked,
  disabled = false,
}: {
  icon?: React.ReactNode;
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="privacy-toggle-row">
      {icon && <span className="privacy-row-icon">{icon}</span>}
      <div className="privacy-setting-copy"><strong>{title}</strong><small>{description}</small></div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={title}
        className={`privacy-switch ${checked ? "on" : ""}`}
        disabled={disabled}
        title={disabled ? "Backend integration required" : undefined}
      >
        <span />
      </button>
    </div>
  );
}

function PrivacyActionRow({
  icon,
  title,
  description,
  action,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action: string;
  onClick: () => void;
}) {
  return (
    <div className="privacy-action-row">
      <span className="privacy-row-icon">{icon}</span>
      <div className="privacy-setting-copy"><strong>{title}</strong><small>{description}</small></div>
      <button type="button" className="privacy-outline-button" onClick={onClick}>{action}</button>
    </div>
  );
}

function PreferenceToggle({
  title,
  description,
  checked,
  onChange,
  compact = false,
}: {
  title: LocalNotificationPreference;
  description: string;
  checked: boolean;
  onChange: () => void;
  compact?: boolean;
}) {
  return (
    <div className={`settings-preference-row ${compact ? "compact" : ""}`}>
      <span className="settings-preference-icon">{preferenceIcon(title)}</span>
      <div><strong>{title}</strong><small>{description}</small></div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={`${title} notifications`}
        className={`settings-switch ${checked ? "on" : ""}`}
        onClick={onChange}
      >
        <i />
      </button>
    </div>
  );
}

function ThemePicker({
  theme,
  onChange,
  compact = false,
}: {
  theme: "Light" | "Dark";
  onChange: (theme: "Light" | "Dark") => void;
  compact?: boolean;
}) {
  return (
    <div className={`settings-theme-picker ${compact ? "compact" : ""}`}>
      {(["Light", "Dark"] as const).map((option) => (
        <button type="button" key={option} className={theme === option ? "selected" : ""} onClick={() => onChange(option)}>
          <span>{option === "Light" ? <Sun /> : <Moon />}</span>
          <strong>{option}</strong>
          <i>{theme === option && <Check />}</i>
        </button>
      ))}
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof UserRound;
  label: string;
  value: string;
}) {
  return (
    <div className="settings-info-row">
      <Icon />
      <span><strong>{label}</strong><small>{value}</small></span>
      <ChevronRight />
    </div>
  );
}

function preferenceIcon(title: LocalNotificationPreference) {
  if (title === "Skill Swap Requests") return <ArrowRightLeft />;
  if (title === "Messages") return <Bell />;
  if (title === "Session Updates") return <Globe2 />;
  if (title === "Reviews") return <ShieldCheck />;
  return <Target />;
}

function notificationDescription(title: LocalNotificationPreference) {
  if (title === "Skill Swap Requests") return "When someone sends you a request";
  if (title === "Messages") return "New chat messages";
  if (title === "Session Updates") return "Reminders and changes";
  if (title === "Reviews") return "When you receive a review";
  return "New features and announcements";
}
