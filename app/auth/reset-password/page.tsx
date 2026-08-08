"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase!.auth.updateUser({ password });
    if (error) {
      setStatus("error");
      setMessage(error.message);
    } else {
      setStatus("done");
      setMessage("Password updated. Redirecting…");
      setTimeout(() => (window.location.href = "/account"), 1200);
    }
  }

  return (
    <main className="mx-auto max-w-md px-4 py-16 sm:py-24">
      <h1 className="font-serif text-3xl text-indigo-950">Set a new password</h1>
      <form onSubmit={handleSubmit} className="mt-8 space-y-4 border border-indigo-100 bg-white p-6">
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-500">
            New password
          </span>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-indigo-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-gold-500"
          />
        </label>
        {message && (
          <p className={`text-sm ${status === "error" ? "text-red-700" : "text-ink-700"}`}>{message}</p>
        )}
        <button
          type="submit"
          disabled={status === "loading"}
          className="w-full bg-indigo-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-800 disabled:opacity-60"
        >
          {status === "loading" ? "Saving…" : "Save password"}
        </button>
      </form>
    </main>
  );
}
