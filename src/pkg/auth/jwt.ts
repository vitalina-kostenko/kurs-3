import { SignJWT, jwtVerify, type JWTPayload } from "jose";

export interface AuthPayload extends JWTPayload {
  id: string;
  name: string;
  email: string;
  role: string;
}

const secret = () =>
  new TextEncoder().encode(process.env.JWT_SECRET ?? "local-dev-secret");

export async function signToken(payload: Omit<AuthPayload, keyof JWTPayload>) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(secret());
}

export async function verifyToken(token: string): Promise<AuthPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload as AuthPayload;
  } catch {
    return null;
  }
}
