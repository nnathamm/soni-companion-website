import { destroySession } from "@/lib/auth";
import { portalError } from "@/lib/route-helpers";
import { assertSameOrigin } from "@/lib/security";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    await destroySession();
    return NextResponse.redirect(new URL("/portal/login?notice=signed_out", request.url), 303);
  } catch (error) {
    return portalError(request.url, "/portal", error);
  }
}
