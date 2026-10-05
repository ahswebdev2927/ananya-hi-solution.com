import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "../../components/Header";
import GlobalFooter from "../../components/GlobalFooter";
import { getDbClient, initDatabaseSchema } from "../../../lib/db";
import ShareButtons from "./ShareButtons";

// Database helper for single article
async function getArticleData(slug) {
  try {
    await initDatabaseSchema();
    const db = getDbClient();

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
      args: [slug, slug],
    });

    if (!result.rows || result.rows.length === 0) {
      return null;
    }

    const blog = result.rows[0];

    // Fetch up to 3 related articles
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
      args: [blog.id, blog.category],
    });

    return {
      blog,
      related: relatedResult.rows || [],
    };
  } catch (error) {
    console.error("Error retrieving blog data:", error);
    return null;
  }
}

// Next.js dynamic metadata for SEO Google Ranking
export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const { slug } = resolvedParams;
  const data = await getArticleData(slug);

  if (!data || !data.blog) {
    return {
      title: "Article Not Found | Ananya Hi Solutions",
      description: "The requested blog article could not be found.",
    };
  }

  const { blog } = data;
  const title = blog.metaTitle || `${blog.title} | Ananya Hi Solutions`;
  const description =
    blog.metaDescription ||
    blog.summary ||
    "Read this article on Ananya Hi Solutions.";
  const canonicalUrl = `https://ananyahisolutions.com/blogs/${blog.slug || blog.id}`;
  const keywords = blog.metaKeywords
    ? blog.metaKeywords.split(",").map((k) => k.trim())
    : [];
  const imageUrl = blog.coverImage
    ? blog.coverImage.startsWith("http")
      ? blog.coverImage
      : `https://ananyahisolutions.com${blog.coverImage}`
    : "https://ananyahisolutions.com/images/hero/digital-marketing.png";

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: "article",
      publishedTime: blog.createdAt || blog.date,
      modifiedTime: blog.updatedAt || blog.createdAt,
      authors: [blog.author || "Ananya Hi Solutions"],
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: blog.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function SingleBlogDetailPage({ params }) {
  const resolvedParams = await params;
  const { slug } = resolvedParams;
  const data = await getArticleData(slug);

  if (!data || !data.blog) {
    notFound();
  }

  const { blog, related } = data;

  // Calculate estimated reading time
  const plainText = (blog.content || "").replace(/<[^>]+>/g, " ");
  const wordCount = plainText.trim().split(/\s+/).filter(Boolean).length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  // JSON-LD structured data for Google
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: blog.metaTitle || blog.title,
    description: blog.metaDescription || blog.summary,
    image: blog.coverImage ? [blog.coverImage] : [],
    datePublished: blog.createdAt || blog.date,
    dateModified: blog.updatedAt || blog.createdAt,
    author: {
      "@type": "Organization",
      name: blog.author || "Ananya Hi Solutions",
    },
    publisher: {
      "@type": "Organization",
      name: "Ananya Hi Solutions",
      logo: {
        "@type": "ImageObject",
        url: "https://ananyahisolutions.com/logo.png",
      },
    },
    keywords: blog.metaKeywords || "",
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Header */}
      <Header activePage="blog" />

      {/* Main Article Container */}
      <main
        className="section-bg-alt flex-1"
        style={{ paddingTop: "130px", paddingBottom: "90px" }}
      >
        <div
          className="container"
          style={{ maxWidth: "960px", margin: "0 auto", padding: "0 20px" }}
        >
          {/* Breadcrumb Navigation */}
          <nav
            aria-label="Breadcrumb"
            style={{ marginBottom: "24px", fontSize: "14px", color: "#64748b" }}
          >
            <ol
              style={{
                listStyle: "none",
                display: "flex",
                flexWrap: "wrap",
                gap: "8px",
                padding: 0,
                margin: 0,
              }}
            >
              <li>
                <Link
                  href="/"
                  style={{ color: "#0f75bc", textDecoration: "none" }}
                >
                  Home
                </Link>
                <span style={{ marginLeft: "8px" }}>/</span>
              </li>
              <li>
                <Link
                  href="/blogs"
                  style={{ color: "#0f75bc", textDecoration: "none" }}
                >
                  Blogs
                </Link>
                <span style={{ marginLeft: "8px" }}>/</span>
              </li>
              <li
                style={{
                  color: "#0f172a",
                  fontWeight: 500,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: "300px",
                }}
              >
                {blog.title}
              </li>
            </ol>
          </nav>

          {/* Article Header */}
          <header style={{ marginBottom: "32px", paddingTop: "8px" }}>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: "10px",
                marginTop: "12px",
                marginBottom: "18px",
              }}
            >
              <span
                style={{
                  background: "rgba(15, 117, 188, 0.1)",
                  color: "#0f75bc",
                  padding: "4px 12px",
                  borderRadius: "16px",
                  fontSize: "13px",
                  fontWeight: 600,
                }}
              >
                {blog.category}
              </span>
              <span style={{ fontSize: "13px", color: "#64748b" }}>•</span>
              <span style={{ fontSize: "13px", color: "#64748b" }}>
                📅 {blog.date}
              </span>
              <span style={{ fontSize: "13px", color: "#64748b" }}>•</span>
              <span style={{ fontSize: "13px", color: "#64748b" }}>
                ⏱️ {readingTime} min read
              </span>
              <span style={{ fontSize: "13px", color: "#64748b" }}>•</span>
              <span style={{ fontSize: "13px", color: "#64748b" }}>
                ✍️ {blog.author}
              </span>
            </div>

            <h1
              style={{
                fontSize: "clamp(28px, 4vw, 42px)",
                fontWeight: 800,
                color: "#0f172a",
                lineHeight: 1.25,
                marginBottom: "20px",
              }}
            >
              {blog.title}
            </h1>

            {/* Teaser Summary / Meta Description Quote */}
            {(blog.metaDescription || blog.summary) && (
              <p
                style={{
                  fontSize: "17px",
                  lineHeight: 1.6,
                  color: "#475569",
                  borderLeft: "4px solid #0f75bc",
                  paddingLeft: "16px",
                  margin: "16px 0 28px",
                  fontStyle: "italic",
                }}
              >
                {blog.metaDescription || blog.summary}
              </p>
            )}

            {/* Featured Image */}
            {blog.coverImage && (
              <div
                style={{
                  width: "100%",
                  maxHeight: "520px",
                  overflow: "hidden",
                  borderRadius: "12px",
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.08)",
                  background: "#f8fafc",
                }}
              >
                <img
                  src={blog.coverImage}
                  alt={blog.title}
                  style={{
                    width: "100%",
                    maxHeight: "520px",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              </div>
            )}
          </header>

          {/* Social Share Bar Top */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              paddingBottom: "20px",
              borderBottom: "1px solid #e2e8f0",
              marginBottom: "32px",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <span
              style={{ fontSize: "14px", fontWeight: 600, color: "#334155" }}
            >
              Share this guide:
            </span>
            <ShareButtons title={blog.title} />
          </div>

          {/* Rich Content Body (ReactQuill HTML output) */}
          <article
            className="article-rich-body"
            dangerouslySetInnerHTML={{ __html: blog.content }}
          />

          {/* Keywords / Tags Section */}
          {blog.metaKeywords && (
            <div
              style={{
                marginTop: "40px",
                paddingTop: "24px",
                borderTop: "1px solid #e2e8f0",
              }}
            >
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#1e293b",
                  marginRight: "10px",
                }}
              >
                Tags & Topics:
              </span>
              <div
                style={{
                  display: "inline-flex",
                  flexWrap: "wrap",
                  gap: "8px",
                  marginTop: "8px",
                }}
              >
                {blog.metaKeywords
                  .split(",")
                  .map((k) => k.trim())
                  .filter(Boolean)
                  .map((keyword, kidx) => (
                    <span
                      key={kidx}
                      style={{
                        fontSize: "12px",
                        padding: "4px 10px",
                        borderRadius: "16px",
                        background: "rgba(15, 117, 188, 0.06)",
                        color: "#0f75bc",
                        fontWeight: 500,
                      }}
                    >
                      #{keyword}
                    </span>
                  ))}
              </div>
            </div>
          )}

          {/* Author Card & Free Consultation CTA */}
          <div
            style={{
              marginTop: "48px",
              padding: "28px",
              background: "#ffffff",
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.04)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                marginBottom: "16px",
              }}
            >
              <div
                style={{
                  width: "54px",
                  height: "54px",
                  borderRadius: "50%",
                  background: "#0f75bc",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "22px",
                  fontWeight: "bold",
                }}
              >
                A
              </div>
              <div>
                <h4
                  style={{
                    margin: 0,
                    fontSize: "17px",
                    fontWeight: 700,
                    color: "#0f172a",
                  }}
                >
                  Published by {blog.author}
                </h4>
                <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
                  Official Engineering & Safety Solutions Research Team
                </p>
              </div>
            </div>

            <p
              style={{
                fontSize: "14px",
                color: "#475569",
                lineHeight: 1.6,
                marginBottom: "20px",
              }}
            >
              Have questions about this topic or looking for customized
              implementations for your project? We are here to help you scale
              securely.
            </p>

            <Link
              href="/contact"
              className="btn btn-accent text-center"
              style={{
                display: "inline-block",
                textDecoration: "none",
                padding: "10px 22px",
                borderRadius: "6px",
                fontWeight: 600,
              }}
            >
              ✉️ Schedule a Free Strategy Session
            </Link>
          </div>

          {/* Related Articles Section */}
          {related && related.length > 0 && (
            <section style={{ marginTop: "60px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "24px",
                }}
              >
                <h3
                  style={{
                    fontSize: "22px",
                    fontWeight: 700,
                    color: "#0f172a",
                    margin: 0,
                  }}
                >
                  Related Articles
                </h3>
                <Link
                  href="/blogs"
                  style={{
                    color: "#0f75bc",
                    fontSize: "14px",
                    fontWeight: 600,
                    textDecoration: "none",
                  }}
                >
                  View All Blogs →
                </Link>
              </div>

              <div
                className="blog-grid"
                style={{
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                }}
              >
                {related.map((rel) => (
                  <article key={rel.id} className="blog-card-frontend">
                    <Link
                      href={`/blogs/${rel.slug || rel.id}`}
                      className="blog-card-img-wrapper"
                      style={{ display: "block" }}
                    >
                      {rel.coverImage ? (
                        <img
                          src={rel.coverImage}
                          alt={rel.title}
                          className="blog-card-img"
                          loading="lazy"
                        />
                      ) : (
                        <div className="blog-card-img-placeholder"></div>
                      )}
                      <span className="blog-card-img-badge">
                        {rel.category}
                      </span>
                    </Link>

                    <div className="blog-card-frontend-content">
                      <div>
                        <div className="blog-card-frontend-meta">
                          <span>📅 {rel.date}</span>
                        </div>
                        <h3 className="blog-card-frontend-title">
                          <Link
                            href={`/blogs/${rel.slug || rel.id}`}
                            style={{ color: "inherit", textDecoration: "none" }}
                          >
                            {rel.title}
                          </Link>
                        </h3>
                        <p className="blog-card-frontend-summary">
                          {rel.metaDescription || rel.summary}
                        </p>
                      </div>

                      <Link
                        href={`/blogs/${rel.slug || rel.id}`}
                        className="blog-card-frontend-link"
                        style={{ textDecoration: "none", fontWeight: 600 }}
                      >
                        Read Article →
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      {/* Footer */}
      <GlobalFooter />
    </div>
  );
}
