import { currentUser, type PortalUser } from "./auth";
import { db } from "./db";
import { isUuid } from "./security";

export type ProfileAccess = {
  user: PortalUser;
  profileId: string;
  relationship: string;
};

export async function requireProfileAccess(profileId: string): Promise<ProfileAccess> {
  if (!isUuid(profileId)) throw new Error("invalid_input");
  const user = await currentUser();
  if (!user) throw new Error("authentication_required");
  if (user.role === "admin") {
    const rows = await db()<{ id: string }[]>`
      SELECT id FROM senior_profiles WHERE id = ${profileId} AND status <> 'archived' LIMIT 1
    `;
    if (!rows[0]) throw new Error("not_found");
    return { user, profileId, relationship: "administrator" };
  }
  const rows = await db()<{ relationship: string }[]>`
    SELECT m.relationship
    FROM profile_memberships m
    JOIN senior_profiles p ON p.id = m.profile_id
    WHERE m.profile_id = ${profileId} AND m.user_id = ${user.id} AND p.status <> 'archived'
    LIMIT 1
  `;
  if (!rows[0]) throw new Error("not_found");
  return { user, profileId, relationship: rows[0].relationship };
}

export function canManageProfile(access: ProfileAccess) {
  return access.user.role === "admin" || ["senior", "caregiver", "coordinator", "family"].includes(access.relationship);
}
