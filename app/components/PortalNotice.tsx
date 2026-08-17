const messages: Record<string, string> = {
  setup_complete: "Administrator account created. The private portal is ready.",
  signed_out: "You have been signed out.",
  password_changed: "Password changed. Sign in again on your trusted device.",
  member_created: "Family member created. Share the temporary password privately.",
  profile_created: "Profile created with every sensitive feature off by default.",
  member_assigned: "The family member can now open this profile.",
  permission_updated: "Profile permission updated.",
  invalid_credentials: "The email or password was not recognized.",
  rate_limited: "Too many attempts. Please wait 15 minutes and try again.",
  invalid_input: "Please check the information and try again.",
  invalid_setup_code: "That setup code was not recognized. Paste the complete single-use code and try again.",
  invalid_password: "Use a password between 12 and 128 characters.",
  setup_unavailable: "Administrator setup has already been completed.",
  admin_required: "Administrator access is required.",
  not_found: "That account or profile was not found.",
  portal_not_configured: "The private portal is still being connected.",
  request_failed: "The request could not be completed safely. Please try again.",
};

export default function PortalNotice({ error, notice }: { error?: string; notice?: string }) {
  const key = error || notice;
  if (!key) return null;
  return <div className={`portal-notice${error ? " portal-notice--error" : ""}`} role="status">{messages[key] || "The portal has been updated."}</div>;
}
