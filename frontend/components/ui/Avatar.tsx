import React from "react";
import { cn, getInitials } from "@/lib/utils";

export interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  isOnline?: boolean;
  className?: string;
}

export function Avatar({ src, name, size = "md", isOnline, className }: AvatarProps) {
  const sizes = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
    xl: "w-16 h-16 text-lg",
  };

  const dotSizes = {
    sm: "w-2 h-2 ring-1",
    md: "w-2.5 h-2.5 ring-2",
    lg: "w-3 h-3 ring-2",
    xl: "w-3.5 h-3.5 ring-2",
  };

  return (
    <div className="relative inline-block shrink-0">
      <div
        className={cn(
          "rounded-full flex items-center justify-center font-semibold bg-gradient-to-tr from-indigo-500 to-purple-600 text-white overflow-hidden shadow-sm",
          sizes[size],
          className
        )}
      >
        {src ? (
          <img src={src} alt={name || "Avatar"} className="w-full h-full object-cover" />
        ) : (
          <span>{getInitials(name)}</span>
        )}
      </div>
      {typeof isOnline === "boolean" && (
        <span
          className={cn(
            "absolute bottom-0 right-0 rounded-full ring-white",
            isOnline ? "bg-emerald-500" : "bg-slate-300",
            dotSizes[size]
          )}
          title={isOnline ? "Online" : "Offline"}
        />
      )}
    </div>
  );
}
