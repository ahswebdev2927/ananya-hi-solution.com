import { NextResponse } from "next/server";
import { readDb, writeDb, verifyToken } from "../db-helper";

const DEFAULT_MARQUEE_LOGOS = [
  { src: "/portfolio_images/zuxa_logo.png", name: "Zuxa Beauty & Spa", row: 1 },
  { src: "/portfolio_images/mad_academy_logo.png", name: "Mad Academy", row: 1 },
  { src: "/portfolio_images/qpath_logo.png", name: "Q Path Diagnostics", row: 2 },
  { src: "/portfolio_images/shanmukha_logo.png", name: "Shanmukha Gold", row: 2 }
];

export async function GET() {
  const db = await readDb();
  let updated = false;

  if (!db.marqueeLogos) {
    db.marqueeLogos = DEFAULT_MARQUEE_LOGOS;
    updated = true;
  }

  if (updated) {
    await writeDb(db);
  }

  return NextResponse.json(db.marqueeLogos);
}

export async function POST(request) {
  if (!verifyToken(request)) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { logos } = body;

    if (!logos || !Array.isArray(logos)) {
      return NextResponse.json({ error: "Missing or invalid logos array" }, { status: 400 });
    }

    const db = await readDb();
    db.marqueeLogos = logos;

    const success = await writeDb(db);
    if (!success) throw new Error("Failed to write updated marquee logos to database");

    return NextResponse.json({ success: true, logos });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Failed to save marquee logos" }, { status: 500 });
  }
}
