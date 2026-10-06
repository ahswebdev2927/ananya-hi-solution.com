"use client";

import React, { useState, useEffect, useRef } from "react";
import { useServices } from "./context/ServicesContext";
import Link from "next/link";
import Header from "./components/Header";
import GlobalFooter from "./components/GlobalFooter";

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
        display: "block",
      }}
    />
  );
}

// Portfolio Showcase Constants
const COLUMN_1_IMAGES = Array.from(
  { length: 12 },
  (_, i) => `/portfolio_images/spa_page_${i + 1}.png`,
);
const COLUMN_2_IMAGES = Array.from(
  { length: 5 },
  (_, i) => `/portfolio_images/mad_academy_page_${i + 1}.png`,
);
const COLUMN_3_IMAGES = Array.from(
  { length: 7 },
  (_, i) => `/portfolio_images/qpath_page_${i + 1}.png`,
);
const COLUMN_4_IMAGES = Array.from(
  { length: 4 },
  (_, i) => `/portfolio_images/shanmukha_gold_portfolio_page_${i + 1}.png`,
);

const padLogosArray = (logosList, minItems = 12) => {
  if (!logosList || logosList.length === 0) return [];
  let padded = [...logosList];
  while (padded.length < minItems) {
    padded = [...padded, ...logosList];
  }
  return padded;
};

const MARQUEE_LOGOS = [
  { src: "/portfolio_images/zuxa_logo.png", name: "Zuxa Beauty & Spa" },
  { src: "/portfolio_images/mad_academy_logo.png", name: "Mad Academy" },
  { src: "/portfolio_images/qpath_logo.png", name: "Q Path Diagnostics" },
  { src: "/portfolio_images/shanmukha_logo.png", name: "Shanmukha Gold" },
  { src: "/portfolio_images/zuxa_logo.png", name: "Zuxa Beauty & Spa" },
  { src: "/portfolio_images/mad_academy_logo.png", name: "Mad Academy" },
  { src: "/portfolio_images/qpath_logo.png", name: "Q Path Diagnostics" },
  { src: "/portfolio_images/shanmukha_logo.png", name: "Shanmukha Gold" },
];

// Default fallback card images for core services
const DEFAULT_SERVICE_CARD_IMAGES = {
  "web-design": "/images/hero/web-design.png",
  "digital-marketing": "/images/hero/digital-marketing.png",
  "mobile-app": "/images/hero/mobile-app.png",
  "ecommerce-app": "/images/hero/ecommerce-app.png",
  "video-production": "/images/hero/video-production.jpg",
  "software-development": "/images/hero/software-development.png",
  "aeo": "/images/hero/aeo.png",
  "geo": "/images/hero/geo.png",
  "aio": "/images/hero/aio.jpg",
  "sxo": "/images/hero/sxo.jpg",
  "youtube-seo": "/images/hero/youtube-seo.png",
  "youtube-ads": "/images/hero/youtube-ads.png",
};

function getServiceCardImage(service) {
  if (service?.image && service.image.trim()) {
    return service.image.trim();
  }
  return DEFAULT_SERVICE_CARD_IMAGES[service?.id] || "/images/hero/web-design.png";
}

function renderServiceDescription(desc) {
  if (!desc) return null;
  const lines = desc.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length > 1) {
    return (
      <ul className="service-card-bullet-list">
        {lines.map((line, idx) => {
          const cleanLine = line.replace(/^[•\-\*]\s*/, "");
          return (
            <li key={idx} className="service-card-bullet-item">
              <span className="bullet-dot" />
              <span>{cleanLine}</span>
            </li>
          );
        })}
      </ul>
    );
  }
  return <p className="service-card-description">{desc}</p>;
}

// Service Icon SVG Mapper Helper
function renderServiceIcon(iconName) {
  switch (iconName) {
    case "globe":
    default:
      return (
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
      );
    case "trending-up":
      return (
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M23 6l-9.5 9.5-5-5L1 18" />
          <path d="M17 6h6v6" />
        </svg>
      );
    case "smartphone":
      return (
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
          <line x1="12" y1="18" x2="12.01" y2="18" />
        </svg>
      );
    case "shopping-cart":
      return (
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="9" cy="21" r="1" />
          <circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
        </svg>
      );
    case "video":
      return (
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polygon points="23 7 16 12 23 17 23 7" />
          <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
        </svg>
      );
    case "code":
      return (
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
          <line x1="12" y1="4" x2="12" y2="20" />
        </svg>
      );
  }
}

