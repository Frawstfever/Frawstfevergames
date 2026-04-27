import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const PUBLIC_ADMIN_PATHS = ["/admin/login"];

async function verify(token: string | undefined, secret: string | undefined) {
  if (!token || !secret) return null;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    return payload as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const secret = process.env.AUTH_SECRET;

  // Admin area (pages + API)
  const isAdminPage = pathname.startsWith("/admin") && !PUBLIC_ADMIN_PATHS.includes(pathname);
  const isAdminApi = pathname.startsWith("/api/admin");

  if (isAdminPage || isAdminApi) {
    const adminToken = req.cookies.get("rr_admin")?.value;
    const payload = await verify(adminToken, secret);

    if (!payload) {
      if (isAdminApi) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const login = req.nextUrl.clone();
      login.pathname = "/admin/login";
      login.searchParams.set("from", pathname);
      return NextResponse.redirect(login);
    }
    return NextResponse.next();
  }

  // Redirect admins away from customer account pages
  if (pathname.startsWith("/account")) {
    const adminToken = req.cookies.get("rr_admin")?.value;
    const payload = await verify(adminToken, secret);
    if (payload) {
      const adminUrl = req.nextUrl.clone();
      adminUrl.pathname = "/admin";
      adminUrl.search = "";
      return NextResponse.redirect(adminUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/account/:path*"],
};
