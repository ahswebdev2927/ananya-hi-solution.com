import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { verifyToken } from "../db-helper";

export async function POST(request) {
  if (!verifyToken(request)) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const blogId = formData.get("blogId") || formData.get("id");
    const uploadType = formData.get("type"); // e.g. "blog"

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Validate allowed file extensions (.jpg, .jpeg, .png, .webp)
    const rawExt = path.extname(file.name || "").toLowerCase();
    const validExtensions = [".jpg", ".jpeg", ".png", ".webp"];
    if (!validExtensions.includes(rawExt)) {
      return NextResponse.json(
        { error: "Invalid image format. Supported formats: .jpg, .jpeg, .png, .webp" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // If it's a blog upload or blogId is specified: store in public/uploads/blogs/[id]/[filename]
    if (uploadType === "blog" || blogId) {
      const targetBlogId = (blogId || `draft-${Date.now()}`)
        .replace(/[^a-zA-Z0-9_-]/g, "")
        .trim();

      const uploadDir = path.join(process.cwd(), "public", "uploads", "blogs", targetBlogId);
      await fs.mkdir(uploadDir, { recursive: true });

      const baseName = path.basename(file.name, rawExt).replace(/[^a-zA-Z0-9_-]/g, "_");
      const filename = `${baseName || "image"}${rawExt}`;
      const filePath = path.join(uploadDir, filename);

      await fs.writeFile(filePath, buffer);

      const relativeUrl = `/uploads/blogs/${targetBlogId}/${filename}`;
      console.log(`Saved blog image locally: ${filePath} -> ${relativeUrl}`);

      return NextResponse.json({
        success: true,
        url: relativeUrl,
        blogId: targetBlogId,
        filename
      });
    }

    // Fallback for general site images
    const generalUploadDir = path.join(process.cwd(), "public", "images", "uploads");
    await fs.mkdir(generalUploadDir, { recursive: true });

    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filename = `${timestamp}_${sanitizedName}`;
    const filePath = path.join(generalUploadDir, filename);

    await fs.writeFile(filePath, buffer);

    const relativePath = `/images/uploads/${filename}`;
    return NextResponse.json({ success: true, url: relativePath });
  } catch (error) {
    console.error("Upload handler failed:", error);
    return NextResponse.json({ error: error.message || "Failed to upload image" }, { status: 500 });
  }
}

export async function DELETE(request) {
  if (!verifyToken(request)) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { url, blogId } = body;

    let deletedAny = false;

    // 1. Delete single image file if relative URL is provided
    if (url && typeof url === "string") {
      const cleanUrl = url.replace(/^\//, "");
      const normalizedPath = path.normalize(path.join(process.cwd(), "public", cleanUrl));
      const publicDir = path.normalize(path.join(process.cwd(), "public"));

      // Security check: ensure path stays within public directory
      if (normalizedPath.startsWith(publicDir)) {
        try {
          await fs.unlink(normalizedPath);
          deletedAny = true;
          console.log(`Deleted image from server: ${normalizedPath}`);
        } catch (err) {
          if (err.code !== "ENOENT") {
            console.error("Error unlinking file:", err);
          }
        }
      }
    }

    // 2. Clean up blog upload directory if blogId provided and directory is empty
    if (blogId) {
      const sanitizedBlogId = String(blogId).replace(/[^a-zA-Z0-9_-]/g, "").trim();
      if (sanitizedBlogId) {
        const blogFolder = path.join(process.cwd(), "public", "uploads", "blogs", sanitizedBlogId);
        try {
          const files = await fs.readdir(blogFolder).catch(() => []);
          if (files.length === 0) {
            await fs.rmdir(blogFolder).catch(() => {});
          }
        } catch (e) {
          // Ignore directory clean-up errors
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: deletedAny ? "Image deleted from server" : "Image path processed"
    });
  } catch (error) {
    console.error("Delete image handler failed:", error);
    return NextResponse.json({ error: error.message || "Failed to delete image" }, { status: 500 });
  }
}

