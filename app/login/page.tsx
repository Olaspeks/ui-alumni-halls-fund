import type { Metadata } from "next";
import AuthForm from "@/components/AuthForm";

export const metadata: Metadata = { title: "Sign in — UI Alumni Halls Fund" };

export default function LoginPage({ searchParams }: { searchParams: { mode?: string } }) {
  const initialMode = searchParams.mode === "signup" ? "signup" : "signin";

  return (
    <main className="mx-auto max-w-md px-4 py-16 sm:py-24">
      <h1 className="font-serif text-3xl text-indigo-950">
        {initialMode === "signup" ? "Create your alumni account" : "Alumni sign in"}
      </h1>
      <p className="mt-2 text-sm text-ink-500">
        Optional — you can always{" "}
        <a href="/" className="underline decoration-gold-500 underline-offset-2">
          give as a guest
        </a>{" "}
        instead. {initialMode === "signup" ? "Creating an account just keeps" : "Signing in just gives you"} a
        giving history and receipt trail.
      </p>
      <div className="mt-8">
        <AuthForm initialMode={initialMode} />
      </div>
    </main>
  );
}
