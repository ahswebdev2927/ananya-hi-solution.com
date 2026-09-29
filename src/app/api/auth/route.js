import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    // Default Credentials
    if (username === "admin" && password === "ananya@2026") {
      return NextResponse.json({
        success: true,
        token: "ananya-secure-admin-token-2026",
        message: "Authentication successful"
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid username or passcode" },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Server error occurred" },
      { status: 500 }
    );
  }
}
