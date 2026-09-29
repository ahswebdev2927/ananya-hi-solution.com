"use client";

import GlobalFooter from "../components/GlobalFooter";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Header from "../components/Header";

// Crisp Inline SVG Logo Component
function Logo({ className = "", light = false }) {
  return (
    <img
      src="/logo.png"
      alt="Ananya Hi Solutions"
      className={`nav-logo-img ${className}`}
      style={{
        height: "42px",
        width: "auto",
        objectFit: "contain",
        display: "block"
      }}
    />
  );
}

export default function BlogPage() {
  const [blogs, setBlogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals and Blog states
  const [selectedBlog, setSelectedBlog] = useState(null);
  const [showBlogModal, setShowBlogModal] = useState(false);

  // Fetch blogs on mount
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
          <h1>Ananya <span>Tech Blog</span></h1>
          <p>
            Stay ahead of the curve with expert tutorials, local marketing strategies, and deep dives into modern software engineering patterns.
          </p>
        </div>
      </section>

      {/* 3. Blog listings Grid (DYNAMIC FROM DATABASE) */}
      <section className="section section-bg-alt" style={{ flex: 1 }}>
        <div className="container">
          <style dangerouslySetInnerHTML={{ __html: `
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
          `}} />
          <div className="blog-grid">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, idx) => (
                <div key={idx} className="blog-card-frontend" style={{ pointerEvents: 'none' }}>
                  <div className="blog-card-img-wrapper" style={{ background: '#e2e8f0', position: 'relative', overflow: 'hidden' }}>
                    <div className="skeleton-shimmer-container"></div>
                  </div>
                  
                  <div className="blog-card-frontend-content">
                    <div>
                      <div className="blog-card-frontend-meta" style={{ gap: '15px' }}>
                        <span style={{ width: '80px', height: '14px', background: '#e2e8f0', borderRadius: '4px', display: 'inline-block', position: 'relative', overflow: 'hidden' }}>
                          <span className="skeleton-shimmer-container"></span>
                        </span>
                        <span style={{ width: '120px', height: '14px', background: '#e2e8f0', borderRadius: '4px', display: 'inline-block', position: 'relative', overflow: 'hidden' }}>
                          <span className="skeleton-shimmer-container"></span>
                        </span>
                      </div>
                      <h3 style={{ width: '100%', height: '22px', background: '#e2e8f0', borderRadius: '4px', marginTop: '12px', marginBottom: '12px', position: 'relative', overflow: 'hidden' }}>
                        <span className="skeleton-shimmer-container"></span>
                      </h3>
                      <h3 style={{ width: '70%', height: '22px', background: '#e2e8f0', borderRadius: '4px', marginBottom: '16px', position: 'relative', overflow: 'hidden' }}>
                        <span className="skeleton-shimmer-container"></span>
                      </h3>
                      <p style={{ width: '100%', height: '14px', background: '#e2e8f0', borderRadius: '4px', marginBottom: '8px', position: 'relative', overflow: 'hidden' }}>
                        <span className="skeleton-shimmer-container"></span>
                      </p>
                      <p style={{ width: '90%', height: '14px', background: '#e2e8f0', borderRadius: '4px', marginBottom: '20px', position: 'relative', overflow: 'hidden' }}>
                        <span className="skeleton-shimmer-container"></span>
                      </p>
                    </div>
                    
                    <div style={{ width: '110px', height: '16px', background: '#e2e8f0', borderRadius: '4px', position: 'relative', overflow: 'hidden' }}>
                      <span className="skeleton-shimmer-container"></span>
                    </div>
                  </div>
                </div>
              ))
            ) : blogs.length === 0 ? (
              <div className="text-center py-10 w-full col-span-full">
                <p className="text-slate-400 italic">No news updates have been published yet. Stay tuned!</p>
              </div>
            ) : (
              blogs.map((post) => (
                <div key={post.id} className="blog-card-frontend">
                  <div className="blog-card-img-wrapper">
                    {post.coverImage ? (
                      <img 
                        src={post.coverImage} 
                        alt={post.title} 
                        className="blog-card-img"
                      />
                    ) : (
                      <div className="blog-card-img-placeholder"></div>
                    )}
                    <span className="blog-card-img-text">{post.category ? post.category.slice(0, 3) : "AHS"}</span>
                    <span className="blog-card-img-badge">{post.category || "News"}</span>
                  </div>
                  
                  <div className="blog-card-frontend-content">
                    <div>
                      <div className="blog-card-frontend-meta">
                        <span>📅 {post.date}</span>
                        <span>✍️ {post.author || "Ananya Hi Solutions"}</span>
                      </div>
                      <h3 className="blog-card-frontend-title">{post.title}</h3>
                      <p className="blog-card-frontend-summary">{post.content || post.summary}</p>
                    </div>
                    
                    <button
                      onClick={() => {
                        setSelectedBlog(post);
                        setShowBlogModal(true);
                      }}
                      className="blog-card-frontend-link cursor-pointer bg-transparent border-none text-left p-0"
                    >
                      Read Full Article <span>→</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* 4. Footer */}
      <GlobalFooter />

      {/* 5. Blog News Article Modal Overlay */}
      {showBlogModal && selectedBlog && (
        <div className="frontend-modal-overlay animate-fade-in" onClick={() => setShowBlogModal(false)}>
          <div className="frontend-modal-card animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="frontend-modal-header">
              <h3>Article Insights</h3>
              <button className="frontend-modal-close" onClick={() => setShowBlogModal(false)}>✕</button>
            </div>
            
            <div className="frontend-modal-body">
              <article className="blog-modal-article">
                {selectedBlog.coverImage && (
                  <img 
                    src={selectedBlog.coverImage} 
                    alt={selectedBlog.title} 
                    className="blog-modal-cover-image"
                    style={{
                      width: "100%",
                      maxHeight: "350px",
                      objectFit: "cover",
                      borderRadius: "8px",
                      marginBottom: "20px",
                      display: "block"
                    }}
                  />
                )}
                <h2>{selectedBlog.title}</h2>
                
                <div className="blog-modal-meta">
                  <span className="blog-modal-category">{selectedBlog.category || "General"}</span>
                  <span>📅 Published: {selectedBlog.date}</span>
                  <span>✍️ Author: {selectedBlog.author || "Ananya Hi Solutions"}</span>
                </div>
                
                <div className="blog-modal-content">
                  {selectedBlog.content}
                </div>
              </article>
              
              <div className="mt-8 pt-6 flex flex-col gap-4" style={{ borderTop: "1px solid rgba(15, 117, 188, 0.08)" }}>
                <p className="text-sm text-slate-600">
                  Looking to implement these exact tech secrets or SEO growth strategies in your own company? Let's consult!
                </p>
                <Link
                  href="/contact"
                  onClick={() => setShowBlogModal(false)}
                  className="btn btn-accent text-center w-full"
                  style={{ textDecoration: 'none' }}
                >
                  ✉️ Book a Free Strategy Session
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}
