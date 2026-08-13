"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Hall } from "@/types/database";
import { percentRaised, convertSubunits, type Currency } from "@/lib/money";
import type { FxRate } from "@/lib/fx";
import BarometerTube from "./BarometerTube";
import DonationDialog from "./DonationDialog";

/**
 * The instrument-panel-style barometer row — all 15 halls side by side
 * as liquid-fill tubes, reading as one connected instrument rather than
 * a grid of separate cards.
 *
 * Layout: each tube is allowed to shrink (down to a legible floor) and
 * grow (up to a sensible ceiling) to fill available width, so on most
 * desktop/tablet widths all 15 are visible at once with no scrolling —
 * see BarometerTube's flex-basis/min/max. Only once the row can't fit
 * everyone at a readable size does it fall back to horizontal scroll,
 * with edge-fades and small chevron buttons that appear only then (see
 * the scroll-state tracking below) — never on a width where everything
 * already fits.
 *
 * One shared currency toggle drives every tube at once (see
 * GivingPageClient), rather than each hall toggling independently —
 * otherwise tubes wouldn't be comparable to each other.
 */
export default function BarometerArray({
  halls,
  currency,
  fxRate,
}: {
  halls: Hall[];
  currency: Currency;
  fxRate: FxRate;
}) {
  const [selectedHall, setSelectedHall] = useState<Hall | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scroll, setScroll] = useState({ overflowing: false, canLeft: false, canRight: false });

  const computed = useMemo(() => {
    const rows = halls.map((hall) => {
      const { raised, goal } =
        currency === "NGN"
          ? {
              raised: hall.raised_kobo + convertSubunits(hall.raised_cents, "USD", "NGN", fxRate.usdToNgn),
              goal: hall.goal_kobo + convertSubunits(hall.goal_cents, "USD", "NGN", fxRate.usdToNgn),
            }
          : {
              raised: hall.raised_cents + convertSubunits(hall.raised_kobo, "NGN", "USD", fxRate.usdToNgn),
              goal: hall.goal_cents + convertSubunits(hall.goal_kobo, "NGN", "USD", fxRate.usdToNgn),
            };
      return { hall, raised, goal, percent: percentRaised(raised, goal) };
    });

    return { rows };
  }, [halls, currency, fxRate]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    function update() {
      if (!el) return;
      const overflowing = el.scrollWidth > el.clientWidth + 2;
      setScroll({
        overflowing,
        canLeft: overflowing && el.scrollLeft > 4,
        canRight: overflowing && el.scrollLeft < el.scrollWidth - el.clientWidth - 4,
      });
    }

    update();
    el.addEventListener("scroll", update, { passive: true });
    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(el);
    window.addEventListener("resize", update);

    return () => {
      el.removeEventListener("scroll", update);
      resizeObserver.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [computed.rows.length]);

  function scrollByPage(direction: 1 | -1) {
    scrollRef.current?.scrollBy({ left: direction * 260, behavior: "smooth" });
  }

  return (
    <div className="relative">
      {scroll.canLeft && (
        <>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-indigo-50 to-transparent"
          />
          <button
            type="button"
            onClick={() => scrollByPage(-1)}
            aria-label="Scroll to see earlier halls"
            className="absolute left-2 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-indigo-200 bg-white text-indigo-900 shadow-raised transition-colors hover:bg-gold-50"
          >
            ‹
          </button>
        </>
      )}

      {scroll.canRight && (
        <>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-indigo-50 to-transparent"
          />
          <button
            type="button"
            onClick={() => scrollByPage(1)}
            aria-label="Scroll to see more halls"
            className="absolute right-2 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-indigo-200 bg-white text-indigo-900 shadow-raised transition-colors hover:bg-gold-50"
          >
            ›
          </button>
        </>
      )}

      <div ref={scrollRef} className="barometer-row flex gap-1.5 overflow-x-auto px-4 pb-4 pt-2 sm:px-6">
        {computed.rows.map(({ hall, raised, percent }, i) => {
          const badges = percent >= 100 ? ["Goal reached"] : [];
          return (
            <BarometerTube
              key={hall.id}
              hallId={hall.id}
              hallName={hall.name}
              percent={percent}
              raised={raised}
              currency={currency}
              badges={badges}
              animIndex={i}
              onClick={() => setSelectedHall(hall)}
            />
          );
        })}
      </div>

      {selectedHall && <DonationDialog hall={selectedHall} onClose={() => setSelectedHall(null)} />}
    </div>
  );
}
