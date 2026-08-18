import { authenticateDevice } from "@/lib/device-auth";
import { db } from "@/lib/db";
import { deviceError } from "@/lib/device-response";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const device = await authenticateDevice(request);
    await db()`
      UPDATE household_devices SET status = 'revoked', revoked_at = now(), updated_at = now()
      WHERE id = ${device.id}
    `;
    return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return deviceError(error);
  }
}
