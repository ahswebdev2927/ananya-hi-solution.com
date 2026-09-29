import { NextResponse } from "next/server";
import { readDb, writeDb, verifyToken } from "../db-helper";

export async function GET() {
  const db = await readDb();
  return NextResponse.json(db.blogs || []);
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

    const db = await readDb();
    
    // Auto-generate ID
    const nextId = "post-" + (db.blogs.length > 0 ? (Math.max(...db.blogs.map(b => {
      const match = b.id.match(/\d+/);
      return match ? parseInt(match[0], 10) : 0;
    })) + 1) : 1);

    // Format current date elegantly (e.g. May 22, 2026)
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

    db.blogs.push(newPost);
    
    const success = await writeDb(db);
    if (!success) throw new Error("Failed to write to database");

    return NextResponse.json({ success: true, blog: newPost });
  } catch (error) {
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

    const db = await readDb();
    const blogIndex = db.blogs.findIndex(b => b.id === id);

    if (blogIndex === -1) {
      return NextResponse.json({ error: "Blog post not found" }, { status: 404 });
    }

    // Keep existing date or update it
    const options = { year: "numeric", month: "short", day: "numeric" };
    const currentDate = new Date().toLocaleDateString("en-US", options);

    db.blogs[blogIndex] = {
      id,
      title,
      summary,
      content,
      category,
      coverImage: coverImage || db.blogs[blogIndex].coverImage || "/images/hero/blog_hero_bg.png",
      date: date || db.blogs[blogIndex].date || currentDate,
      author: author || db.blogs[blogIndex].author || "Ananya Hi Solutions"
    };
    
    const success = await writeDb(db);
    if (!success) throw new Error("Failed to write to database");

    return NextResponse.json({ success: true, blog: db.blogs[blogIndex] });
  } catch (error) {
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

    const db = await readDb();
    const blogIndex = db.blogs.findIndex(b => b.id === id);

    if (blogIndex === -1) {
      return NextResponse.json({ error: "Blog post not found" }, { status: 404 });
    }

    db.blogs.splice(blogIndex, 1);
    
    const success = await writeDb(db);
    if (!success) throw new Error("Failed to write to database");

    return NextResponse.json({ success: true, message: "Blog post deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Failed to delete blog post" }, { status: 500 });
  }
}
