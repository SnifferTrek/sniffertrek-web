import { NextResponse } from "next/server";
import { canAccessVeloSchweiz } from "@/lib/canAccessVeloSchweiz";

export function veloAccessDenied(): NextResponse {
  return NextResponse.json({ error: "Kein Zugang" }, { status: 403 });
}

export function assertVeloApiAccess(email: unknown): NextResponse | null {
  if (!canAccessVeloSchweiz({ email: typeof email === "string" ? email : "" })) {
    return veloAccessDenied();
  }
  return null;
}
