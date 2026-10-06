import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();
    const { code } = body;

    if (!code || typeof code !== "string" || !code.trim()) {
      return NextResponse.json(
        { valid: false, message: "Authorization passcode is required." },
        { status: 400 }
      );
    }

    const envCodes = process.env.DISCOUNT_PASSCODES || "AHS123,NAVEEN@10,AHSDISCOUNT18";
    const allowed = envCodes
      .split(",")
      .map((c) => c.trim().toUpperCase())
      .filter(Boolean);

    const entered = code.trim().toUpperCase();

    if (allowed.includes(entered)) {
      return NextResponse.json({ valid: true });
    }

    return NextResponse.json({
      valid: false,
      message: "Invalid authorization passcode. Please check and try again.",
    });
  } catch (err) {
    console.error("Discount passcode verification error:", err);
    return NextResponse.json(
      { valid: false, message: "Server error verifying passcode." },
      { status: 500 }
    );
  }
}
