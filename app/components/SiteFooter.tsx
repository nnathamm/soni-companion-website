"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import SoniMark from "./SoniMark";
import PortalEntryLink from "./PortalEntryLink";

const links = [
  ["Our mission", "/#mission"],
  ["Soni’s progression", "/#progression"],
  ["Anonymous testimonials", "/#testimonials"],
  ["How it works", "/how-soni-works"],
  ["Research study", "/research"],
  ["Connected platform", "/features"],
  ["Login", "/portal/login"],
  ["For senior communities", "/communities"],
  ["Safety & privacy", "/privacy"],
  ["About the project", "/about"],
  ["Contact", "/contact"],
];

export default function SiteFooter() {
  const pathname = usePathname();
  if (pathname === "/display") return null;
  return (
    <footer className="site-footer">
      <div className="site-footer__top shell">
        <div className="site-footer__brand">
          <Link className="brand brand--footer" href="/">
            <SoniMark compact />
            <span className="brand__word">SONI</span>
          </Link>
          <p>
            A school capstone project becoming a warm tabletop AI companion for older adults who need more opportunities for meaningful conversation.
          </p>
          <a className="site-footer__email" href="mailto:soni.companion@gmail.com">
            soni.companion@gmail.com
          </a>
        </div>
        <div className="site-footer__links" aria-label="Footer navigation">
          {links.map(([label, href]) => (
            href === "/portal/login"
              ? <PortalEntryLink key={href} />
              : <Link href={href} key={href}>{label}</Link>
          ))}
        </div>
      </div>
      <div className="site-footer__bottom shell">
        <p>Prototype project. Soni is not a medical device or a replacement for human care.</p>
        <p>© {new Date().getFullYear()} Soni</p>
      </div>
    </footer>
  );
}
