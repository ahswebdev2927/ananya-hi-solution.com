import { NextResponse } from "next/server";
import { readDb, writeDb, verifyToken } from "../db-helper";

// Default BANNERS to initialize db if empty
const DEFAULT_BANNERS = [
  {
    title: "",
    desc: "",
    path: "/contact#contact-form",
    bgImage: "/images/banner1.png",
    btnText: "",
  },
  {
    title: "",
    desc: "",
    path: "/packages",
    bgImage: "/images/banner2.png",
    btnText: "",
  },
  {
    title: "",
    desc: "",
    path: "/packages/plans?package=E-Commerce Website",
    bgImage: "/images/banner3.png",
    btnText: "",
  }
];

export async function GET() {
  const db = await readDb();
  let updated = false;

  // Initialize banners if missing
  if (!db.banners) {
    db.banners = DEFAULT_BANNERS;
    updated = true;
  }

  if (updated) {
    await writeDb(db);
  }

  return NextResponse.json(db.banners);
}

export async function POST(request) {
  if (!verifyToken(request)) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { banners } = body;

    if (!banners || !Array.isArray(banners)) {
      return NextResponse.json({ error: "Missing or invalid banners array" }, { status: 400 });
    }

    const db = await readDb();
    db.banners = banners;

    const success = await writeDb(db);
    if (!success) throw new Error("Failed to write updated banners to database");

    return NextResponse.json({ success: true, banners });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Failed to save banners" }, { status: 500 });
  }
}
