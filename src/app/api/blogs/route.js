import { NextResponse } from "next/server";
import { getDbClient, initDatabaseSchema, verifyToken } from "../db-helper";

export async function GET() {
  try {
    await initDatabaseSchema();
    const db = getDbClient();
    const result = await db.execute(`
      SELECT id, title, summary, content, category, author, cover_image as coverImage, publish_date as date 
      FROM blogs 
      ORDER BY created_at DESC
    `);
    return NextResponse.json(result.rows || []);
  } catch (error) {
    console.error("Error fetching blogs:", error);
    return NextResponse.json({ error: "Failed to fetch blogs" }, { status: 500 });
  }
}

export async function POST(request) {
  if (!verifyToken(request)) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, summary, content, category, author, coverImage } = body;

    if (!title || !summary || !content || !category) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await initDatabaseSchema();
    const db = getDbClient();

    // Auto-generate ID
    const allBlogsRes = await db.execute("SELECT id FROM blogs");
    const existingIds = allBlogsRes.rows.map(r => r.id);
    const maxNum = existingIds.reduce((max, id) => {
      const match = String(id).match(/\d+/);
      return match ? Math.max(max, parseInt(match[0], 10)) : max;
    }, 0);
    const nextId = "post-" + (maxNum + 1);

    const options = { year: "numeric", month: "short", day: "numeric" };
    const formattedDate = new Date().toLocaleDateString("en-US", options);

    const newPost = {
      id: nextId,
      title,
      summary,
      content,
      category,
      coverImage: coverImage || "/images/hero/blog_hero_bg.png",
      date: formattedDate,
      author: author || "Ananya Hi Solutions"
    };

    await db.execute({
      sql: `INSERT INTO blogs (id, title, summary, content, category, author, cover_image, publish_date) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        newPost.id,
        newPost.title,
        newPost.summary,
        newPost.content,
        newPost.category,
        newPost.author,
        newPost.coverImage,
        newPost.date
      ]
    });

    return NextResponse.json({ success: true, blog: newPost });
  } catch (error) {
    console.error("Error publishing blog:", error);
    return NextResponse.json({ error: error.message || "Failed to publish blog post" }, { status: 500 });
  }
}

export async function PUT(request) {
  if (!verifyToken(request)) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, title, summary, content, category, author, date, coverImage } = body;

    if (!id || !title || !summary || !content || !category) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await initDatabaseSchema();
    const db = getDbClient();

    const existingRes = await db.execute({
      sql: "SELECT * FROM blogs WHERE id = ?",
      args: [id]
    });

    if (!existingRes.rows || existingRes.rows.length === 0) {
      return NextResponse.json({ error: "Blog post not found" }, { status: 404 });
    }

    const existing = existingRes.rows[0];
    const options = { year: "numeric", month: "short", day: "numeric" };
    const currentDate = new Date().toLocaleDateString("en-US", options);

    const updatedBlog = {
      id,
      title,
      summary,
      content,
      category,
      coverImage: coverImage || existing.cover_image || "/images/hero/blog_hero_bg.png",
      date: date || existing.publish_date || currentDate,
      author: author || existing.author || "Ananya Hi Solutions"
    };

    await db.execute({
      sql: `UPDATE blogs 
            SET title = ?, summary = ?, content = ?, category = ?, author = ?, cover_image = ?, publish_date = ?, updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?`,
      args: [
        updatedBlog.title,
        updatedBlog.summary,
        updatedBlog.content,
        updatedBlog.category,
        updatedBlog.author,
        updatedBlog.coverImage,
        updatedBlog.date,
        id
      ]
    });

    return NextResponse.json({ success: true, blog: updatedBlog });
  } catch (error) {
    console.error("Error updating blog:", error);
    return NextResponse.json({ error: error.message || "Failed to update blog post" }, { status: 500 });
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
      return NextResponse.json({ error: "Missing blog post ID" }, { status: 400 });
    }

    await initDatabaseSchema();
    const db = getDbClient();

    const result = await db.execute({
      sql: "DELETE FROM blogs WHERE id = ?",
      args: [id]
    });

    if (result.rowsAffected === 0) {
      return NextResponse.json({ error: "Blog post not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Blog post deleted successfully" });
  } catch (error) {
    console.error("Error deleting blog:", error);
    return NextResponse.json({ error: error.message || "Failed to delete blog post" }, { status: 500 });
  }
}
