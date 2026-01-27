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
            // Set a simple auth cookie
            // In a production app, this should be a JWT or signed session ID
            const cookieStore = await cookies();
            cookieStore.set("auth_session", "true", {
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
