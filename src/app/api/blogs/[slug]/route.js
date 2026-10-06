import { NextResponse } from "next/server";
import { getDbClient, initDatabaseSchema } from "../../db-helper";

export async function GET(request, context) {
  try {
    await initDatabaseSchema();
    const db = getDbClient();

    // Await params if needed in Next.js 15+
    const params = await context.params;
    const { slug } = params;

    if (!slug) {
      return NextResponse.json({ error: "Missing article identifier" }, { status: 400 });
    }

    // Lookup by slug first, fallback to id
    const result = await db.execute({
      sql: `
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
        WHERE slug = ? OR id = ?
        LIMIT 1
      `,
      args: [slug, slug]
    });

    if (!result.rows || result.rows.length === 0) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    const blog = result.rows[0];

    // Fetch up to 3 related articles (prioritize same category, excluding current)
    const relatedResult = await db.execute({
      sql: `
        SELECT 
          id, 
          title, 
          slug, 
          summary, 
          category, 
          author, 
          cover_image as coverImage, 
          meta_description as metaDescription, 
          publish_date as date
        FROM blogs 
        WHERE id != ?
        ORDER BY CASE WHEN category = ? THEN 0 ELSE 1 END, created_at DESC
        LIMIT 3
      `,
      args: [blog.id, blog.category]
    });

    return NextResponse.json({
      blog,
      related: relatedResult.rows || []
    });
  } catch (error) {
    console.error("Error fetching single blog:", error);
    return NextResponse.json({ error: "Failed to fetch article" }, { status: 500 });
  }
}
