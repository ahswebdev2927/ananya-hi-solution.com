"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Header from "../components/Header";
import GlobalFooter from "../components/GlobalFooter";

export default function BlogsPage() {
  const [blogs, setBlogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const res = await fetch("/api/blogs");
        if (res.ok) {
          const data = await res.json();
          setBlogs(data);
        }
      } catch (err) {
        console.error("Failed to load blogs:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBlogs();
  }, []);

  // Compute categories
  const categories = useMemo(() => {
    const cats = new Set(["All"]);
    blogs.forEach((b) => {
      if (b.category) cats.add(b.category.trim());
    });
    return Array.from(cats);
  }, [blogs]);

  // Filtered blogs
  const filteredBlogs = useMemo(() => {
    return blogs.filter((post) => {
      const matchCat =
        selectedCategory === "All" ||
        post.category?.toLowerCase() === selectedCategory.toLowerCase();
      const matchQuery =
        !searchQuery ||
        post.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.metaDescription?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.metaKeywords?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [blogs, selectedCategory, searchQuery]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* 1. Header & Navigation Bar */}
      <Header activePage="blog" />

      {/* 2. Hero Section */}
      <section className="page-hero">
        <div
          className="page-hero-bg"
          style={{ backgroundImage: "url('/images/hero/digital-marketing.png')" }}
        />
        <div className="page-hero-overlay"></div>
        <div className="page-hero-content container animate-slide-in">
          <h1>
            Ananya <span>Insights & Blog</span>
          </h1>
          <p>
            Explore expert guides, cutting-edge software practices, digital growth frameworks, and modern safety solutions.
          </p>
        </div>
      </section>

      {/* 3. Search and Category Filter Bar */}
      <section style={{ padding: "45px 0", background: "rgba(15, 117, 188, 0.02)", borderBottom: "1px solid rgba(15, 117, 188, 0.08)" }}>
        <div className="container" style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 20px" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", justifyContent: "space-between", alignItems: "center" }}>
            {/* Category pills */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "20px",
                    fontSize: "13px",
                    fontWeight: 500,
                    cursor: "pointer",
                    border: selectedCategory === cat ? "1px solid #0f75bc" : "1px solid #cbd5e1",
                    background: selectedCategory === cat ? "#0f75bc" : "#ffffff",
                    color: selectedCategory === cat ? "#ffffff" : "#475569",
                    transition: "all 0.2s ease"
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div style={{ minWidth: "260px" }}>
              <input
                type="text"
                placeholder="🔍 Search articles or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 14px",
                  borderRadius: "20px",
                  border: "1px solid #cbd5e1",
                  fontSize: "13px",
                  outline: "none",
                  background: "#ffffff"
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* 4. Blog listings Grid */}
      <section className="section section-bg-alt" style={{ flex: 1, padding: "50px 0 90px" }}>
        <div className="container" style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 20px" }}>
          <style
            dangerouslySetInnerHTML={{
              __html: `
            @keyframes shimmer {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(100%); }
            }
            .skeleton-shimmer-container {
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background: linear-gradient(
                90deg,
                rgba(255, 255, 255, 0) 0%,
                rgba(255, 255, 255, 0.4) 30%,
                rgba(255, 255, 255, 0.4) 60%,
                rgba(255, 255, 255, 0) 100%
              );
              animation: shimmer 1.5s infinite;
            }
          `,
            }}
          />

          <div className="blog-grid">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, idx) => (
                <div key={idx} className="blog-card-frontend" style={{ pointerEvents: "none" }}>
                  <div
                    className="blog-card-img-wrapper"
                    style={{ background: "#e2e8f0", position: "relative", overflow: "hidden" }}
                  >
                    <div className="skeleton-shimmer-container"></div>
                  </div>
                  <div className="blog-card-frontend-content">
                    <div>
                      <div className="blog-card-frontend-meta" style={{ gap: "15px" }}>
                        <span style={{ width: "80px", height: "14px", background: "#e2e8f0", borderRadius: "4px" }}></span>
                        <span style={{ width: "120px", height: "14px", background: "#e2e8f0", borderRadius: "4px" }}></span>
                      </div>
                      <h3 style={{ width: "100%", height: "22px", background: "#e2e8f0", borderRadius: "4px", margin: "12px 0" }}></h3>
                      <p style={{ width: "100%", height: "14px", background: "#e2e8f0", borderRadius: "4px", marginBottom: "8px" }}></p>
                      <p style={{ width: "90%", height: "14px", background: "#e2e8f0", borderRadius: "4px" }}></p>
                    </div>
                  </div>
                </div>
              ))
            ) : filteredBlogs.length === 0 ? (
              <div className="text-center py-16 w-full col-span-full" style={{ textAlign: "center", gridColumn: "1 / -1" }}>
                <p className="text-slate-500 italic" style={{ fontSize: "16px" }}>
                  {searchQuery || selectedCategory !== "All"
                    ? "No articles matched your search filters. Try resetting the category or keyword."
                    : "No blog posts published yet. Check back soon!"}
                </p>
                {(searchQuery || selectedCategory !== "All") && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory("All");
                    }}
                    style={{
                      marginTop: "12px",
                      padding: "6px 16px",
                      background: "#0f75bc",
                      color: "#fff",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "13px"
                    }}
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            ) : (
              filteredBlogs.map((post) => {
                const articleHref = `/blogs/${post.slug || post.id}`;
                const previewSnippet = post.metaDescription || post.summary || post.title;

                return (
                  <article key={post.id} className="blog-card-frontend">
                    {/* Featured Image with Link */}
                    <Link href={articleHref} className="blog-card-img-wrapper" style={{ display: "block" }}>
                      {post.coverImage ? (
                        <img
                          src={post.coverImage}
                          alt={post.title}
                          className="blog-card-img"
                          loading="lazy"
                        />
                      ) : (
                        <div className="blog-card-img-placeholder"></div>
                      )}
                      <span className="blog-card-img-badge">{post.category || "General"}</span>
                    </Link>

                    {/* Content Section */}
                    <div className="blog-card-frontend-content">
                      <div>
                        <div className="blog-card-frontend-meta">
                          <span>📅 {post.date}</span>
                          <span>✍️ {post.author || "Ananya Hi Solutions"}</span>
                        </div>

                        {/* Title linking to article */}
                        <h3 className="blog-card-frontend-title">
                          <Link
                            href={articleHref}
                            style={{ color: "inherit", textDecoration: "none" }}
                          >
                            {post.title}
                          </Link>
                        </h3>

                        {/* Meta Description (Concise 150-160 characters summary) */}
                        <p className="blog-card-frontend-summary">
                          {previewSnippet}
                        </p>
                      </div>

                      {/* Direct Read Full Article Link */}
                      <Link
                        href={articleHref}
                        className="blog-card-frontend-link"
                        style={{
                          textDecoration: "none",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          fontWeight: 600
                        }}
                      >
                        Read Full Article <span>→</span>
                      </Link>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* 5. Footer */}
      <GlobalFooter />
    </div>
  );
}
