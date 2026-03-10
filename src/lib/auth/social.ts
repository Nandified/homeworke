export type SocialProvider = "google" | "apple" | "facebook";

/**
 * Phase 2 placeholder: social login will be added later.
 *
 * Magic link remains the primary auth mechanism for now.
 *
 * Intended future shape:
 * - /api/auth/oauth/:provider/start
 * - /api/auth/oauth/:provider/callback
 * - link provider identity to User
 */
export const SOCIAL_PROVIDERS: Array<{ id: SocialProvider; label: string; enabled: boolean }> = [
  { id: "google", label: "Continue with Google", enabled: false },
  { id: "apple", label: "Continue with Apple", enabled: false },
  { id: "facebook", label: "Continue with Facebook", enabled: false },
];
