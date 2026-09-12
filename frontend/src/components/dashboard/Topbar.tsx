"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";

export function Topbar({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const initial = user?.name ? user.name.trim().charAt(0).toUpperCase() : "U";

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleLogout() {
    setOpen(false);
    logout();
  }

  return (
    <div className="flex flex-col gap-4 border-b border-navy/10 bg-cream/85 px-5 py-5 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between sm:px-8">
      <div>
        <h1 className="font-display text-2xl text-ink sm:text-3xl">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-muted">{subtitle}</p> : null}
      </div>

      <div ref={menuRef} className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2.5 rounded-full border border-navy/10 bg-card px-3 py-2 text-sm font-medium text-ink shadow-xs transition hover:border-navy/20"
        >
          <span className="grid h-7 w-7 place-items-center rounded-full bg-green/15 text-xs font-semibold text-green uppercase">
            {initial}
          </span>
          <span>My account</span>
        </button>

        {open && (
          <div className="absolute right-0 z-10 mt-2 w-52 overflow-hidden rounded-2xl border border-navy/10 bg-card p-1.5 shadow-xl">
            {user && (
              <div className="border-b border-navy/10 px-3 py-2 mb-1">
                <p className="text-xs font-semibold text-ink truncate">{user.name}</p>
                <p className="text-[11px] text-muted truncate">{user.email}</p>
              </div>
            )}
            <Link
              href="/"
              className="block rounded-lg px-3 py-2 text-sm text-ink hover:bg-navy/5 transition"
              onClick={() => setOpen(false)}
            >
              Home
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-saffron-deep hover:bg-saffron/10 transition"
            >
              Log out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
