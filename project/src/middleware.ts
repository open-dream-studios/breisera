import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("accessToken")?.value;

  const isStaticFile = pathname.startsWith("/_next") || pathname.startsWith("/static") || pathname.endsWith(".js") || pathname.endsWith(".css") || pathname.endsWith(".ico") || pathname.endsWith(".svg") || pathname.endsWith(".png") || pathname.endsWith(".jpg") || pathname.endsWith(".jpeg") || pathname.endsWith(".webp") || pathname.endsWith(".woff2");
  const isApiRoute = pathname.startsWith("/api");
  const isRoot = pathname === "/";

  if (!token && !isRoot && !isStaticFile && !isApiRoute) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}