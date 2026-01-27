import { NextResponse } from "next/server";

export async function middleware(request) {
    const authCookie = request.cookies.get("auth_session");
    const isLoginPage = request.nextUrl.pathname === "/login";

    let isAuthenticated = false;

    if (authCookie?.value) {
        try {
            const [username, hash] = authCookie.value.split("|");

            if (username && hash) {
                // Re-construct valid users list to check password
                // Note: Accessing process.env in middleware works in Next.js (Edge)
                const allowedUsersEnv = process.env.ALLOWED_USERS || "";
                const legacyUser = process.env.ADMIN_USERNAME;
                const legacyPass = process.env.ADMIN_PASSWORD;

                const validUsers = allowedUsersEnv.split(",").map(pair => {
                    const [u, p] = pair.split(":");
                    return { username: u?.trim(), password: p?.trim() };
                }).filter(u => u.username && u.password);

                if (legacyUser && legacyPass) {
                    validUsers.push({ username: legacyUser, password: legacyPass });
                }

                const user = validUsers.find(u => u.username === username);

                if (user) {
                    // Re-compute hash to verify
                    const sessionData = `${user.username}:${user.password}`;
                    const encoder = new TextEncoder();
                    const data = encoder.encode(sessionData + (process.env.AUTH_SECRET || "fallback_secret"));

                    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
                    const hashArray = Array.from(new Uint8Array(hashBuffer));
                    const expectedHash = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

                    if (hash === expectedHash) {
                        isAuthenticated = true;
                    }
                }
            }
        } catch (e) {
            console.error("Auth verification failed", e);
        }
    }

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
