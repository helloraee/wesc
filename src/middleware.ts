import { NextResponse } from "next/server";
import { withAuth } from "next-auth/middleware";

const PUBLIC_HOST = "westendsportsclub.com";
const OPS_HOST = "ops.westendsportsclub.com";

export default withAuth(
  function middleware(req) {
    const host = (req.headers.get("host") || "").toLowerCase();
    const { pathname, search } = req.nextUrl;
    const isProd = process.env.NODE_ENV === "production";

    // In production, force traffic onto the two canonical hosts
    if (isProd && host !== PUBLIC_HOST && host !== OPS_HOST && host !== `www.${PUBLIC_HOST}`) {
      const url = new URL(req.url);
      url.host = PUBLIC_HOST;
      url.protocol = "https:";
      return NextResponse.redirect(url.toString(), 301);
    }

    // Normalise www → apex
    if (isProd && host === `www.${PUBLIC_HOST}`) {
      const url = new URL(req.url);
      url.host = PUBLIC_HOST;
      url.protocol = "https:";
      return NextResponse.redirect(url.toString(), 301);
    }

    const onOps = host === OPS_HOST;
    const onApex = host === PUBLIC_HOST;

    const isBackOfficePath =
      pathname.startsWith("/back-office") || pathname === "/login";

    // Apex: block back-office/login, punt to ops subdomain
    if (isProd && onApex && isBackOfficePath) {
      return NextResponse.redirect(
        `https://${OPS_HOST}${pathname}${search}`,
        301
      );
    }

    // Ops: only serve back-office/login/offline. Root goes to dashboard.
    if (isProd && onOps) {
      if (pathname === "/") {
        return NextResponse.redirect(
          `https://${OPS_HOST}/back-office/dashboard`,
          302
        );
      }
      const opsAllowed =
        isBackOfficePath ||
        pathname === "/offline" ||
        pathname.startsWith("/forgot-password");
      if (!opsAllowed) {
        return NextResponse.redirect(
          `https://${PUBLIC_HOST}${pathname}${search}`,
          301
        );
      }
    }

    return NextResponse.next();
  },
  {
    pages: {
      signIn: "/login",
    },
    callbacks: {
      authorized: ({ token, req }) => {
        const host = (req.headers.get("host") || "").toLowerCase();
        // On apex, the middleware function redirects /back-office/* to ops
        // before auth is considered. Always authorize apex so the middleware
        // function runs and performs the host rewrite.
        if (host === PUBLIC_HOST || host === `www.${PUBLIC_HOST}`) {
          return true;
        }
        // On ops (or any other host), require a token for back-office routes.
        if (req.nextUrl.pathname.startsWith("/back-office")) {
          return !!token;
        }
        return true;
      },
    },
  }
);

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|assets|icons|favicon|manifest|sw|offline).*)"],
};
