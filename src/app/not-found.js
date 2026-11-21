import React from "react";
import Link from "next/link";
import Header from "./components/Header";
import GlobalFooter from "./components/GlobalFooter";

export const metadata = {
  title: "404 - Page Not Found | Ananya Hi Solutions",
  description: "The page you are looking for does not exist on Ananya Hi Solutions. Explore our web design, SEO, and digital marketing services.",
};

export default function NotFound() {
  const quickLinks = [
    {
      title: "Website Design",
      desc: "Fast, responsive, SEO-ready modern websites built for conversion.",
      href: "/services/web-design",
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#0f75bc"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ width: "24px", height: "24px", flexShrink: 0 }}
        >
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
      ),
    },
    {
      title: "Digital Marketing & SEO",
      desc: "Drive targeted organic traffic, qualified leads, and measurable growth.",
      href: "/services/digital-marketing",
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#f58220"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ width: "24px", height: "24px", flexShrink: 0 }}
        >
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
          <polyline points="17 6 23 6 23 12" />
        </svg>
      ),
    },
    {
      title: "Growth Packages",
      desc: "Transparent, flexible pricing packages tailored for businesses of all sizes.",
      href: "/packages",
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#0f75bc"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ width: "24px", height: "24px", flexShrink: 0 }}
        >
          <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
      ),
    },
    {
      title: "Latest Insights & Blog",
      desc: "Actionable tips, industry updates, and strategies from our team.",
      href: "/blogs",
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#f58220"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ width: "24px", height: "24px", flexShrink: 0 }}
        >
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="ahs-error-page">
      <Header activePage="404" />

      <main className="ahs-error-main">
        {/* Ambient background glows */}
        <div aria-hidden="true" className="ahs-error-bg-glow glow-1" />
        <div aria-hidden="true" className="ahs-error-bg-glow glow-2" />

        <div className="ahs-error-container">
          {/* Badge */}
          <div className="ahs-error-badge">
            <span className="ahs-badge-dot" />
            Page Not Found
          </div>

          {/* 404 Heading */}
          <h1 className="ahs-error-404-number">404</h1>

          <h2 className="ahs-error-title">
            Oops! Looks Like You&apos;ve Hit a Dead End
          </h2>

          <p className="ahs-error-desc">
            The page you are looking for might have been removed, had its address changed, or is temporarily unavailable. Let&apos;s get you back on track!
          </p>

          {/* Primary Action Buttons */}
          <div className="ahs-error-actions">
            <Link href="/" className="ahs-btn ahs-btn-primary">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ width: "18px", height: "18px", flexShrink: 0 }}
              >
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              Back to Home
            </Link>

            <Link href="/packages" className="ahs-btn ahs-btn-secondary">
              Explore Our Services
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--accent-orange)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ width: "16px", height: "16px", flexShrink: 0 }}
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>

            <Link href="/contact" className="ahs-btn ahs-btn-ghost">
              Contact Support
            </Link>
          </div>

          {/* Quick Links Section */}
          <div className="ahs-quicklinks-section">
            <h3 className="ahs-quicklinks-header">
              Popular Destinations You Might Be Looking For
            </h3>
            <div className="ahs-quicklinks-grid">
              {quickLinks.map((item, idx) => (
                <Link key={idx} href={item.href} className="ahs-quicklink-card">
                  <div>
                    <div className="ahs-quicklink-icon-box">{item.icon}</div>
                    <div className="ahs-quicklink-title">{item.title}</div>
                    <div className="ahs-quicklink-desc">{item.desc}</div>
                  </div>
                  <div className="ahs-quicklink-arrow">
                    <span>Visit page</span>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ width: "14px", height: "14px", flexShrink: 0 }}
                    >
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>

      <GlobalFooter />
    </div>
  );
}
