import type { PortalUser } from "@/lib/auth";
import Link from "next/link";

export default function PortalBar({ user }: { user: PortalUser }) {
  return (
    <div className="portal-bar">
      <div>
        <span className="portal-bar__label">Signed in as</span>
        <strong>{user.displayName}</strong>
        <span className="portal-role">{user.role === "admin" ? "Administrator" : "Care Circle"}</span>
      </div>
      <nav aria-label="Portal navigation">
        <Link href="/portal">Profiles</Link>
        {user.role === "admin" && <Link href="/portal/admin">Administration</Link>}
        <Link href="/portal/password">Password</Link>
        <form action="/api/auth/logout" method="post"><button className="portal-text-button" type="submit">Sign out</button></form>
      </nav>
    </div>
  );
}
