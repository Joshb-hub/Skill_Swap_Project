"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { skillService } from "@/services";
import { AlertCircle } from "lucide-react";

interface SkillFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: "TEACH" | "LEARN";
  onSuccess: () => void;
}

export function SkillFormModal({
  isOpen,
  onClose,
  defaultType = "TEACH",
  onSuccess,
}: SkillFormModalProps) {
  const [skillType, setSkillType] = useState<"TEACH" | "LEARN">(defaultType);
  const [skillName, setSkillName] = useState("");
  const [categoryName, setCategoryName] = useState("Programming & Tech");
  const [experienceLevel, setExperienceLevel] = useState("Intermediate");
  const [currentLevel, setCurrentLevel] = useState("Beginner");
  const [targetLevel, setTargetLevel] = useState("Intermediate");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categories = [
    "Programming & Tech",
    "Design & Creative",
    "Languages",
    "Music & Audio",
    "Business & Finance",
    "Technical Trades",
    "Culinary Arts",
    "Arts & Crafts",
    "Academics & Science",
    "Health & Fitness",
    "General"
  ];

  const levels = ["Beginner", "Intermediate", "Advanced", "Professional"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!skillName.trim()) {
      setError("Please enter a valid skill name.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await skillService.addUserSkill({
        skill_name: skillName.trim(),
        category_name: categoryName,
        skill_type: skillType,
        experience_level: skillType === "TEACH" ? experienceLevel : undefined,
        current_level: skillType === "LEARN" ? currentLevel : undefined,
        target_level: skillType === "LEARN" ? targetLevel : undefined,
        description: description.trim() || undefined,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to add skill");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={skillType === "TEACH" ? "Add Skill You Can Teach" : "Add Skill You Want to Learn"}
      description="Expand your exchange profile to match with compatible peers."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center space-x-2 text-rose-700 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Skill Type Switcher */}
        <div className="flex rounded-lg bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setSkillType("TEACH")}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
              skillType === "TEACH" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            I Can Teach
          </button>
          <button
            type="button"
            onClick={() => setSkillType("LEARN")}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
              skillType === "LEARN" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            I Want to Learn
          </button>
        </div>

        {/* Skill Name */}
        <Input
          label="Skill Name"
          placeholder="e.g. Python, UI/UX Design, Carpentry, French"
          value={skillName}
          onChange={(e) => setSkillName(e.target.value)}
          required
        />

        {/* Category */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-700">Category</label>
          <select
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Experience Level for TEACH */}
        {skillType === "TEACH" ? (
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">Your Experience Level</label>
            <select
              value={experienceLevel}
              onChange={(e) => setExperienceLevel(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {levels.map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">Current Level</label>
              <select
                value={currentLevel}
                onChange={(e) => setCurrentLevel(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {levels.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">Target Level</label>
              <select
                value={targetLevel}
                onChange={(e) => setTargetLevel(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {levels.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Description */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-700">Brief Note / Experience</label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={
              skillType === "TEACH"
                ? "Describe your background, projects, or what you enjoy teaching..."
                : "What specific topics or outcomes do you want to achieve?"
            }
            className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex justify-end space-x-3">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            Save Skill
          </Button>
        </div>
      </form>
    </Modal>
  );
}
