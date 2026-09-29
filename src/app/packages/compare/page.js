"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Header from "../../components/Header";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// Common uniform font stack to ensure absolute visual consistency in rendering
const UNIFORM_FONT_STACK = "'Times New Roman', Times, Baskerville, Georgia, serif";

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

// Helper to recursively expand package plans inheritance (e.g. everything in basic)
const getExpandedFeatures = (plan, allPlans, visited = new Set()) => {
  if (!plan || !plan.features || visited.has(plan.name)) return [];
  visited.add(plan.name);
  
  let expanded = [];
  for (const feature of plan.features) {
    const cleanFeature = feature.trim().toLowerCase();
    
    if (cleanFeature.startsWith("everything in basic")) {
      const basicPlan = allPlans.find(p => p.name.toLowerCase().includes("basic"));
      if (basicPlan) {
        expanded = [...expanded, ...getExpandedFeatures(basicPlan, allPlans, visited)];
      } else {
        expanded.push(feature);
      }
    } else if (cleanFeature.startsWith("everything in standard")) {
      const standardPlan = allPlans.find(p => p.name.toLowerCase().includes("standard"));
      if (standardPlan) {
        expanded = [...expanded, ...getExpandedFeatures(standardPlan, allPlans, visited)];
      } else {
        expanded.push(feature);
      }
    } else {
      expanded.push(feature);
    }
  }
  return expanded;
};

