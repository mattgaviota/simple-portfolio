import "server-only";
import { getAuth } from "firebase-admin/auth";
import { getAdminApp } from "@/lib/server/firebase-admin";

/** True if the request carries a Firebase ID token of the verified admin account. */
export async function isAdminRequest(request: Request) {
  const adminEmail = (process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "").trim().toLowerCase();
  const token = request.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!adminEmail || !token) return false;
  try {
    const decoded = await getAuth(getAdminApp()).verifyIdToken(token);
    return decoded.email_verified === true && decoded.email?.toLowerCase() === adminEmail;
  } catch {
    return false;
  }
}
