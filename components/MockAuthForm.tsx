"use client";

import { useState } from "react";

type Mode = "signin" | "signup";
type Stage = "form" | "loading" | "done";

const inputClass =
  "w-full border border-indigo-200 bg-white px-3 py-2.5 text-sm text-ink-900 outline-none focus:border-gold-500";

/**
 * Stand-in for AuthForm's real Supabase flow, shown only when Supabase
 * isn't configured yet. Collects the same shape of information a real
 * sign-up would (name, email, password) and ends in a believable
 * "you're registered" screen — but creates nothing and persists nothing.
 * It exists so the sign-up experience can be reviewed and approved
 * end-to-end before Supabase is wired in; swapping this out for the real
 * thing later is a config change (lib/config.ts#isSupabaseConfigured),
 * not a redesign — see AuthForm.tsx.
 */
export default function MockAuthForm({ initialMode = "signin" }: { initialMode?: Mode }) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [stage, setStage] = useState<Stage>("form");
  const [via, setVia] = useState<"email" | "google">("email");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  function switchMode(next: Mode) {
    setMode(next);
    setStage("form");
    setError(null);
  }

  function handleGoogle() {
    setError(null);
    setVia("google");
    setStage("loading");
    window.setTimeout(() => setStage("done"), 900);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (mode === "signup" && !fullName.trim()) return setError("Enter your name.");
    if (!email.trim()) return setError("Enter your email.");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (mode === "signup" && password !== confirmPassword) return setError("Passwords don't match.");

    setVia("email");
    setStage("loading");
    window.setTimeout(() => setStage("done"), 900);
  }

  if (stage === "done") {
    const firstName = fullName.trim().split(" ")[0];
    return (
      <div className="space-y-4 py-2 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gold-100 text-2xl">
          🎉
        </div>
        <h3 className="font-serif text-xl text-indigo-950">
          {mode === "signup" ? "You're registered!" : "Welcome back!"}
        </h3>
        <p className="text-sm text-ink-500">
          {mode === "signup"
            ? `You're all set${firstName ? `, ${firstName}` : ""} — signed up ${via === "google" ? "with Google" : "with email"} (demo).`
            : `Signed in ${via === "google" ? "with Google" : "with email"} (demo).`}{" "}
          Real accounts go live once Supabase is connected — nothing was actually created just now.
        </p>
        <button
          onClick={() => (window.location.href = "/")}
          className="w-full bg-indigo-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-800"
        >
          Continue to homepage
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <p className="text-xs text-ink-300">
        Demo mode — Supabase isn&apos;t connected yet, so this walks through the sign-up experience
        without creating a real account.
      </p>

      <div className="flex gap-4 text-xs font-medium uppercase tracking-wide text-ink-500">
        <button type="button" onClick={() => switchMode("signin")} className={mode === "signin" ? "text-indigo-900 underline" : ""}>
          Sign in
        </button>
        <button type="button" onClick={() => switchMode("signup")} className={mode === "signup" ? "text-indigo-900 underline" : ""}>
          Create account
        </button>
      </div>

      <button
        type="button"
        onClick={handleGoogle}
        disabled={stage === "loading"}
        className="flex w-full items-center justify-center gap-2 border border-indigo-200 bg-white px-4 py-2.5 text-sm font-medium text-ink-700 transition-colors hover:bg-indigo-50 disabled:opacity-60"
      >
        <GoogleIcon />
        {stage === "loading" && via === "google" ? "Connecting…" : "Continue with Google"}
      </button>

      <div className="flex items-center gap-3 text-xs text-ink-300">
        <span className="h-px flex-1 bg-indigo-100" />
        or with email
        <span className="h-px flex-1 bg-indigo-100" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "signup" && (
          <Field label="Full name">
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={inputClass}
              placeholder="e.g. Adaeze Okafor"
            />
          </Field>
        )}

        <Field label="Email">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            placeholder="you@example.com"
          />
        </Field>

        <Field label="Password">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
            placeholder="At least 8 characters"
          />
        </Field>

        {mode === "signup" && (
          <Field label="Confirm password">
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={inputClass}
              placeholder="Retype your password"
            />
          </Field>
        )}

        {error && <p className="text-sm text-red-700">{error}</p>}

        <button
          type="submit"
          disabled={stage === "loading"}
          className="w-full bg-indigo-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-800 disabled:opacity-60"
        >
          {stage === "loading" && via === "email" ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}
        </button>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-500">{label}</span>
      {children}
    </label>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l5.7-5.7C34.5 6.1 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.8 1.1 8 3l5.7-5.7C34.5 6.1 29.5 4 24 4c-7.5 0-13.9 4.2-17.2 10.4z" />
      <path fill="#4CAF50" d="M24 44c5.4 0 10.3-2.1 14-5.5l-6.5-5.4C29.4 34.9 26.8 36 24 36c-5.3 0-9.7-3.1-11.3-7.5l-6.5 5C9.9 39.6 16.4 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.2 5.6l6.5 5.4C39.9 37.4 44 31.4 44 24c0-1.3-.1-2.7-.4-3.5z" />
    </svg>
  );
}
