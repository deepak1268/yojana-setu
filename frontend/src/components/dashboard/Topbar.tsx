"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getUserName, signOut } from "@/lib/auth";

export function Topbar({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  const router = useRouter();
  const [initial, setInitial] = useState("A");
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const name = getUserName();
    if (name) setInitial(name.charAt(0).toUpperCase());
  }, []);

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
    signOut();
    router.push("/");
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
          className="flex items-center gap-2.5 rounded-full border border-navy/10 bg-card px-3 py-2 text-sm font-medium text-ink"
        >
          <span className="grid h-7 w-7 place-items-center rounded-full bg-green/15 text-xs font-semibold text-green">
            {initial}
          </span>
          My account
        </button>

        {open && (
          <div className="absolute right-0 z-10 mt-2 w-44 overflow-hidden rounded-xl border border-navy/10 bg-card shadow-lg">
            <Link
              href="/"
              className="block px-4 py-2.5 text-sm text-ink hover:bg-navy/5"
              onClick={() => setOpen(false)}
            >
              Home
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="block w-full px-4 py-2.5 text-left text-sm font-medium text-saffron-deep hover:bg-saffron/10"
            >
              Log out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
