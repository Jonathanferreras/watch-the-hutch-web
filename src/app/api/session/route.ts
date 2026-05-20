import { NextResponse } from "next/server";

import { adminAuth } from "@/src/lib/firebase/auth/admin-auth";
import { logError } from "@/src/lib/errors";

export async function POST(request: Request) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 401 });
    }

    const decoded = await adminAuth.verifyIdToken(token);

    if (!decoded) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const response = NextResponse.json({ ok: true });

    response.cookies.set("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return response;
  } catch (error) {
    logError("SessionRoute", "Failed to create auth session.", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  try {
    const response = NextResponse.json({ ok: true });

    response.cookies.delete("session");

    return response;
  } catch (error) {
    logError("SessionRoute", "Failed to clear auth session.", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
