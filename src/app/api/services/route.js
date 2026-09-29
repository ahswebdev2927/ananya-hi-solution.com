import { NextResponse } from "next/server";
import { readDb, writeDb, verifyToken } from "../db-helper";

export async function GET() {
  const db = await readDb();
  return NextResponse.json(db.services || []);
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

    const db = await readDb();
    
    // Check if ID already exists
    if (db.services.some(s => s.id === id)) {
      return NextResponse.json({ error: "Service ID already exists" }, { status: 400 });
    }

    const newService = { id, title, desc, iconName: iconName || "globe" };
    db.services.push(newService);
    
    const success = await writeDb(db);
    if (!success) throw new Error("Failed to write to database");

    return NextResponse.json({ success: true, service: newService });
  } catch (error) {
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

    const db = await readDb();
    const serviceIndex = db.services.findIndex(s => s.id === id);

    if (serviceIndex === -1) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    db.services[serviceIndex] = { id, title, desc, iconName: iconName || "globe" };
    
    const success = await writeDb(db);
    if (!success) throw new Error("Failed to write to database");

    return NextResponse.json({ success: true, service: db.services[serviceIndex] });
  } catch (error) {
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

    const db = await readDb();
    const serviceIndex = db.services.findIndex(s => s.id === id);

    if (serviceIndex === -1) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    db.services.splice(serviceIndex, 1);
    
    const success = await writeDb(db);
    if (!success) throw new Error("Failed to write to database");

    return NextResponse.json({ success: true, message: "Service deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Failed to delete service" }, { status: 500 });
  }
}
