import { currentUser } from "@/lib/auth";
import { AUTH_STATE_COOKIE_NAME } from "@/lib/auth-state";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const authenticated = Boolean(await currentUser());
  const response = NextResponse.json(
    { authenticated },
    { headers: { "Cache-Control": "private, no-store" } },
  );
  response.cookies.set(AUTH_STATE_COOKIE_NAME, authenticated ? "1" : "0", {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}
