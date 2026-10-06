import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { verifyToken } from "../db-helper";
import { v2 as cloudinary } from "cloudinary";

/**
 * Configure and return Cloudinary instance if environment variables exist
 */
function getCloudinary() {
  const cloudinaryUrl = process.env.CLOUDINARY_URL
    ?.replace(/^["']|["']$/g, "")
    ?.trim();

  const cloudName = (
    process.env.CLOUDINARY_CLOUD_NAME ||
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  )
    ?.replace(/^["']|["']$/g, "")
    ?.trim();

  const apiKey = (
    process.env.CLOUDINARY_API_KEY ||
    process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY
  )
    ?.replace(/^["']|["']$/g, "")
    ?.trim();

  const apiSecret = process.env.CLOUDINARY_API_SECRET
    ?.replace(/^["']|["']$/g, "")
    ?.trim();

  if (cloudinaryUrl) {
    cloudinary.config({
      cloudinary_url: cloudinaryUrl,
      secure: true,
    });
    return cloudinary;
  }

  if (cloudName && apiKey && apiSecret) {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });
    return cloudinary;
  }

  return null;
}

/**
 * Helper to upload buffer to Cloudinary via upload_stream
 */
function uploadBufferToCloudinary(cld, buffer, options) {
  return new Promise((resolve, reject) => {
    const uploadStream = cld.uploader.upload_stream(
      {
        resource_type: "auto",
        ...options,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    uploadStream.end(buffer);
  });
}

export async function POST(request) {
  if (!verifyToken(request)) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const blogId = formData.get("blogId") || formData.get("id");
    const uploadType = formData.get("type"); // e.g. "service", "banner", "logo", "package", "blog"

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Validate allowed file extensions (.jpg, .jpeg, .png, .webp, .svg, .gif, .avif)
    const rawExt = path.extname(file.name || "").toLowerCase();
    const validExtensions = [".jpg", ".jpeg", ".png", ".webp", ".svg", ".gif", ".avif"];
    if (!validExtensions.includes(rawExt)) {
      return NextResponse.json(
        { error: "Invalid image format. Supported formats: .jpg, .jpeg, .png, .webp, .svg, .gif, .avif" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 1. Check if Cloudinary is configured
    const cld = getCloudinary();
    if (cld) {
      try {
        let folder = "ananya_solutions/uploads";
        if (uploadType === "service") {
          folder = "ananya_solutions/services";
        } else if (uploadType === "banner") {
          folder = "ananya_solutions/banners";
        } else if (uploadType === "logo") {
          folder = "ananya_solutions/logos";
        } else if (uploadType === "package") {
          folder = "ananya_solutions/packages";
        } else if (uploadType === "blog" || blogId) {
          const targetId = (blogId || `post-${Date.now()}`).replace(/[^a-zA-Z0-9_-]/g, "");
          folder = `ananya_solutions/blogs/${targetId}`;
        }

        const baseName = path.basename(file.name, rawExt).replace(/[^a-zA-Z0-9_-]/g, "_");
        const publicId = `${baseName || "image"}_${Date.now()}`;

        const cldResult = await uploadBufferToCloudinary(cld, buffer, {
          folder,
          public_id: publicId,
        });

        console.log(`Uploaded image to Cloudinary: ${cldResult.secure_url}`);

        return NextResponse.json({
          success: true,
          url: cldResult.secure_url,
          publicId: cldResult.public_id,
          blogId: blogId || null,
          filename: file.name,
        });
      } catch (cldErr) {
        console.error("Cloudinary upload failed, attempting local fallback:", cldErr);
        // Fall through to local fallback below
      }
    }

    // 2. Fallback to Local Storage if Cloudinary is not configured or failed
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
      return NextResponse.json({
        success: true,
        url: relativeUrl,
        blogId: targetBlogId,
        filename,
      });
    }

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
    const { url, blogId, publicId: passedPublicId } = body;

    let deletedAny = false;

    // 1. Delete from Cloudinary if it is a Cloudinary URL or publicId is passed
    if ((url && (url.includes("cloudinary.com") || url.includes("res.cloudinary.com"))) || passedPublicId) {
      const cld = getCloudinary();
      if (cld) {
        try {
          let targetPublicId = passedPublicId;
          if (!targetPublicId && url) {
            // Extract public ID from standard Cloudinary URL:
            // https://res.cloudinary.com/<cloud>/image/upload/(v\d+/)?<public_id>.<ext>
            const match = url.match(/\/upload\/(?:v\d+\/)?([^\.]+)/);
            if (match && match[1]) {
              targetPublicId = match[1];
            }
          }

          if (targetPublicId) {
            await cld.uploader.destroy(targetPublicId);
            deletedAny = true;
            console.log(`Deleted image from Cloudinary: ${targetPublicId}`);
          }
        } catch (cldErr) {
          console.error("Error destroying asset in Cloudinary:", cldErr);
        }
      }
    }

    // 2. Delete local image file if relative URL is provided
    if (url && typeof url === "string" && !url.startsWith("http")) {
      const cleanUrl = url.replace(/^\//, "");
      const normalizedPath = path.normalize(path.join(process.cwd(), "public", cleanUrl));
      const publicDir = path.normalize(path.join(process.cwd(), "public"));

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

    // 3. Clean up blog upload directory if blogId provided and directory is empty
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
      message: deletedAny ? "Image deleted" : "Image path processed",
    });
  } catch (error) {
    console.error("Delete image handler failed:", error);
    return NextResponse.json({ error: error.message || "Failed to delete image" }, { status: 500 });
  }
}
