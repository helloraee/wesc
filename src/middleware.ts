import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const PUBLIC_HOST = "westendsportsclub.com";
const OPS_HOST = "ops.westendsportsclub.com";

export default async function middleware(req: NextRequest) {
  const host = (req.headers.get("host") || "").toLowerCase();
  const { pathname, search } = req.nextUrl;
  const isProd = process.env.NODE_ENV === "production";

  if (isProd) {
    // Force traffic onto canonical hosts; anything else → apex
    if (host !== PUBLIC_HOST && host !== OPS_HOST && host !== `www.${PUBLIC_HOST}`) {
      const url = new URL(req.url);
      url.host = PUBLIC_HOST;
      url.protocol = "https:";
      return NextResponse.redirect(url.toString(), 301);
    }

    // www → apex
    if (host === `www.${PUBLIC_HOST}`) {
      const url = new URL(req.url);
      url.host = PUBLIC_HOST;
      url.protocol = "https:";
      return NextResponse.redirect(url.toString(), 301);
    }

    const onOps = host === OPS_HOST;
    const onApex = host === PUBLIC_HOST;
    const isOpsPath =
      pathname.startsWith("/back-office") ||
      pathname.startsWith("/login") ||
      pathname.startsWith("/forgot-password");

    // Apex: back-office/login/forgot-password live on ops only
    if (onApex && isOpsPath) {
      return NextResponse.redirect(
        `https://${OPS_HOST}${pathname}${search}`,
        301
      );
    }

    // Ops: only serve ops paths. Root → dashboard. Public paths → apex.
    if (onOps) {
      if (pathname === "/") {
        return NextResponse.redirect(
          `https://${OPS_HOST}/back-office/dashboard`,
          302
        );
      }
      if (!isOpsPath && pathname !== "/offline") {
        return NextResponse.redirect(
          `https://${PUBLIC_HOST}${pathname}${search}`,
          301
        );
      }
    }
  }

  // Auth gate for back-office paths (runs on any host in dev, ops in prod)
  if (pathname.startsWith("/back-office")) {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });
    if (!token) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname + search);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|assets|icons|favicon|manifest|sw).*)",
  ],
};
