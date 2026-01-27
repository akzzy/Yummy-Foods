import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request) {
    try {
        const { username, password } = await request.json();

        // Support multiple users via ALLOWED_USERS="user1:pass1,user2:pass2"
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

        if (validUsers.length === 0) {
            console.error("No users configured in .env.local");
            return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
        }

        const isValidUser = validUsers.some(u => u.username === username && u.password === password);

        if (isValidUser) {
            // Create a simple signed token using a hash of the credentials + secret
            // Ideally use a proper JWT library, but for zero-deps this works for simple auth
            const sessionData = `${username}:${password}`;
            const encoder = new TextEncoder();
            const data = encoder.encode(sessionData + (process.env.AUTH_SECRET || "fallback_secret"));
            const hashBuffer = await crypto.subtle.digest("SHA-256", data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

            const sessionToken = `${username}|${hashHex}`;

            const cookieStore = await cookies();
            cookieStore.set("auth_session", sessionToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                maxAge: 60 * 60 * 24 * 7, // 1 week
                path: "/",
            });

            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
    } catch (error) {
        return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
    }
}
