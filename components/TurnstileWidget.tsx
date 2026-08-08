"use client";

import { useEffect, useId, useRef } from "react";
import Script from "next/script";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        opts: { sitekey: string; callback: (token: string) => void; "expired-callback"?: () => void },
      ) => void;
    };
  }
}

/**
 * Invisible-by-default bot check on the donation form. In mock mode (no
 * NEXT_PUBLIC_TURNSTILE_SITE_KEY), it auto-passes immediately so the
 * form works with zero keys — matching the server-side verifyTurnstileToken
 * mock behavior in lib/turnstile.ts exactly.
 */
export default function TurnstileWidget({ onVerify }: { onVerify: (token: string) => void }) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const containerId = `turnstile-${useId().replace(/[:]/g, "")}`;
  const rendered = useRef(false);

  useEffect(() => {
    if (!siteKey) {
      onVerify("mock-turnstile-token");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteKey]);

  if (!siteKey) {
    return <p className="text-xs text-ink-300">Bot check: automatic (demo mode).</p>;
  }

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="afterInteractive"
        onReady={() => {
          if (rendered.current) return;
          const el = document.getElementById(containerId);
          if (el && window.turnstile) {
            window.turnstile.render(el, { sitekey: siteKey, callback: onVerify });
            rendered.current = true;
          }
        }}
      />
      <div id={containerId} />
    </>
  );
}
