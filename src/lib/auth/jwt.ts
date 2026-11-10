// Session token: HS256 JWT { uid, sv } (spec 10). No database access, usable in proxy.ts.
import { SignJWT, jwtVerify } from "jose";
import { SESSION_TTL_DAYS } from "@/config/site";

export type SessionPayload = { uid: string; sv: number };

const ISSUER = "navbat";

function key(secret: string): Uint8Array {
  if (!secret || secret.length < 32) {
    throw new Error(
      "SESSION_SECRET topilmadi yoki 32 belgidan qisqa — .env.local faylini tekshiring",
    );
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(
  payload: SessionPayload,
  secret: string,
  now: Date = new Date(),
): Promise<string> {
  const issuedAt = Math.floor(now.getTime() / 1000);
  return new SignJWT({ uid: payload.uid, sv: payload.sv })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(ISSUER)
    .setIssuedAt(issuedAt)
    .setExpirationTime(issuedAt + SESSION_TTL_DAYS * 24 * 60 * 60)
    .sign(key(secret));
}

/** Returns the payload, or null for a missing, forged or expired token. */
export async function verifySession(
  token: string | undefined,
  secret: string,
  now: Date = new Date(),
): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(secret), {
      algorithms: ["HS256"],
      issuer: ISSUER,
      currentDate: now,
    });
    if (typeof payload.uid !== "string" || typeof payload.sv !== "number") return null;
    return { uid: payload.uid, sv: payload.sv };
  } catch {
    return null;
  }
}
