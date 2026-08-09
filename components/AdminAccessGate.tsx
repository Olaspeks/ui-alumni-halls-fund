"use client";

import { useEffect, useState } from "react";
import { STATIC_HALLS } from "@/lib/halls";
import { formatMoney } from "@/lib/money";
import { useCountUp } from "@/hooks/useCountUp";

type Stage = "form" | "authenticating" | "welcome";

const totalRaisedNgn = STATIC_HALLS.reduce((sum, h) => sum + h.raised_kobo, 0);

/**
 * The "Welcome, Dean" entrance — a stand-in for real Supabase Auth +
 * role check until staff/finance accounts exist. Collects only a
 * display name (there's nothing real to authenticate against yet),
 * then hands off to /admin. Once Supabase is connected, this page
 * should redirect straight to the normal /login instead — see
 * app/admin/login/page.tsx, which already branches that way.
 */
export default function AdminAccessGate() {
  const [name, setName] = useState("");
  const [stage, setStage] = useState<Stage>("form");
  const raisedCountUp = useCountUp(stage === "welcome" ? totalRaisedNgn / 100 : 0, 1600);

  useEffect(() => {
    if (stage !== "welcome") return;
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return; // let the visitor click through instead of forcing a wait
    const t = window.setTimeout(() => (window.location.href = "/admin"), 3400);
    return () => window.clearTimeout(t);
  }, [stage]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim()) window.sessionStorage.setItem("mockAdminName", name.trim());
    setStage("authenticating");
    window.setTimeout(() => setStage("welcome"), 1100);
  }

  return (
    <main className="gate-root relative flex min-h-[calc(100vh-1px)] items-center justify-center overflow-hidden bg-indigo-950 px-4 py-16">
      <GridBackdrop />

      {stage === "form" && (
        <div className="relative z-10 w-full max-w-sm border border-gold-500/30 bg-indigo-950/80 p-8 shadow-[0_0_40px_rgba(199,154,43,0.08)]">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-gold-400">Staff &amp; finance access</p>
          <h1 className="mt-2 font-serif text-2xl text-white">Command Center</h1>
          <p className="mt-2 text-sm text-indigo-300">
            Demo mode — Supabase isn&apos;t connected yet, so this previews the dashboard without a
            real login.
          </p>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-indigo-300">
                Name
              </span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Dean Adeyemi"
                className="w-full border border-indigo-700 bg-indigo-900/60 px-3 py-2.5 text-sm text-white outline-none placeholder:text-indigo-500 focus:border-gold-500"
              />
            </label>
            <button
              type="submit"
              className="w-full bg-gold-500 px-4 py-3 text-sm font-semibold text-indigo-950 transition-colors hover:bg-gold-400"
            >
              Enter Command Center
            </button>
          </form>
        </div>
      )}

      {stage === "authenticating" && (
        <div className="relative z-10 w-full max-w-sm text-center">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-gold-400">Verifying credentials</p>
          <div className="mt-4 h-px w-full overflow-hidden bg-indigo-800">
            <div className="gate-scan h-full w-full bg-gold-500" />
          </div>
        </div>
      )}

      {stage === "welcome" && (
        <div className="relative z-10 text-center">
          <p className="gate-fadein gate-delay-0 font-mono text-xs uppercase tracking-[0.3em] text-gold-400">
            UI Alumni Halls Fund
          </p>
          <h1 className="gate-fadein gate-delay-1 mt-3 font-serif text-5xl text-white [text-shadow:0_0_30px_rgba(199,154,43,0.35)] sm:text-6xl">
            Welcome, {name.trim().split(" ")[0] || "Dean"}
          </h1>
          <div className="gate-fadein gate-delay-2 mt-8 flex flex-wrap justify-center gap-8 font-mono text-sm text-indigo-300">
            <Stat label="Raised so far" value={formatMoney(raisedCountUp * 100, "NGN")} />
            <Stat label="Halls" value={String(STATIC_HALLS.length)} />
            <Stat label="Fully funded" value="2" />
          </div>
          <button
            onClick={() => (window.location.href = "/admin")}
            className="gate-fadein gate-delay-3 mt-10 border border-gold-500/50 px-6 py-2.5 text-sm font-medium text-gold-300 transition-colors hover:bg-gold-500/10"
          >
            Enter Command Center →
          </button>
        </div>
      )}

      <style>{`
        .gate-scan { transform-origin: left; animation: gate-scan-kf 1.1s ease-in-out forwards; }
        .gate-fadein { opacity: 0; animation: gate-fadein-kf 0.7s ease-out forwards; }
        .gate-delay-0 { animation-delay: 0ms; }
        .gate-delay-1 { animation-delay: 120ms; }
        .gate-delay-2 { animation-delay: 320ms; }
        .gate-delay-3 { animation-delay: 520ms; }
        @keyframes gate-scan-kf { from { transform: scaleX(0); } to { transform: scaleX(1); } }
        @keyframes gate-fadein-kf { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @media (prefers-reduced-motion: reduce) {
          .gate-scan, .gate-fadein { animation: none; opacity: 1; transform: none; }
        }
      `}</style>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="text-lg text-gold-300">{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-indigo-400">{label}</p>
    </div>
  );
}

function GridBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 opacity-[0.07]"
      style={{
        backgroundImage:
          "linear-gradient(#C79A2B 1px, transparent 1px), linear-gradient(90deg, #C79A2B 1px, transparent 1px)",
        backgroundSize: "40px 40px",
      }}
    />
  );
}
