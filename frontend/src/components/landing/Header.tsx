"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";

export function Header() {
  const { user, initialLoading } = useAuth();
  const authed = !initialLoading && Boolean(user);
  const initial = user?.name ? user.name.trim().charAt(0).toUpperCase() : "U";

  return (
    <header className="sticky top-0 z-50 border-b border-navy/10 bg-cream/85 backdrop-blur-md">
      <div className="tricolor-bar h-1 w-full" />
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3.5 sm:px-6">
        <a href="#top" className="flex items-center gap-2.5">
          <Image
            src="/logo.png"
            alt="Yojana Setu Logo"
            width={44}
            height={36}
            className="h-9 w-auto rounded-lg object-contain"
            priority
          />
          <span>
            <span className="block font-display text-lg leading-none font-semibold text-ink">
              Yojana Setu
            </span>
            <span className="text-[11px] tracking-wide text-muted">
              योजना सेतु
            </span>
          </span>
        </a>

        <nav className="hidden items-center gap-7 text-sm font-medium text-ink/80 md:flex">
          <a href="#features" className="hover:text-saffron-deep">
            Features
          </a>
          <a href="#calculator" className="hover:text-saffron-deep">
            Calculator
          </a>
          <a href="#how-it-works" className="hover:text-saffron-deep">
            How it works
          </a>
        </nav>

        {authed ? (
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-full bg-navy px-4 py-2 text-sm font-semibold text-cream shadow-sm transition hover:bg-ink"
          >
            <span className="grid h-6 w-6 place-items-center rounded-full bg-green/20 text-xs font-semibold text-cream">
              {initial}
            </span>
            My account
          </Link>
        ) : (
          <Link
            href="/login"
            className="rounded-full bg-navy px-4 py-2 text-sm font-semibold text-cream shadow-sm transition hover:bg-ink"
          >
            Find my scheme
          </Link>
        )}
      </div>
      <nav className="flex gap-5 overflow-x-auto border-t border-navy/5 px-5 py-2.5 text-xs font-medium text-ink/75 md:hidden">
        <a href="#features">Features</a>
        <a href="#calculator">Calculator</a>
        <a href="#how-it-works">How it works</a>
      </nav>
    </header>
  );
}
