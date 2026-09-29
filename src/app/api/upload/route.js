import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { verifyToken } from "../db-helper";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary securely, stripping quotes if present
const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.replace(/^["']|["']$/g, "");
const apiKey = process.env.CLOUDINARY_API_KEY?.replace(/^["']|["']$/g, "");
const apiSecret = process.env.CLOUDINARY_API_SECRET?.replace(/^["']|["']$/g, "");

if (cloudName && apiKey && apiSecret) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true
  });
}

export async function POST(request) {
  if (!verifyToken(request)) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 1. Try Cloudinary upload if configured
    if (cloudName && apiKey && apiSecret) {
      try {
        const uploadResult = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            { 
              folder: "ananya_uploads",
              resource_type: "auto"
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          ).end(buffer);
        });

        if (uploadResult && uploadResult.secure_url) {
          console.log("Uploaded successfully to Cloudinary:", uploadResult.secure_url);
          return NextResponse.json({ success: true, url: uploadResult.secure_url });
        }
      } catch (cloudinaryError) {
        console.error("Cloudinary upload failed, trying local fallback:", cloudinaryError);
      }
    }

    // 2. Fallback to local file upload (e.g. for local dev when Cloudinary is not set up)
    console.log("Uploading file locally...");
    const uploadDir = path.join(process.cwd(), "public", "images", "uploads");
    await fs.mkdir(uploadDir, { recursive: true });

    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filename = `${timestamp}_${sanitizedName}`;
    const filePath = path.join(uploadDir, filename);

    await fs.writeFile(filePath, buffer);

    const relativePath = `/images/uploads/${filename}`;
    return NextResponse.json({ success: true, url: relativePath });
  } catch (error) {
    console.error("Upload handler failed:", error);
    return NextResponse.json({ error: error.message || "Failed to upload image" }, { status: 500 });
  }
}
