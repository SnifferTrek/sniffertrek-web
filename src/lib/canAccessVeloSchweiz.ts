/** Beta-Zugang Velo Schweiz – nur diese Adresse. */
export const VELO_SCHWEIZ_BETA_EMAIL = "j.zwyssig@strisa.com";

export function canAccessVeloSchweiz(
  user: { email?: string | null } | null | undefined
): boolean {
  const email = user?.email?.toLowerCase().trim();
  return email === VELO_SCHWEIZ_BETA_EMAIL.toLowerCase();
}
