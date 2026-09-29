"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Header from "../components/Header";

// Clean footer logo component
function FooterLogo() {
  return (
    <img
      src="/logo.png"
      alt="Ananya Hi Solutions"
      style={{
        height: "42px",
        width: "auto",
        objectFit: "contain",
        display: "block"
      }}
    />
  );
}

const PACKAGE_CATEGORIES = [
  {
    title: "Digital Marketing Packages",
    key: "digital-marketing",
    cards: [
      {
        title: "Social Media Marketing",
        image: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=800&q=80",
        features: [
          "15-18 High-Quality Creative Posts.",
          "Competitor Analysis.",
          "Paid Meta Ads.",
          "Strategy & Content Calendar"
        ],
        link: "/services/digital-marketing/smm"
      },
      {
        title: "Google Ads/PPC Ads",
        image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80",
        features: [
          "Ads Account Setup & Audit.",
          "Advanced Keyword Research.",
          "Conversion Tracking.",
          "Audience Targeting Strategies."
        ],
        link: "/services/digital-marketing/google-ads"
      },
      {
        title: "Search Engine Optimization (SEO)",
        image: "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?auto=format&fit=crop&w=800&q=80",
        features: [
          "Free Website Audit.",
          "Keyword Research & Strategy.",
          "Competitor Analysis & Reporting.",
          "High-Quality Backlink Building."
        ],
        link: "/services/digital-marketing/seo"
      },
      {
        title: "YouTube Production",
        image: "/images/hero/youtube-seo.png",
        features: [
          "Basic, Standard & Premium Plans.",
          "Channel Setup & Optimisation.",
          "Cinematic 4K Video Shoots.",
          "YouTube SEO & Audience Building."
        ],
        link: "/services/youtube-seo"
      },
      {
        title: "AEO, GEO, AIO, SXO",
        image: "/images/hero/aio.jpg",
        features: [
          "Complete Website SEO & Audit.",
          "Answer Engine & AI Visibility.",
          "Search Experience Optimisation (SXO).",
          "Social Profile & Brand Mentions."
        ],
        link: "/services/aeo"
      }
    ]
  },
  {
    title: "Website Packages",
    key: "websites",
    cards: [
      {
        title: "Static Website Design",
        image: "/images/static_website_mockup.jpg",
        features: [
          "Delivery Within 3 Working Days.",
          "FREE Web Hosting & SSL for 1 year.",
          "1 Week FREE Support After Deployment.",
          "Responsive Design."
        ],
        link: "/services/web-design/static"
      },
      {
        title: "Dynamic Website",
        image: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=800&q=80",
        features: [
          "Unlimited Dynamic Web Pages Website.",
          "FREE Web Hosting & SSL for 1 year.",
          "1 Week FREE Support After Deployment.",
          "Responsive Design."
        ],
        link: "/services/web-design/dynamic"
      },
      {
        title: "E-Commerce Website",
        image: "https://images.unsplash.com/photo-1557821552-17105176677c?auto=format&fit=crop&w=800&q=80",
        features: [
          "Add & Manage Unlimited Store Products.",
          "Shopping Cart System.",
          "Easy Checkout System.",
          "Secure Payment Gateway Integration."
        ],
        link: "/services/web-design/ecommerce"
      }
    ]
  },
  {
    title: "App Development Packages",
    key: "app-development",
    isSingleCard: true,
    cards: [
      {
        title: "App Development",
        image: "/images/subservices/ios_app_detail.jpg",
        features: [
          "Basic, Standard & Premium Plans.",
          "Android & iOS App Development.",
          "Play Store & App Store Publishing.",
          "6 Months Support & Maintenance."
        ],
        link: "/services/mobile-app"
      }
    ]
  },
  {
    title: "Special Packages",
    key: "special",
    isSingleCard: true,
    cards: [
      {
        title: "Spa Packages",
        image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80",
        features: [
          "Performance Insights Report.",
          "Social Media Setup (Instagram & Facebook).",
          "Social Media Management.",
          "Content Strategy & Planning."
        ],
        link: "/services/web-design/spa"
      }
    ]
  }
];