export default function PackageComparePage() {
  const [allPlansData, setAllPlansData] = useState({});
  const [comparisonSlots, setComparisonSlots] = useState([
    { packageTitle: "", planName: "" },
    { packageTitle: "", planName: "" }
  ]);
  const [loading, setLoading] = useState(true);

  // PDF Generator & Proposal Options States
  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState(1); // Step 1: Lead Details, Step 2: Proposal Options
  const [packageDurations, setPackageDurations] = useState({}); // { [packageTitle]: durationMonths }
  const [excludeGst, setExcludeGst] = useState(false);

  const [modalFormData, setModalFormData] = useState({ name: "", company: "", phone: "", email: "" });
  const [modalError, setModalError] = useState("");
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [leadInfo, setLeadInfo] = useState({ name: "Valued Client", company: "", phone: "", email: "" });
  const [downloadDateTime, setDownloadDateTime] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [proposalCount, setProposalCount] = useState(101);

  // Helpers to parse numeric price and currency
  const parsePrice = (priceStr) => {
    if (!priceStr) return 0;
    const cleanStr = priceStr.replace(/[^\d]/g, "");
    return parseInt(cleanStr, 10) || 0;
  };

  const formatCurrency = (num) => {
    return "₹" + (num || 0).toLocaleString("en-IN");
  };

  const isWebsitePackage = (packageTitle = "") => {
    return /website|web\s*design|web\s*dev|landing\s*page|e-?commerce|wordpress/i.test(packageTitle);
  };

  // Compile selected combo plans and final grand total
  const selectedComboItems = comparisonSlots.map((slot) => {
    if (!slot.packageTitle || !slot.planName) return null;
    const categoryPlans = allPlansData[slot.packageTitle] || [];
    const selectedPlan = categoryPlans.find(p => p.name === slot.planName);
    if (!selectedPlan) return null;

    const rawMonthlyPrice = parsePrice(selectedPlan.price);
    const isWebsite = isWebsitePackage(slot.packageTitle);
    const durationMonths = isWebsite ? 1 : (packageDurations[slot.packageTitle] || 1);

    const basePrice = rawMonthlyPrice * durationMonths;
    const baseMonthlyGst = Math.round(rawMonthlyPrice * 0.18);
    const gstAmount = excludeGst ? 0 : baseMonthlyGst * durationMonths;
    const totalWithGst = basePrice + gstAmount;

    return {
      packageTitle: slot.packageTitle,
      planName: slot.planName,
      monthlyPrice: rawMonthlyPrice,
      durationMonths,
      isWebsite,
      basePrice,
      baseMonthlyGst,
      gstAmount,
      totalWithGst,
      rawPlanPriceStr: selectedPlan.price,
      rawPlanBillingStr: selectedPlan.billing
    };
  }).filter(Boolean);

  const totalBase = selectedComboItems.reduce((sum, item) => sum + item.basePrice, 0);
  const totalGst = selectedComboItems.reduce((sum, item) => sum + item.gstAmount, 0);
  const finalGrandTotal = totalBase + totalGst;

  // === Geometry constants for PDF page layout (all in px at 794×1123 canvas) ===
  const PAGE_CONTENT_HEIGHT = 955;   // 1123 - 40(top pad) - 80(bottom pad) - 18(meta header) - 30(footer)
  const COVER_HEADER_HEIGHT = 215;   // Banner(75) + InfoGrid(120) + gap(20)
  const FEATURE_ROW_HEIGHT = 30;     // 12px font + 8px gap + padding + line-height 1.3
  const FEATURE_LIST_PADDING = 48;   // 24px top + 24px bottom padding on the list wrapper
  const PLAN_TITLE_HEIGHT = 48;      // Title bar(38px) + margin-bottom(10px)
  const PRICING_BOX_HEIGHT = 120;    // Pricing box safe ceiling (covers GST / no-GST)
  const SECTION_GAP = 30;            // border-top + padding-top between successive plan blocks
  const SUMMARY_BASE = 255;          // heading + table header + grand-total box + T&C + margins
  const SUMMARY_ROW_HEIGHT = 32;     // per-item row in summary table

  // Get expanded features for a given item
  const getItemFeatures = (item) => {
    const categoryPlans = allPlansData[item.packageTitle] || [];
    const selectedPlan = categoryPlans.find(p => p.name === item.planName);
    return selectedPlan ? getExpandedFeatures(selectedPlan, categoryPlans) : [];
  };

  // Dynamically divide selected items into page chunks with smooth feature flow
  const generateProposalPages = () => {
    const pages = [];
    let currentPageContent = [];
    let remainingHeight = PAGE_CONTENT_HEIGHT - COVER_HEADER_HEIGHT; // Page 1 has cover
    let isFirstBlockOnPage = true;

    selectedComboItems.forEach((item, itemIndex) => {
      const allFeatures = getItemFeatures(item);
      let featuresRemaining = [...allFeatures];
      let isFirstChunk = true;

      while (featuresRemaining.length > 0) {
        // Calculate overhead for this chunk
        let overhead = FEATURE_LIST_PADDING;
        if (isFirstChunk) overhead += PLAN_TITLE_HEIGHT;
        if (!isFirstBlockOnPage) overhead += SECTION_GAP;
        // Always reserve space for pricing box on the last chunk
        // We optimistically check if ALL remaining features can fit
        const maxFeaturesIfLast = Math.floor((remainingHeight - overhead - PRICING_BOX_HEIGHT) / FEATURE_ROW_HEIGHT);
        const maxFeaturesIfNotLast = Math.floor((remainingHeight - overhead) / FEATURE_ROW_HEIGHT);

        if (maxFeaturesIfLast >= featuresRemaining.length && maxFeaturesIfLast > 0) {
          // All remaining features + pricing box fit on this page
          currentPageContent.push({
            type: "PLAN_CHUNK",
            ...item,
            featureChunk: featuresRemaining,
            isFirstChunk,
            isLastChunk: true
          });
          const chunkHeight = overhead + (featuresRemaining.length * FEATURE_ROW_HEIGHT) + PRICING_BOX_HEIGHT;
          remainingHeight -= chunkHeight;
          featuresRemaining = [];
          isFirstBlockOnPage = false;
        } else if (maxFeaturesIfNotLast >= 3) {
          // Put as many features as we can (at least 3), continue on next page
          const takeCount = Math.min(maxFeaturesIfNotLast, featuresRemaining.length);
          const chunk = featuresRemaining.slice(0, takeCount);
          featuresRemaining = featuresRemaining.slice(takeCount);
          
          currentPageContent.push({
            type: "PLAN_CHUNK",
            ...item,
            featureChunk: chunk,
            isFirstChunk,
            isLastChunk: false
          });
          const chunkHeight = overhead + (chunk.length * FEATURE_ROW_HEIGHT);
          remainingHeight -= chunkHeight;
          isFirstChunk = false;

          // If there are more features, or we need pricing box, start new page
          if (featuresRemaining.length > 0) {
            pages.push(currentPageContent);
            currentPageContent = [];
            remainingHeight = PAGE_CONTENT_HEIGHT;
            isFirstBlockOnPage = true;
          }
        } else {
          // Not enough room for even 3 features — push current page, start fresh
          if (currentPageContent.length > 0) {
            pages.push(currentPageContent);
          }
          currentPageContent = [];
          remainingHeight = PAGE_CONTENT_HEIGHT;
          isFirstBlockOnPage = true;
          // Don't advance — retry this chunk on the new empty page
        }
      }
    });

    // Now handle the summary block
    const summaryHeight = SUMMARY_BASE + selectedComboItems.length * SUMMARY_ROW_HEIGHT;
    if (remainingHeight < summaryHeight) {
      if (currentPageContent.length > 0) {
        pages.push(currentPageContent);
      }
      pages.push([{ type: "SUMMARY" }]);
    } else {
      currentPageContent.push({ type: "SUMMARY" });
      pages.push(currentPageContent);
    }

    return pages;
  };

  const proposalPages = selectedComboItems.length > 0 ? generateProposalPages() : [];

  // Date formatting helpers
  const formatDownloadDateTime = (date) => {
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true
    });
  };

  const formatIssueDate = (date) => {
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric"
    });
  };

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const res = await fetch("/api/packages");
        if (res.ok) {
          const data = await res.json();
          if (data.plans) {
            setAllPlansData(data.plans);
          }
        }
      } catch (err) {
        console.error("Error fetching packages:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPackages();

    // Load proposal counter and lead details from localStorage
    if (typeof window !== "undefined") {
      const savedCounter = localStorage.getItem("proposal_counter");
      if (savedCounter) {
        setProposalCount(parseInt(savedCounter, 10));
      } else {
        setProposalCount(101);
      }
      
      const savedLead = localStorage.getItem("ahs_lead_info");
      if (savedLead) {
        try {
          const parsed = JSON.parse(savedLead);
          setLeadInfo({
            name: parsed.name || "Valued Client",
            company: parsed.company || "",
            phone: parsed.phone || "",
            email: parsed.email || ""
          });
        } catch (e) {
          console.error("Error parsing lead info:", e);
        }
      }
    }
  }, []);

  const addComparisonSlot = () => {
    setComparisonSlots([...comparisonSlots, { packageTitle: "", planName: "" }]);
  };

  const updateComparisonSlot = (idx, field, value) => {
    const updated = [...comparisonSlots];
    updated[idx][field] = value;
    if (field === "packageTitle") {
      updated[idx].planName = "";
    }
    setComparisonSlots(updated);
  };

  const removeComparisonSlot = (idx) => {
    const updated = comparisonSlots.filter((_, i) => i !== idx);
    setComparisonSlots(updated.length > 0 ? updated : [{ packageTitle: "", planName: "" }]);
  };

  const clearAllSlots = () => {
    setComparisonSlots([
      { packageTitle: "", planName: "" },
      { packageTitle: "", planName: "" }
    ]);
  };

  const handleModalInputChange = (e) => {
    const { name, value } = e.target;
    setModalFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDownloadClick = () => {
    if (typeof window !== "undefined") {
      const savedLead = localStorage.getItem("ahs_lead_info");
      if (savedLead) {
        try {
          const parsed = JSON.parse(savedLead);
          setModalFormData({
            name: parsed.name || "",
            company: parsed.company || "",
            phone: parsed.phone || "",
            email: parsed.email || ""
          });
        } catch (e) {}
      }
    }
    setModalError("");
    setModalStep(1);
    setLeadModalOpen(true);
  };

  const handleModalSubmit = (e) => {
    e.preventDefault();
    if (!modalFormData.name || !modalFormData.phone || !modalFormData.email) {
      setModalError("Please fill in all required fields.");
      return;
    }

    const info = {
      name: modalFormData.name,
      company: modalFormData.company,
      phone: modalFormData.phone,
      email: modalFormData.email
    };

    if (typeof window !== "undefined") {
      localStorage.setItem("ahs_lead_info", JSON.stringify(info));
    }
    setLeadInfo(info);
    setModalError("");

    // Submit lead in background
    fetch("/api/unlock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: info.name,
        email: info.email,
        phone: info.phone,
        company: info.company,
        packageTitle: "Combo Plans Builder",
        subId: selectedComboItems.map(item => `${item.packageTitle} (${item.planName})`).join(", ")
      })
    }).catch(err => {
      console.error("Error submitting lead in background:", err);
    });

    setModalStep(2);
  };

  const handleFinalPdfGenerate = () => {
    setLeadModalOpen(false);
    triggerPdfGeneration(leadInfo);
  };

  const triggerPdfGeneration = async (currentLeadInfo) => {
    console.log("Starting triggerPdfGeneration...");
    const now = new Date();
    setDownloadDateTime(formatDownloadDateTime(now));
    setIssueDate(formatIssueDate(now));
    setGeneratingPdf(true);

    try {
      console.log("Waiting for re-render...");
      await new Promise(r => setTimeout(r, 650));

      console.log("Initializing jsPDF...");
      const doc = new jsPDF('p', 'mm', 'a4');

      // Loop over each calculated page
      for (let i = 0; i < proposalPages.length; i++) {
        const pageElId = `combo-proposal-page-${i + 1}`;
        console.log(`Getting page element ${pageElId}...`);
        const pageEl = document.getElementById(pageElId);
        if (!pageEl) {
          console.error(`${pageElId} not found!`);
          alert(`Error: Page ${i + 1} template element not found.`);
          return;
        }

        console.log(`Rendering page ${i + 1} with html2canvas...`);
        const canvas = await html2canvas(pageEl, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          width: 794,
          height: 1123,
          windowWidth: 794
        });
        console.log(`Page ${i + 1} rendered successfully. Adding to PDF...`);
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        if (i > 0) {
          doc.addPage();
        }
        doc.addImage(imgData, 'JPEG', 0, 0, 210, 297);
      }

      const fileName = `Combo_Proposal_${currentLeadInfo.name.replace(/\s+/g, '_')}.pdf`;
      console.log(`Saving PDF as ${fileName}...`);
      doc.save(fileName);
      console.log("PDF saved successfully!");

      setProposalCount(prev => {
        const next = prev + 1;
        if (typeof window !== "undefined") {
          localStorage.setItem("proposal_counter", next.toString());
        }
        return next;
      });

      if (typeof window !== "undefined") {
        try {
          const existing = localStorage.getItem("ahs_actions_history");
          const list = existing ? JSON.parse(existing) : [];
          list.push({
            type: "DOWNLOAD_COMBO_PROPOSAL",
            timestamp: new Date().toISOString(),
            details: {
              name: currentLeadInfo.name,
              email: currentLeadInfo.email,
              phone: currentLeadInfo.phone,
              company: currentLeadInfo.company,
              items: selectedComboItems.map(item => `${item.packageTitle} (${item.planName})`)
            }
          });
          localStorage.setItem("ahs_actions_history", JSON.stringify(list));
        } catch (e) {
          console.error("Error logging combo proposal download to localStorage:", e);
        }
      }
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Failed to generate PDF: " + err.message);
    } finally {
      setGeneratingPdf(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* 1. Navbar */}
      <Header activePage="packages" />

      {/* 2. Hero Header */}
      <section className="page-hero" style={{ padding: "80px 0 60px 0", background: "linear-gradient(135deg, #0f75bc 0%, #1d4ed8 100%)", color: "#ffffff", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div className="page-hero-overlay" style={{ position: "absolute", inset: 0, background: "rgba(15, 117, 188, 0.05)", mixBlendMode: "overlay" }} />
        <div className="container" style={{ position: "relative", zIndex: 2 }}>
          <span style={{ fontSize: "0.85rem", fontWeight: "800", color: "#f58220", textTransform: "uppercase", tracking: "wider", display: "block", marginBottom: "8px" }}>Interactive Plan Matrix</span>
          <h1 style={{ fontSize: "2.75rem", fontWeight: "800", marginBottom: "12px", fontFamily: "var(--font-headings)", color: "#ffffff" }}>Combo Plans Builder</h1>
          <p style={{ fontSize: "1.1rem", color: "#e0f2fe", maxWidth: "600px", margin: "0 auto", lineHeight: "1.6" }}>
            Select multiple service packages to customize your own combo plan and calculate combined pricing with detailed GST breakdowns.
          </p>
        </div>
      </section>

      {/* 3. Comparison Section */}
      <section style={{ padding: "60px 0", flex: 1 }}>
        <div className="container">
          
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "300px" }}>
              <div style={{ width: "40px", height: "40px", border: "4px solid rgba(15, 117, 188, 0.1)", borderTopColor: "#0f75bc", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              
              {/* Toolbar Actions */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
                <Link href="/packages">
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "#0f75bc", fontWeight: "700", fontSize: "0.95rem", cursor: "pointer", textDecoration: "none" }}>
                    ← Back to Packages List
                  </span>
                </Link>

                <div style={{ display: "flex", gap: "12px" }}>
                  <button 
                    onClick={clearAllSlots}
                    style={{ padding: "10px 20px", border: "1px solid #cbd5e1", background: "#ffffff", borderRadius: "8px", color: "#475569", fontSize: "0.9rem", fontWeight: "700", cursor: "pointer", transition: "all 0.2s" }}
                  >
                    Clear All
                  </button>
                  <button 
                    onClick={addComparisonSlot}
                    disabled={Object.keys(allPlansData).length > 0 && comparisonSlots.length >= Object.keys(allPlansData).length}
                    style={{ 
                      padding: "10px 20px", 
                      border: "none", 
                      background: Object.keys(allPlansData).length > 0 && comparisonSlots.length >= Object.keys(allPlansData).length ? "#cbd5e1" : "#f58220", 
                      borderRadius: "8px", 
                      color: Object.keys(allPlansData).length > 0 && comparisonSlots.length >= Object.keys(allPlansData).length ? "#94a3b8" : "#ffffff", 
                      fontSize: "0.9rem", 
                      fontWeight: "700", 
                      cursor: Object.keys(allPlansData).length > 0 && comparisonSlots.length >= Object.keys(allPlansData).length ? "not-allowed" : "pointer", 
                      transition: "all 0.2s", 
                      boxShadow: Object.keys(allPlansData).length > 0 && comparisonSlots.length >= Object.keys(allPlansData).length ? "none" : "0 4px 6px -1px rgba(245, 130, 32, 0.2)" 
                    }}
                  >
                    ➕ Add Another Package
                  </button>
                </div>
              </div>

              {/* Horizontal Scroll Wrapper */}
              <div style={{ overflowX: "auto", paddingBottom: "16px" }}>
                <div style={{ display: "flex", gap: "24px", minWidth: "max-content", alignItems: "stretch" }}>
                  
                  {comparisonSlots.map((slot, idx) => {
                    const categoryPlans = allPlansData[slot.packageTitle] || [];
                    const selectedPlan = categoryPlans.find(p => p.name === slot.planName);
                    
                    // Recursive resolution of features
                    const expandedFeatures = selectedPlan ? getExpandedFeatures(selectedPlan, categoryPlans) : [];
                    
                    // Parse numeric price
                    const parsePrice = (priceStr) => {
                      if (!priceStr) return 0;
                      const cleanStr = priceStr.replace(/[^\d]/g, "");
                      return parseInt(cleanStr, 10) || 0;
                    };
                    
                    const planAmount = selectedPlan ? parsePrice(selectedPlan.price) : 0;
                    const gstAmount = Math.round(planAmount * 0.18);
                    const grandTotal = planAmount + gstAmount;

                    return (
                      <div key={idx} style={{ width: "340px", background: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0,0,0,0.03)", display: "flex", flexDirection: "column", position: "relative" }}>
                        
                        {/* Slot Header */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid #f1f5f9", background: "#f8fafc", borderTopLeftRadius: "16px", borderTopRightRadius: "16px" }}>
                          <span style={{ fontSize: "0.75rem", fontWeight: "800", color: "#64748b", textTransform: "uppercase" }}>Slot #{idx + 1}</span>
                          {comparisonSlots.length > 1 && (
                            <button 
                              onClick={() => removeComparisonSlot(idx)}
                              style={{ background: "none", border: "none", color: "#ef4444", fontSize: "0.85rem", fontWeight: "700", cursor: "pointer" }}
                            >Remove</button>
                          )}
                        </div>

                        {/* Dropdowns */}
                        <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "12px", borderBottom: "1px solid #f1f5f9" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>Select Package Category</label>
                            <select 
                              value={slot.packageTitle}
                              onChange={(e) => updateComparisonSlot(idx, "packageTitle", e.target.value)}
                              style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "0.875rem", color: "#0f172a", background: "#ffffff" }}
                            >
                              <option value="">-- Choose Package --</option>
                              {Object.keys(allPlansData).map((title, pIdx) => {
                                const isSelectedElsewhere = comparisonSlots.some((s, sIdx) => sIdx !== idx && s.packageTitle === title);
                                if (isSelectedElsewhere && title !== slot.packageTitle) return null;
                                return (
                                  <option key={pIdx} value={title}>{title}</option>
                                );
                              })}
                            </select>
                          </div>

                          <div>
                            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>Select Plan</label>
                            <select 
                              value={slot.planName}
                              disabled={!slot.packageTitle}
                              onChange={(e) => updateComparisonSlot(idx, "planName", e.target.value)}
                              style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "0.875rem", color: "#0f172a", background: slot.packageTitle ? "#ffffff" : "#f1f5f9", cursor: slot.packageTitle ? "pointer" : "not-allowed" }}
                            >
                              <option value="">-- Choose Plan --</option>
                              {categoryPlans.map((plan, plIdx) => (
                                <option key={plIdx} value={plan.name}>{plan.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Content & Pricing */}
                        {selectedPlan ? (
                          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                            
                            {/* Features area */}
                            <div style={{ flex: 1, padding: "20px", borderBottom: "1px solid #f1f5f9" }}>
                              <h4 style={{ margin: "0 0 12px 0", fontSize: "0.85rem", fontWeight: "800", color: "#1e293b" }}>Included Features:</h4>
                              <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "10px" }}>
                                {expandedFeatures.map((feat, fIdx) => (
                                  <li key={fIdx} style={{ fontSize: "0.85rem", color: "#475569", display: "flex", alignItems: "flex-start", gap: "8px", lineHeight: "1.4" }}>
                                    <span style={{ color: "#10b981", fontWeight: "bold" }}>✓</span>
                                    <span>{feat}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {/* Pricing summary */}
                            <div style={{ padding: "20px", background: "#f8fafc", borderBottomLeftRadius: "16px", borderBottomRightRadius: "16px" }}>
                              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "#64748b" }}>
                                  <span>Plan Amount:</span>
                                  <span style={{ fontWeight: "600", color: "#1e293b" }}>₹{planAmount.toLocaleString("en-IN")}</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "#64748b" }}>
                                  <span>GST (18%):</span>
                                  <span style={{ fontWeight: "600", color: "#1e293b" }}>₹{gstAmount.toLocaleString("en-IN")}</span>
                                </div>
                                <div style={{ height: "1px", background: "#e2e8f0", margin: "6px 0" }} />
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1rem", fontWeight: "800" }}>
                                  <span style={{ color: "#0f75bc" }}>Grand Total:</span>
                                  <span style={{ color: "#0f75bc" }}>₹{grandTotal.toLocaleString("en-IN")}</span>
                                </div>
                              </div>
                            </div>

                          </div>
                        ) : (
                          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 20px", color: "#94a3b8", fontSize: "0.875rem", textAlign: "center", minHeight: "350px" }}>
                            Select a package and plan to compare features and cost
                          </div>
                        )}

                      </div>
                    );
                  })}

                </div>
              </div>

              {/* Combo Plans Summary Card */}
              <div style={{ background: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "30px", marginTop: "30px", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.03)" }}>
                <h3 style={{ fontFamily: "var(--font-headings)", fontSize: "1.4rem", fontWeight: "800", color: "#0f75bc", margin: "0 0 20px 0", display: "flex", alignItems: "center", gap: "10px" }}>
                  <span>📦</span> Combo Price Breakdown
                </h3>
                
                {selectedComboItems.length === 0 ? (
                  <p style={{ color: "#94a3b8", fontSize: "0.95rem", textAlign: "center", margin: "20px 0" }}>
                    Select package categories and plans above to generate your combo breakdown and grand total.
                  </p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {selectedComboItems.map((item, idx) => (
                        <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", padding: "14px 20px", background: "#f8fafc", borderRadius: "10px", border: "1px solid #f1f5f9" }}>
                          <span style={{ fontSize: "1rem", fontWeight: "700", color: "#1e293b" }}>
                            {item.packageTitle} ({item.planName})
                          </span>
                          <span style={{ fontSize: "1.05rem", color: "#0f75bc", fontWeight: "800" }}>
                            ₹{item.totalWithGst.toLocaleString("en-IN")}
                          </span>
                        </div>
                      ))}
                    </div>
                    
                    <div style={{ height: "1px", background: "#e2e8f0", margin: "10px 0" }} />
                    
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", background: "linear-gradient(90deg, #f0fdf4 0%, #dcfce7 100%)", borderRadius: "10px", border: "1px solid #bbf7d0" }}>
                      <span style={{ fontSize: "1.15rem", fontWeight: "800", color: "#166534" }}>Final Combo Grand Total:</span>
                      <span style={{ fontSize: "1.5rem", fontWeight: "900", color: "#166534" }}>
                        ₹{finalGrandTotal.toLocaleString("en-IN")} <span style={{ fontSize: "0.85rem", fontWeight: "600", color: "#15803d" }}>(incl. GST)</span>
                      </span>
                    </div>

                    {/* Download Proposal Button */}
                    <div style={{ display: "flex", justifyContent: "center", marginTop: "10px" }}>
                      <button
                        onClick={handleDownloadClick}
                        disabled={generatingPdf}
                        className="btn btn-primary"
                        style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "14px 36px", fontSize: "1rem", fontWeight: "700", cursor: "pointer", border: "none", borderRadius: "8px", width: "100%", justifyContent: "center" }}
                      >
                        {generatingPdf ? "Generating PDF Proposal..." : "📥 Download Combo Proposal PDF"}
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

        </div>
      </section>

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
                <span>Flat No. 502, Riviera Apartments, Dwarakapuri,<br />Punjagutta, Hyderabad, Telangana 500082</span>
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

      {/* Lead Capture & Customization Modal for PDF Generation */}
      {leadModalOpen && (
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
          onClick={() => setLeadModalOpen(false)}
        >
          <div 
            className="modal-content animate-slide-in"
            style={{ 
              background: "#ffffff", 
              borderRadius: "20px", 
              width: "100%", 
              maxWidth: "520px", 
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)", 
              overflow: "hidden", 
              position: "relative", 
              padding: "32px 28px"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header" style={{ padding: "0 0 12px 0", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div>
                <h3 style={{ fontSize: "1.2rem", fontWeight: "800", color: "#0f75bc", margin: 0 }}>Personalize Your Combo Proposal</h3>
                <span style={{ fontSize: "0.75rem", fontWeight: "700", color: "#f58220", textTransform: "uppercase" }}>
                  Step {modalStep} of 2: {modalStep === 1 ? "Business Details" : "Plan Durations & GST"}
                </span>
              </div>
              <button 
                onClick={() => setLeadModalOpen(false)}
                style={{ 
                  background: "none", 
                  border: "none", 
                  fontSize: "20px", 
                  color: "#64748b", 
                  cursor: "pointer", 
                  fontWeight: "bold"
                }}
              >✕</button>
            </div>

            {modalError && (
              <div className="modal-error-alert" style={{ marginBottom: "16px", color: "#ef4444", fontSize: "0.85rem", background: "#fef2f2", padding: "8px 12px", borderRadius: "6px", border: "1px solid #fee2e2" }}>
                {modalError}
              </div>
            )}

            {modalStep === 1 ? (
              <form onSubmit={handleModalSubmit} className="modal-form" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <p style={{ fontSize: "0.85rem", color: "#64748b", margin: 0, lineHeight: "1.4" }}>
                  Please enter your contact details to customize your Combo Proposal document.
                </p>

                <div className="modal-form-group" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "0.85rem", fontWeight: "700", color: "#475569" }}>Contact Name *</label>
                  <input 
                    type="text" 
                    name="name" 
                    value={modalFormData.name}
                    onChange={handleModalInputChange}
                    placeholder="Your full name"
                    required
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "0.9rem" }}
                  />
                </div>

                <div className="modal-form-group" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "0.85rem", fontWeight: "700", color: "#475569" }}>Company Name</label>
                  <input 
                    type="text" 
                    name="company" 
                    value={modalFormData.company}
                    onChange={handleModalInputChange}
                    placeholder="Your organization name"
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "0.9rem" }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                  <div className="modal-form-group" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "0.85rem", fontWeight: "700", color: "#475569" }}>Phone Number *</label>
                    <input 
                      type="tel" 
                      name="phone" 
                      value={modalFormData.phone}
                      onChange={handleModalInputChange}
                      placeholder="Phone number"
                      required
                      style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "0.9rem" }}
                    />
                  </div>

                  <div className="modal-form-group" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "0.85rem", fontWeight: "700", color: "#475569" }}>Email Address *</label>
                    <input 
                      type="email" 
                      name="email" 
                      value={modalFormData.email}
                      onChange={handleModalInputChange}
                      placeholder="Your email"
                      required
                      style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "0.9rem" }}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "12px" }}>
                  <button 
                    type="button" 
                    className="modal-btn btn-secondary" 
                    onClick={() => setLeadModalOpen(false)}
                    style={{ cursor: "pointer", padding: "10px 20px", border: "1px solid #cbd5e1", background: "#ffffff", borderRadius: "8px", color: "#475569", fontSize: "0.9rem", fontWeight: "700" }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="modal-btn btn-primary"
                    style={{ cursor: "pointer", padding: "10px 20px", border: "none", background: "#0f75bc", borderRadius: "8px", color: "#ffffff", fontSize: "0.9rem", fontWeight: "700" }}
                  >
                    Next: Customization Options →
                  </button>
                </div>
              </form>
            ) : (
              <div className="modal-step-2" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <p style={{ fontSize: "0.85rem", color: "#64748b", margin: 0, lineHeight: "1.4" }}>
                  Customize durations for each selected package and GST preferences for the generated PDF proposal.
                </p>

                {/* Plan Durations Selection List */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "200px", overflowY: "auto", paddingRight: "4px" }}>
                  {selectedComboItems.map((item, idx) => (
                    <div key={idx} style={{ background: "#f8fafc", padding: "10px 12px", borderRadius: "8px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: "6px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "0.85rem", fontWeight: "700", color: "#0f172a" }}>
                          {item.packageTitle} <span style={{ color: "#0f75bc", fontWeight: "600" }}>({item.planName})</span>
                        </span>
                        <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: "600" }}>
                          ₹{item.monthlyPrice.toLocaleString("en-IN")}{item.isWebsite ? "" : "/mo"}
                        </span>
                      </div>

                      {item.isWebsite ? (
                        <div style={{ background: "#eff6ff", color: "#1d4ed8", padding: "4px 8px", borderRadius: "4px", fontSize: "0.75rem", fontWeight: "700", display: "inline-block" }}>
                          ⚡ One-Time Payment (Website Package)
                        </div>
                      ) : (
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <label style={{ fontSize: "0.75rem", fontWeight: "700", color: "#475569" }}>Select Duration:</label>
                          <select 
                            value={packageDurations[item.packageTitle] || 1}
                            onChange={(e) => setPackageDurations(prev => ({ ...prev, [item.packageTitle]: parseInt(e.target.value, 10) }))}
                            style={{ flex: 1, padding: "6px 10px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "0.85rem", background: "#ffffff", color: "#0f172a" }}
                          >
                            <option value={1}>1 Month (Default)</option>
                            <option value={3}>3 Months</option>
                            <option value={6}>6 Months</option>
                            <option value={12}>1 Year (12 Months)</option>
                          </select>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Exclude GST Checkbox */}
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "0.85rem", fontWeight: "700", color: "#334155", background: "#f8fafc", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}>
                  <input 
                    type="checkbox" 
                    checked={excludeGst} 
                    onChange={(e) => setExcludeGst(e.target.checked)} 
                    style={{ width: "16px", height: "16px", accentColor: "#0f75bc", cursor: "pointer" }} 
                  />
                  <span>Exclude GST from proposal (do not mention GST references)</span>
                </label>

                {/* Payment Summary Preview */}
                <div style={{ background: "#f1f5f9", padding: "12px 14px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                  <h4 style={{ margin: "0 0 8px 0", fontSize: "0.75rem", fontWeight: "800", color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px" }}>Payment Summary Preview</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "140px", overflowY: "auto" }}>
                    {selectedComboItems.map((item, idx) => (
                      <div key={idx} style={{ fontSize: "0.8rem", borderBottom: "1px dashed #cbd5e1", paddingBottom: "4px" }}>
                        <div style={{ fontWeight: "700", color: "#0f172a" }}>{item.packageTitle} ({item.planName})</div>
                        <div style={{ display: "flex", justifyContent: "space-between", color: "#475569" }}>
                          <span>{!item.isWebsite && item.durationMonths > 1 ? `Plan Amount (₹${item.monthlyPrice.toLocaleString("en-IN")} x ${item.durationMonths} mo):` : "Plan Amount:"}</span>
                          <span style={{ fontWeight: "600", color: "#0f172a" }}>₹{item.basePrice.toLocaleString("en-IN")}</span>
                        </div>
                        {!excludeGst && (
                          <div style={{ display: "flex", justifyContent: "space-between", color: "#475569" }}>
                            <span>{!item.isWebsite && item.durationMonths > 1 ? `GST 18% (₹${item.baseMonthlyGst.toLocaleString("en-IN")} x ${item.durationMonths} mo):` : "GST 18%:"}</span>
                            <span style={{ fontWeight: "600", color: "#0f172a" }}>₹{item.gstAmount.toLocaleString("en-IN")}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", fontWeight: "800", color: "#0f75bc", paddingTop: "8px", marginTop: "4px", borderTop: "1px solid #cbd5e1" }}>
                    <span>Final Combo Grand Total:</span>
                    <span>
                      ₹{finalGrandTotal.toLocaleString("en-IN")}{" "}
                      <span style={{ fontSize: "0.75rem", fontWeight: "600" }}>{excludeGst ? "(GST Excluded)" : "(incl. 18% GST)"}</span>
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", marginTop: "6px" }}>
                  <button 
                    type="button" 
                    onClick={() => setModalStep(1)}
                    style={{ cursor: "pointer", padding: "10px 18px", border: "1px solid #cbd5e1", background: "#ffffff", borderRadius: "8px", color: "#475569", fontSize: "0.85rem", fontWeight: "700" }}
                  >
                    ← Back
                  </button>
                  <button 
                    type="button" 
                    onClick={handleFinalPdfGenerate}
                    style={{ cursor: "pointer", padding: "10px 20px", border: "none", background: "#0f75bc", borderRadius: "8px", color: "#ffffff", fontSize: "0.85rem", fontWeight: "700" }}
                  >
                    Generate & Download PDF
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hidden Templates for PDF Generation */}
      {proposalPages.length > 0 && (
        <div style={{ position: "absolute", left: "-9999px", top: "-9999px", zIndex: -100 }}>
          {proposalPages.map((pageContent, pIdx) => {
            return (
              <div 
                key={`combo-page-${pIdx}`}
                id={`combo-proposal-page-${pIdx + 1}`}
                style={{
                  width: "794px",
                  height: "1123px",
                  padding: "40px 40px 80px 40px",
                  overflow: "hidden",
                  boxSizing: "border-box",
                  backgroundColor: "#ffffff",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  fontFamily: UNIFORM_FONT_STACK
                }}
              >
                <div>
                  {/* Top Meta Header */}
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#64748b", marginBottom: "12px" }}>
                    <span>{downloadDateTime}</span>
                    <span style={{ fontWeight: "700" }}>ANANYA HI SOLUTIONS — CUSTOM COMBO PROPOSAL</span>
                  </div>

                  {/* Render Cover Header if page 1 */}
                  {pIdx === 0 && (
                    <>
                      {/* Banner */}
                      <div style={{
                        background: "linear-gradient(135deg, #0f75bc 0%, #1d4ed8 100%)",
                        padding: "20px 30px",
                        borderRadius: "10px",
                        color: "#ffffff"
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <h1 style={{ fontSize: "21px", fontWeight: "900", margin: 0, letterSpacing: "0.5px" }}>ANANYA HI SOLUTIONS</h1>
                          <span style={{ fontSize: "11px", fontWeight: "700", background: "rgba(255, 255, 255, 0.15)", padding: "3px 10px", borderRadius: "20px" }}>
                            Proposal ID: #AHS-C-{proposalCount}
                          </span>
                        </div>
                        <div style={{ width: "50px", height: "2px", background: "#f58220", margin: "8px 0 4px 0" }} />
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "10.5px", opacity: 0.9 }}>
                          <span>in collaboration with <strong>swetha solutions</strong></span>
                          <span>Issue Date: {issueDate}</span>
                        </div>
                      </div>

                      {/* Info Grid */}
                      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "30px", margin: "20px 0" }}>
                        <div>
                          <span style={{ background: "#eff6ff", color: "#1e40af", padding: "3px 8px", borderRadius: "4px", fontSize: "9px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.5px" }}>Prepared For</span>
                          <h2 style={{ fontSize: "17px", fontWeight: "800", color: "#0f172a", margin: "8px 0 2px 0" }}>{leadInfo.name}</h2>
                          {leadInfo.company && <p style={{ color: "#475569", fontSize: "12px", margin: "0 0 10px 0", fontWeight: "600" }}>{leadInfo.company}</p>}
                          <div style={{ fontSize: "11.5px", color: "#475569", lineHeight: "1.5" }}>
                            {leadInfo.phone && <div>📞 {leadInfo.phone}</div>}
                            {leadInfo.email && <div>✉️ {leadInfo.email}</div>}
                          </div>
                        </div>
                        <div>
                          <span style={{ background: "#f8fafc", color: "#475569", padding: "3px 8px", borderRadius: "4px", fontSize: "9px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.5px" }}>Service Provider</span>
                          <h3 style={{ fontSize: "14px", fontWeight: "800", color: "#0f172a", margin: "8px 0 2px 0" }}>Ananya Hi Solutions</h3>
                          <p style={{ color: "#475569", fontSize: "11px", margin: "0 0 8px 0", lineHeight: "1.3" }}>
                            Flat No. 502, Riviera Apartments, Dwarakapuri,<br />Punjagutta, Hyderabad, Telangana 500082
                          </p>
                          <div style={{ fontSize: "11.5px", color: "#0f75bc", fontWeight: "700", lineHeight: "1.5" }}>
                            <div>🌐 www.ananyahisolutions.com</div>
                            <div>✉️ info@ananyahisolutions.com</div>
                            <div>📞 (+91) 76739-35353</div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Render Page Contents */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    {pageContent.map((item, itemIdx) => {
                      if (item.type === "SUMMARY") {
                        // Render Pricing Summary + T&C
                        return (
                          <div key={`summary-block`} style={{ display: "flex", flexDirection: "column", gap: "16px", borderTop: "1px solid #e2e8f0", paddingTop: "14px" }}>
                            {/* Table of selected items */}
                            <h3 style={{ fontSize: "13px", fontWeight: "800", color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 4px 0", borderBottom: "2px solid #e2e8f0", paddingBottom: "4px" }}>Combo Pricing Overview</h3>
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11.5px" }}>
                              <thead>
                                <tr style={{ background: "#f8fafc" }}>
                                  <th style={{ padding: "8px 10px", textAlign: "left", fontWeight: "700", borderBottom: "2px solid #e2e8f0", color: "#475569" }}>Sl.</th>
                                  <th style={{ padding: "8px 10px", textAlign: "left", fontWeight: "700", borderBottom: "2px solid #e2e8f0", color: "#475569" }}>Service Package & Selected Plan</th>
                                  <th style={{ padding: "8px 10px", textAlign: "right", fontWeight: "700", borderBottom: "2px solid #e2e8f0", color: "#475569" }}>Base Cost</th>
                                  <th style={{ padding: "8px 10px", textAlign: "right", fontWeight: "700", borderBottom: "2px solid #e2e8f0", color: "#475569" }}>{excludeGst ? "GST" : "GST (18%)"}</th>
                                  <th style={{ padding: "8px 10px", textAlign: "right", fontWeight: "700", borderBottom: "2px solid #e2e8f0", color: "#475569" }}>Total Cost</th>
                                </tr>
                              </thead>
                              <tbody>
                                {selectedComboItems.map((cItem, cIdx) => (
                                  <tr key={cIdx} style={{ borderBottom: "1px solid #e2e8f0" }}>
                                    <td style={{ padding: "8px 10px", color: "#475569" }}>{cIdx + 1}</td>
                                    <td style={{ padding: "8px 10px", fontWeight: "700", color: "#0f172a" }}>
                                      {cItem.packageTitle} — <span style={{ color: "#0f75bc" }}>{cItem.planName}</span>
                                      {!cItem.isWebsite && cItem.durationMonths > 1 ? (
                                        <span style={{ fontSize: "10px", color: "#64748b", fontWeight: "600" }}> ({cItem.durationMonths} Mo)</span>
                                      ) : cItem.isWebsite ? (
                                        <span style={{ fontSize: "10px", color: "#1d4ed8", fontWeight: "600" }}> (One-Time)</span>
                                      ) : null}
                                    </td>
                                    <td style={{ padding: "8px 10px", textAlign: "right", color: "#334155" }}>₹{cItem.basePrice.toLocaleString("en-IN")}</td>
                                    <td style={{ padding: "8px 10px", textAlign: "right", color: "#334155" }}>{excludeGst ? "Excluded" : `₹${cItem.gstAmount.toLocaleString("en-IN")}`}</td>
                                    <td style={{ padding: "8px 10px", textAlign: "right", fontWeight: "700", color: "#0f75bc" }}>₹{cItem.totalWithGst.toLocaleString("en-IN")}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>

                            {/* Grand Total box */}
                            <div style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              background: "#f0fdf4",
                              border: "1px solid #bbf7d0",
                              borderRadius: "8px",
                              padding: "12px 16px"
                            }}>
                              <span style={{ fontSize: "12px", fontWeight: "800", color: "#166534", textTransform: "uppercase", letterSpacing: "0.5px" }}>Final Combo Grand Total:</span>
                              <span style={{ fontSize: "18px", fontWeight: "900", color: "#166534" }}>
                                ₹{finalGrandTotal.toLocaleString("en-IN")}{" "}
                                <span style={{ fontSize: "10px", fontWeight: "600" }}>
                                  {excludeGst ? "(GST Excluded)" : "(incl. 18% GST)"}
                                </span>
                              </span>
                            </div>

                            {/* T&C Strip */}
                            <div style={{ background: "#f8fafc", padding: "12px 16px", borderRadius: "8px", border: "1px solid #cbd5e1" }}>
                              <h4 style={{ fontSize: "11px", fontWeight: "800", color: "#1e293b", margin: "0 0 6px 0", letterSpacing: "0.5px" }}>Terms And Condition :</h4>
                              <ul style={{ fontSize: "10px", color: "#475569", margin: 0, paddingLeft: "14px", lineHeight: "1.5", listStyleType: "disc" }}>
                                <li>Any extra work beyond this proposal will be charged extra.</li>
                                <li>Campaign charges are not included.</li>
                                <li>Quotation is valid for 15 days from the date of issue.</li>
                                <li>All payments must be made directly to Ananya Hi Solutions / Swetha Solutions account only.</li>
                              </ul>
                            </div>
                          </div>
                        );
                      } else {
                        // Render Plan chunk (feature-level split across pages)
                        const planIndex = selectedComboItems.findIndex(p => p.packageTitle === item.packageTitle && p.planName === item.planName) + 1;

                        return (
                          <div key={`plan-block-${itemIdx}`} style={{ borderTop: itemIdx > 0 ? "1px solid #e2e8f0" : "none", paddingTop: itemIdx > 0 ? "14px" : "0px" }}>
                            {/* Plan title strip — only shown on first chunk */}
                            {item.isFirstChunk && (
                              <div style={{
                                background: "#0f75bc",
                                padding: "6px 12px",
                                borderRadius: "4px",
                                color: "#ffffff",
                                marginBottom: "10px",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px"
                              }}>
                                <h3 style={{ fontSize: "12px", fontWeight: "900", margin: 0 }}>
                                  {planIndex}. {item.packageTitle} — {item.planName}
                                  {!item.isWebsite && item.durationMonths > 1 ? ` (${item.durationMonths} Months)` : item.isWebsite ? " (One-Time Payment)" : ""}
                                </h3>
                                <span style={{ fontSize: "8.5px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.5px", color: "#e0f2fe" }}>
                                  — Scope of Work
                                </span>
                              </div>
                            )}

                            {/* Continuation label for non-first chunks */}
                            {!item.isFirstChunk && (
                              <div style={{
                                background: "#f1f5f9",
                                padding: "4px 12px",
                                borderRadius: "4px",
                                marginBottom: "10px",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px"
                              }}>
                                <span style={{ fontSize: "10px", fontWeight: "700", color: "#0f75bc" }}>
                                  {planIndex}. {item.packageTitle} — {item.planName} (Continued)
                                </span>
                              </div>
                            )}

                            {/* Features list */}
                            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "6px", padding: "12px 16px" }}>
                              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                {item.featureChunk.map((feat, fIdx) => (
                                  <div key={fIdx} style={{ fontSize: "12px", color: "#334155", display: "flex", alignItems: "flex-start", gap: "6px", lineHeight: "1.3" }}>
                                    <span style={{ color: "#10b981", fontWeight: "bold" }}>✓</span>
                                    <span>{feat}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Pricing box — only shown on last chunk */}
                            {item.isLastChunk && (
                              <div style={{ marginTop: "8px" }}>
                                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "6px", padding: "8px 12px" }}>
                                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10.5px", color: "#475569" }}>
                                      <span>{!item.isWebsite && item.durationMonths > 1 ? `Plan Amount (₹${item.monthlyPrice.toLocaleString("en-IN")} x ${item.durationMonths} mo):` : "Plan Amount:"}</span>
                                      <span style={{ fontWeight: "600", color: "#0f172a" }}>₹{item.basePrice.toLocaleString("en-IN")}</span>
                                    </div>
                                    {!excludeGst && (
                                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10.5px", color: "#475569" }}>
                                        <span>{!item.isWebsite && item.durationMonths > 1 ? `GST 18% (₹${item.baseMonthlyGst.toLocaleString("en-IN")} x ${item.durationMonths} mo):` : "GST (18%):"}</span>
                                        <span style={{ fontWeight: "600", color: "#0f172a" }}>₹{item.gstAmount.toLocaleString("en-IN")}</span>
                                      </div>
                                    )}
                                    <div style={{ height: "1px", background: "#cbd5e1", margin: "3px 0" }} />
                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11.5px", fontWeight: "800" }}>
                                      <span style={{ color: "#0f75bc" }}>Grand Total:</span>
                                      <span style={{ color: "#0f75bc" }}>₹{item.totalWithGst.toLocaleString("en-IN")}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      }
                    })}
                  </div>
                </div>

                {/* Footer */}
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#94a3b8", borderTop: "1px solid #f1f5f9", paddingTop: "12px" }}>
                  <span>Page {pIdx + 1} of {proposalPages.length}</span>
                  <span>Ananya Hi Solutions © 2026. All Rights Reserved.</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
