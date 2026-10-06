import { NextResponse } from "next/server";
import { getDbClient, initDatabaseSchema, verifyToken } from "../db-helper";

export async function GET() {
  try {
    await initDatabaseSchema();
    const db = getDbClient();
    const result = await db.execute(`
      SELECT id, title, department, location, experience, qualifications, type, description, requirements 
      FROM jobs 
      WHERE is_active = 1 
      ORDER BY sort_order ASC, created_at ASC
    `);

    const jobs = (result.rows || []).map((j) => {
      let parsedReqs = [];
      try {
        parsedReqs = typeof j.requirements === "string" ? JSON.parse(j.requirements) : (j.requirements || []);
      } catch (e) {
        parsedReqs = [];
      }
      return {
        ...j,
        requirements: parsedReqs
      };
    });

    return NextResponse.json(jobs);
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return NextResponse.json({ error: "Failed to fetch jobs" }, { status: 500 });
  }
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

    await initDatabaseSchema();
    const db = getDbClient();

    // Auto-generate safe unique ID
    const allJobsRes = await db.execute("SELECT id FROM jobs");
    const existingIds = allJobsRes.rows.map(r => r.id);
    const maxNum = existingIds.reduce((max, id) => {
      const match = String(id).match(/\d+/);
      return match ? Math.max(max, parseInt(match[0], 10)) : max;
    }, 0);
    const nextId = "job-" + (maxNum + 1);

    const nextOrderRes = await db.execute("SELECT COALESCE(MAX(sort_order), -1) + 1 as next_order FROM jobs");
    const nextOrder = nextOrderRes.rows[0]?.next_order || 0;

    const requirementsArray = Array.isArray(requirements) ? requirements : [];

    const newJob = {
      id: nextId,
      title,
      department,
      location,
      experience,
      qualifications: qualifications || "",
      type,
      description,
      requirements: requirementsArray
    };

    await db.execute({
      sql: `INSERT INTO jobs (id, title, department, location, experience, qualifications, type, description, requirements, is_active, sort_order) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
      args: [
        newJob.id,
        newJob.title,
        newJob.department,
        newJob.location,
        newJob.experience,
        newJob.qualifications,
        newJob.type,
        newJob.description,
        JSON.stringify(newJob.requirements),
        nextOrder
      ]
    });

    return NextResponse.json({ success: true, job: newJob });
  } catch (error) {
    console.error("Error creating job posting:", error);
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

    await initDatabaseSchema();
    const db = getDbClient();

    const requirementsArray = Array.isArray(requirements) ? requirements : [];

    const result = await db.execute({
      sql: `UPDATE jobs 
            SET title = ?, department = ?, location = ?, experience = ?, qualifications = ?, type = ?, description = ?, requirements = ?, updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?`,
      args: [
        title,
        department,
        location,
        experience,
        qualifications || "",
        type,
        description,
        JSON.stringify(requirementsArray),
        id
      ]
    });

    if (result.rowsAffected === 0) {
      return NextResponse.json({ error: "Job posting not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      job: {
        id,
        title,
        department,
        location,
        experience,
        qualifications: qualifications || "",
        type,
        description,
        requirements: requirementsArray
      }
    });
  } catch (error) {
    console.error("Error updating job posting:", error);
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

    await initDatabaseSchema();
    const db = getDbClient();

    const result = await db.execute({
      sql: "DELETE FROM jobs WHERE id = ?",
      args: [id]
    });

    if (result.rowsAffected === 0) {
      return NextResponse.json({ error: "Job posting not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Job posting deleted successfully" });
  } catch (error) {
    console.error("Error deleting job posting:", error);
    return NextResponse.json({ error: error.message || "Failed to delete job posting" }, { status: 500 });
  }
}
