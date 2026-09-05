"use client";

import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import Script from "next/script";
import { useRef, useState } from "react";
import { toast } from "sonner";

declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;

          renderButton: (
            parent: HTMLElement,
            options: {
              theme?: string;
              size?: string;
              width?: number;
            }
          ) => void;
        };
      };
    };
  }
}

export default function signup() {
  const { setUser, loading, setLoading } = useAuth();

  const googleButtonRef = useRef<HTMLDivElement>(null);


  const handleGoogleResponse = async (response: { credential: string }) => {
    setLoading(true);

    try {
      const res = await axios.post(
        "http://localhost:5000/api/auth/google",
        {
          credential: response.credential,
        }
      );

      const { token, user } = res.data;

      localStorage.setItem("token", token);

      setUser(user);

      toast.success("Welcome! You're signed in successfully.");

      console.log("Google signup successful:", user);

      // Redirect later
      // window.location.href = "/dashboard";
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(
          error.response?.data?.message ||
          "Google authentication failed. Please try again."
        );
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };
  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);

    const name = formData.get("name");
    const email = formData.get("email");
    const password = formData.get("password");
    const confirmPassword = formData.get("confirmPassword");

    // Check passwords
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/signup",
        {
          name,
          email,
          password,
        }
      );

      const { token, user } = response.data;

      // Store token
      localStorage.setItem("token", token);

      // Store user in AuthContext
      setUser(user);

      toast.success("Account created successfully!");

      console.log("Signup successful:", user);

      // You can redirect after signup
      // window.location.href = "/dashboard";
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;

        if (status === 409) {
          toast.error("An account with this email already exists");
        } else if (status === 400) {
          toast.error(
            error.response?.data?.message || "Please check your details"
          );
        } else {
          toast.error("Something went wrong. Please try again.");
        }
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-5 py-8 text-foreground sm:px-8">
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => {
          if (!googleButtonRef.current) return;

          window.google.accounts.id.initialize({
            client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
            callback: handleGoogleResponse,
          });

          window.google.accounts.id.renderButton(
            googleButtonRef.current,
            {
              theme: "outline",
              size: "large",
              width: 400,
            }
          );
        }}
      />
      <div className="pointer-events-none absolute -left-24 top-12 h-64 w-64 rounded-full bg-saffron/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-8 h-72 w-72 rounded-full bg-green/10 blur-3xl" />

      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-foreground/10 bg-card shadow-[0_24px_80px_rgba(18,32,51,0.12)] lg:grid-cols-[0.9fr_1.1fr]">
        <aside className="relative hidden overflow-hidden bg-navy p-10 text-cream lg:flex lg:flex-col lg:justify-between">
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full border-[22px] border-saffron/30" />
          <div className="absolute -bottom-24 -left-16 h-56 w-56 rounded-full border-[28px] border-green/25" />

          <div className="relative">
            <a href="/" className="inline-flex items-center gap-3 font-[var(--font-fraunces)] text-2xl font-semibold">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-saffron text-lg text-white shadow-lg shadow-saffron/20">YS</span>
              Yojana Setu
            </a>
            <div className="mt-20 max-w-sm">
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-saffron">Start with clarity</p>
              <h2 className="font-[var(--font-fraunces)] text-5xl leading-[1.05]">Your goals deserve the right support.</h2>
              <p className="mt-6 text-sm leading-7 text-cream/65">Create your account and discover government schemes shaped around your needs and ambitions.</p>
            </div>
          </div>

          <div className="relative flex items-center gap-3 text-xs text-cream/55">
            <span className="grid h-8 w-8 place-items-center rounded-full border border-cream/20 text-green">✓</span>
            One account, more possibilities
          </div>
        </aside>

        <section className="p-6 sm:p-10 lg:p-14">
          <div className="mb-9 flex items-center justify-between lg:hidden">
            <a href="/" className="inline-flex items-center gap-2 font-[var(--font-fraunces)] text-2xl font-semibold">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-saffron text-sm text-white">YS</span>
              Yojana Setu
            </a>
            <span className="rounded-full bg-green/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-green">Get started</span>
          </div>

          <div className="mx-auto max-w-md">
            <div className="mb-8">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-green">Join Yojana Setu</p>
              <h1 className="font-[var(--font-fraunces)] text-4xl font-semibold tracking-tight sm:text-5xl">Create your account.</h1>
              <p className="mt-3 text-sm leading-6 text-muted">Get started and find schemes tailored to your needs.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="mb-2 block text-sm font-semibold">Full name</label>
                <div className="relative">
                  <input id="name" name="name" type="text" placeholder="Enter your full name" required className="w-full rounded-xl border border-foreground/15 bg-background py-3.5 px-4 text-sm outline-none transition placeholder:text-muted/60 focus:border-saffron focus:ring-4 focus:ring-saffron/10" />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-semibold">Email address</label>
                <div className="relative">
                  <input id="email" name="email" type="email" placeholder="you@example.com" required className="w-full rounded-xl border border-foreground/15 bg-background py-3.5 px-4 text-sm outline-none transition placeholder:text-muted/60 focus:border-saffron focus:ring-4 focus:ring-saffron/10" />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="password" className="mb-2 block text-sm font-semibold">Password</label>
                  <input id="password" name="password" type="password" placeholder="Create password" required className="w-full rounded-xl border border-foreground/15 bg-background px-4 py-3.5 text-sm outline-none transition placeholder:text-muted/60 focus:border-green focus:ring-4 focus:ring-green/10" />
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="mb-2 block text-sm font-semibold">Confirm password</label>
                  <input id="confirmPassword" name="confirmPassword" type="password" placeholder="Repeat password" required className="w-full rounded-xl border border-foreground/15 bg-background px-4 py-3.5 text-sm outline-none transition placeholder:text-muted/60 focus:border-green focus:ring-4 focus:ring-green/10" />
                </div>
              </div>

              <div className="flex items-start gap-3 pt-2">
                <input id="terms" name="terms" type="checkbox" required className="mt-1 h-4 w-4 rounded border-foreground/20 accent-green" />
                <label htmlFor="terms" className="text-xs leading-5 text-muted">I agree to the <a href="#" className="font-semibold text-foreground underline decoration-saffron underline-offset-4">Terms of Service</a> and <a href="#" className="font-semibold text-foreground underline decoration-saffron underline-offset-4">Privacy Policy</a>.</label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-saffron px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-saffron/20 transition hover:-translate-y-0.5 hover:bg-saffron-deep active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? "Signing up..." : "Create account"}

                {!loading && (
                  <span aria-hidden="true" className="text-lg leading-none">
                    →
                  </span>
                )}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 py-2">
                <div className="h-px flex-1 bg-foreground/10" />
                <span className="text-xs font-medium text-muted">OR</span>
                <div className="h-px flex-1 bg-foreground/10" />
              </div>

              {/* Google Signup */}
              <div
                ref={googleButtonRef}
                className="flex w-full justify-center"
              />
            </form>

            <div className="mt-8 flex items-center gap-3 rounded-xl border border-green/15 bg-green/5 px-4 py-3 text-xs text-muted">
              <span aria-hidden="true" className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-green text-sm font-bold text-white">✓</span>
              Your information stays private and secure.
            </div>

            <div className="mt-8 border-t border-foreground/10 pt-6 text-center">
              <p className="text-sm text-muted">Already have an account? <a href="/login" className="font-bold text-foreground underline decoration-saffron decoration-2 underline-offset-4">Login</a></p>
            </div>
            <div className="mt-6 text-center">
              <a href="/" className="text-sm font-medium text-muted transition hover:text-foreground">← Back to home</a>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}