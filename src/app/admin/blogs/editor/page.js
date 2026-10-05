"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import QuillEditor from "../../../components/QuillEditor";

// Helper to convert date strings (e.g. "Oct 5, 2026", "2026-10-05") into "YYYY-MM-DD" for HTML date inputs
const toInputDateFormat = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

function BlogEditorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");
  const fileInputRef = useRef(null);

  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState({ text: "", type: "success" });

  // Blog Fields
  const [blogId, setBlogId] = useState("");
  const [blogTitle, setBlogTitle] = useState("");
  const [blogSlug, setBlogSlug] = useState("");
  const [blogCategory, setBlogCategory] = useState("Technology");
  const [blogAuthor, setBlogAuthor] = useState("Ananya Hi Solutions");
  const [blogDate, setBlogDate] = useState("");
  const [blogCoverImage, setBlogCoverImage] = useState("");
  const [blogContent, setBlogContent] = useState("");
  const [blogMetaTitle, setBlogMetaTitle] = useState("");
  const [blogMetaDescription, setBlogMetaDescription] = useState("");
  const [blogMetaKeywords, setBlogMetaKeywords] = useState("");

  // Image Upload / External URL State
  const [imageSourceTab, setImageSourceTab] = useState("url"); // "url" (default) | "upload"
  const [externalImageUrl, setExternalImageUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // Quick categories
  const POPULAR_CATEGORIES = [
    "Technology",
    "Web Development",
    "Digital Marketing",
    "Invisible Grills",
    "Home Safety",
    "Software Engineering"
  ];

  // Helper Toast
  const showToast = (text, type = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage({ text: "", type: "success" }), 4000);
  };

  // Auth & Load Blog Data
  useEffect(() => {
    const token = localStorage.getItem("ananya_admin_token");
    if (token !== "ananya-secure-admin-token-2026") {
      router.push("/admin/login");
      return;
    }
    setIsAuthorized(true);

    const initData = async () => {
      setLoading(true);
      try {
        if (editId) {
          // Fetch existing blog to edit
          const res = await fetch(`/api/blogs/${editId}`);
          if (!res.ok) {
            throw new Error("Failed to load blog article");
          }
          const data = await res.json();
          const post = data.blog;
          if (post) {
            setBlogId(post.id);
            setBlogTitle(post.title || "");
            setBlogSlug(post.slug || "");
            setBlogCategory(post.category || "Technology");
            const defaultDateOptions = { year: "numeric", month: "short", day: "numeric" };
            const defaultDate = new Date().toLocaleDateString("en-US", defaultDateOptions);
            setBlogDate(post.date || defaultDate);
            setBlogCoverImage(post.coverImage || "");
            if (post.coverImage && post.coverImage.startsWith("/uploads/")) {
              setImageSourceTab("upload");
              setExternalImageUrl("");
            } else {
              setImageSourceTab("url");
              setExternalImageUrl(post.coverImage || "");
            }
            setBlogContent(post.content || "");
            setBlogMetaTitle(post.metaTitle || post.title || "");
            setBlogMetaDescription(post.metaDescription || post.summary || "");
            setBlogMetaKeywords(post.metaKeywords || "");
          }
        } else {
          // Add new blog: Generate next ID
          const res = await fetch("/api/blogs");
          if (res.ok) {
            const allBlogs = await res.json();
            const existingIds = (allBlogs || []).map((b) => b.id);
            const maxNum = existingIds.reduce((max, id) => {
              const match = String(id).match(/\d+/);
              return match ? Math.max(max, parseInt(match[0], 10)) : max;
            }, 0);
            setBlogId("post-" + (maxNum + 1));
          } else {
            setBlogId("post-" + Date.now());
          }
          const options = { year: "numeric", month: "short", day: "numeric" };
          setBlogDate(new Date().toLocaleDateString("en-US", options));
        }
      } catch (err) {
        console.error(err);
        showToast("Error loading blog details from database", "error");
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, [router, editId]);

  // Title change handler with auto-slugify
  const handleTitleChange = (val) => {
    setBlogTitle(val);
    if (!editId) {
      const autoSlug = val
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
      setBlogSlug(autoSlug);
      if (!blogMetaTitle || blogMetaTitle === blogTitle) {
        setBlogMetaTitle(val);
      }
    }
  };

  // Document extractor (.docx / .pdf)
  const handleDocumentUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileType = file.name.split(".").pop().toLowerCase();
    showToast("Extracting document content...", "success");

    try {
      if (fileType === "docx") {
        if (!window.mammoth) {
          const script = document.createElement("script");
          script.src = "https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js";
          await new Promise((resolve) => {
            script.onload = resolve;
            document.body.appendChild(script);
          });
        }

        const reader = new FileReader();
        reader.onload = (event) => {
          window.mammoth
            .extractRawText({ arrayBuffer: event.target.result })
            .then((result) => {
              const text = result.value;
              const formattedHtml = text
                .split(/\n\s*\n/)
                .filter((p) => p.trim())
                .map((p) => `<p>${p.trim()}</p>`)
                .join("");
              setBlogContent(formattedHtml || `<p>${text}</p>`);
              const snippet = text.replace(/\s+/g, " ").trim().slice(0, 160);
              if (!blogMetaDescription) setBlogMetaDescription(snippet);
              showToast("Extracted .docx paragraphs into editor!", "success");
            });
        };
        reader.readAsArrayBuffer(file);
      } else if (fileType === "pdf") {
        if (!window["pdfjs-dist/build/pdf"]) {
          const script = document.createElement("script");
          script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js";
          await new Promise((resolve) => {
            script.onload = resolve;
            document.body.appendChild(script);
          });
        }

        const reader = new FileReader();
        reader.onload = async (event) => {
          const typedarray = new Uint8Array(event.target.result);
          const pdfjsLib = window["pdfjs-dist/build/pdf"];
          pdfjsLib.GlobalWorkerOptions.workerSrc =
            "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js";

          const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise;
          let fullText = "";
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            fullText += textContent.items.map((item) => item.str).join(" ") + "\n\n";
          }
          const formattedHtml = fullText
            .split(/\n\s*\n/)
            .filter((p) => p.trim())
            .map((p) => `<p>${p.trim()}</p>`)
            .join("");
          setBlogContent(formattedHtml || `<p>${fullText}</p>`);
          const snippet = fullText.replace(/\s+/g, " ").trim().slice(0, 160);
          if (!blogMetaDescription) setBlogMetaDescription(snippet);
          showToast("Extracted .pdf text into editor!", "success");
        };
        reader.readAsArrayBuffer(file);
      }
    } catch (err) {
      console.error(err);
      showToast("Error parsing file", "error");
    }
  };

  // Image Upload Handler to public/uploads/blogs/[id]/[filename] with Progress
  const handleImageUpload = () => {
    if (!selectedFile) {
      showToast("Please choose an image file first (.jpg, .png, .webp)", "error");
      return;
    }

    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!validTypes.includes(selectedFile.type) && !/\.(jpe?g|png|webp)$/i.test(selectedFile.name)) {
      showToast("Only .jpg, .png, and .webp images are allowed.", "error");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("type", "blog");
    formData.append("blogId", blogId || `post-${Date.now()}`);

    const token = localStorage.getItem("ananya_admin_token");
    const xhr = new XMLHttpRequest();

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        setUploadProgress(percent);
      }
    };

    xhr.onload = () => {
      setIsUploading(false);
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300 && data.success) {
          setBlogCoverImage(data.url);
          setUploadProgress(100);
          showToast("Featured image uploaded successfully to server!");
        } else {
          showToast(data.error || "Failed to upload image", "error");
        }
      } catch {
        showToast("Error processing upload response", "error");
      }
    };

    xhr.onerror = () => {
      setIsUploading(false);
      showToast("Network error uploading image", "error");
    };

    xhr.open("POST", "/api/upload", true);
    if (token) {
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    }
    xhr.send(formData);
  };

  // Apply external image URL
  const handleApplyExternalUrl = () => {
    const trimmed = externalImageUrl.trim();
    if (!trimmed) {
      showToast("Please enter an image URL", "error");
      return;
    }
    if (!/^https?:\/\//i.test(trimmed)) {
      showToast("URL must start with http:// or https://", "error");
      return;
    }
    setBlogCoverImage(trimmed);
    showToast("External image applied!", "success");
  };

  // Remove featured image handler (also deletes file from server if locally uploaded)
  const handleRemoveImage = async () => {
    if (!blogCoverImage && !selectedFile && !externalImageUrl) return;

    const imageToDelete = blogCoverImage;
    const token = typeof window !== "undefined" ? localStorage.getItem("ananya_admin_token") : null;

    if (imageToDelete && imageToDelete.startsWith("/uploads/")) {
      try {
        const res = await fetch("/api/upload", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ url: imageToDelete, blogId })
        });
        if (res.ok) {
          showToast("Image deleted from server", "success");
        } else {
          const data = await res.json().catch(() => ({}));
          showToast(data.error || "Failed to delete image from server", "error");
        }
      } catch (err) {
        console.error("Error deleting image from server:", err);
        showToast("Network error deleting image from server", "error");
      }
    } else {
      showToast("Featured image cleared", "success");
    }

    setBlogCoverImage("");
    setExternalImageUrl("");
    setSelectedFile(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!blogTitle.trim()) {
      showToast("Article title is required", "error");
      return;
    }
    if (!blogContent.trim()) {
      showToast("Article body content cannot be empty", "error");
      return;
    }

    setSaving(true);
    const token = localStorage.getItem("ananya_admin_token");

    const payload = {
      id: blogId,
      title: blogTitle.trim(),
      slug: blogSlug.trim() || undefined,
      category: blogCategory.trim(),
      author: blogAuthor.trim() || "Ananya Hi Solutions",
      date: blogDate,
      coverImage: blogCoverImage,
      content: blogContent,
      summary: (blogMetaDescription || blogTitle).trim().slice(0, 250),
      metaTitle: (blogMetaTitle || blogTitle).trim(),
      metaDescription: blogMetaDescription.trim(),
      metaKeywords: blogMetaKeywords.trim(),
    };

    try {
      const method = editId ? "PUT" : "POST";
      const res = await fetch("/api/blogs", {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && (data.success || data.blog)) {
        showToast(
          editId ? "Article updated successfully!" : "Article published successfully!",
          "success"
        );
        setTimeout(() => {
          router.push("/admin?tab=blogs");
        }, 1200);
      } else {
        showToast(data.error || "Failed to save blog post", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Network error saving article", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("ananya_admin_token");
    router.push("/admin/login");
  };

  if (!isAuthorized) {
    return (
      <div className="admin-loading-screen">
        <span className="spinner-dashboard"></span>
        <p>Verifying admin credentials...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-container">
      {/* Toast Notification */}
      {toastMessage.text && (
        <div className={`admin-toast ${toastMessage.type === "error" ? "error" : "success"}`}>
          <span className="toast-icon">{toastMessage.type === "error" ? "⚠️" : "✨"}</span>
          <p>{toastMessage.text}</p>
        </div>
      )}

      {/* 1. Admin Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <img src="/logo.png" alt="Ananya Hi Solutions" className="admin-sidebar-logo" />
          <span className="admin-sidebar-badge">CONTROL PANEL</span>
        </div>

        <nav className="admin-sidebar-nav">
          <Link href="/admin?tab=overview" className="admin-nav-item" style={{ textDecoration: "none" }}>
            <span className="nav-icon">📊</span> Overview
          </Link>
          <Link href="/admin?tab=services" className="admin-nav-item" style={{ textDecoration: "none" }}>
            <span className="nav-icon">🌐</span> Services List
          </Link>
          <Link href="/admin?tab=careers" className="admin-nav-item" style={{ textDecoration: "none" }}>
            <span className="nav-icon">💼</span> Careers / Jobs
          </Link>
          <Link href="/admin?tab=blogs" className="admin-nav-item active" style={{ textDecoration: "none" }}>
            <span className="nav-icon">📰</span> News & Blogs
          </Link>
          <Link href="/admin?tab=packages" className="admin-nav-item" style={{ textDecoration: "none" }}>
            <span className="nav-icon">📦</span> Packages & Plans
          </Link>
          <Link href="/admin?tab=banners" className="admin-nav-item" style={{ textDecoration: "none" }}>
            <span className="nav-icon">🖼️</span> Homepage Banners
          </Link>
          <Link href="/admin?tab=marquee-logos" className="admin-nav-item" style={{ textDecoration: "none" }}>
            <span className="nav-icon">✨</span> Scroll Logos
          </Link>
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-user-profile">
            <span className="user-avatar">👤</span>
            <div className="user-meta">
              <span className="user-name">Administrator</span>
              <span className="user-role">Security Level: Full</span>
            </div>
          </div>
          <button className="admin-logout-btn" onClick={handleLogout}>
            🚪 Sign Out
          </button>
        </div>
      </aside>

      {/* 2. Main Content */}
      <main className="admin-main-panel" style={{ background: "#f8fafc", minHeight: "100vh" }}>
        {/* Top Header */}
        <header className="admin-main-header" style={{ background: "#ffffff", borderBottom: "1px solid #e2e8f0" }}>
          <div className="header-breadcrumbs">
            <Link href="/admin?tab=blogs" style={{ color: "#0f75bc", textDecoration: "none" }}>
              Admin / Blogs
            </Link>{" "}
            / <span className="active-breadcrumb">{editId ? "Edit Article" : "Publish New Article"}</span>
          </div>
          <div className="header-actions" style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <Link
              href="/admin?tab=blogs"
              className="admin-btn"
              style={{
                textDecoration: "none",
                background: "#f1f5f9",
                color: "#475569",
                padding: "8px 16px",
                borderRadius: "6px",
                fontSize: "13px",
                fontWeight: 600
              }}
            >
              ← Back to Blogs List
            </Link>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="admin-btn btn-primary-custom"
              style={{ padding: "8px 20px", fontSize: "13px" }}
            >
              {saving ? "💾 Saving..." : editId ? "💾 Update Article" : "🚀 Publish Article"}
            </button>
          </div>
        </header>

        {loading ? (
          <div className="admin-tab-loading">
            <span className="spinner-dashboard"></span>
            <p>Loading article data...</p>
          </div>
        ) : (
          <div style={{ maxWidth: "1300px", margin: "0 auto", padding: "30px 24px" }}>
            <form onSubmit={handleSubmit}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "24px", alignItems: "start" }}>
                
                {/* LEFT / MAIN COLUMN */}
                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                  
                  {/* Title & Slug Card */}
                  <div style={{ background: "#fff", padding: "24px", borderRadius: "10px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                    <div className="modal-form-group" style={{ marginBottom: "18px" }}>
                      <label htmlFor="blog-title" style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a", marginBottom: "6px", display: "block" }}>
                        Blog Title <span style={{ color: "#ef4444" }}>*</span>
                      </label>
                      <input
                        id="blog-title"
                        type="text"
                        value={blogTitle}
                        onChange={(e) => handleTitleChange(e.target.value)}
                        placeholder="Type a unique, descriptive blog title (e.g., Invisible Grills for Balconies & Windows | InvHub Guide)"
                        required
                        style={{
                          width: "100%",
                          fontSize: "18px",
                          fontWeight: 600,
                          padding: "12px 14px",
                          borderRadius: "8px",
                          border: "1px solid #cbd5e1"
                        }}
                      />
                    </div>

                    <div className="modal-form-group" style={{ marginBottom: 0 }}>
                      <label htmlFor="blog-slug" style={{ fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "4px", display: "block" }}>
                        Permalink URL Slug
                      </label>
                      <div style={{ display: "flex", alignItems: "center", background: "#f8fafc", borderRadius: "6px", border: "1px solid #cbd5e1", overflow: "hidden" }}>
                        <span style={{ padding: "8px 12px", background: "#f1f5f9", color: "#64748b", fontSize: "13px", borderRight: "1px solid #cbd5e1", fontFamily: "monospace" }}>
                          /blogs/
                        </span>
                        <input
                          id="blog-slug"
                          type="text"
                          value={blogSlug}
                          onChange={(e) => setBlogSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                          placeholder="invisible-grills-for-balconies-windows"
                          style={{
                            flex: 1,
                            border: "none",
                            padding: "8px 12px",
                            fontSize: "13px",
                            background: "transparent",
                            outline: "none"
                          }}
                        />
                      </div>
                      <small style={{ color: "#64748b", fontSize: "11px", marginTop: "4px", display: "block" }}>
                        Search engines crawl this clean URL. Auto-generated from title, or customizable.
                      </small>
                    </div>
                  </div>

                  {/* Blog Body (Rich Text Editor) */}
                  <div style={{ background: "#fff", padding: "24px", borderRadius: "10px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", flexWrap: "wrap", gap: "10px" }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#0f172a" }}>
                          Blog Body (Rich Text Content) <span style={{ color: "#ef4444" }}>*</span>
                        </h3>
                        <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748b" }}>
                          Use the ReactQuill text editor to write, format headings (H1, H2, H3), bold/italicize text, add bullet points, blockquotes, or hyperlink texts.
                        </p>
                      </div>

                      {/* Optional Document Extractor */}
                      <div>
                        <label
                          htmlFor="blog-doc-import"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            background: "rgba(234, 88, 12, 0.08)",
                            color: "#ea580c",
                            border: "1px dashed #ea580c",
                            padding: "5px 12px",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: 600,
                            cursor: "pointer"
                          }}
                        >
                          📄 Import .docx / .pdf
                        </label>
                        <input
                          id="blog-doc-import"
                          type="file"
                          accept=".docx,.pdf"
                          onChange={handleDocumentUpload}
                          style={{ display: "none" }}
                        />
                      </div>
                    </div>

                    <div style={{ marginTop: "16px" }}>
                      <QuillEditor
                        value={blogContent}
                        onChange={setBlogContent}
                        placeholder="Write your comprehensive, informative guide here..."
                      />
                    </div>
                  </div>

                  {/* SEO Metadata Card */}
                  <div style={{
                    background: "#fff",
                    padding: "24px",
                    borderRadius: "10px",
                    border: "1px solid rgba(15, 117, 188, 0.2)",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px", paddingBottom: "12px", borderBottom: "1px solid #f1f5f9" }}>
                      <span style={{ fontSize: "22px" }}>🎯</span>
                      <div>
                        <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#0f172a" }}>
                          SEO Metadata (Crucial for Google Ranking)
                        </h3>
                        <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>
                          Ensure this blog ranks well on Google Search and renders properly when shared on social media.
                        </p>
                      </div>
                    </div>

                    {/* Meta Title */}
                    <div className="modal-form-group" style={{ marginBottom: "16px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                        <label htmlFor="meta-title" style={{ fontSize: "13px", fontWeight: 600, color: "#334155" }}>
                          Meta Title
                        </label>
                        <span style={{ fontSize: "11px", color: blogMetaTitle.length > 60 ? "#ef4444" : "#64748b" }}>
                          {blogMetaTitle.length} / 60 chars (Recommended: 50-60)
                        </span>
                      </div>
                      <input
                        id="meta-title"
                        type="text"
                        value={blogMetaTitle}
                        onChange={(e) => setBlogMetaTitle(e.target.value)}
                        placeholder="e.g. Invisible Grills for Balconies & Windows | InvHub Guide"
                        style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                      />
                    </div>

                    {/* Meta Description */}
                    <div className="modal-form-group" style={{ marginBottom: "16px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                        <label htmlFor="meta-desc" style={{ fontSize: "13px", fontWeight: 600, color: "#334155" }}>
                          Meta Description
                        </label>
                        <span style={{
                          fontSize: "11px",
                          fontWeight: 500,
                          color: blogMetaDescription.length > 160 ? "#ef4444" : (blogMetaDescription.length >= 130 ? "#16a34a" : "#64748b")
                        }}>
                          {blogMetaDescription.length} / 160 chars (Recommended: 150-160)
                        </span>
                      </div>
                      <textarea
                        id="meta-desc"
                        value={blogMetaDescription}
                        onChange={(e) => setBlogMetaDescription(e.target.value)}
                        placeholder="Concise summary (150-160 characters) explaining what the blog is about. This is also shown on the /blogs card preview."
                        rows="3"
                        style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", lineHeight: 1.5 }}
                      ></textarea>
                    </div>

                    {/* Meta Keywords */}
                    <div className="modal-form-group" style={{ marginBottom: 0 }}>
                      <label htmlFor="meta-keywords" style={{ fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "4px", display: "block" }}>
                        Meta Keywords
                      </label>
                      <input
                        id="meta-keywords"
                        type="text"
                        value={blogMetaKeywords}
                        onChange={(e) => setBlogMetaKeywords(e.target.value)}
                        placeholder="Target keywords separated by commas (e.g. invisible grill, balcony safety, mesh door, InvHub)"
                        style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                      />
                      {blogMetaKeywords && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "10px" }}>
                          {blogMetaKeywords
                            .split(",")
                            .map((k) => k.trim())
                            .filter(Boolean)
                            .map((keyword, kidx) => (
                              <span
                                key={kidx}
                                style={{
                                  fontSize: "11px",
                                  padding: "3px 10px",
                                  background: "rgba(15, 117, 188, 0.08)",
                                  color: "#0f75bc",
                                  borderRadius: "14px",
                                  fontWeight: 500
                                }}
                              >
                                #{keyword}
                              </span>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>

                </div>

                {/* RIGHT / SIDEBAR COLUMN */}
                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                  
                  {/* Category & Author Card */}
                  <div style={{ background: "#fff", padding: "20px", borderRadius: "10px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                    <h4 style={{ margin: "0 0 12px", fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>
                      Category & Author
                    </h4>

                    <div className="modal-form-group" style={{ marginBottom: "14px" }}>
                      <label htmlFor="cat-input" style={{ fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "4px", display: "block" }}>
                        Category <span style={{ color: "#ef4444" }}>*</span>
                      </label>
                      <input
                        id="cat-input"
                        type="text"
                        value={blogCategory}
                        onChange={(e) => setBlogCategory(e.target.value)}
                        placeholder="e.g. Technology"
                        required
                        style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                      />

                      {/* Quick category badges */}
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "8px" }}>
                        {POPULAR_CATEGORIES.map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setBlogCategory(cat)}
                            style={{
                              padding: "2px 8px",
                              borderRadius: "12px",
                              fontSize: "11px",
                              border: blogCategory === cat ? "1px solid #0f75bc" : "1px solid #e2e8f0",
                              background: blogCategory === cat ? "#0f75bc" : "#f8fafc",
                              color: blogCategory === cat ? "#fff" : "#475569",
                              cursor: "pointer"
                            }}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="modal-form-group" style={{ marginBottom: 0 }}>
                      <label htmlFor="author-input" style={{ fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "4px", display: "block" }}>
                        Author Name
                      </label>
                      <input
                        id="author-input"
                        type="text"
                        value={blogAuthor}
                        onChange={(e) => setBlogAuthor(e.target.value)}
                        placeholder="e.g. Ananya Hi Solutions"
                        style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                      />
                    </div>
                  </div>

                  {/* Featured Image Card (Upload or External URL) */}
                  <div style={{ background: "#fff", padding: "20px", borderRadius: "10px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                    <h4 style={{ margin: "0 0 12px", fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>
                      Featured Image
                    </h4>

                    {/* Source Toggle Tabs */}
                    <div style={{ display: "flex", background: "#f1f5f9", borderRadius: "8px", padding: "3px", marginBottom: "14px" }}>
                      <button
                        type="button"
                        onClick={() => setImageSourceTab("url")}
                        style={{
                          flex: 1,
                          padding: "6px 10px",
                          fontSize: "12px",
                          fontWeight: imageSourceTab === "url" ? 700 : 500,
                          background: imageSourceTab === "url" ? "#ffffff" : "transparent",
                          color: imageSourceTab === "url" ? "#0f75bc" : "#64748b",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                          boxShadow: imageSourceTab === "url" ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
                          transition: "all 0.15s ease"
                        }}
                      >
                        🔗 External URL
                      </button>
                      <button
                        type="button"
                        onClick={() => setImageSourceTab("upload")}
                        style={{
                          flex: 1,
                          padding: "6px 10px",
                          fontSize: "12px",
                          fontWeight: imageSourceTab === "upload" ? 700 : 500,
                          background: imageSourceTab === "upload" ? "#ffffff" : "transparent",
                          color: imageSourceTab === "upload" ? "#0f75bc" : "#64748b",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                          boxShadow: imageSourceTab === "upload" ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
                          transition: "all 0.15s ease"
                        }}
                      >
                        📁 Upload File
                      </button>
                    </div>

                    {/* Mode 1: External Image URL (Default) */}
                    {imageSourceTab === "url" && (
                      <div>
                        <label htmlFor="ext-img-input" style={{ fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "4px", display: "block" }}>
                          External Image URL
                        </label>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <input
                            id="ext-img-input"
                            type="url"
                            value={externalImageUrl}
                            onChange={(e) => {
                              const val = e.target.value;
                              setExternalImageUrl(val);
                              if (!val) {
                                setBlogCoverImage("");
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleApplyExternalUrl();
                              }
                            }}
                            placeholder="https://images.unsplash.com/... or https://..."
                            style={{
                              flex: 1,
                              padding: "8px 10px",
                              borderRadius: "6px",
                              border: "1px solid #cbd5e1",
                              fontSize: "12px",
                              color: "#0f172a"
                            }}
                          />
                          <button
                            type="button"
                            onClick={handleApplyExternalUrl}
                            className="admin-btn btn-primary-custom"
                            style={{ padding: "8px 12px", fontSize: "12px" }}
                          >
                            Set
                          </button>
                        </div>
                        <p style={{ margin: "8px 0 0", fontSize: "11px", color: "#64748b", lineHeight: 1.4 }}>
                          Paste any direct image link (.jpg, .png, .webp, Unsplash, Cloudinary, etc.) and click <strong>Set</strong>.
                        </p>
                      </div>
                    )}

                    {/* Mode 2: Local Upload */}
                    {imageSourceTab === "upload" && (
                      <div>
                        <p style={{ margin: "0 0 10px", fontSize: "11px", color: "#64748b", lineHeight: 1.5 }}>
                          Choose file (.jpg, .png, .webp). Stored locally in <code>public/uploads/blogs/{blogId || "id"}/</code>.
                        </p>

                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                          onChange={(e) => {
                            const f = e.target.files[0];
                            if (f) {
                              setSelectedFile(f);
                              setUploadProgress(0);
                            }
                          }}
                          style={{
                            width: "100%",
                            fontSize: "12px",
                            padding: "6px",
                            border: "1px dashed rgba(15, 117, 188, 0.4)",
                            borderRadius: "6px",
                            background: "rgba(15, 117, 188, 0.02)",
                            marginBottom: "10px"
                          }}
                        />

                        <button
                          type="button"
                          onClick={handleImageUpload}
                          disabled={!selectedFile || isUploading}
                          className="admin-btn btn-primary-custom"
                          style={{
                            width: "100%",
                            justifyContent: "center",
                            padding: "8px",
                            fontSize: "12px",
                            cursor: !selectedFile || isUploading ? "not-allowed" : "pointer",
                            opacity: !selectedFile || isUploading ? 0.6 : 1
                          }}
                        >
                          {isUploading ? "⏳ Uploading..." : "⬆️ Upload Image"}
                        </button>

                        {/* Progress Bar */}
                        {(isUploading || (uploadProgress > 0 && uploadProgress < 100)) && (
                          <div style={{ marginTop: "12px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "3px", color: "#0f75bc", fontWeight: 600 }}>
                              <span>Uploading...</span>
                              <span>{uploadProgress}%</span>
                            </div>
                            <div style={{ width: "100%", height: "6px", background: "#e2e8f0", borderRadius: "3px", overflow: "hidden" }}>
                              <div
                                style={{
                                  width: `${uploadProgress}%`,
                                  height: "100%",
                                  background: "linear-gradient(90deg, #0f75bc, #22c55e)",
                                  transition: "width 0.2s ease"
                                }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Image Preview */}
                    {blogCoverImage && (
                      <div style={{ marginTop: "14px", border: "1px solid #e2e8f0", borderRadius: "6px", overflow: "hidden" }}>
                        <img
                          src={blogCoverImage}
                          alt="Featured Cover Preview"
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                          style={{ width: "100%", height: "140px", objectFit: "cover", display: "block" }}
                        />
                        <div style={{ padding: "8px 10px", background: "#f8fafc", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{
                            fontSize: "11px",
                            fontWeight: 600,
                            color: blogCoverImage.startsWith("http") ? "#0284c7" : "#16a34a"
                          }}>
                            {blogCoverImage.startsWith("http") ? "🌐 External URL" : "✓ Local Server Image"}
                          </span>
                          <button
                            type="button"
                            onClick={handleRemoveImage}
                            title={blogCoverImage.startsWith("http") ? "Remove image URL" : "Delete image from server"}
                            style={{ background: "transparent", border: "none", color: "#ef4444", fontSize: "11px", cursor: "pointer", fontWeight: 600 }}
                          >
                            ✕ Remove
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Publishing Action Box (Bottom / Last Option) */}
                  <div style={{ background: "#fff", padding: "20px", borderRadius: "10px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                    <h4 style={{ margin: "0 0 12px", fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>
                      Publish Settings
                    </h4>
                    
                    <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span><strong>Post ID:</strong> <code>{blogId || "auto-generated"}</code></span>
                        <span><strong>Status:</strong> <span style={{ color: "#16a34a", fontWeight: 600 }}>Active</span></span>
                      </div>
                      
                      <div style={{ background: "#f8fafc", padding: "10px 12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                          <label htmlFor="publish-date-input" style={{ fontSize: "12px", fontWeight: 700, color: "#334155" }}>
                            📅 Publish Date
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              const options = { year: "numeric", month: "short", day: "numeric" };
                              setBlogDate(new Date().toLocaleDateString("en-US", options));
                            }}
                            style={{
                              background: "none",
                              border: "none",
                              color: "#0f75bc",
                              fontSize: "11px",
                              fontWeight: 600,
                              cursor: "pointer",
                              padding: "0 2px"
                            }}
                            title="Reset to current date"
                          >
                            Set to Current Date
                          </button>
                        </div>
                        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                          <input
                            id="publish-date-input"
                            type="text"
                            value={blogDate}
                            onChange={(e) => setBlogDate(e.target.value)}
                            placeholder="e.g. Oct 5, 2026"
                            style={{
                              flex: 1,
                              padding: "7px 10px",
                              borderRadius: "6px",
                              border: "1px solid #cbd5e1",
                              fontSize: "12px",
                              color: "#0f172a",
                              background: "#ffffff"
                            }}
                          />
                          <input
                            type="date"
                            title="Pick from calendar"
                            value={toInputDateFormat(blogDate)}
                            onChange={(e) => {
                              if (e.target.value) {
                                const [yyyy, mm, dd] = e.target.value.split("-");
                                const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
                                const options = { year: "numeric", month: "short", day: "numeric" };
                                setBlogDate(d.toLocaleDateString("en-US", options));
                              }
                            }}
                            style={{
                              width: "36px",
                              height: "33px",
                              padding: "4px",
                              borderRadius: "6px",
                              border: "1px solid #cbd5e1",
                              cursor: "pointer",
                              background: "#ffffff"
                            }}
                          />
                        </div>
                        <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px" }}>
                          Type any custom date or pick from calendar. Defaults to current date.
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={saving}
                        className="admin-btn btn-primary-custom"
                        style={{ width: "100%", justifyContent: "center", padding: "10px" }}
                      >
                        {saving ? "💾 Saving..." : editId ? "💾 Update Article" : "🚀 Publish Article"}
                      </button>

                      <Link
                        href="/admin?tab=blogs"
                        className="admin-btn"
                        style={{
                          width: "100%",
                          textAlign: "center",
                          textDecoration: "none",
                          background: "#f1f5f9",
                          color: "#475569",
                          padding: "8px",
                          borderRadius: "6px",
                          fontSize: "13px"
                        }}
                      >
                        Cancel
                      </Link>
                    </div>
                  </div>

                </div>

              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}

export default function BlogEditorPage() {
  return (
    <Suspense
      fallback={
        <div className="admin-loading-screen">
          <span className="spinner-dashboard"></span>
          <p>Loading editor...</p>
        </div>
      }
    >
      <BlogEditorContent />
    </Suspense>
  );
}