export default function PackagesPage() {
  const router = require("next/navigation").useRouter();
  const [categories, setCategories] = useState(PACKAGE_CATEGORIES);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState({ category: "", plan: "" });
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", company: "" });

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const res = await fetch("/api/packages");
        if (res.ok) {
          const data = await res.json();
          if (data.packages) {
            setCategories(data.packages);
          }
        }
      } catch (err) {
        console.error("Error fetching packages:", err);
      }
    };
    fetchPackages();
  }, []);

  const openModal = (category, plan) => {
    setSelectedPackage({ category, plan });
    setModalOpen(true);
  };
  const closeModal = () => setModalOpen(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      if (typeof window !== "undefined") {
        localStorage.setItem("ahs_lead_info", JSON.stringify(updated));
      }
      return updated;
    });
  };


  const handleUnlockSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.phone) {
      alert("Please fill in all required fields.");
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch("/api/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          company: formData.company,
          packageTitle: selectedPackage.category,
          subId: selectedPackage.plan
        })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to unlock.");
      
      if (typeof window !== "undefined") {
        localStorage.setItem("ahs_lead_info", JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          company: formData.company
        }));

        // Log package unlock
        try {
          const existing = localStorage.getItem("ahs_actions_history");
          const list = existing ? JSON.parse(existing) : [];
          list.push({
            type: "UNLOCK_PACKAGE",
            timestamp: new Date().toISOString(),
            details: {
              name: formData.name,
              email: formData.email,
              phone: formData.phone,
              company: formData.company,
              packageTitle: selectedPackage.category,
              plan: selectedPackage.plan
            }
          });
          localStorage.setItem("ahs_actions_history", JSON.stringify(list));
        } catch (e) {
          console.error("Error logging package unlock to localStorage:", e);
        }
      }
      
      const queryParams = new URLSearchParams({
        package: selectedPackage.plan,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        company: formData.company || ""
      });
      router.push(`/packages/plans?${queryParams.toString()}`);
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* 1. Navbar */}
      <Header activePage="packages" />

      {/* 2. Hero Section Banner */}
      <section className="page-hero">
        <div 
          className="page-hero-bg" 
          style={{ backgroundImage: "url('/images/hero/advanced-marketing.png')" }}
        />
        <div className="page-hero-overlay"></div>
        <div className="page-hero-content container animate-slide-in">
          <span className="text-accent-orange font-bold text-sm uppercase tracking-wider block mb-2">Transparent Value</span>
          <h1>Our Service <span>Packages</span></h1>
          <p>
            Choose from our highly specialized, result-oriented marketing and web development packages. Select a plan to view features and unlock comprehensive checklists.
          </p>
        </div>
      </section>

      {/* 3. Package Sections */}
      {categories.map((category, index) => {
        // Alternate background colors (Light Gray -> White -> Light Gray)
        const isAltBg = index % 2 === 0;
        const bgClass = isAltBg ? "section section-bg-alt" : "section";
        const bgStyle = isAltBg ? {} : { backgroundColor: "var(--white)" };

        return (
          <section key={category.key} id={category.key} className={bgClass} style={bgStyle}>
            <div className="container">
              <div className="package-category-header">
                <h2 className="package-category-title">{category.title}</h2>
                <div className="package-category-underline"></div>
              </div>

              <div className={(category.isSingleCard || (category.cards && category.cards.length === 1)) ? "packages-grid-single" : "packages-grid"}>
                {category.cards.map((card, cIdx) => (
                  <div key={cIdx} className="package-card-premium">
                    {/* Default Background Image */}
                    <div 
                      className="package-card-bg"
                      style={{ backgroundImage: `url('${card.image}')` }}
                    />
                    
                    {/* Shadow overlay gradient */}
                    <div className="package-card-overlay" />

                    {/* Default visible Title at bottom */}
                    <div className="package-card-title-default">
                      <h3>{card.title}</h3>
                      <div className="package-card-underline" />
                    </div>

                    {/* Sliding Hover Panel */}
                    <div className="package-card-hover-panel">
                      <div className="package-hover-header">
                        <h3>{card.title}</h3>
                        <div style={{ width: "40px", height: "3px", background: "var(--accent-orange)", margin: "0 auto", borderRadius: "10px" }} />
                      </div>

                      {/* 4 Single-line features */}
                      <ul className="package-hover-features">
                        {card.features.map((feat, fIdx) => (
                          <li key={fIdx} className="package-hover-feature-item">
                            {feat}
                          </li>
                        ))}
                      </ul>

                      {/* Unlock button */}
                      <button onClick={() => openModal(category.title, card.title)} className="package-hover-btn">
                        Unlock Full Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        );
      })}

      {/* 4. Footer */}
      <footer className="footer mt-auto">
        <div className="footer-container">
          <div className="footer-brand">
            <FooterLogo />
            <p className="footer-desc mt-4">
              We are a professional Web Design & Digital Marketing agency in Hyderabad, delivering creative solutions that help businesses grow online.
            </p>
          </div>

          <div className="footer-column">
            <h4>Quick Links</h4>
            <ul className="footer-links">
              <li><Link href="/">Home</Link></li>
              <li><Link href="/about">About Us</Link></li>
              <li><Link href="/careers">Careers</Link></li>
              <li><Link href="/packages">Packages</Link></li>
              <li><Link href="/blog">Blogs</Link></li>
              <li><Link href="/contact">Contact</Link></li>
            </ul>
          </div>

          <div className="footer-column">
            <h4>Our Services</h4>
            <ul className="footer-links">
              <li><Link href="/services/web-design">Website Design</Link></li>
              <li><Link href="/services/digital-marketing">Digital Marketing</Link></li>
              <li><Link href="/services/mobile-app">Mobile Application</Link></li>
              <li><Link href="/services/ecommerce-app">Ecommerce Application</Link></li>
              <li><Link href="/services/video-production">Video Production</Link></li>
              <li><Link href="/services/software-development">Software Development</Link></li>
              <li><Link href="/services/aeo">AEO (Answer Engine)</Link></li>
              <li><Link href="/services/geo">GEO (Google Engine)</Link></li>
              <li><Link href="/services/youtube-seo">YouTube SEO</Link></li>
              <li><Link href="/services/youtube-ads">YouTube Ads</Link></li>
            </ul>
          </div>

          <div className="footer-column">
            <h4>Contact Us</h4>
            <ul className="footer-contact">
              <li className="footer-contact-item">
                <span className="footer-contact-icon">📍</span>
                <span>401 Sravya Vatika, Greenlands,<br />Begumpet, Hyderabad, Telangana-500016</span>
              </li>
              <li className="footer-contact-item">
                <span className="footer-contact-icon">📞</span>
                <span>(+91) 76739-35353</span>
              </li>
              <li className="footer-contact-item">
                <span className="footer-contact-icon">✉️</span>
                <span>info@ananyahisolutions.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-divider" />
        
        <div className="footer-bottom">
          <p>© 2026 Ananya Hi Solutions. All Rights Reserved.</p>
        </div>
      </footer>

      {/* Lead Capture Modal */}
      {modalOpen && (
        <div className="modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(3,24,37,0.7)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "20px" }}>
          <div className="modal-content" style={{ background: "#ffffff", borderRadius: "20px", width: "100%", maxWidth: "480px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)", overflow: "hidden", position: "relative", animation: "modalSlideIn 0.3s ease-out" }}>
            <button 
              onClick={closeModal}
              style={{ position: "absolute", top: "16px", right: "16px", background: "none", border: "none", fontSize: "20px", color: "var(--secondary-slate)", cursor: "pointer", fontWeight: "bold" }}
            >✕</button>
            <form onSubmit={handleUnlockSubmit} style={{ padding: "40px 30px" }}>
              <h3 style={{ fontFamily: "var(--font-headings)", color: "var(--dark-deep)", fontSize: "1.45rem", fontWeight: "800", marginBottom: "8px", textAlign: "center" }}>
                Unlock {selectedPackage.plan}
              </h3>
              <p style={{ color: "var(--secondary-slate)", fontSize: "0.9rem", textAlign: "center", marginBottom: "28px" }}>
                Enter your details to instantly view our comprehensive checklists and pricing models.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "24px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", color: "var(--dark-deep)", marginBottom: "6px" }}>Full Name *</label>
                  <input type="text" name="name" required value={formData.name} onChange={handleInputChange} placeholder="e.g. John Doe" style={{ width: "100%", padding: "12px 16px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "0.95rem", color: "var(--dark-deep)" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", color: "var(--dark-deep)", marginBottom: "6px" }}>Email Address *</label>
                  <input type="email" name="email" required value={formData.email} onChange={handleInputChange} placeholder="e.g. john@company.com" style={{ width: "100%", padding: "12px 16px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "0.95rem", color: "var(--dark-deep)" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", color: "var(--dark-deep)", marginBottom: "6px" }}>Phone Number *</label>
                  <input type="tel" name="phone" required value={formData.phone} onChange={handleInputChange} placeholder="e.g. +91 98765 43210" style={{ width: "100%", padding: "12px 16px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "0.95rem", color: "var(--dark-deep)" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", color: "var(--dark-deep)", marginBottom: "6px" }}>Company Name (Optional)</label>
                  <input type="text" name="company" value={formData.company} onChange={handleInputChange} placeholder="e.g. Acme Corp" style={{ width: "100%", padding: "12px 16px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "0.95rem", color: "var(--dark-deep)" }} />
                </div>
              </div>
              <button 
                type="submit" 
                disabled={submitting}
                style={{ width: "100%", background: "var(--accent-orange)", color: "var(--white)", padding: "14px", borderRadius: "8px", fontWeight: "700", fontSize: "0.95rem", border: "none", cursor: submitting ? "not-allowed" : "pointer", boxShadow: "var(--shadow-orange)", opacity: submitting ? 0.8 : 1, transition: "all 0.2s" }}
              >
                {submitting ? "Processing..." : "Unlock Full Packages"}
              </button>
            </form>
          </div>
        </div>
      )}
      {/* Sticky floating Combo Button */}
      <div style={{ position: "fixed", bottom: "30px", right: "30px", zIndex: 999 }}>
        <Link href="/packages/compare" style={{ textDecoration: "none" }}>
          <button 
            style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "10px", 
              padding: "16px 24px", 
              background: "#0f75bc", 
              border: "none", 
              borderRadius: "50px", 
              color: "#ffffff", 
              fontWeight: "800", 
              fontSize: "0.95rem", 
              boxShadow: "0 10px 25px -5px rgba(15, 117, 188, 0.4)", 
              cursor: "pointer", 
              transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
              backdropFilter: "blur(4px)"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px) scale(1.05)";
              e.currentTarget.style.boxShadow = "0 20px 35px -5px rgba(15, 117, 188, 0.5)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0) scale(1)";
              e.currentTarget.style.boxShadow = "0 10px 25px -5px rgba(15, 117, 188, 0.4)";
            }}
          >
            <span style={{ fontSize: "1.2rem" }}>📦</span>
            <span>Combo Plans</span>
          </button>
        </Link>
      </div>
    </div>
  );
}
