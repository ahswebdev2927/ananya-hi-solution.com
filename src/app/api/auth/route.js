import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: "Missing username or passcode" },
        { status: 400 },
      );
    }

    // Load the credentials from the environment variable
    const admin_username = process.env.ADMIN_USERNAME || "admin";
    const admin_password = process.env.ADMIN_PASSWORD || "ananya@2026";

    // Verify the credentials
    if (username === admin_username && password === admin_password) {
      return NextResponse.json({
        success: true,
        token: "ananya-secure-admin-token-2026",
        message: "Authentication successful",
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid username or passcode" },
      { status: 401 },
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Server error occurred" },
      { status: 500 },
    );
  }
}
