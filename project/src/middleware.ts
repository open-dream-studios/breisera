import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("accessToken")?.value;

  if (!token && req.nextUrl.pathname.startsWith("/home")) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}