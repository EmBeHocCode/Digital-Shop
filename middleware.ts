import { NextResponse, type NextRequest } from "next/server";

const protectedRoutes = [
  { prefix: "/profile", roles: ["USER"] },
  { prefix: "/staff", roles: ["STAFF", "ADMIN"] },
  { prefix: "/admin", roles: ["ADMIN"] }
];

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const matchedRoute = protectedRoutes.find((route) =>
    pathname.startsWith(route.prefix)
  );

  if (!matchedRoute) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get("meowmarket-session")?.value;
  const role = request.cookies.get("meowmarket-role")?.value;

  if (!sessionCookie || !role || !matchedRoute.roles.includes(role)) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("redirect", pathname);
    if (searchParams.size) {
      redirectUrl.searchParams.set("fromQuery", "1");
    }
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/profile/:path*", "/staff/:path*", "/admin/:path*"]
};
