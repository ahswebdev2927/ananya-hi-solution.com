import { NextResponse } from "next/server";
import { getDbClient, initDatabaseSchema, verifyToken } from "../db-helper";

const DEFAULT_MARQUEE_LOGOS = [
  { src: "/portfolio_images/zuxa_logo.png", name: "Zuxa Beauty & Spa", row: 1 },
  { src: "/portfolio_images/mad_academy_logo.png", name: "Mad Academy", row: 1 },
  { src: "/portfolio_images/qpath_logo.png", name: "Q Path Diagnostics", row: 2 },
  { src: "/portfolio_images/shanmukha_logo.png", name: "Shanmukha Gold", row: 2 }
];

export async function GET() {
  try {
    await initDatabaseSchema();
    const db = getDbClient();
    const result = await db.execute(`
      SELECT src, name, row_number as row 
      FROM marquee_logos 
      ORDER BY row_number ASC, sort_order ASC, id ASC
    `);

    if (!result.rows || result.rows.length === 0) {
      for (let i = 0; i < DEFAULT_MARQUEE_LOGOS.length; i++) {
        const logo = DEFAULT_MARQUEE_LOGOS[i];
        await db.execute({
          sql: `INSERT INTO marquee_logos (src, name, row_number, sort_order) VALUES (?, ?, ?, ?)`,
          args: [logo.src, logo.name || "", logo.row || 1, i]
        });
      }
      return NextResponse.json(DEFAULT_MARQUEE_LOGOS);
    }

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Error fetching marquee logos:", error);
    return NextResponse.json({ error: "Failed to fetch marquee logos" }, { status: 500 });
  }
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

    await initDatabaseSchema();
    const db = getDbClient();

    const batchStatements = [
      { sql: "DELETE FROM marquee_logos", args: [] }
    ];

    for (let i = 0; i < logos.length; i++) {
      const logo = logos[i];
      batchStatements.push({
        sql: `INSERT INTO marquee_logos (src, name, row_number, sort_order) VALUES (?, ?, ?, ?)`,
        args: [logo.src, logo.name || "", logo.row || 1, i]
      });
    }

    await db.batch(batchStatements, "write");

    return NextResponse.json({ success: true, logos });
  } catch (error) {
    console.error("Error saving marquee logos:", error);
    return NextResponse.json({ error: error.message || "Failed to save marquee logos" }, { status: 500 });
  }
}
