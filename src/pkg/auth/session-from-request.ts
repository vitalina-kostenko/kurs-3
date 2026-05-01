import { type NextRequest } from "next/server";
import { verifyToken, type AuthPayload } from "./jwt";

export async function getSessionPayloadFromRequest(
  req: NextRequest
): Promise<AuthPayload | null> {
  const token = req.cookies.get("auth-token")?.value;
  if (!token) return null;
  return verifyToken(token);
}
