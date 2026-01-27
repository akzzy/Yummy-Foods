import { NextResponse } from "next/server";

export function middleware(request) {
    const authCookie = request.cookies.get("auth_session");
    const isAuthenticated = authCookie?.value === "true";
    const isLoginPage = request.nextUrl.pathname === "/login";

    // If trying to access login page while authenticated, redirect to home
    if (isLoginPage && isAuthenticated) {
        return NextResponse.redirect(new URL("/", request.url));
    }

    // If trying to access protected route (anything not /login or /api/auth) while not authenticated
    if (!isAuthenticated && !isLoginPage) {
        // Check if it's an API route or public asset, we probably want to secure /api except /api/auth
        // but allow static files, nextjs internals
        if (request.nextUrl.pathname.startsWith("/api/auth")) {
            return NextResponse.next();
        }

        // Allow static files
        if (request.nextUrl.pathname.includes(".")) {
            return NextResponse.next();
        }

        return NextResponse.redirect(new URL("/login", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        "/((?!_next/static|_next/image|favicon.ico).*)",
    ],
};
