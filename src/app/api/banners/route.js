import { NextResponse } from "next/server";
import { getDbClient, initDatabaseSchema, verifyToken } from "../db-helper";

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
  try {
    await initDatabaseSchema();
    const db = getDbClient();
    const result = await db.execute(`
      SELECT title, desc, path, bg_image as bgImage, btn_text as btnText 
      FROM banners 
      ORDER BY sort_order ASC, id ASC
    `);

    if (!result.rows || result.rows.length === 0) {
      // Seed default banners if empty
      for (let i = 0; i < DEFAULT_BANNERS.length; i++) {
        const b = DEFAULT_BANNERS[i];
        await db.execute({
          sql: `INSERT INTO banners (title, desc, path, bg_image, btn_text, sort_order) VALUES (?, ?, ?, ?, ?, ?)`,
          args: [b.title || "", b.desc || "", b.path, b.bgImage, b.btnText || "", i]
        });
      }
      return NextResponse.json(DEFAULT_BANNERS);
    }

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Error fetching banners:", error);
    return NextResponse.json({ error: "Failed to fetch banners" }, { status: 500 });
  }
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

    await initDatabaseSchema();
    const db = getDbClient();

    const batchStatements = [
      { sql: "DELETE FROM banners", args: [] }
    ];

    for (let i = 0; i < banners.length; i++) {
      const b = banners[i];
      batchStatements.push({
        sql: `INSERT INTO banners (title, desc, path, bg_image, btn_text, sort_order) VALUES (?, ?, ?, ?, ?, ?)`,
        args: [b.title || "", b.desc || "", b.path, b.bgImage, b.btnText || "", i]
      });
    }

    await db.batch(batchStatements, "write");

    return NextResponse.json({ success: true, banners });
  } catch (error) {
    console.error("Error saving banners:", error);
    return NextResponse.json({ error: error.message || "Failed to save banners" }, { status: 500 });
  }
}
