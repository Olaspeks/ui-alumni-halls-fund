"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured, siteUrl } from "@/lib/config";
import MockAuthForm from "./MockAuthForm";

type Tab = "magic" | "password";
type PasswordMode = "signin" | "signup" | "forgot";

/**
 * Combined alumni sign-in/sign-up screen. Magic link is first and more
 * prominent (the recommended default per the brief); email+password is
 * offered as the alternative, in its own tab, with confirm/resend/forgot
 * all covered. Guests never see this screen — it's opt-in only.
 *
 * `initialMode` lets a caller (the homepage's Sign up / Sign in buttons)
 * land the visitor on the right starting tab instead of always the
 * default. When Supabase isn't configured yet, this renders
 * MockAuthForm instead — same fields, same shape of flow, no backend.
 */
export default function AuthForm({ initialMode }: { initialMode?: "signin" | "signup" }) {
  const [tab, setTab] = useState<Tab>(initialMode === "signup" ? "password" : "magic");

  if (!isSupabaseConfigured) {
    return (
      <div className="border border-indigo-100 bg-white p-6">
        <MockAuthForm initialMode={initialMode ?? "signin"} />
      </div>
    );
  }

  return (
    <div className="border border-indigo-100 bg-white">
      <div className="flex border-b border-indigo-100">
        <TabButton active={tab === "magic"} onClick={() => setTab("magic")}>
          Magic link
        </TabButton>
        <TabButton active={tab === "password"} onClick={() => setTab("password")}>
          Email &amp; password
        </TabButton>
      </div>
      <div className="p-6">
        {tab === "magic" ? <MagicLinkForm /> : <PasswordForm initialMode={initialMode === "signup" ? "signup" : "signin"} />}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
        active ? "bg-indigo-900 text-white" : "text-ink-500 hover:bg-indigo-50"
      }`}
    >
      {children}
    </button>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-500">{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full border border-indigo-200 bg-white px-3 py-2.5 text-sm text-ink-900 outline-none focus:border-gold-500";

function MagicLinkForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage(null);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase!.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${siteUrl}/auth/callback` },
    });
    if (error) {
      setStatus("error");
      setMessage(error.message);
    } else {
      setStatus("sent");
    }
  }

  if (status === "sent") {
    return (
      <p className="text-sm text-ink-700">
        Check <strong>{email}</strong> for a sign-in link. It also confirms your email in
        one step — no password needed.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-ink-500">
        The simplest way in: we&apos;ll email you a one-time link. No password to set,
        remember, or leak.
      </p>
      <Field label="Email">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
          placeholder="you@example.com"
        />
      </Field>
      {message && <p className="text-sm text-red-700">{message}</p>}
      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full bg-indigo-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-800 disabled:opacity-60"
      >
        {status === "loading" ? "Sending…" : "Send magic link"}
      </button>
    </form>
  );
}

function PasswordForm({ initialMode = "signin" }: { initialMode?: PasswordMode }) {
  const [mode, setMode] = useState<PasswordMode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage(null);
    setNeedsConfirmation(false);
    const supabase = createSupabaseBrowserClient()!;

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${siteUrl}/auth/callback`,
          data: { full_name: fullName || undefined },
        },
      });
      if (error) {
        setStatus("error");
        setMessage(error.message);
      } else {
        setStatus("done");
        setMessage(
          "Almost there — confirm your email to finish creating your account. Check your inbox for a confirmation link.",
        );
      }
      return;
    }

    if (mode === "forgot") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${siteUrl}/auth/callback?next=/auth/reset-password`,
      });
      if (error) {
        setStatus("error");
        setMessage(error.message);
      } else {
        setStatus("done");
        setMessage("Check your email for a link to reset your password.");
      }
      return;
    }

    // mode === "signin"
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setStatus("error");
      if (/confirm/i.test(error.message)) setNeedsConfirmation(true);
      setMessage(error.message);
    } else {
      setStatus("done");
      window.location.href = "/account";
    }
  }

  async function resendConfirmation() {
    const supabase = createSupabaseBrowserClient()!;
    setStatus("loading");
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: `${siteUrl}/auth/callback` },
    });
    setStatus(error ? "error" : "done");
    setMessage(error ? error.message : "Confirmation email resent — check your inbox.");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-4 text-xs font-medium uppercase tracking-wide text-ink-500">
        <button type="button" onClick={() => setMode("signin")} className={mode === "signin" ? "text-indigo-900 underline" : ""}>
          Sign in
        </button>
        <button type="button" onClick={() => setMode("signup")} className={mode === "signup" ? "text-indigo-900 underline" : ""}>
          Create account
        </button>
        <button type="button" onClick={() => setMode("forgot")} className={mode === "forgot" ? "text-indigo-900 underline" : ""}>
          Forgot password
        </button>
      </div>

      {mode === "signup" && (
        <Field label="Full name (optional)">
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} />
        </Field>
      )}

      <Field label="Email">
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
      </Field>

      {mode !== "forgot" && (
        <Field label="Password">
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
        </Field>
      )}

      {message && (
        <p className={`text-sm ${status === "error" ? "text-red-700" : "text-ink-700"}`}>{message}</p>
      )}

      {needsConfirmation && (
        <button type="button" onClick={resendConfirmation} className="text-sm font-medium text-indigo-900 underline">
          Resend confirmation email
        </button>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full bg-indigo-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-800 disabled:opacity-60"
      >
        {status === "loading"
          ? "Please wait…"
          : mode === "signin"
            ? "Sign in"
            : mode === "signup"
              ? "Create account"
              : "Send reset link"}
      </button>
    </form>
  );
}
