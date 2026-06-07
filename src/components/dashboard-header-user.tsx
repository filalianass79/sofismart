"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { ChevronDown, LogOut, UserCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

function initials(name: string, email?: string | null) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  if (parts.length === 1 && parts[0].length >= 2) return parts[0].slice(0, 2).toUpperCase();
  if (email) return email.slice(0, 2).toUpperCase();
  return "U";
}

export function DashboardHeaderUser({
  name,
  email,
  roleLabel,
}: {
  name?: string | null;
  email?: string | null;
  roleLabel?: string | null;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const displayName = name?.trim() || email || "Utilisateur";
  const onProfile = pathname.startsWith("/dashboard/profile");

  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={cn(
          "flex items-center gap-2.5 rounded-lg border px-2.5 py-1.5 text-left transition-colors sm:gap-3 sm:px-3 sm:py-2",
          onProfile
            ? "border-gold-500/40 bg-gold-500/10"
            : "border-navy-950/10 bg-white hover:border-gold-500/30 hover:bg-cream-50"
        )}
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-navy-950 to-navy-800 text-sm font-semibold text-gold-300">
          {initials(displayName, email)}
        </span>
        <span className="hidden min-w-0 sm:block">
          <span className="block truncate text-sm font-medium text-navy-900">{displayName}</span>
          {roleLabel && (
            <span className="block truncate text-xs capitalize text-navy-500">{roleLabel}</span>
          )}
        </span>
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 text-navy-400 transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+6px)] z-20 w-52 overflow-hidden rounded-xl border border-navy-950/10 bg-white py-1 shadow-lg"
        >
          <div className="border-b border-navy-950/5 px-3 py-2 sm:hidden">
            <p className="truncate text-sm font-medium text-navy-900">{displayName}</p>
            {roleLabel && <p className="truncate text-xs capitalize text-navy-500">{roleLabel}</p>}
          </div>
          <Link
            href="/dashboard/profile"
            role="menuitem"
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-2 px-3 py-2.5 text-sm text-navy-800 hover:bg-cream-50",
              onProfile && "bg-gold-500/10 font-medium text-navy-950"
            )}
          >
            <UserCircle className="h-4 w-4 text-navy-500" />
            Mon profil
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              signOut({ callbackUrl: "/login" });
            }}
            className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-morocco-700 hover:bg-morocco-500/10"
          >
            <LogOut className="h-4 w-4" />
            Déconnexion
          </button>
        </div>
      )}
    </div>
  );
}