// Custom Tool Logo Renderer for missing public/tools logos
function ToolLogo({ type, name, isMobile = false }) {
  let size = isMobile ? 20 : 46;
  const nameLower = name.toLowerCase();

  if (!isMobile) {
    if (
      nameLower.includes("jio ads") ||
      nameLower.includes("twitter") ||
      nameLower.includes("youtube ads") ||
      nameLower.includes("meta ads") ||
      nameLower.includes("clarity")
    ) {
      size = 36;
    } else if (nameLower.includes("meta")) {
      size = 54;
    }
  }
  const sizePx = `${size}px`;

  if (
    type.endsWith(".svg") ||
    type.endsWith(".png") ||
    type.endsWith(".jpg") ||
    type.endsWith(".jpeg") ||
    type.endsWith(".webp")
  ) {
    return (
      <img
        src={type}
        alt={name}
        className="tool-logo-img"
        style={{
          width: sizePx,
          height: sizePx,
          objectFit: "contain",
          pointerEvents: "none",
        }}
      />
    );
  }
  switch (type) {
    case "linkedin":
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          fill="#0077b5"
          style={{ pointerEvents: "none" }}
        >
          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
        </svg>
      );
    case "twitter":
      return (
        <svg
          viewBox="0 0 24 24"
          width={isMobile ? 16 : 26}
          height={isMobile ? 16 : 26}
          fill="#000000"
          style={{ pointerEvents: "none" }}
        >
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    case "jio":
      return (
        <svg
          viewBox="0 0 100 100"
          width={size}
          height={size}
          style={{ pointerEvents: "none" }}
        >
          <circle cx="50" cy="50" r="50" fill="#0F3CC9" />
          <text
            x="50"
            y="62"
            fill="#ffffff"
            fontFamily="system-ui, sans-serif"
            fontWeight="900"
            fontSize="30"
            textAnchor="middle"
          >
            jio
          </text>
        </svg>
      );
    case "adobe":
      return (
        <svg
          viewBox="0 0 24 24"
          width={size - 2}
          height={size - 2}
          fill="#FF0000"
          style={{ pointerEvents: "none" }}
        >
          <path d="M14.867 2.667H24v20.8H14.867zM9.133 2.667H0v20.8h9.133zM12 8.767l4.567 11.2h-3.467l-2.033-5.2H7.4l-2.067 5.2H1.8z" />
        </svg>
      );
    case "youtube":
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          fill="#FF0000"
          style={{ pointerEvents: "none" }}
        >
          <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.518 3.545 12 3.545 12 3.545s-7.518 0-9.388.507a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.87.507 9.388.507 9.388.507s7.518 0 9.388-.507a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      );
    case "gmap":
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          style={{ pointerEvents: "none" }}
        >
          <path
            d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
            fill="#EA4335"
          />
          <path
            d="M12 6.5c-1.38 0-2.5 1.12-2.5 2.5s1.12 2.5 2.5 2.5 2.5-1.12 2.5-2.5-1.12-2.5-2.5-2.5z"
            fill="#4285F4"
          />
        </svg>
      );
    case "merchant":
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          style={{ pointerEvents: "none" }}
        >
          <path
            d="M19 6h-2c0-2.76-2.24-5-5-5S7 3.24 7 6H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-7-3c1.66 0 3 1.34 3 3H9c0-1.66 1.34-3 3-3zm7 17H5V8h14v12z"
            fill="#4285F4"
          />
          <path
            d="M12 10c-1.66 0-3 1.34-3 3h6c0-1.66-1.34-3-3-3z"
            fill="#34A853"
          />
        </svg>
      );
    case "photoshop":
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          style={{ pointerEvents: "none" }}
        >
          <rect
            width="24"
            height="24"
            rx="4"
            fill="#001E36"
            stroke="#00C8FF"
            strokeWidth="1.5"
          />
          <text
            x="12"
            y="15.5"
            fill="#00C8FF"
            fontFamily="system-ui, sans-serif"
            fontWeight="bold"
            fontSize="10"
            textAnchor="middle"
          >
            Ps
          </text>
        </svg>
      );
    case "premiere":
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          style={{ pointerEvents: "none" }}
        >
          <rect
            width="24"
            height="24"
            rx="4"
            fill="#130022"
            stroke="#EA77FF"
            strokeWidth="1.5"
          />
          <text
            x="12"
            y="15.5"
            fill="#EA77FF"
            fontFamily="system-ui, sans-serif"
            fontWeight="bold"
            fontSize="10"
            textAnchor="middle"
          >
            Pr
          </text>
        </svg>
      );
    case "clarity":
      return (
        <svg
          viewBox="0 0 24 24"
          width={size - 2}
          height={size - 2}
          fill="none"
          stroke="#0078D4"
          strokeWidth="2"
          style={{ pointerEvents: "none" }}
        >
          <circle cx="9" cy="9" r="6" />
          <circle cx="15" cy="15" r="6" stroke="#EC4899" />
        </svg>
      );
    case "envato":
      return (
        <svg
          viewBox="0 0 24 24"
          width={size - 2}
          height={size - 2}
          fill="#81B441"
          style={{ pointerEvents: "none" }}
        >
          <path d="M19.333 2.667c-1.8 1.4-3.5 3.3-4.8 5.6-1.2-2.1-2.9-3.7-4.8-4.8-1 .8-1.8 1.8-2.3 3-.9.4-1.6 1.1-2 2-1 2.3-.5 5 1.2 6.7 1.8 1.8 4.6 2.3 6.9 1.2.9 1.1 2.2 1.8 3.7 1.8 3.4 0 6.1-2.7 6.1-6.1.1-3.6-1.6-7.2-4-9.4z" />
        </svg>
      );
    case "meta-cert":
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          fill="#0064e0"
          style={{ pointerEvents: "none" }}
        >
          <path d="M12.5 15.6c-.6 0-1.1-.2-1.5-.6l-4.1-4.1c-1.2-1.2-1.2-3.1 0-4.3 1.2-1.2 3.1-1.2 4.3 0l1.3 1.3 1.3-1.3c1.2-1.2 3.1-1.2 4.3 0 1.2 1.2 1.2 3.1 0 4.3l-4.1 4.1c-.4.4-.9.6-1.5.6zm-4.3-8.2c-.6 0-1.2.2-1.6.6-.9.9-.9 2.4 0 3.3l4.1 4.1c.2.2.5.3.8.3s.6-.1.8-.3l4.1-4.1c.9-.9.9-2.4 0-3.3-.9-.9-2.4-.9-3.3 0l-1.6 1.6-1.6-1.6c-.4-.4-1-.6-1.6-.6z" />
        </svg>
      );
    case "google-cert":
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          style={{ pointerEvents: "none" }}
        >
          <path d="M12 2L1 7l11 5 9-4.09V16.5h2V7L12 2z" fill="#4285F4" />
          <path
            d="M4.5 10.5v5c0 1.66 3.36 3 7.5 3s7.5-1.34 7.5-3v-5l-7.5 3.41-7.5-3.41z"
            fill="#34A853"
          />
        </svg>
      );
    case "microsoft-cert":
      return (
        <svg
          viewBox="0 0 24 24"
          width={size - 2}
          height={size - 2}
          style={{ pointerEvents: "none" }}
        >
          <rect x="2" y="2" width="9" height="9" fill="#F25022" />
          <rect x="13" y="2" width="9" height="9" fill="#7FBA00" />
          <rect x="2" y="13" width="9" height="9" fill="#00A1F1" />
          <rect x="13" y="13" width="9" height="9" fill="#FFB900" />
        </svg>
      );
    case "google-ecom-cert":
      return (
        <svg
          viewBox="0 0 24 24"
          width={size - 2}
          height={size - 2}
          style={{ pointerEvents: "none" }}
        >
          <path
            d="M12.24 10.285V13.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.866-3.577-7.866-8s3.536-8 7.866-8c2.46 0 4.105 1.025 5.047 1.926l2.427-2.334C18.155 2.223 15.433 1 12.24 1 6.033 1 1 6.033 1 12.24s5.033 11.24 11.24 11.24c6.478 0 10.793-4.537 10.793-10.983 0-.74-.08-1.302-.178-1.859H12.24z"
            fill="#4285F4"
          />
          <path d="M19 14l2 2-4 4-2-2 4-4z" fill="#EA4335" />
        </svg>
      );
    case "hubspot-cert":
      return (
        <svg
          viewBox="0 0 24 24"
          width={size - 2}
          height={size - 2}
          fill="#FF7A59"
          style={{ pointerEvents: "none" }}
        >
          <path d="M21.3 9.7h-2.9C18 7.6 16.4 6 14.3 5.6V2.7c1-.3 1.7-1.2 1.7-2.3C16 .2 15 0 14.3 0c-2 0-3.5 1.5-3.5 3.5V5.6C8.7 6 7.1 7.6 6.7 9.7H3.8c-.3-1-1.2-1.7-2.3-1.7C.7 8 0 9 0 9.7s1 1.7 1.7 1.7c1.1 0 2-.7 2.3-1.7h2.9c.4 2.1 2 3.7 4.1 4.1v2.9c-1 .3-1.7 1.2-1.7 2.3 0 1.2 1 1.7 1.7 1.7s3.5-1.5 3.5-3.5v-2.9c2.1-.4 3.7-2 4.1-4.1h2.9c.3 1 1.2 1.7 2.3 1.7.8 0 1.7-1 1.7-1.7s-1-1.7-1.7-1.7zM12 14.5c-1.4 0-2.5-1.1-2.5-2.5s1.1-2.5 2.5-2.5 2.5 1.1 2.5 2.5-1.1 2.5-2.5 2.5z" />
        </svg>
      );
    default:
      return (
        <div
          className="text-[12px] font-bold text-slate-700"
          style={{ pointerEvents: "none" }}
        >
          {name.substring(0, 2)}
        </div>
      );
  }
}

