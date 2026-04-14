import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const PUBLIC_HOST = "westendsportsclub.com";
const OPS_HOST = "ops.westendsportsclub.com";

// Paths that must ONLY exist on the ops subdomain. Anything under these
// prefixes returns 404 on the apex (public) host — no redirect, no leak.
function isOpsOnlyPath(pathname: string): boolean {
  if (pathname.startsWith("/back-office")) return true;
  if (pathname.startsWith("/login")) return true;
  if (pathname.startsWith("/forgot-password")) return true;
  if (pathname.startsWith("/api/auth")) return true;
  if (
    pathname.startsWith("/api/") &&
    !pathname.startsWith("/api/waitlist")
  ) {
    return true;
  }
  return false;
}

function notFound(): NextResponse {
  return new NextResponse(null, {
    status: 404,
    headers: {
      "content-type": "text/plain",
      // Don't let any cache serve this — belt and braces
      "cache-control": "no-store, no-cache, must-revalidate, max-age=0",
    },
  });
}

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

    // Apex: ops-only paths return a bare 404. No redirect — do not
    // reveal that an admin surface exists on another host.
    if (onApex && isOpsOnlyPath(pathname)) {
      return notFound();
    }

    // Ops: only serve ops paths. Root → dashboard. Public paths → apex.
    if (onOps) {
      if (pathname === "/") {
        return NextResponse.redirect(
          `https://${OPS_HOST}/back-office/dashboard`,
          302
        );
      }
      // Allow ops-only paths, the offline page, and static Next internals
      const allowedOnOps =
        isOpsOnlyPath(pathname) ||
        pathname === "/offline" ||
        pathname.startsWith("/_next") ||
        pathname.startsWith("/assets") ||
        pathname.startsWith("/icons") ||
        pathname === "/favicon.ico" ||
        pathname === "/manifest.json" ||
        pathname === "/sw.js";
      if (!allowedOnOps) {
        // Public page requested on ops → send to apex equivalent
        return NextResponse.redirect(
          `https://${PUBLIC_HOST}${pathname}${search}`,
          301
        );
      }
    }
  }

  // Auth gate for back-office paths
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
  // Run on everything except static asset paths that must stream as-is.
  // Note: /api IS included here (so we can 404 admin APIs on apex), but
  // /_next/static and /_next/image are not (those are framework assets).
  matcher: [
    "/((?!_next/static|_next/image|assets|icons|favicon.ico|manifest.json|sw.js).*)",
  ],
};
