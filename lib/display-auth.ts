import type { NextRequest } from "next/server";
import { db } from "./db";
import { bearerToken, validateDeviceToken } from "./device-auth";

export type DisplayIdentity = {
  id: string;
  profileId: string;
  displayId: string;
  displayName: string;
};

export async function authenticateDisplay(request: NextRequest): Promise<DisplayIdentity> {
  let token: ReturnType<typeof validateDeviceToken>;
  try {
    token = validateDeviceToken(bearerToken(request));
  } catch {
    throw new Error("display_unauthorized");
  }
  const rows = await db()<{
    id: string; profile_id: string; display_id: string; display_name: string;
  }[]>`
    SELECT id, profile_id, display_id, display_name FROM remote_displays
    WHERE display_id=${token.deviceId} AND token_hash=${token.hash} AND status='active' LIMIT 1
  `;
  const display = rows[0];
  if (!display) throw new Error("display_unauthorized");
  return { id: display.id, profileId: display.profile_id, displayId: display.display_id, displayName: display.display_name };
}
