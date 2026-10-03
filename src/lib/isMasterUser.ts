/**
 * „Master“-Zugriff: gleiche Logik wie Admin-Bereich (Partner).
 * Setze in Vercel / .env: NEXT_PUBLIC_ADMIN_EMAIL=deine@email.de
 */
const MASTER_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

export function isMasterUser(user: { email?: string | null } | null | undefined): boolean {
 const email = user?.email?.toLowerCase().trim();
 const master = MASTER_EMAIL?.toLowerCase().trim();
 return !!email && !!master && email === master;
}
