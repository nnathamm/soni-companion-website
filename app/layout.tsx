import type { Metadata } from "next";
import type { ReactNode } from "react";
import SiteFooter from "./components/SiteFooter";
import SiteHeader from "./components/SiteHeader";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Soni | A companion robot for older adults",
    template: "%s | Soni",
  },
  description:
    "Meet Soni, a warm tabletop AI companion robot prototype for older adults, senior communities, and research partners.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <SiteHeader />
        <main id="main-content">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
