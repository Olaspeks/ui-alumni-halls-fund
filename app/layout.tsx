import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import "./globals.css";

// Font stack: see tailwind.config.ts for the actual font-family values and
// the comment there on why this uses system font stacks instead of
// next/font/google — short version: this keeps `npm run build` from
// depending on being able to reach fonts.gstatic.com at build time, which
// isn't guaranteed on every network (this project's own dev sandbox
// included). Swapping in real webfonts later is a config-only change.

export const metadata: Metadata = {
  title: "UI Alumni Halls Fund",
  description: "Give toward renovating University of Ibadan's halls of residence.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col font-sans">
        <SiteHeader />
        <div className="flex-1">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}
