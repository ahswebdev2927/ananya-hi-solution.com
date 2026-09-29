"use client";

import React, { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Header from "../../components/Header";
import { PACKAGE_PLANS_DATA } from "../../../data/plans";
import Link from "next/link";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// Common uniform font stack to ensure absolute visual consistency in rendering
const UNIFORM_FONT_STACK =
  "'Times New Roman', Times, Baskerville, Georgia, serif";

const renderPlanName = (
  name,
  subSize = "13px",
  subColor = "inherit",
  blockStyle = {},
) => {
  const match = name.match(/^(.*?)\s*\((.*?)\)$/);
  if (match) {
    return (
      <span
        style={{ display: "inline-block", textAlign: "center", ...blockStyle }}
      >
        <span style={{ display: "block" }}>{match[1]}</span>
        <span
          style={{
            display: "block",
            fontSize: subSize,
            fontWeight: "600",
            opacity: 0.8,
            color: subColor,
            marginTop: "4px",
            textTransform: "none",
          }}
        >
          ({match[2]})
        </span>
      </span>
    );
  }
  return name;
};

// Recursively expand "Everything in Basic" and "Everything in Standard" references to full features lists
const getExpandedFeatures = (plan, allPlans, visited = new Set()) => {
  if (!plan || !plan.features || visited.has(plan.name)) return [];
  visited.add(plan.name);

  let expanded = [];
  for (const feature of plan.features) {
    const cleanFeature = feature.trim().toLowerCase();

    if (cleanFeature.startsWith("everything in basic")) {
      const basicPlan = allPlans.find((p) =>
        p.name.toLowerCase().includes("basic"),
      );
      if (basicPlan) {
        expanded = [
          ...expanded,
          ...getExpandedFeatures(basicPlan, allPlans, visited),
        ];
      } else {
        expanded.push(feature);
      }
    } else if (cleanFeature.startsWith("everything in standard")) {
      const standardPlan = allPlans.find((p) =>
        p.name.toLowerCase().includes("standard"),
      );
      if (standardPlan) {
        expanded = [
          ...expanded,
          ...getExpandedFeatures(standardPlan, allPlans, visited),
        ];
      } else {
        expanded.push(feature);
      }
    } else {
      expanded.push(feature);
    }
  }
  return expanded;
};

// Date formatting helper for issue date (e.g. 6th June 2026)
const getOrdinalSuffix = (day) => {
  if (day > 3 && day < 21) return "th";
  switch (day % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
};

const formatIssueDate = (date) => {
  const day = date.getDate();
  const month = date.toLocaleDateString("en-US", { month: "long" });
  const year = date.getFullYear();
  return `${day}${getOrdinalSuffix(day)} ${month} ${year}`;
};

// Date formatting helper for browser print header (e.g. 06/06/2026, 11:02)
const formatDownloadDateTime = (date) => {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year}, ${hours}:${minutes}`;
};

function PlansContent() {
  const searchParams = useSearchParams();
  const packageTitle = searchParams.get("package") || "Selected Package";

  // Initialize plansData to empty to show the loading spinner while fetching updated plans from database
  const [plansData, setPlansData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [whiteLogoSrc, setWhiteLogoSrc] = useState("");

  const [leadInfo, setLeadInfo] = useState({
    name: "Client Name",
    company: "",
    phone: "",
    email: "",
  });
  const [downloadDateTime, setDownloadDateTime] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [generatingPdfId, setGeneratingPdfId] = useState(null);
  const [proposalCount, setProposalCount] = useState(135);

  // Proposal modal customization state
  const [selectedPlanForProposal, setSelectedPlanForProposal] = useState(null);
  const [proposalDuration, setProposalDuration] = useState(1);
  const [excludeGst, setExcludeGst] = useState(false);
  const [proposalCustomizations, setProposalCustomizations] = useState({});

  // Reset state during render when packageTitle changes to show loading spinner instantly
  const [prevPackageTitle, setPrevPackageTitle] = useState(packageTitle);
  if (packageTitle !== prevPackageTitle) {
    setPrevPackageTitle(packageTitle);
    setPlansData([]);
    setLoading(true);
    setGeneratingPdfId(null);
    setSelectedPlanForProposal(null);
  }

  const handleOpenProposalModal = (plan, idx) => {
    const existing = proposalCustomizations[idx] || {
      duration: 1,
      excludeGst: false,
    };
    setProposalDuration(existing.duration || 1);
    setExcludeGst(existing.excludeGst || false);
    setSelectedPlanForProposal({ plan, idx });
  };

  const handleConfirmAndDownloadProposal = async () => {
    if (!selectedPlanForProposal) return;
    const { plan, idx } = selectedPlanForProposal;
    const targetDuration = proposalDuration;
    const targetExcludeGst = excludeGst;

    setProposalCustomizations((prev) => ({
      ...prev,
      [idx]: { duration: targetDuration, excludeGst: targetExcludeGst },
    }));

    setSelectedPlanForProposal(null);
    await handleDownloadInvoice(plan, idx, targetDuration, targetExcludeGst);
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = "/logo.png";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);

        try {
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imgData.data;

          for (let i = 0; i < data.length; i += 4) {
            data[i] = 255; // R
            data[i + 1] = 255; // G
            data[i + 2] = 255; // B
          }

          ctx.putImageData(imgData, 0, 0);
          setWhiteLogoSrc(canvas.toDataURL());
        } catch (e) {
          console.error("Error creating white logo data url:", e);
        }
      };
    }
  }, []);

  useEffect(() => {
    let active = true;

    // If it's the initial default fallback, let's wait for query parameters to hydrate.
    // However, if it doesn't change after a while, we should stop loading.
    if (packageTitle === "Selected Package") {
      const timer = setTimeout(() => {
        if (active) {
          setLoading(false);
          setPlansData([]);
        }
      }, 500);
      return () => {
        active = false;
        clearTimeout(timer);
      };
    }

    setLoading(true);
    setPlansData([]);

    const fetchPlans = async () => {
      try {
        const res = await fetch("/api/packages");
        if (!active) return;
        if (res.ok) {
          const data = await res.json();
          if (data.plans && data.plans[packageTitle]) {
            if (active) setPlansData(data.plans[packageTitle]);
          } else {
            if (active) setPlansData([]);
          }
        } else {
          if (active) setPlansData([]);
        }
      } catch (err) {
        console.error("Error fetching plans:", err);
        if (active) setPlansData([]);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchPlans();

    return () => {
      active = false;
    };
  }, [packageTitle]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedCount = localStorage.getItem("proposal_counter");
      if (savedCount) {
        setProposalCount(parseInt(savedCount, 10));
      } else {
        localStorage.setItem("proposal_counter", "135");
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // 1. Try to read from URL search parameters first
      const urlName = searchParams.get("name");
      const urlEmail = searchParams.get("email");
      const urlPhone = searchParams.get("phone");
      const urlCompany = searchParams.get("company");

      if (urlName) {
        const info = {
          name: urlName,
          email: urlEmail || "",
          phone: urlPhone || "",
          company: urlCompany || "",
        };
        setLeadInfo(info);
        localStorage.setItem("ahs_lead_info", JSON.stringify(info));
        return;
      }

      // 2. Fall back to localStorage
      const saved = localStorage.getItem("ahs_lead_info");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setLeadInfo({
            name: parsed.name || "Client Name",
            company: parsed.company || "",
            phone: parsed.phone || "",
            email: parsed.email || "",
          });
        } catch (e) {
          console.error("Error parsing stored lead data:", e);
        }
      }
    }
  }, [searchParams]);

  const handleWhatsAppClick = (planName) => {
    const phoneNumber = "917673935353";
    const message = `Hi Ananya Team, I'm interested in the ${planName} plan of ${packageTitle}.`;
    const encodedMessage = encodeURIComponent(message);
    window.open(
      `https://wa.me/${phoneNumber}?text=${encodedMessage}`,
      "_blank",
    );
  };

  const handleDownloadInvoice = async (
    plan,
    idx,
    durationOverride,
    excludeGstOverride,
  ) => {
    if (durationOverride !== undefined) {
      setProposalCustomizations((prev) => ({
        ...prev,
        [idx]: { duration: durationOverride, excludeGst: !!excludeGstOverride },
      }));
    }

    const now = new Date();
    setDownloadDateTime(formatDownloadDateTime(now));
    setIssueDate(formatIssueDate(now));

    setGeneratingPdfId(idx);
    try {
      // Delay to ensure React state updates propagate to HTML elements
      await new Promise((r) => setTimeout(r, 450));

      const page1 = document.getElementById(`proposal-page-1-${idx}`);

      if (!page1) {
        alert("Error: Template Page 1 element not found.");
        return;
      }

      const doc = new jsPDF("p", "mm", "a4");

      // Capture all pages dynamically
      let pageNum = 1;
      while (true) {
        const pageEl = document.getElementById(`proposal-page-${pageNum}-${idx}`);
        if (!pageEl) break;
        
        const canvas = await html2canvas(pageEl, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          width: 794,
          height: 1123,
          windowWidth: 794,
        });
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        if (pageNum > 1) {
          doc.addPage();
        }
        doc.addImage(imgData, 'JPEG', 0, 0, 210, 297);
        pageNum++;
      }

      const sanitizedName = plan.name.replace(/\s+/g, "_");
      const sanitizedPackage = packageTitle.replace(/\s+/g, "_");
      doc.save(`Proposal_${sanitizedPackage}_${sanitizedName}.pdf`);

      // Increment proposal counter on success
      setProposalCount((prev) => {
        const next = prev + 1;
        if (typeof window !== "undefined") {
          localStorage.setItem("proposal_counter", next.toString());
        }
        return next;
      });

      // Log invoice download
      if (typeof window !== "undefined") {
        try {
          const existing = localStorage.getItem("ahs_actions_history");
          const list = existing ? JSON.parse(existing) : [];
          list.push({
            type: "DOWNLOAD_INVOICE",
            timestamp: new Date().toISOString(),
            details: {
              name: leadInfo.name,
              email: leadInfo.email,
              phone: leadInfo.phone,
              company: leadInfo.company,
              planName: plan.name,
              packageName: packageTitle,
              price: plan.price,
            },
          });
          localStorage.setItem("ahs_actions_history", JSON.stringify(list));
        } catch (e) {
          console.error("Error logging invoice download to localStorage:", e);
        }
      }
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setGeneratingPdfId(null);
    }
  };

  return (
    <div className="plans-page-wrapper">
      <Header activePage="packages" />

      <section className="plans-section">
        <span className="plans-subtitle">Transparent Pricing</span>
        <h1 className="plans-title">Choose Your Perfect Plan</h1>
        <p className="plans-description">
          Choose the plan that fits your vision — and let’s build your digital
          success story together for <strong>{packageTitle}</strong>!
        </p>

        {loading && plansData.length === 0 ? (
          <div
            className="plans-loading-state"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "300px",
              gap: "20px",
            }}
          >
            <div
              className="spinner-dashboard"
              style={{
                width: "50px",
                height: "50px",
                borderTopColor: "var(--accent-orange)",
              }}
            ></div>
            <p
              style={{
                color: "var(--secondary-slate)",
                fontSize: "1.1rem",
                fontWeight: "500",
              }}
            >
              {packageTitle === "Selected Package"
                ? "Loading plans..."
                : `Loading plans for ${packageTitle}...`}
            </p>
          </div>
        ) : plansData.length > 0 ? (
          <div className="plans-grid">
            {plansData.map((plan, idx) => (
              <div
                key={idx}
                className={`plan-card ${plan.isPopular ? "plan-card-popular" : ""}`}
              >
                {plan.isPopular && (
                  <div className="plan-badge">Most Popular</div>
                )}

                <div className="plan-card-content">
                  <h3
                    className="plan-name"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {plan.icon && (
                        <span style={{ marginRight: "8px" }}>{plan.icon}</span>
                      )}
                      {plan.name.match(/^(.*?)\s*\(.*?\)$/)
                        ? plan.name.match(/^(.*?)\s*\(.*?\)$/)[1]
                        : plan.name}
                    </span>
                    {plan.name.match(/^(.*?)\s*\((.*?)\)$/) && (
                      <span
                        style={{
                          display: "block",
                          fontSize: "13px",
                          fontWeight: "600",
                          opacity: 0.75,
                          marginTop: "4px",
                          textTransform: "none",
                        }}
                      >
                        ({plan.name.match(/^(.*?)\s*\((.*?)\)$/)[2]})
                      </span>
                    )}
                  </h3>
                  <div className="plan-price-wrapper">
                    <span className="plan-price">{plan.price}</span>
                    <span className="plan-billing">{plan.billing}</span>
                  </div>

                  <ul className="plan-features-list">
                    {plan.features.map((feature, fIdx) => {
                      const isHighlighted =
                        feature
                          .toLowerCase()
                          .startsWith("everything in basic") ||
                        feature
                          .toLowerCase()
                          .startsWith("everything in standard");
                      return (
                        <li
                          key={fIdx}
                          className={`plan-feature-item ${isHighlighted ? "highlighted-feature" : ""}`}
                        >
                          <span
                            className="feature-icon"
                            style={
                              isHighlighted
                                ? { color: "var(--accent-orange)" }
                                : {}
                            }
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 11.22a.75.75 0 00-1.06 1.06l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </span>
                          <span
                            className="feature-text"
                            style={
                              isHighlighted
                                ? {
                                    fontWeight: "800",
                                    color: "var(--accent-orange)",
                                  }
                                : {}
                            }
                          >
                            {feature}
                          </span>
                        </li>
                      );
                    })}
                  </ul>

                  {plan.note && plan.note.trim() && (
                    <div className="plan-alert-note">{plan.note}</div>
                  )}

                  <div
                    className="plan-action-area"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                    }}
                  >
                    <button
                      onClick={() => handleWhatsAppClick(plan.name)}
                      className="plan-whatsapp-btn"
                      style={{ marginBottom: 0 }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        fill="currentColor"
                        viewBox="0 0 16 16"
                      >
                        <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z" />
                      </svg>
                      Get in Touch
                    </button>

                    <button
                      onClick={() => handleOpenProposalModal(plan, idx)}
                      disabled={generatingPdfId !== null}
                      className="plan-pdf-btn"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      {generatingPdfId === idx
                        ? "Generating PDF..."
                        : "Download Proposal"}
                    </button>

                    <p className="plan-expert-msg">
                      One of our experts will contact you soon.
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="plans-empty-state">
            <div className="empty-icon">🚀</div>
            <h3 className="empty-title">Plans Coming Soon!</h3>
            <p className="empty-desc">
              We are currently tailoring the perfect pricing plans for{" "}
              <strong>{packageTitle}</strong>. Leave us a message and we'll get
              back to you with a custom quote!
            </p>
            <Link href="/contact" className="empty-btn">
              Contact Us Now
            </Link>
          </div>
        )}
      </section>

      {/* Hidden Templates for PDF Generation */}
      {plansData.length > 0 &&
        plansData.map((plan, idx) => {
          const expandedFeatures = getExpandedFeatures(plan, plansData);

          // Dynamic feature chunking: Page 1 has cover header overhead so fewer features fit
          // Page 1: banner(90) + info-grid(150) + plan-title(40) + pricing-panel(110) = ~390px overhead
          // Available for features: 1123 - 70(padding) - 30(footer) - 390 = ~633px
          // Per feature row: ~25px (12.5px font + 10px margin + 1.4 line-height)
          const PAGE1_FEATURE_CAP = 18;
          const PAGEN_FEATURE_CAP = 30;

          const featureChunks = [];
          let featuresLeft = [...expandedFeatures];
          featureChunks.push(featuresLeft.slice(0, PAGE1_FEATURE_CAP));
          featuresLeft = featuresLeft.slice(PAGE1_FEATURE_CAP);
          while (featuresLeft.length > 0) {
            featureChunks.push(featuresLeft.slice(0, PAGEN_FEATURE_CAP));
            featuresLeft = featuresLeft.slice(PAGEN_FEATURE_CAP);
          }
          const totalPdfPages = featureChunks.length;
          const isSinglePage = totalPdfPages === 1;
          const featuresPage1 = featureChunks[0];

          // Proposal Customization settings for this plan index
          const custom = proposalCustomizations[idx] || {
            duration: 1,
            excludeGst: false,
          };
          const durationMonths = custom.duration || 1;
          const isGstExcluded = !!custom.excludeGst;

          // Parse pricing for GST breakdown
          const parsePrice = (priceStr) => {
            if (!priceStr) return 0;
            const cleanStr = priceStr.replace(/[^\d]/g, "");
            return parseInt(cleanStr, 10) || 0;
          };
          const formatCurrency = (num) => {
            return "₹" + num.toLocaleString("en-IN");
          };

          const rawMonthlyPrice = parsePrice(plan.price);
          const totalBaseAmount = rawMonthlyPrice * durationMonths;

          // Calculate base monthly GST first, then multiply by duration
          const baseMonthlyGst = Math.round(rawMonthlyPrice * 0.18);
          const gstAmount = isGstExcluded ? 0 : baseMonthlyGst * durationMonths;
          const grandTotal = totalBaseAmount + gstAmount;

          const durationText =
            durationMonths === 1
              ? "1 month"
              : durationMonths === 12
                ? "1 year"
                : `${durationMonths} months`;

          const billingText =
            durationMonths === 1
              ? plan.billing.replace("+", "").trim() || "For 30 Days"
              : durationMonths === 12
                ? "For 1 Year (365 Days)"
                : `For ${durationMonths} Months (${durationMonths * 30} Days)`;

          const planAmountLabelStr =
            durationMonths > 1
              ? `Plan Amount (${formatCurrency(rawMonthlyPrice)} x ${durationText}):`
              : `Plan Amount:`;

          const planAmountDisplayValue = formatCurrency(totalBaseAmount);
          const gstStr = formatCurrency(gstAmount);
          const grandTotalStr = formatCurrency(grandTotal);

          return (
            <div
              key={`pdf-template-${idx}`}
              style={{
                position: "absolute",
                left: "-9999px",
                top: "-9999px",
                zIndex: -100,
              }}
            >
              {/* Page 1 */}
              <div
                id={`proposal-page-1-${idx}`}
                style={{
                  width: "794px",
                  height: "1123px",
                  padding: "30px 40px 40px 40px",
                  boxSizing: "border-box",
                  backgroundColor: "#ffffff",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  overflow: "hidden",
                  fontFamily: UNIFORM_FONT_STACK,
                }}
              >
                <div>
                  {/* Metadata Browser Print Header Strip */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "11px",
                      color: "#333333",
                      marginBottom: "12px",
                      padding: "0 4px",
                      fontFamily: UNIFORM_FONT_STACK,
                    }}
                  >
                    <span>{downloadDateTime}</span>
                    <span style={{ fontWeight: "600" }}>
                      Ananya Hi Solutions - Quotation Overview
                    </span>
                  </div>

                  {/* Header Banner */}
                  <div
                    style={{
                      background:
                        "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                      padding: "24px 30px",
                      borderRadius: "10px 10px 0 0",
                      color: "#ffffff",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "20px",
                          fontWeight: "800",
                          letterSpacing: "0.5px",
                        }}
                      >
                        ANANYA HI SOLUTIONS
                      </span>
                      <span style={{ fontSize: "14px", fontWeight: "700" }}>
                        Proposal ID: #{proposalCount + idx}
                      </span>
                    </div>

                    {/* Small Divider */}
                    <div
                      style={{
                        width: "40px",
                        height: "1px",
                        background: "rgba(255, 255, 255, 0.35)",
                        margin: "3px 0",
                      }}
                    ></div>

                    {/* Second Row: Collaboration Subtext & Date */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginTop: "1px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "9.5px",
                          fontWeight: "500",
                          color: "rgba(255, 255, 255, 0.9)",
                          fontStyle: "italic",
                          fontFamily: UNIFORM_FONT_STACK,
                        }}
                      >
                        in collaboration with{" "}
                        <span
                          style={{
                            fontWeight: "700",
                            color: "#ffffff",
                            fontSize: "9.5px",
                          }}
                        >
                          swetha solutions
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          opacity: 0.95,
                          textAlign: "right",
                          fontFamily: UNIFORM_FONT_STACK,
                        }}
                      >
                        Issue Date: {issueDate}
                      </div>
                    </div>
                  </div>

                  {/* Info Grid */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "30px",
                      margin: "30px 0",
                    }}
                  >
                    <div>
                      <span
                        style={{
                          background: "#f1f5f9",
                          color: "#475569",
                          padding: "4px 10px",
                          borderRadius: "4px",
                          fontSize: "11px",
                          fontWeight: "700",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        Business Proposal
                      </span>
                      <h2
                        style={{
                          fontSize: "22px",
                          fontWeight: "800",
                          color: "#0f172a",
                          margin: "10px 0 2px 0",
                        }}
                      >
                        {leadInfo.name}
                      </h2>
                      {leadInfo.company &&
                        leadInfo.company !== "Company Name" && (
                          <p
                            style={{
                              color: "#64748b",
                              fontSize: "14px",
                              margin: "0 0 12px 0",
                              fontWeight: "500",
                            }}
                          >
                            {leadInfo.company}
                          </p>
                        )}
                      <div
                        style={{
                          fontSize: "13px",
                          color: "#475569",
                          lineHeight: "1.6",
                          marginTop: "8px",
                        }}
                      >
                        {leadInfo.phone &&
                          leadInfo.phone !== "Phone Number" && (
                            <div>📞 {leadInfo.phone}</div>
                          )}
                        {leadInfo.email &&
                          leadInfo.email !== "Email Address" && (
                            <div>✉️ {leadInfo.email}</div>
                          )}
                      </div>
                    </div>

                    <div>
                      <h3
                        style={{
                          fontSize: "16px",
                          fontWeight: "800",
                          color: "#0f172a",
                          margin: "0 0 8px 0",
                        }}
                      >
                        Ananya Hi Solutions
                      </h3>
                      <p
                        style={{
                          color: "#475569",
                          fontSize: "13px",
                          margin: "0 0 10px 0",
                          lineHeight: "1.4",
                        }}
                      >
                        Flat No. 502, Riviera Apartments, Dwarakapuri,
                        <br />
                        Punjagutta, Hyderabad, Telangana 500082
                      </p>
                      <div
                        style={{
                          fontSize: "13px",
                          color: "#2563eb",
                          fontWeight: "600",
                          lineHeight: "1.6",
                        }}
                      >
                        <div>🌐 www.ananyahisolutions.com</div>
                        <div>✉️ info@ananyahisolutions.com</div>
                        <div>📞 (+91) 76739-35353</div>
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      background: "#2563eb",
                      color: "#ffffff",
                      textAlign: "center",
                      padding: "12px",
                      fontSize: "16px",
                      fontWeight: "700",
                      borderRadius: "8px 8px 0 0",
                    }}
                  >
                    {packageTitle}
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1.5fr 1fr",
                      border: "1px solid #e2e8f0",
                      borderTop: "none",
                    }}
                  >
                    <div style={{ padding: "24px", background: "#f8fafc" }}>
                      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                        {featuresPage1.map((feat, fIdx) => (
                          <li
                            key={fIdx}
                            style={{
                              fontSize: "12.5px",
                              color: "#334155",
                              margin: "0 0 10px 0",
                              display: "flex",
                              alignItems: "flex-start",
                              gap: "8px",
                              lineHeight: "1.4",
                            }}
                          >
                            <span
                              style={{ color: "#22c55e", fontWeight: "bold" }}
                            >
                              ✓
                            </span>
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div
                      style={{
                        padding: "24px",
                        background: "#eff6ff",
                        borderLeft: "1px solid #e2e8f0",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        alignItems: "center",
                        textAlign: "center",
                      }}
                    >
                      <div style={{ width: "100%" }}>
                        <div
                          style={{
                            fontSize: "11px",
                            color: "#64748b",
                            textTransform: "uppercase",
                            fontWeight: "700",
                            letterSpacing: "0.5px",
                          }}
                        >
                          Payable Amount
                        </div>
                        <div
                          style={{
                            fontSize: "28px",
                            color: "#1e3a8a",
                            fontWeight: "800",
                            margin: "10px 0 20px 0",
                          }}
                        >
                          {formatCurrency(totalBaseAmount)}
                          {!isGstExcluded && (
                            <span
                              style={{
                                fontSize: "13px",
                                fontWeight: "600",
                                color: "#475569",
                                marginLeft: "5px",
                                verticalAlign: "middle",
                              }}
                            >
                              +GST
                            </span>
                          )}
                        </div>

                        {/* Plan Card */}
                        <div
                          style={{
                            background: "#dbeafe",
                            border: "1px solid #bfdbfe",
                            borderRadius: "6px",
                            padding: "16px",
                            textAlign: "center",
                            marginTop: "40px",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "16px",
                              fontWeight: "700",
                              color: "#2563eb",
                            }}
                          >
                            {plan.name.match(/^(.*?)\s*\(.*?\)$/)
                              ? plan.name.match(/^(.*?)\s*\(.*?\)$/)[1]
                              : plan.name}
                            {plan.name.match(/^(.*?)\s*\((.*?)\)$/) && (
                              <div
                                style={{
                                  fontSize: "11px",
                                  fontWeight: "600",
                                  color: "#4b5563",
                                  marginTop: "2px",
                                  textTransform: "none",
                                }}
                              >
                                ({plan.name.match(/^(.*?)\s*\((.*?)\)$/)[2]})
                              </div>
                            )}
                          </div>
                          <div
                            style={{
                              fontSize: "12px",
                              color: "#475569",
                              marginTop: "4px",
                            }}
                          >
                            {billingText}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {isSinglePage && (
                    <div style={{ marginTop: "20px" }}>
                      {plan.note && plan.note.trim() && (
                        <div
                          style={{
                            background: "#fffbeb",
                            border: "1px solid #fde68a",
                            color: "#b45309",
                            padding: "10px 15px",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: "600",
                            marginBottom: "15px",
                            display: "inline-block",
                          }}
                        >
                          Note: {plan.note}
                        </div>
                      )}

                      {/* Payment Summary Box (GST Breakdown) */}
                      <div style={{ margin: "15px 0" }}>
                        <div
                          style={{
                            border: "1px solid #bfdbfe",
                            borderRadius: "6px",
                            background: "#eff6ff",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              background: "#2563eb",
                              color: "#ffffff",
                              padding: "10px 20px",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <span
                              style={{ fontSize: "14px", fontWeight: "700" }}
                            >
                              Payment Summary
                            </span>
                            <span
                              style={{
                                fontSize: "11px",
                                fontWeight: "700",
                                textTransform: "uppercase",
                              }}
                            >
                              {plan.name.match(/^(.*?)\s*\(.*?\)$/)
                                ? plan.name.match(/^(.*?)\s*\(.*?\)$/)[1]
                                : plan.name}
                            </span>
                          </div>
                          <div style={{ padding: "12px 20px" }}>
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                fontSize: "12px",
                                color: "#475569",
                                margin: "4px 0",
                              }}
                            >
                              <span>{planAmountLabelStr}</span>
                              <span
                                style={{ fontWeight: "700", color: "#1e293b" }}
                              >
                                {planAmountDisplayValue}
                              </span>
                            </div>
                            {!isGstExcluded && (
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  fontSize: "12px",
                                  color: "#475569",
                                  margin: "4px 0",
                                }}
                              >
                                <span>
                                  {durationMonths > 1
                                    ? `GST 18% (${formatCurrency(baseMonthlyGst)} x ${durationMonths} mo):`
                                    : "GST (18%):"}
                                </span>
                                <span
                                  style={{
                                    fontWeight: "700",
                                    color: "#1e293b",
                                  }}
                                >
                                  {formatCurrency(gstAmount)}
                                </span>
                              </div>
                            )}
                            <div
                              style={{
                                borderTop: "1px solid #bfdbfe",
                                margin: "8px 0 6px 0",
                              }}
                            ></div>
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                fontSize: "16px",
                                color: "#1e3a8a",
                                fontWeight: "800",
                                margin: "4px 0",
                              }}
                            >
                              <span>Grand Total:</span>
                              <span>{grandTotalStr}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div style={{ margin: "10px 0" }}>
                        <h4
                          style={{
                            fontSize: "13px",
                            fontWeight: "700",
                            color: "#0f172a",
                            margin: "0 0 6px 0",
                          }}
                        >
                          Terms And Condition :
                        </h4>
                        <ul
                          style={{
                            listStyle: "none",
                            padding: 0,
                            margin: 0,
                            fontSize: "11px",
                            color: "#334155",
                            lineHeight: "1.6",
                          }}
                        >
                          <li style={{ display: "flex", gap: "8px" }}>
                            <span>•</span>
                            <span>
                              Any extra work beyond this proposal will be
                              charged extra.
                            </span>
                          </li>
                          <li style={{ display: "flex", gap: "8px" }}>
                            <span>•</span>
                            <span>Campaign charges are not included.</span>
                          </li>
                          <li style={{ display: "flex", gap: "8px" }}>
                            <span>•</span>
                            <span>
                              Quotation is valid for 15 days from the date of
                              issue.
                            </span>
                          </li>
                          <li style={{ display: "flex", gap: "8px" }}>
                            <span>•</span>
                            <span>
                              All payments must be made directly to Ananya Hi
                              Solutions / Swetha Solutions account only.
                            </span>
                          </li>
                        </ul>
                      </div>

                      <p
                        style={{
                          fontSize: "10px",
                          color: "#64748b",
                          fontStyle: "italic",
                          lineHeight: "1.4",
                          margin: "12px 0 0 0",
                        }}
                      >
                        If you have any questions about this quotation, please
                        contact us. Thank you for choosing Ananya Hi Solutions —
                        your growth partner in the digital world!
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <div
                    style={{ borderTop: "1px solid #e2e8f0", margin: "10px 0" }}
                  ></div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontSize: "10px",
                      color: "#64748b",
                    }}
                  >
                    <span style={{ fontWeight: "600" }}>
                      Thank you very much for doing business with us.
                    </span>
                    <span>Page 1 of {totalPdfPages}</span>
                  </div>
                </div>
              </div>

              {featureChunks.slice(1).map((chunk, chunkIdx) => {
                const pageNum = chunkIdx + 2; // Page 2, 3, etc.
                const isLastPage = pageNum === totalPdfPages;
                return (
                <div
                  key={`pdf-page-${pageNum}-${idx}`}
                  id={`proposal-page-${pageNum}-${idx}`}
                  style={{
                    width: "794px",
                    height: "1123px",
                    padding: "30px 40px 40px 40px",
                    boxSizing: "border-box",
                    backgroundColor: "#ffffff",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    overflow: "hidden",
                    fontFamily: UNIFORM_FONT_STACK,
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "11px",
                        color: "#333333",
                        marginBottom: "12px",
                        padding: "0 4px",
                        fontFamily: UNIFORM_FONT_STACK,
                      }}
                    >
                      <span>{downloadDateTime}</span>
                      <span style={{ fontWeight: "600" }}>
                        Ananya Hi Solutions - Quotation Overview
                      </span>
                    </div>

                    {/* Continuation header */}
                    <div style={{
                      background: "#f1f5f9",
                      padding: "6px 12px",
                      borderRadius: "4px",
                      marginBottom: "12px",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px"
                    }}>
                      <span style={{ fontSize: "11px", fontWeight: "700", color: "#0f75bc" }}>
                        {packageTitle} — {plan.name} (Continued)
                      </span>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1.5fr 1fr",
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px 8px 0 0",
                      }}
                    >
                      <div style={{ padding: "24px", background: "#f8fafc" }}>
                        <ul
                          style={{ listStyle: "none", padding: 0, margin: 0 }}
                        >
                          {chunk.map((feat, fIdx) => (
                            <li
                              key={fIdx}
                              style={{
                                fontSize: "12.5px",
                                color: "#334155",
                                margin: "0 0 10px 0",
                                display: "flex",
                                alignItems: "flex-start",
                                gap: "8px",
                                lineHeight: "1.4",
                              }}
                            >
                              <span
                                style={{ color: "#22c55e", fontWeight: "bold" }}
                              >
                                ✓
                              </span>
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div
                        style={{
                          padding: "24px",
                          background: "#eff6ff",
                          borderLeft: "1px solid #e2e8f0",
                        }}
                      >
                        {isLastPage && plan.note && plan.note.trim() && (
                          <div
                            style={{
                              background: "#fffbeb",
                              border: "1px solid #fde68a",
                              color: "#b45309",
                              padding: "12px",
                              borderRadius: "6px",
                              fontSize: "12px",
                              fontWeight: "600",
                              lineHeight: "1.4",
                            }}
                          >
                            Note: {plan.note}
                          </div>
                        )}
                      </div>
                    </div>

                    {isLastPage && (
                      <>
                        <div style={{ margin: "20px 0" }}>
                          <div
                            style={{
                              border: "1px solid #bfdbfe",
                              borderRadius: "6px",
                              background: "#eff6ff",
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                background: "#2563eb",
                                color: "#ffffff",
                                padding: "12px 24px",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                              }}
                            >
                              <span style={{ fontSize: "15px", fontWeight: "700" }}>
                                Payment Summary
                              </span>
                              <span
                                style={{
                                  fontSize: "11px",
                                  fontWeight: "700",
                                  textTransform: "uppercase",
                                }}
                              >
                                {plan.name.match(/^(.*?)\s*\(.*?\)$/)
                                  ? plan.name.match(/^(.*?)\s*\(.*?\)$/)[1]
                                  : plan.name}
                              </span>
                            </div>
                            <div style={{ padding: "16px 24px" }}>
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  fontSize: "13px",
                                  color: "#475569",
                                  margin: "6px 0",
                                }}
                              >
                                <span>{planAmountLabelStr}</span>
                                <span
                                  style={{ fontWeight: "700", color: "#1e293b" }}
                                >
                                  {planAmountDisplayValue}
                                </span>
                              </div>
                              {!isGstExcluded && (
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    fontSize: "13px",
                                    color: "#475569",
                                    margin: "6px 0",
                                  }}
                                >
                                  <span>
                                    {durationMonths > 1
                                      ? `GST 18% (${formatCurrency(baseMonthlyGst)} x ${durationMonths} mo):`
                                      : "GST (18%):"}
                                  </span>
                                  <span
                                    style={{ fontWeight: "700", color: "#1e293b" }}
                                  >
                                    {formatCurrency(gstAmount)}
                                  </span>
                                </div>
                              )}
                              <div
                                style={{
                                  borderTop: "1px solid #bfdbfe",
                                  margin: "10px 0 8px 0",
                                }}
                              ></div>
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  fontSize: "18px",
                                  color: "#1e3a8a",
                                  fontWeight: "800",
                                  margin: "6px 0",
                                }}
                              >
                                <span>Grand Total:</span>
                                <span>{grandTotalStr}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div style={{ margin: "24px 0" }}>
                          <h4
                            style={{
                              fontSize: "14px",
                              fontWeight: "700",
                              color: "#0f172a",
                              margin: "0 0 10px 0",
                            }}
                          >
                            Terms And Condition :
                          </h4>
                          <ul
                            style={{
                              listStyle: "none",
                              padding: 0,
                              margin: 0,
                              fontSize: "12px",
                              color: "#334155",
                              lineHeight: "1.8",
                            }}
                          >
                            <li style={{ display: "flex", gap: "8px" }}>
                              <span>•</span>
                              <span>
                                Any extra work beyond this proposal will be charged
                                extra.
                              </span>
                            </li>
                            <li style={{ display: "flex", gap: "8px" }}>
                              <span>•</span>
                              <span>Campaign charges are not included.</span>
                            </li>
                            <li style={{ display: "flex", gap: "8px" }}>
                              <span>•</span>
                              <span>
                                Quotation is valid for 15 days from the date of
                                issue.
                              </span>
                            </li>
                            <li style={{ display: "flex", gap: "8px" }}>
                              <span>•</span>
                              <span>
                                All payments must be made directly to Ananya Hi
                                Solutions / Swetha Solutions account only.
                              </span>
                            </li>
                          </ul>
                        </div>

                        <p
                          style={{
                            fontSize: "11px",
                            color: "#64748b",
                            fontStyle: "italic",
                            lineHeight: "1.5",
                            margin: "20px 0 0 0",
                          }}
                        >
                          If you have any questions about this quotation, please
                          contact us. Thank you for choosing Ananya Hi Solutions —
                          your growth partner in the digital world!
                        </p>
                      </>
                    )}
                  </div>

                  <div>
                    <div
                      style={{
                        borderTop: "1px solid #e2e8f0",
                        margin: "15px 0",
                      }}
                    ></div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        fontSize: "10px",
                        color: "#64748b",
                      }}
                    >
                      <span style={{ fontWeight: "600" }}>
                        Thank you very much for doing business with us.
                      </span>
                      <span>Page {pageNum} of {totalPdfPages}</span>
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          );
        })}

      {/* Proposal Customization Modal Dialog */}
      {selectedPlanForProposal &&
        (() => {
          const { plan, idx } = selectedPlanForProposal;
          const parsePrice = (priceStr) => {
            if (!priceStr) return 0;
            const cleanStr = priceStr.replace(/[^\d]/g, "");
            return parseInt(cleanStr, 10) || 0;
          };
          const formatCurrency = (num) => {
            return "₹" + num.toLocaleString("en-IN");
          };

          const rawMonthly = parsePrice(plan.price);
          const subtotal = rawMonthly * proposalDuration;
          const baseMonthlyGst = Math.round(rawMonthly * 0.18);
          const gstVal = excludeGst ? 0 : baseMonthlyGst * proposalDuration;
          const totalVal = subtotal + gstVal;

          const durationLabel =
            proposalDuration === 1
              ? "1 Month"
              : proposalDuration === 3
                ? "3 Months"
                : proposalDuration === 6
                  ? "6 Months"
                  : "1 Year (12 Months)";

          return (
            <div
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 9999,
                backgroundColor: "rgba(15, 23, 42, 0.65)",
                backdropFilter: "blur(6px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "20px",
              }}
              onClick={() => setSelectedPlanForProposal(null)}
            >
              <div
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: "16px",
                  width: "100%",
                  maxWidth: "520px",
                  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                  overflow: "hidden",
                  border: "1px solid #e2e8f0",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div
                  style={{
                    background:
                      "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)",
                    padding: "20px 24px",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <h3
                      style={{
                        fontSize: "18px",
                        fontWeight: "700",
                        margin: 0,
                        color: "#ffffff",
                      }}
                    >
                      Customize Proposal Options
                    </h3>
                    <p
                      style={{
                        fontSize: "12px",
                        color: "rgba(255, 255, 255, 0.85)",
                        margin: "4px 0 0 0",
                      }}
                    >
                      {packageTitle} — {plan.name.replace(/\s*\(.*?\)$/, "")}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedPlanForProposal(null)}
                    style={{
                      background: "rgba(255, 255, 255, 0.15)",
                      border: "none",
                      color: "#ffffff",
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      fontSize: "18px",
                      lineHeight: 1,
                    }}
                    aria-label="Close modal"
                  >
                    ✕
                  </button>
                </div>

                {/* Modal Body */}
                <div style={{ padding: "24px" }}>
                  {/* 1. Plan Duration Dropdown */}
                  <div style={{ marginBottom: "20px" }}>
                    <label
                      style={{
                        display: "block",
                        fontSize: "14px",
                        fontWeight: "700",
                        color: "#1e293b",
                        marginBottom: "8px",
                      }}
                    >
                      1. Select Plan Duration
                    </label>
                    <select
                      value={proposalDuration}
                      onChange={(e) =>
                        setProposalDuration(parseInt(e.target.value, 10))
                      }
                      style={{
                        width: "100%",
                        padding: "12px 14px",
                        borderRadius: "8px",
                        border: "1.5px solid #cbd5e1",
                        backgroundColor: "#f8fafc",
                        fontSize: "14px",
                        color: "#0f172a",
                        fontWeight: "600",
                        outline: "none",
                        cursor: "pointer",
                      }}
                    >
                      <option value={1}>1 Month ({plan.price} / mo)</option>
                      <option value={3}>
                        3 Months ({formatCurrency(rawMonthly * 3)})
                      </option>
                      <option value={6}>
                        6 Months ({formatCurrency(rawMonthly * 6)})
                      </option>
                      <option value={12}>
                        1 Year / 12 Months ({formatCurrency(rawMonthly * 12)})
                      </option>
                    </select>
                  </div>

                  {/* 2. Exclude GST Checkbox */}
                  <div
                    style={{
                      marginBottom: "24px",
                      background: "#f1f5f9",
                      padding: "14px 16px",
                      borderRadius: "10px",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <label
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "12px",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={excludeGst}
                        onChange={(e) => setExcludeGst(e.target.checked)}
                        style={{
                          width: "18px",
                          height: "18px",
                          marginTop: "2px",
                          accentColor: "#2563eb",
                          cursor: "pointer",
                        }}
                      />
                      <div>
                        <span
                          style={{
                            fontSize: "14px",
                            fontWeight: "700",
                            color: "#0f172a",
                            display: "block",
                          }}
                        >
                          Exclude GST from Proposal
                        </span>
                        <span
                          style={{
                            fontSize: "12px",
                            color: "#64748b",
                            marginTop: "2px",
                            display: "block",
                          }}
                        >
                          Check this box to remove all GST calculations and
                          references from the generated quotation PDF.
                        </span>
                      </div>
                    </label>
                  </div>

                  {/* Live Payment Summary Box */}
                  <div
                    style={{
                      border: "1px solid #bfdbfe",
                      borderRadius: "10px",
                      backgroundColor: "#eff6ff",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        backgroundColor: "#2563eb",
                        color: "#ffffff",
                        padding: "10px 16px",
                        fontSize: "13px",
                        fontWeight: "700",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span>Payment Summary Preview</span>
                      <span>{durationLabel}</span>
                    </div>
                    <div style={{ padding: "14px 16px" }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: "13px",
                          color: "#475569",
                          marginBottom: "6px",
                        }}
                      >
                        <span>
                          Plan Amount{" "}
                          {proposalDuration > 1
                            ? `(${plan.price} x ${proposalDuration} mo)`
                            : ""}
                          :
                        </span>
                        <span style={{ fontWeight: "700", color: "#1e293b" }}>
                          {formatCurrency(subtotal)}
                        </span>
                      </div>

                      {!excludeGst ? (
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: "13px",
                            color: "#475569",
                            marginBottom: "6px",
                          }}
                        >
                          <span>
                            {proposalDuration > 1
                              ? `GST 18% (${formatCurrency(baseMonthlyGst)} x ${proposalDuration} mo):`
                              : "GST (18%):"}
                          </span>
                          <span style={{ fontWeight: "700", color: "#1e293b" }}>
                            {formatCurrency(gstVal)}
                          </span>
                        </div>
                      ) : (
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: "12px",
                            color: "#059669",
                            fontWeight: "600",
                            marginBottom: "6px",
                          }}
                        >
                          <span>GST Reference:</span>
                          <span>Excluded</span>
                        </div>
                      )}

                      <div
                        style={{
                          borderTop: "1px solid #bfdbfe",
                          margin: "8px 0",
                        }}
                      ></div>

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: "16px",
                          fontWeight: "800",
                          color: "#1e3a8a",
                        }}
                      >
                        <span>Grand Total:</span>
                        <span>{formatCurrency(totalVal)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modal Footer Controls */}
                <div
                  style={{
                    padding: "16px 24px",
                    borderTop: "1px solid #e2e8f0",
                    backgroundColor: "#f8fafc",
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "12px",
                  }}
                >
                  <button
                    onClick={() => setSelectedPlanForProposal(null)}
                    style={{
                      padding: "10px 20px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      backgroundColor: "#ffffff",
                      color: "#475569",
                      fontWeight: "600",
                      fontSize: "14px",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmAndDownloadProposal}
                    style={{
                      padding: "10px 22px",
                      borderRadius: "8px",
                      border: "none",
                      backgroundColor: "#2563eb",
                      color: "#ffffff",
                      fontWeight: "700",
                      fontSize: "14px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)",
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Generate & Download PDF
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
    </div>
  );
}

export default function PlansPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          Loading plans...
        </div>
      }
    >
      <PlansContent />
    </Suspense>
  );
}
