import { NextResponse } from "next/server";
import { readDb, writeDb, verifyToken } from "../db-helper";

export async function GET() {
  const db = await readDb();
  return NextResponse.json(db.jobs || []);
}

export async function POST(request) {
  if (!verifyToken(request)) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, department, location, experience, qualifications, type, description, requirements } = body;

    if (!title || !department || !location || !experience || !type || !description) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const db = await readDb();
    
    // Auto-generate a safe unique ID
    const nextId = "job-" + (db.jobs.length > 0 ? (Math.max(...db.jobs.map(j => {
      const match = j.id.match(/\d+/);
      return match ? parseInt(match[0], 10) : 0;
    })) + 1) : 1);

    const newJob = {
      id: nextId,
      title,
      department,
      location,
      experience,
      qualifications: qualifications || "",
      type,
      description,
      requirements: Array.isArray(requirements) ? requirements : []
    };

    db.jobs.push(newJob);
    
    const success = await writeDb(db);
    if (!success) throw new Error("Failed to write to database");

    return NextResponse.json({ success: true, job: newJob });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Failed to add job posting" }, { status: 500 });
  }
}

export async function PUT(request) {
  if (!verifyToken(request)) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, title, department, location, experience, qualifications, type, description, requirements } = body;

    if (!id || !title || !department || !location || !experience || !type || !description) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const db = await readDb();
    const jobIndex = db.jobs.findIndex(j => j.id === id);

    if (jobIndex === -1) {
      return NextResponse.json({ error: "Job posting not found" }, { status: 404 });
    }

    db.jobs[jobIndex] = {
      id,
      title,
      department,
      location,
      experience,
      qualifications: qualifications || "",
      type,
      description,
      requirements: Array.isArray(requirements) ? requirements : []
    };
    
    const success = await writeDb(db);
    if (!success) throw new Error("Failed to write to database");

    return NextResponse.json({ success: true, job: db.jobs[jobIndex] });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Failed to update job posting" }, { status: 500 });
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
      return NextResponse.json({ error: "Missing job ID" }, { status: 400 });
    }

    const db = await readDb();
    const jobIndex = db.jobs.findIndex(j => j.id === id);

    if (jobIndex === -1) {
      return NextResponse.json({ error: "Job posting not found" }, { status: 404 });
    }

    db.jobs.splice(jobIndex, 1);
    
    const success = await writeDb(db);
    if (!success) throw new Error("Failed to write to database");

    return NextResponse.json({ success: true, message: "Job posting deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Failed to delete job posting" }, { status: 500 });
  }
}
