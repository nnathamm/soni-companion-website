"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import SoniMark from "./SoniMark";

const navigation = [
  { href: "/#mission", label: "Mission" },
  { href: "/#progression", label: "Build journey" },
  { href: "/research", label: "Research" },
  { href: "/features", label: "Platform" },
  { href: "/privacy", label: "Privacy" },
  { href: "/about", label: "About" },
];

export default function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="site-header site-header--v4">
      <div className="site-header__inner">
        <Link className="brand" href="/" aria-label="Soni home">
          <SoniMark compact />
          <span className="brand__word">SONI</span>
        </Link>

        <button
          type="button"
          className="menu-button"
          aria-expanded={open}
          aria-controls="site-navigation"
          onClick={() => setOpen((value) => !value)}
        >
          <span className="sr-only">Toggle navigation</span>
          <span />
          <span />
        </button>

        <nav
          id="site-navigation"
          className={`site-nav${open ? " site-nav--open" : ""}`}
          aria-label="Primary navigation"
        >
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={pathname === item.href ? "site-nav__link is-active" : "site-nav__link"}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <Link className="button button--small button--dark" href="/portal" onClick={() => setOpen(false)}>
            Family portal
          </Link>
        </nav>
      </div>
    </header>
  );
}