// Specialization Categories Data
const specializationCategories = [
  {
    title: "Designing Tools",
    icon: (
      <svg
        width="36"
        height="36"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" />
        <path d="M12 6a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" />
        <path d="M7 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" />
        <path d="M17 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" />
        <path d="M12 16a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
      </svg>
    ),
    count: 5,
    color: "#7C3AED",
    glowColor: "rgba(124, 58, 237, 0.4)",
    tools: [
      { name: "Canva", logo: "/logos/canva_logo.png" },
      { name: "Photoshop", logo: "/logos/photoshop_logo.png" },
      { name: "Adobe Premiere Pro", logo: "/logos/adobepremierepro_logo.png" },
      { name: "Clarity", logo: "/logos/clarity_logo.png" },
      { name: "Envato", logo: "/logos/envato_logo.png" },
    ],
  },
  {
    title: "Paid Marketing Tools",
    icon: (
      <svg
        width="36"
        height="36"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
    count: 14,
    color: "#2563EB",
    glowColor: "rgba(37, 99, 235, 0.4)",
    tools: [
      { name: "Google Ads", logo: "/logos/Google_Ads_logo.png" },
      { name: "Meta Ads", logo: "/logos/meta_ads_logo.jpg" },
      { name: "LinkedIn Ads", logo: "/logos/linkedin_ads_logo.webp" },
      { name: "Twitter/X Ads", logo: "/logos/twitter_ads_logo.png" },
      { name: "Jio Ads", logo: "/logos/jio_ads_logo.jpg" },
      { name: "Adobe Ads", logo: "/logos/adobe_ads_logo.png" },
      { name: "YouTube Ads", logo: "/logos/youtube_ads_logo.jpg" },
      { name: "GMAP Ads", logo: "/logos/GMAP_ads_logo.png" },
      {
        name: "Google Merchant Ads",
        logo: "/logos/googlemerchant_ads_logo.png",
      },
      { name: "Google Analytics", logo: "/logos/googleanalytics_logo.png" },
      {
        name: "Google Search Console",
        logo: "/logos/googlesearchconsole_logo.png",
      },
      { name: "Bing Webmaster", logo: "/logos/bing_logo.png" },
      { name: "SE Ranking", logo: "/logos/seranking_logo.png" },
      { name: "Hootsuite", logo: "/logos/hootsuite_logo.png" },
    ],
  },
  {
    title: "Certifications",
    icon: (
      <svg
        width="36"
        height="36"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <polyline points="9 11 11 13 15 9" />
      </svg>
    ),
    count: 5,
    color: "#EC4899",
    glowColor: "rgba(236, 72, 153, 0.4)",
    tools: [
      {
        name: "Meta Certification",
        logo: "/logos/meta_certification_logo.png",
      },
      {
        name: "Google Certification",
        logo: "/logos/google_certification_logo.png",
      },
      {
        name: "Microsoft Certification",
        logo: "/logos/microsft_certification_logo.png",
      },
      {
        name: "Google Ecommerce Certification",
        logo: "/logos/google_certifcation_logo.png",
      },
      {
        name: "HubSpot Certification",
        logo: "/logos/hubspot_certification_logo.png",
      },
    ],
  },
];

const BUBBLE_ICONS = [
  // 1. Chart / SEO growth
  <svg
    key="1"
    width="100%"
    height="100%"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="20" x2="18" y2="10"></line>
    <line x1="12" y1="20" x2="12" y2="4"></line>
    <line x1="6" y1="20" x2="6" y2="14"></line>
  </svg>,
  // 2. Chip / AI / Tech
  <svg
    key="2"
    width="100%"
    height="100%"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect>
    <rect x="9" y="9" width="6" height="6"></rect>
    <line x1="9" y1="1" x2="9" y2="4"></line>
    <line x1="15" y1="1" x2="15" y2="4"></line>
    <line x1="9" y1="20" x2="9" y2="23"></line>
    <line x1="15" y1="20" x2="15" y2="23"></line>
    <line x1="20" y1="9" x2="23" y2="9"></line>
    <line x1="20" y1="15" x2="23" y2="15"></line>
    <line x1="1" y1="9" x2="4" y2="9"></line>
    <line x1="1" y1="15" x2="4" y2="15"></line>
  </svg>,
  // 3. Code / Web Dev
  <svg
    key="3"
    width="100%"
    height="100%"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="16 18 22 12 16 6"></polyline>
    <polyline points="8 6 2 12 8 18"></polyline>
  </svg>,
  // 4. Gear / System Settings
  <svg
    key="4"
    width="100%"
    height="100%"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="3"></circle>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
  </svg>,
  // 5. Globe / World / GEO
  <svg
    key="5"
    width="100%"
    height="100%"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="2" y1="12" x2="22" y2="12"></line>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
  </svg>,
  // 6. Search / SEO
  <svg
    key="6"
    width="100%"
    height="100%"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>,
  // 7. Chat / AEO / Support
  <svg
    key="7"
    width="100%"
    height="100%"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
  </svg>,
  // 8. Pulse / UX Conversion / SXO
  <svg
    key="8"
    width="100%"
    height="100%"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
  </svg>,
  // 9. Cloud / Database / Networks
  <svg
    key="9"
    width="100%"
    height="100%"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 10h-.79A4.8 4.8 0 0 0 12 8a4.8 4.8 0 0 0-5.21 2H6a5 5 0 0 0 0 10h12a5 5 0 0 0 0-10z"></path>
  </svg>,
];

export default function Home() {
  // Intro Splash State
  const [showSplash, setShowSplash] = useState(true);
  const [fadeSplash, setFadeSplash] = useState(false);

  const [marqueeLogos, setMarqueeLogos] = useState(MARQUEE_LOGOS);

  useEffect(() => {
    const fetchMarqueeLogos = async () => {
      try {
        const res = await fetch("/api/marquee-logos");
        if (res.ok) {
          const data = await res.json();
          setMarqueeLogos(data);
        } else {
          setMarqueeLogos(MARQUEE_LOGOS);
        }
      } catch (err) {
        console.error("Error loading marquee logos:", err);
        setMarqueeLogos(MARQUEE_LOGOS);
      }
    };
    fetchMarqueeLogos();
  }, []);

  // Splash Screen Intro Timer
  useEffect(() => {
    if (typeof window !== "undefined") {
      const shown = sessionStorage.getItem("ahs_splash_shown");
      if (shown) {
        setShowSplash(false);
        return;
      }

      // First visit in session
      sessionStorage.setItem("ahs_splash_shown", "true");

      // Start fading out after 3.4 seconds (0.5s after Ananya Hi Solutions text fully renders)
      const fadeTimer = setTimeout(() => {
        setFadeSplash(true);
      }, 3400);

      // Completely unmount the splash screen after the transition completes
      const removeTimer = setTimeout(() => {
        setShowSplash(false);
      }, 3800);

      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(removeTimer);
      };
    }
  }, []);

  // Prevent scroll during splash intro
  useEffect(() => {
    if (showSplash) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showSplash]);

  // Hero Carousel State
  const [activeSlide, setActiveSlide] = useState(0);
  const [carouselSlides, setCarouselSlides] = useState([
    {
      title: "",
      desc: "",
      path: "/contact#contact-form",
      bgImage: "/images/banner1.png",
      btnText: "",
    },
    {
      title: "",
      desc: "",
      path: "/packages",
      bgImage: "/images/banner2.png",
      btnText: "",
    },
    {
      title: "",
      desc: "",
      path: "/packages/plans?package=E-Commerce Website",
      bgImage: "/images/banner3.png",
      btnText: "",
    },
  ]);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const res = await fetch("/api/banners");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setCarouselSlides(data);
          }
        }
      } catch (err) {
        console.error("Error fetching banners:", err);
      }
    };
    fetchBanners();
  }, []);

  // Auto scroll carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % carouselSlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [carouselSlides.length]);

  // ----------------------------------------------------
  // DYNAMIC FETCH STATES
  // ----------------------------------------------------
  const { services, isLoading } = useServices();

  // ----------------------------------------------------
  // PLATFORMS & TOOLS SPECIALIZATION STATE & HOOKS
  // ----------------------------------------------------
  const [sectionInView, setSectionInView] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const [hoveredBadge, setHoveredBadge] = useState(null); // { catIdx, toolIdx }
  const [particles, setParticles] = useState([]);
  const specializationSectionRef = useRef(null);
  const mouseGlowRef = useRef(null);

  // Initialize particles config on mount to prevent server-client hydration mismatch
  useEffect(() => {
    setParticles(
      Array.from({ length: 15 }).map((_, i) => ({
        size: Math.random() * 3 + 1,
        left: Math.random() * 100,
        top: Math.random() * 100,
        duration: Math.random() * 12 + 8,
        delay: Math.random() * -15,
      })),
    );
  }, []);
  const glowCoords = useRef({ x: 0, y: 0 });
  const targetGlowCoords = useRef({ x: 0, y: 0 });
  const isTracking = useRef(false);

  // IntersectionObserver for entrance animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSectionInView(true);
        }
      },
      { threshold: 0.05 },
    );
    if (specializationSectionRef.current) {
      observer.observe(specializationSectionRef.current);
    }
    return () => observer.disconnect();
  }, []);

  // requestAnimationFrame for mouse-follow glow
  useEffect(() => {
    let animationFrameId;
    const updateGlowPosition = () => {
      glowCoords.current.x +=
        (targetGlowCoords.current.x - glowCoords.current.x) * 0.15;
      glowCoords.current.y +=
        (targetGlowCoords.current.y - glowCoords.current.y) * 0.15;

      if (mouseGlowRef.current) {
        mouseGlowRef.current.style.transform = `translate3d(${glowCoords.current.x - 300}px, ${glowCoords.current.y - 300}px, 0)`;
      }
      animationFrameId = requestAnimationFrame(updateGlowPosition);
    };

    updateGlowPosition();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const handleMouseMove = (e) => {
    if (!specializationSectionRef.current) return;
    const rect = specializationSectionRef.current.getBoundingClientRect();
    targetGlowCoords.current.x = e.clientX - rect.left;
    targetGlowCoords.current.y = e.clientY - rect.top;
    if (!isTracking.current) {
      isTracking.current = true;
      if (mouseGlowRef.current) {
        mouseGlowRef.current.style.opacity = "1";
      }
    }
  };

  const handleMouseLeaveSection = () => {
    isTracking.current = false;
    if (mouseGlowRef.current) {
      mouseGlowRef.current.style.opacity = "0";
    }
  };

  const handleCategoryClick = (idx) => {
    setActiveCategory(activeCategory === idx ? null : idx);
  };

  const handleCategoryKeyDown = (e, idx) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setActiveCategory(activeCategory === idx ? null : idx);
    }
  };

  // Trigonometric distribution helper for orbiting badges
  const getToolCoords = (cat, tIdx) => {
    if (cat.title === "Paid Marketing Tools") {
      // Split Paid Marketing Into 2 Orbit Layers: Inner (9 ads tools), Outer (5 analytics/SEO tools)
      if (tIdx < 9) {
        // Inner Orbit: 9 core advertising platforms, r = 135px
        const angle = (tIdx * 2 * Math.PI) / 9;
        return {
          x: Math.round(Math.cos(angle) * 135),
          y: Math.round(Math.sin(angle) * 135),
        };
      } else {
        // Outer Orbit: 5 analytics & SEO tools, r = 205px
        const offsetAngle = Math.PI / 5;
        const angle = ((tIdx - 9) * 2 * Math.PI) / 5 + offsetAngle;
        return {
          x: Math.round(Math.cos(angle) * 205),
          y: Math.round(Math.sin(angle) * 205),
        };
      }
    } else {
      // Designing Tools & Certifications: 5 tools, r = 145px
      const angle = (tIdx * 2 * Math.PI) / 5;
      return {
        x: Math.round(Math.cos(angle) * 145),
        y: Math.round(Math.sin(angle) * 145),
      };
    }
  };

  // Client Onboarding Process State
  const [activeStep, setActiveStep] = useState(0);
  const processSteps = [
    {
      num: 1,
      title: "Discovery & Analysis",
      detail:
        "We kick off our collaboration with a thorough discovery phase, analyzing your business landscape, defining requirements, and mapping key project goals.",
      icon: "🔍",
    },
    {
      num: 2,
      title: "Strategy & Planning",
      detail:
        "Our technical architects and strategists design a custom project blueprint, selecting optimal frameworks, database layouts, and project milestones.",
      icon: "📋",
    },
    {
      num: 3,
      title: "Design & Development",
      detail:
        "Our creative designers and Next.js developers bring the vision to life, building responsive interfaces and robust backend integration with premium visuals.",
      icon: "💻",
    },
    {
      num: 4,
      title: "Testing & Optimization",
      detail:
        "We run exhaustive multi-device tests, optimize SEO tags, inspect load times, and implement security protocols to guarantee flawless launch status.",
      icon: "🛡️",
    },
    {
      num: 5,
      title: "Launch & Support",
      detail:
        "We deploy the systems to your cloud environments, organize onboarding training, and provide ongoing updates to fuel your startup's growth.",
      icon: "🚀",
    },
  ];

  // Tools State
  const tools = [
    {
      name: "Google Analytics",
      logo: "/tools/google-analytics.svg",
      desc: "User Traffic Auditing",
    },
    {
      name: "Google Search Console",
      logo: "/tools/google-search-console.svg",
      desc: "SEO Indexing Control",
    },
    {
      name: "Google Ads",
      logo: "/tools/google-ads.svg",
      desc: "Targeted Paid Traffic",
    },
    {
      name: "Bing Webmaster",
      logo: "/tools/bing-webmaster.svg",
      desc: "Search Engine Presence",
    },
    {
      name: "Facebook Ads",
      logo: "/tools/facebook-ads.svg",
      desc: "Social Media Campaigns",
    },
    {
      name: "SE Ranking",
      logo: "/tools/se-ranking.svg",
      desc: "Rank Tracking & Audits",
    },
    {
      name: "Canva",
      logo: "/tools/canva.svg",
      desc: "Branded Creative Graphics",
    },
    {
      name: "Hootsuite",
      logo: "/tools/hootsuite.svg",
      desc: "Social Scheduler Panel",
    },
    {
      name: "Grammarly",
      logo: "/tools/grammarly.svg",
      desc: "Flawless Copywriting Checks",
    },
    { name: "Moz", logo: "/tools/moz.svg", desc: "Domain Authority & SEO" },
  ];

  // Reviews State
  const reviews = [
    {
      name: "sunspringwellnessspa",
      role: "Spa & Wellness Brand",
      stars: 5,
      text: "Ananya Hi Solutions is hands down the best AI digital marketing and automation service provider in Hyderabad. Their team doesn't just run ads; they use advanced automation to streamline lead generation and ROI. Since partnering with them, our digital presence has grown significantly. Highly recommended for any business looking for data-driven results",
      initials: "SS",
    },
    {
      name: "Neerunemula Arunkumar",
      role: "Local Guide",
      stars: 5,
      text: "Best social media marketing firm.",
      initials: "NA",
    },
    {
      name: "sri bhavani",
      role: "Local Business Owner",
      stars: 5,
      text: "best digital marketing agencies in hyderabad",
      initials: "SB",
    },
    {
      name: "Vinay Varma",
      role: "Client",
      stars: 5,
      text: "best digital marketing agencies in hyderabad",
      initials: "VV",
    },
    {
      name: "vissvekanth",
      role: "Client",
      stars: 5,
      text: "best digital marketing agencies in hyderabad",
      initials: "VS",
    },
  ];

  // FAQ State
  const [activeFaq, setActiveFaq] = useState(0);
  const faqs = [
    {
      q: "What services does Ananya Hi Solutions provide in Hyderabad?",
      a: "Ananya Hi Solutions offers comprehensive digital services including website design and development, digital marketing (SEO, PPC, social media), mobile application development, e-commerce solutions, video production, and custom software development. We provide end-to-end digital transformation solutions for businesses of all sizes.",
    },
    {
      q: "How does Ananya Hi Solutions ensure quality in digital marketing campaigns?",
      a: "We employ data-driven strategies with continuous monitoring and optimization. Our certified digital marketing experts use advanced analytics, A/B testing, and industry-leading tools to track KPIs, measure ROI, and refine campaigns for maximum performance. We provide transparent monthly reports showing measurable results.",
    },
    {
      q: "What makes Ananya Hi Solutions different from other digital agencies in Hyderabad?",
      a: "Our key differentiators include 10+ years of proven experience, a team of certified experts, integrated service offerings under one roof, customized solutions rather than templates, transparent pricing, dedicated account management, and a proven track record of delivering measurable ROI for clients across diverse industries.",
    },
    {
      q: "How long does it typically take to complete a website design project?",
      a: "Project timelines vary based on complexity and requirements. A standard business website takes 4-6 weeks, while complex e-commerce platforms or custom web applications may take 8-12 weeks. We provide detailed project timelines during consultation and maintain regular communication throughout the development process.",
    },
    {
      q: "What industries does Ananya Hi Solutions specialize in serving?",
      a: "We have extensive experience serving diverse industries including e-commerce, healthcare, education, real estate, manufacturing, finance, technology startups, hospitality, and professional services. Our adaptable approach allows us to understand unique industry challenges and deliver tailored solutions that drive results in any sector.",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {showSplash && (
        <div className={`splash-screen ${fadeSplash ? "fade-out" : ""}`}>
          <div className="splash-bg-glow splash-glow-1"></div>
          <div className="splash-bg-glow splash-glow-2"></div>
          <div className="splash-bg-glow splash-glow-3"></div>

          {/* Animated 3D cyber perspective grid */}
          <div className="splash-grid"></div>

          {/* Dynamic glassmorphic neon hexagon falling service elements */}
          <div className="splash-bubbles">
            {Array.from({ length: 28 }).map((_, i) => {
              const left = `${5 + ((i * 7.7) % 90)}%`;
              const size = `${38 + ((i * 13) % 25)}px`;
              const delay = `${(i * 0.15) % 3.5}s`;
              const drift = `${-25 + ((i * 17) % 50)}px`;
              const duration = `${4.5 + ((i * 0.5) % 2.5)}s`;
              const startY = `${-15 + ((i * 2.3) % 8)}%`;
              const travelY = `${112 + ((i * 1.5) % 6)}vh`;

              const NEON_COLORS = [
                "#0f75bc",
                "#10b981",
                "#f58220",
                "#a855f7",
                "#06b6d4",
              ];
              const neonColor = NEON_COLORS[i % NEON_COLORS.length];

              const iconIndex = i % BUBBLE_ICONS.length;
              const IconComponent = BUBBLE_ICONS[iconIndex];
              return (
                <div
                  key={i}
                  className="splash-hexagon"
                  style={{
                    left,
                    width: size,
                    height: size,
                    animationDelay: delay,
                    animationDuration: duration,
                    "--bubble-left": left,
                    "--bubble-drift": drift,
                    "--bubble-start-y": startY,
                    "--bubble-travel-y": travelY,
                    "--neon-color": neonColor,
                  }}
                >
                  <div
                    className="bubble-icon"
                    style={{ color: neonColor, width: "55%", height: "55%" }}
                  >
                    {IconComponent}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="splash-content">
            <h2 className="splash-welcome-text">Welcome to</h2>
            <h1 className="splash-brand-title">
              <span>Ananya Hi</span> Solutions
            </h1>
            <div className="splash-line"></div>
          </div>
        </div>
      )}

      {/* 1. Header & Navigation Bar */}
      <Header activePage="home" />

      {/* 2. Hero Carousel Banners */}
      <section id="home" className="hero-carousel">
        {carouselSlides.map((slide, index) => {
          const hasText = !!(slide.title || slide.desc);
          return (
            <Link
              key={index}
              href={slide.path}
              className={`carousel-slide ${index === activeSlide ? "active" : ""}`}
              style={{ textDecoration: "none" }}
            >
              <div
                className="carousel-bg"
                style={{
                  backgroundImage: `url(${slide.bgImage})`,
                  opacity: hasText ? undefined : 1,
                }}
              />
              {hasText && <div className="carousel-overlay"></div>}
              {hasText && (
                <div className="carousel-content">
                  {slide.title && (
                    <h1
                      className="carousel-title"
                      dangerouslySetInnerHTML={{ __html: slide.title }}
                    />
                  )}
                  {slide.desc && <p className="carousel-desc">{slide.desc}</p>}
                  {slide.btnText && (
                    <div className="carousel-buttons">
                      <span className="btn btn-accent">{slide.btnText}</span>
                    </div>
                  )}
                </div>
              )}
            </Link>
          );
        })}

        {/* Indicators */}
        <div className="carousel-dots">
          {carouselSlides.map((_, index) => (
            <button
              key={index}
              className={`carousel-dot ${index === activeSlide ? "active" : ""}`}
              onClick={() => setActiveSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </section>

      {/* 3. Services Provided as Cards (DYNAMIC FROM DATABASE) */}
      <section id="services" className="section section-bg-alt">
        <div className="container">
          <div className="section-header">
            <h2>Our Core Services</h2>
            <p>
              We deliver cutting-edge digital experiences engineered to
              skyrocket efficiency and brand value.
            </p>
          </div>

          <div className="services-grid">
            {isLoading ? (
              <div className="text-center py-8 col-span-full">
                <span className="spinner-dashboard"></span>
                <p className="text-slate-400 mt-4">
                  Connecting with databases...
                </p>
              </div>
            ) : (
              services.map((item) => (
                <Link
                  key={item.id}
                  href={`/services/${item.id}`}
                  className="service-interactive-card"
                  style={{ textDecoration: "none" }}
                >
                  {/* Background Image Layer */}
                  <div
                    className="service-card-bg-image"
                    style={{ backgroundImage: `url(${getServiceCardImage(item)})` }}
                  />

                  {/* Dull / Dark Dimming Overlay */}
                  <div className="service-card-overlay" />

                  {/* Card Content (Title, Description, Know More Button) */}
                  <div className="service-card-content">
                    <div className="service-card-header">
                      <h3 className="service-card-title">{item.title}</h3>
                      <div className="service-card-underline" />
                    </div>

                    <div className="service-card-body">
                      {renderServiceDescription(item.desc)}
                      <div className="service-card-btn-wrapper">
                        <span className="service-card-know-more-btn">
                          Know More
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>

      {/* 4. Client Onboarding Process Section (Curvy SVG Path) */}
      <section
        id="process"
        className="process-section"
        style={{ paddingBottom: "20px" }}
      >
        <div className="container">
          <div className="section-header">
            <h2>Client Onboarding Process</h2>
            <p>
              A structured, collaborative onboarding journey designed to deliver
              tailored digital solutions with maximum precision.
            </p>
          </div>

          {/* Interactive Curvy Wave Container */}
          <div className="process-container">
            {/* SVG Curvy wave path matching Image 2 */}
            <svg
              className="process-svg-container"
              width="1200"
              height="450"
              viewBox="0 0 1200 450"
            >
              <path
                id="wavePath"
                className="process-svg-path"
                d="M 60,240 C 200,320 280,100 370,120 C 470,140 540,360 635,320 C 720,285 780,100 890,140 C 980,170 1020,330 1140,230"
              />
              {/* Double Chevron Flying along path */}
              <g className="process-paper-plane">
                {/* Left/Back Chevron */}
                <path
                  d="M -10 -9 L 0 0 L -10 9"
                  fill="none"
                  stroke="var(--primary-blue)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Right/Front Chevron */}
                <path
                  d="M -2 -9 L 8 0 L -2 9"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            </svg>

            {/* Interactive Steps positioned dynamically */}
            {processSteps.map((step, idx) => (
              <div
                key={step.num}
                className={`process-step process-step-${step.num} ${idx === activeStep ? "active" : ""}`}
                onMouseEnter={() => setActiveStep(idx)}
              >
                <span className="process-step-num">0{step.num}</span>
                <div className="process-node">{step.num}</div>
                <div className="process-icon">{step.icon}</div>
                <h4 className="process-step-title">{step.title}</h4>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4.5. Portfolio Showcase Section */}
      <section
        className="section portfolio-showcase-section bg-white border-t border-slate-100"
        style={{ paddingTop: "20px" }}
      >
        <div className="container">
          <div className="section-header">
            <h2>Our Clients</h2>
            <p>
              Every project in our portfolio represents a business that trusted
              us to grow online.
            </p>
          </div>

          {/* Minimalist Logo Marquee (2 rows scroll!) */}
          <div
            className="portfolio-marquee-container mb-12"
            style={{ display: "flex", flexDirection: "column", gap: "45px" }}
          >
            {/* Row 1: Right to Left */}
            <div className="marquee-wrapper">
              <div className="marquee-content rtl">
                {/* First Set of Logos */}
                {padLogosArray(
                  marqueeLogos.filter(
                    (l) => !l.row || l.row === 1 || l.row === "1",
                  ),
                ).map((logo, idx) => (
                  <div className="marquee-logo-item" key={`logo-r1-1-${idx}`}>
                    <img
                      src={logo.src}
                      alt={logo.name}
                      className="marquee-logo"
                      style={{ height: "55px", maxHeight: "65px", width: "auto", objectFit: "contain" }}
                    />
                  </div>
                ))}
                {/* Second Set of Logos */}
                {padLogosArray(
                  marqueeLogos.filter(
                    (l) => !l.row || l.row === 1 || l.row === "1",
                  ),
                ).map((logo, logoIdx) => (
                  <div
                    className="marquee-logo-item"
                    key={`logo-r1-2-${logoIdx}`}
                  >
                    <img
                      src={logo.src}
                      alt={logo.name}
                      className="marquee-logo"
                      style={{ height: "55px", maxHeight: "65px", width: "auto", objectFit: "contain" }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Row 2: Left to Right */}
            <div className="marquee-wrapper">
              <div className="marquee-content ltr">
                {/* First Set of Logos */}
                {padLogosArray(
                  marqueeLogos.filter((l) => l.row === 2 || l.row === "2"),
                ).map((logo, idx) => (
                  <div className="marquee-logo-item" key={`logo-r2-1-${idx}`}>
                    <img
                      src={logo.src}
                      alt={logo.name}
                      className="marquee-logo"
                      style={{ height: "55px", maxHeight: "65px", width: "auto", objectFit: "contain" }}
                    />
                  </div>
                ))}
                {/* Second Set of Logos */}
                {padLogosArray(
                  marqueeLogos.filter((l) => l.row === 2 || l.row === "2"),
                ).map((logo, logoIdx) => (
                  <div
                    className="marquee-logo-item"
                    key={`logo-r2-2-${logoIdx}`}
                  >
                    <img
                      src={logo.src}
                      alt={logo.name}
                      className="marquee-logo"
                      style={{ height: "55px", maxHeight: "65px", width: "auto", objectFit: "contain" }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Platforms & Tools We Specialize In (Futuristic Premium Section) */}
      <section
        id="specialization"
        ref={specializationSectionRef}
        className={`specialization-section ${sectionInView ? "in-view" : ""}`}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeaveSection}
        aria-labelledby="specialization-heading"
      >
        {/* Layered cinematic glows & particles */}
        <div className="glow-blob glow-blob-blue" style={{ zIndex: 1 }}></div>
        <div className="glow-blob glow-blob-purple" style={{ zIndex: 1 }}></div>
        <div className="glow-blob glow-blob-pink" style={{ zIndex: 1 }}></div>

        {/* Mouse Follow Glow Overlay */}
        <div
          ref={mouseGlowRef}
          className="mouse-follow-glow"
          style={{ zIndex: 3 }}
        ></div>

        {/* Ambient Particles */}
        <div className="particles-container" style={{ zIndex: 2 }}>
          {particles.map((p, i) => (
            <div
              key={i}
              className="particle"
              style={{
                width: `${p.size}px`,
                height: `${p.size}px`,
                left: `${p.left}%`,
                top: `${p.top}%`,
                animationDuration: `${p.duration}s`,
                animationDelay: `${p.delay}s`,
              }}
            ></div>
          ))}
        </div>

        <div
          className="container specialization-container"
          style={{ zIndex: 4 }}
        >
          <div className="section-header spec-header">
            <h2 id="specialization-heading">
              Platforms & Tools We Specialize In
            </h2>
            <p>
              Powering digital growth with industry-leading platforms, marketing
              technologies, creative tools, and certified expertise.
            </p>
          </div>

          <div className="specialization-bento-grid">
            {specializationCategories.map((cat, idx) => (
              <div key={idx} className="spec-bento-column">
                <div
                  className="spec-category-header"
                  style={{ borderColor: cat.color }}
                >
                  <div
                    className="spec-category-icon"
                    style={{ color: cat.color }}
                  >
                    {cat.icon}
                  </div>
                  <h3 className="spec-category-title">{cat.title}</h3>
                </div>
                <div className="spec-tools-flex">
                  {cat.tools.map((tool, tIdx) => {
                    const isLong = tool.name.length > 15;
                    const sizeClass = isLong
                      ? "spec-card-lg"
                      : tIdx % 2 === 0
                        ? "spec-card-md"
                        : "spec-card-sm";

                    return (
                      <div
                        key={tIdx}
                        className={`spec-tool-rect-card ${sizeClass}`}
                      >
                        <div className="spec-tool-logo-wrapper">
                          <ToolLogo type={tool.logo} name={tool.name} />
                        </div>
                        <span className="spec-tool-name-label">
                          {tool.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Review cards */}
      <section id="reviews" className="section">
        <div className="container">
          <div className="section-header">
            <h2>Success Stories</h2>
            <p>
              Hear what business owners and technology directors are saying
              about partnerships with our agency.
            </p>
          </div>

          <div className="reviews-grid">
            {reviews.map((rev, idx) => (
              <div key={idx} className="review-card">
                <div className="review-stars">
                  {Array.from({ length: rev.stars }).map((_, i) => (
                    <span key={i}>★</span>
                  ))}
                </div>
                <p className="review-text">"{rev.text}"</p>
                <div className="review-author">
                  <div className="review-avatar">{rev.initials}</div>
                  <div className="review-info">
                    <h4>{rev.name}</h4>
                    <p>{rev.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. Frequently Asked Questions (FAQ) */}
      <section id="faq" className="section section-bg-alt">
        <div className="container">
          <div className="section-header">
            <h2>Have Questions?</h2>
            <p>
              Get quick, comprehensive answers about how we design, market, and
              develop your custom solutions.
            </p>
          </div>

          <div className="faq-container">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className={`faq-item ${idx === activeFaq ? "active" : ""}`}
              >
                <button
                  className="faq-question"
                  onClick={() => setActiveFaq(idx === activeFaq ? -1 : idx)}
                >
                  <span>{faq.q}</span>
                  <span className="faq-toggle-icon">+</span>
                </button>
                <div
                  className="faq-answer"
                  style={{ maxHeight: idx === activeFaq ? "250px" : "0" }}
                >
                  <div className="faq-answer-content">
                    <p>{faq.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 10. Worldwide Delivery Map Section */}
      <section id="worldwide" className="worldwide-section">
        <div className="container">
          <div className="section-header">
            <h2>Projects Delivered Worldwide</h2>
            <p>
              Delivering high-performance digital solutions globally from our
              headquarters in Hyderabad.
            </p>
          </div>

          <div className="map-container" style={{ position: "relative" }}>
            <img
              src="/images/world_map.png"
              alt="World Map"
              className="map-svg"
              style={{
                width: "100%",
                height: "auto",
                display: "block",
                opacity: 1,
              }}
            />
          </div>
        </div>
      </section>

      {/* 11. Footer */}
      <GlobalFooter />
    </div>
  );
}
