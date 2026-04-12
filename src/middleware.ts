import { NextResponse } from "next/server";
import { withAuth } from "next-auth/middleware";

const CANONICAL_DOMAIN = "westendsportsclub.com";

export default withAuth(
  function middleware(req) {
    const host = req.headers.get("host") || "";

    // Redirect non-canonical domains to the custom domain
    if (
      process.env.NODE_ENV === "production" &&
      !host.includes(CANONICAL_DOMAIN)
    ) {
      const url = new URL(req.url);
      url.host = CANONICAL_DOMAIN;
      url.protocol = "https:";
      return NextResponse.redirect(url.toString(), 301);
    }

    return NextResponse.next();
  },
  {
    pages: {
      signIn: "/login",
    },
    callbacks: {
      authorized: ({ token, req }) => {
        // Only require auth for back-office routes
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
