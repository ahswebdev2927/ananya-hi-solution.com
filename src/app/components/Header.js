"use client";

import React, { useState, useEffect } from "react";
import { useServices } from "../context/ServicesContext";
import Link from "next/link";

function Logo({ className = "" }) {
  return (
    <img
      src="/logo.png"
      alt="Ananya Hi Solutions"
      className="nav-logo-img"
      style={{
        height: "56px",
        width: "auto",
        objectFit: "contain",
        display: "block"
      }}
    />
  );
}

export default function Header({ activePage = "" }) {
  const { services } = useServices();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false);

  // Free Audit Form state declarations
  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", company: "", website: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      if (typeof window !== "undefined") {
        localStorage.setItem("ahs_audit_form_draft", JSON.stringify(updated));
        if (["name", "email", "phone", "company"].includes(name)) {
          const savedLead = localStorage.getItem("ahs_lead_info");
          const leadData = savedLead ? JSON.parse(savedLead) : {};
          leadData[name] = value;
          localStorage.setItem("ahs_lead_info", JSON.stringify(leadData));
        }
      }
      return updated;
    });
  };


  const handleAuditSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.phone) {
      setSubmitError("Please fill in all required fields.");
      return;
    }
    setSubmitting(true);
    setSubmitError("");
    try {
      const response = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to submit audit request.");
      }
      setSubmitSuccess(true);
      
      if (typeof window !== "undefined") {
        localStorage.setItem("ahs_lead_info", JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          company: formData.company
        }));
        localStorage.removeItem("ahs_audit_form_draft");

        // Log audit submission
        try {
          const existing = localStorage.getItem("ahs_actions_history");
          const list = existing ? JSON.parse(existing) : [];
          list.push({
            type: "SUBMIT_AUDIT",
            timestamp: new Date().toISOString(),
            details: {
              name: formData.name,
              email: formData.email,
              phone: formData.phone,
              company: formData.company,
              website: formData.website
            }
          });
          localStorage.setItem("ahs_actions_history", JSON.stringify(list));
        } catch (e) {
          console.error("Error logging audit action to localStorage:", e);
        }
      }
      
      setFormData({ name: "", email: "", phone: "", company: "", website: "" });
      setTimeout(() => {
        setAuditModalOpen(false);
        setSubmitSuccess(false);
      }, 3000);
    } catch (err) {
      setSubmitError(err.message || "An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const closeAuditModal = () => {
    setAuditModalOpen(false);
    setSubmitSuccess(false);
    setSubmitError("");
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={`navbar ${isScrolled ? "scrolled" : ""}`}>
      <div className="navbar-container">
        <Link href="/" className="flex items-center">
          <Logo />
        </Link>

        {/* Desktop Nav Links */}
        <ul className="nav-links">
          <li>
            <Link href="/" className={`nav-link ${activePage === "home" ? "active" : ""}`}>
              Home
            </Link>
          </li>
          <li>
            <Link href="/about" className={`nav-link ${activePage === "about" ? "active" : ""}`}>
              About
            </Link>
          </li>
          <li className="nav-item-dropdown">
            <span className={`nav-link cursor-pointer ${activePage === "services" ? "active" : ""}`}>
              Services <span className="dropdown-arrow">▼</span>
            </span>
            <ul className="dropdown-menu">
              {services.map((svc) => (
                <li key={svc.id}><Link href={`/services/${svc.id}`}>{svc.title}</Link></li>
              ))}
            </ul>
          </li>
          <li>
            <Link href="/careers" className={`nav-link ${activePage === "careers" ? "active" : ""}`}>
              Careers
            </Link>
          </li>
          <li>
            <Link href="/blog" className={`nav-link ${activePage === "blog" ? "active" : ""}`}>
              Blog
            </Link>
          </li>
          <li>
            <Link href="/contact" className={`nav-link ${activePage === "contact" ? "active" : ""}`}>
              Contact us
            </Link>
          </li>
        </ul>

        <div className="nav-cta">
          <button 
            onClick={() => setAuditModalOpen(true)} 
            className="btn btn-accent"
            style={{ border: "none", cursor: "pointer" }}
          >
            Get Free Audit
          </button>
          <Link href="/packages" className="btn btn-primary">Choose Package</Link>
        </div>

        {/* Mobile Menu Icon Toggle */}
        <button
          className="mobile-menu-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="lg:hidden animate-slide-in"
          style={{
            position: "fixed",
            left: 0,
            right: 0,
            top: "70px",
            bottom: 0,
            background: "#ffffff",
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            padding: "24px",
            gap: "20px",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)",
            overflowY: "auto"
          }}
        >
          <Link 
            href="/" 
            onClick={() => setMobileMenuOpen(false)} 
            style={{
              fontSize: "18px",
              fontWeight: "700",
              color: "var(--dark-deep)",
              textDecoration: "none",
              paddingBottom: "12px",
              borderBottom: "1px solid #f1f5f9",
              display: "block"
            }}
          >
            Home
          </Link>
          
          <Link 
            href="/about" 
            onClick={() => setMobileMenuOpen(false)} 
            style={{
              fontSize: "18px",
              fontWeight: "700",
              color: "var(--dark-deep)",
              textDecoration: "none",
              paddingBottom: "12px",
              borderBottom: "1px solid #f1f5f9",
              display: "block"
            }}
          >
            About
          </Link>
          
          <div style={{ display: "flex", flexDirection: "column", borderBottom: "1px solid #f1f5f9", paddingBottom: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span 
                onClick={() => setMobileServicesOpen(!mobileServicesOpen)} 
                style={{
                  fontSize: "18px",
                  fontWeight: "700",
                  color: "var(--dark-deep)",
                  cursor: "pointer",
                  userSelect: "none"
                }}
              >
                Services
              </span>
              <button 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  setMobileServicesOpen(!mobileServicesOpen); 
                }} 
                style={{
                  fontSize: "18px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--primary-blue)",
                  padding: "0 8px"
                }}
              >
                {mobileServicesOpen ? "▲" : "▼"}
              </button>
            </div>
            {mobileServicesOpen && (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", paddingLeft: "16px", paddingTop: "10px" }}>
                {services.map((svc) => (
                  <Link 
                    key={svc.id} 
                    href={`/services/${svc.id}`} 
                    onClick={() => setMobileMenuOpen(false)} 
                    style={{
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#475569",
                      textDecoration: "none",
                      display: "block"
                    }}
                  >
                    {svc.title}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <Link 
            href="/careers" 
            onClick={() => setMobileMenuOpen(false)} 
            style={{
              fontSize: "18px",
              fontWeight: "700",
              color: "var(--dark-deep)",
              textDecoration: "none",
              paddingBottom: "12px",
              borderBottom: "1px solid #f1f5f9",
              display: "block"
            }}
          >
            Careers
          </Link>
          
          <Link 
            href="/blog" 
            onClick={() => setMobileMenuOpen(false)} 
            style={{
              fontSize: "18px",
              fontWeight: "700",
              color: "var(--dark-deep)",
              textDecoration: "none",
              paddingBottom: "12px",
              borderBottom: "1px solid #f1f5f9",
              display: "block"
            }}
          >
            Blog
          </Link>
          
          <Link 
            href="/contact" 
            onClick={() => setMobileMenuOpen(false)} 
            style={{
              fontSize: "18px",
              fontWeight: "700",
              color: "var(--dark-deep)",
              textDecoration: "none",
              paddingBottom: "12px",
              borderBottom: "1px solid #f1f5f9",
              display: "block"
            }}
          >
            Contact us
          </Link>
          
          <button 
            onClick={() => {
              setMobileMenuOpen(false);
              setAuditModalOpen(true);
            }} 
            className="btn btn-primary text-center" 
            style={{
              marginTop: "16px",
              display: "block",
              width: "100%",
              border: "none",
              cursor: "pointer"
            }}
          >
            Get Free Audit
          </button>
          <Link 
            href="/packages" 
            onClick={() => setMobileMenuOpen(false)} 
            className="btn btn-accent text-center" 
            style={{
              marginTop: "10px",
              textDecoration: "none",
              display: "block"
            }}
          >
            Choose Package
          </Link>
        </div>
      )}

      {/* Get Free Audit Modal */}
      {auditModalOpen && (
        <div 
          className="modal-overlay" 
          style={{ 
            position: "fixed", 
            inset: 0, 
            background: "rgba(3,24,37,0.7)", 
            backdropFilter: "blur(8px)", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            zIndex: 99999, 
            padding: "20px" 
          }}
          onClick={closeAuditModal}
        >
          <div 
            className="modal-content" 
            style={{ 
              background: "#ffffff", 
              borderRadius: "20px", 
              width: "100%", 
              maxWidth: "480px", 
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)", 
              overflow: "hidden", 
              position: "relative", 
              animation: "modalSlideIn 0.3s ease-out" 
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={closeAuditModal}
              style={{ 
                position: "absolute", 
                top: "16px", 
                right: "16px", 
                background: "none", 
                border: "none", 
                fontSize: "20px", 
                color: "var(--secondary-slate)", 
                cursor: "pointer", 
                fontWeight: "bold",
                zIndex: 10
              }}
            >✕</button>
            
            <div style={{ padding: "40px 30px" }}>
              {submitSuccess ? (
                <div style={{ textAlign: "center", padding: "20px 0" }}>
                  <div style={{ fontSize: "50px", marginBottom: "15px" }}>✅</div>
                  <h3 style={{ fontFamily: "var(--font-headings)", color: "var(--dark-deep)", fontSize: "1.45rem", fontWeight: "800", marginBottom: "12px" }}>
                    Request Submitted!
                  </h3>
                  <p style={{ color: "var(--secondary-slate)", fontSize: "0.95rem", lineHeight: "1.5" }}>
                    Thank you for requesting a free audit. Our experts will analyze your details and get back to you within 24 hours.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleAuditSubmit}>
                  <h3 style={{ fontFamily: "var(--font-headings)", color: "var(--dark-deep)", fontSize: "1.45rem", fontWeight: "800", marginBottom: "8px", textAlign: "center" }}>
                    Get a Free Website Audit
                  </h3>
                  <p style={{ color: "var(--secondary-slate)", fontSize: "0.9rem", textAlign: "center", marginBottom: "28px" }}>
                    Fill in your details below and our team will run a detailed search and performance audit for your brand.
                  </p>
                  
                  {submitError && (
                    <div style={{ color: "#ef4444", background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: "8px", padding: "10px 14px", fontSize: "0.85rem", marginBottom: "16px", textAlign: "center" }}>
                      {submitError}
                    </div>
                  )}

                  <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "24px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", color: "var(--dark-deep)", marginBottom: "6px" }}>Full Name *</label>
                      <input 
                        type="text" 
                        name="name" 
                        required 
                        value={formData.name} 
                        onChange={handleInputChange} 
                        placeholder="e.g. John Doe" 
                        style={{ width: "100%", padding: "12px 16px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "0.95rem", color: "var(--dark-deep)" }} 
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", color: "var(--dark-deep)", marginBottom: "6px" }}>Email Address *</label>
                      <input 
                        type="email" 
                        name="email" 
                        required 
                        value={formData.email} 
                        onChange={handleInputChange} 
                        placeholder="e.g. john@company.com" 
                        style={{ width: "100%", padding: "12px 16px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "0.95rem", color: "var(--dark-deep)" }} 
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", color: "var(--dark-deep)", marginBottom: "6px" }}>Phone Number *</label>
                      <input 
                        type="tel" 
                        name="phone" 
                        required 
                        value={formData.phone} 
                        onChange={handleInputChange} 
                        placeholder="e.g. +91 98765 43210" 
                        style={{ width: "100%", padding: "12px 16px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "0.95rem", color: "var(--dark-deep)" }} 
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", color: "var(--dark-deep)", marginBottom: "6px" }}>Company Name (Optional)</label>
                      <input 
                        type="text" 
                        name="company" 
                        value={formData.company} 
                        onChange={handleInputChange} 
                        placeholder="e.g. Acme Corp" 
                        style={{ width: "100%", padding: "12px 16px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "0.95rem", color: "var(--dark-deep)" }} 
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", color: "var(--dark-deep)", marginBottom: "6px" }}>Website URL (Optional)</label>
                      <input 
                        type="url" 
                        name="website" 
                        value={formData.website} 
                        onChange={handleInputChange} 
                        placeholder="e.g. https://company.com" 
                        style={{ width: "100%", padding: "12px 16px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "0.95rem", color: "var(--dark-deep)" }} 
                      />
                    </div>
                  </div>
                  
                  <button 
                    type="submit" 
                    disabled={submitting}
                    style={{ 
                      width: "100%", 
                      background: "var(--accent-orange)", 
                      color: "var(--white)", 
                      padding: "14px", 
                      borderRadius: "8px", 
                      fontWeight: "700", 
                      fontSize: "0.95rem", 
                      border: "none", 
                      cursor: submitting ? "not-allowed" : "pointer", 
                      boxShadow: "var(--shadow-orange)", 
                      opacity: submitting ? 0.8 : 1, 
                      transition: "all 0.2s" 
                    }}
                  >
                    {submitting ? "Submitting..." : "Get Free Audit"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
