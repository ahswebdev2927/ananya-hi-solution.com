import { NextResponse } from "next/server";
import { getDbClient, initDatabaseSchema, verifyToken } from "../db-helper";

export async function GET() {
  try {
    await initDatabaseSchema();
    const db = getDbClient();
    const result = await db.execute(`
      SELECT id, title, desc, icon_name as iconName 
      FROM services 
      ORDER BY sort_order ASC, created_at ASC
    `);
    return NextResponse.json(result.rows || []);
  } catch (error) {
    console.error("Error fetching services:", error);
    return NextResponse.json({ error: "Failed to fetch services" }, { status: 500 });
  }
}

export async function POST(request) {
  if (!verifyToken(request)) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, title, desc, iconName } = body;

    if (!id || !title || !desc) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await initDatabaseSchema();
    const db = getDbClient();

    // Check if ID already exists
    const existing = await db.execute({
      sql: "SELECT id FROM services WHERE id = ?",
      args: [id]
    });

    if (existing.rows && existing.rows.length > 0) {
      return NextResponse.json({ error: "Service ID already exists" }, { status: 400 });
    }

    const nextOrderRes = await db.execute("SELECT COALESCE(MAX(sort_order), -1) + 1 as next_order FROM services");
    const nextOrder = nextOrderRes.rows[0]?.next_order || 0;

    const newService = { id, title, desc, iconName: iconName || "globe" };

    await db.execute({
      sql: "INSERT INTO services (id, title, desc, icon_name, sort_order) VALUES (?, ?, ?, ?, ?)",
      args: [id, title, desc, newService.iconName, nextOrder]
    });

    return NextResponse.json({ success: true, service: newService });
  } catch (error) {
    console.error("Error creating service:", error);
    return NextResponse.json({ error: error.message || "Failed to add service" }, { status: 500 });
  }
}

export async function PUT(request) {
  if (!verifyToken(request)) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, title, desc, iconName } = body;

    if (!id || !title || !desc) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await initDatabaseSchema();
    const db = getDbClient();

    const result = await db.execute({
      sql: "UPDATE services SET title = ?, desc = ?, icon_name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      args: [title, desc, iconName || "globe", id]
    });

    if (result.rowsAffected === 0) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, service: { id, title, desc, iconName: iconName || "globe" } });
  } catch (error) {
    console.error("Error updating service:", error);
    return NextResponse.json({ error: error.message || "Failed to update service" }, { status: 500 });
  }
}

export async function DELETE(request) {
  if (!verifyToken(request)) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing service ID" }, { status: 400 });
    }

    await initDatabaseSchema();
    const db = getDbClient();

    const result = await db.execute({
      sql: "DELETE FROM services WHERE id = ?",
      args: [id]
    });

    if (result.rowsAffected === 0) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Service deleted successfully" });
  } catch (error) {
    console.error("Error deleting service:", error);
    return NextResponse.json({ error: error.message || "Failed to delete service" }, { status: 500 });
  }
}
