import { jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = "rr_user";

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET is not set");
  return new TextEncoder().encode(s);
}

export interface CustomerSession {
  userId: string;
  email: string;
  name: string;
  role: string;
}

export async function getCustomerSession(): Promise<CustomerSession | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload as unknown as CustomerSession;
  } catch {
    return null;
  }
}
