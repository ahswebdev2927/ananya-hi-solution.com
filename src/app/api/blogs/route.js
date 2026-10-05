import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { getDbClient, initDatabaseSchema, verifyToken } from "../db-helper";

// Helper to sanitize and format slugs
function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export async function GET() {
  try {
    await initDatabaseSchema();
    const db = getDbClient();
    const result = await db.execute(`
      SELECT 
        id, 
        title, 
        slug, 
        summary, 
        content, 
        category, 
        author, 
        cover_image as coverImage, 
        meta_title as metaTitle, 
        meta_description as metaDescription, 
        meta_keywords as metaKeywords, 
        publish_date as date,
        created_at as createdAt,
        updated_at as updatedAt
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
    const { 
      id: customId,
      title, 
      slug: customSlug, 
      summary, 
      content, 
      category, 
      author, 
      coverImage,
      metaTitle,
      metaDescription,
      metaKeywords
    } = body;

    if (!title || !content || !category) {
      return NextResponse.json({ error: "Missing required fields (title, content, category)" }, { status: 400 });
    }

    await initDatabaseSchema();
    const db = getDbClient();

    // 1. Determine ID
    let finalId = customId;
    if (!finalId) {
      const allBlogsRes = await db.execute("SELECT id FROM blogs");
      const existingIds = allBlogsRes.rows.map((r) => r.id);
      const maxNum = existingIds.reduce((max, id) => {
        const match = String(id).match(/\d+/);
        return match ? Math.max(max, parseInt(match[0], 10)) : max;
      }, 0);
      finalId = "post-" + (maxNum + 1);
    }

    // 2. Determine unique slug
    let baseSlug = slugify(customSlug || title) || finalId;
    let finalSlug = baseSlug;
    let counter = 1;
    while (true) {
      const checkRes = await db.execute({
        sql: "SELECT id FROM blogs WHERE slug = ?",
        args: [finalSlug]
      });
      if (!checkRes.rows || checkRes.rows.length === 0) break;
      counter++;
      finalSlug = `${baseSlug}-${counter}`;
    }

    const options = { year: "numeric", month: "short", day: "numeric" };
    const formattedDate = new Date().toLocaleDateString("en-US", options);

    // Sync summary with metaDescription if one is provided
    const finalSummary = (metaDescription || summary || title).trim().slice(0, 250);
    const finalMetaTitle = (metaTitle || title).trim();
    const finalMetaDesc = (metaDescription || summary || "").trim();
    const finalKeywords = (metaKeywords || "").trim();

    const newPost = {
      id: finalId,
      title: title.trim(),
      slug: finalSlug,
      summary: finalSummary,
      content,
      category: category.trim(),
      coverImage: coverImage || "/images/hero/blog_hero_bg.png",
      metaTitle: finalMetaTitle,
      metaDescription: finalMetaDesc,
      metaKeywords: finalKeywords,
      date: formattedDate,
      author: (author || "Ananya Hi Solutions").trim()
    };

    await db.execute({
      sql: `INSERT INTO blogs (
              id, title, slug, summary, content, category, author, 
              cover_image, meta_title, meta_description, meta_keywords, publish_date
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        newPost.id,
        newPost.title,
        newPost.slug,
        newPost.summary,
        newPost.content,
        newPost.category,
        newPost.author,
        newPost.coverImage,
        newPost.metaTitle,
        newPost.metaDescription,
        newPost.metaKeywords,
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
    const { 
      id, 
      title, 
      slug: customSlug, 
      summary, 
      content, 
      category, 
      author, 
      date, 
      coverImage,
      metaTitle,
      metaDescription,
      metaKeywords
    } = body;

    if (!id || !title || !content || !category) {
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

    // Ensure slug is unique if modified
    let targetSlug = slugify(customSlug || existing.slug || title) || id;
    if (targetSlug !== existing.slug) {
      let baseSlug = targetSlug;
      let counter = 1;
      while (true) {
        const checkRes = await db.execute({
          sql: "SELECT id FROM blogs WHERE slug = ? AND id != ?",
          args: [targetSlug, id]
        });
        if (!checkRes.rows || checkRes.rows.length === 0) break;
        counter++;
        targetSlug = `${baseSlug}-${counter}`;
      }
    }

    const options = { year: "numeric", month: "short", day: "numeric" };
    const currentDate = new Date().toLocaleDateString("en-US", options);

    const finalSummary = (metaDescription || summary || existing.summary || title).trim().slice(0, 250);
    const finalMetaTitle = (metaTitle || existing.meta_title || title).trim();
    const finalMetaDesc = (metaDescription || existing.meta_description || summary || "").trim();
    const finalKeywords = (metaKeywords !== undefined ? metaKeywords : (existing.meta_keywords || "")).trim();

    const updatedBlog = {
      id,
      title: title.trim(),
      slug: targetSlug,
      summary: finalSummary,
      content,
      category: category.trim(),
      coverImage: coverImage || existing.cover_image || "/images/hero/blog_hero_bg.png",
      metaTitle: finalMetaTitle,
      metaDescription: finalMetaDesc,
      metaKeywords: finalKeywords,
      date: date || existing.publish_date || currentDate,
      author: (author || existing.author || "Ananya Hi Solutions").trim()
    };

    await db.execute({
      sql: `UPDATE blogs 
            SET title = ?, slug = ?, summary = ?, content = ?, category = ?, 
                author = ?, cover_image = ?, meta_title = ?, meta_description = ?, 
                meta_keywords = ?, publish_date = ?, updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?`,
      args: [
        updatedBlog.title,
        updatedBlog.slug,
        updatedBlog.summary,
        updatedBlog.content,
        updatedBlog.category,
        updatedBlog.author,
        updatedBlog.coverImage,
        updatedBlog.metaTitle,
        updatedBlog.metaDescription,
        updatedBlog.metaKeywords,
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

    // 1. Fetch blog before deletion to know its cover_image
    const existingRes = await db.execute({
      sql: "SELECT cover_image FROM blogs WHERE id = ?",
      args: [id]
    });

    const coverImage = existingRes.rows?.[0]?.cover_image;

    // 2. Delete blog from database
    const result = await db.execute({
      sql: "DELETE FROM blogs WHERE id = ?",
      args: [id]
    });

    if (result.rowsAffected === 0) {
      return NextResponse.json({ error: "Blog post not found" }, { status: 404 });
    }

    // 3. Delete image directory and associated files from the server
    try {
      const sanitizedId = String(id).replace(/[^a-zA-Z0-9_-]/g, "").trim();
      if (sanitizedId) {
        const blogFolder = path.join(process.cwd(), "public", "uploads", "blogs", sanitizedId);
        await fs.rm(blogFolder, { recursive: true, force: true });
        console.log(`Deleted blog images folder on server: ${blogFolder}`);
      }

      // If coverImage was stored elsewhere in /uploads/
      if (coverImage && typeof coverImage === "string" && coverImage.startsWith("/uploads/")) {
        const cleanUrl = coverImage.replace(/^\//, "");
        const filePath = path.normalize(path.join(process.cwd(), "public", cleanUrl));
        const publicDir = path.normalize(path.join(process.cwd(), "public"));
        if (filePath.startsWith(publicDir)) {
          try {
            await fs.unlink(filePath);
            console.log(`Deleted blog cover image file on server: ${filePath}`);
          } catch (e) {
            // File might have already been inside the deleted folder
          }
        }
      }
    } catch (fsErr) {
      console.warn("Could not delete blog images on server:", fsErr);
    }

    return NextResponse.json({ success: true, message: "Blog post and associated images deleted successfully" });
  } catch (error) {
    console.error("Error deleting blog:", error);
    return NextResponse.json({ error: error.message || "Failed to delete blog post" }, { status: 500 });
  }
}
