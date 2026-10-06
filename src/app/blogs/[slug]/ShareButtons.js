"use client";

import React, { useState } from "react";

export default function ShareButtons({ title }) {
  const [copied, setCopied] = useState(false);

  const getUrl = () => {
    if (typeof window !== "undefined") {
      return window.location.href;
    }
    return "";
  };

  const handleCopy = () => {
    const url = getUrl();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      });
    }
  };

  const shareToWhatsApp = () => {
    const url = encodeURIComponent(getUrl());
    const text = encodeURIComponent(`Check out this article: ${title}\n`);
    window.open(`https://api.whatsapp.com/send?text=${text}${url}`, "_blank");
  };

  const shareToLinkedIn = () => {
    const url = encodeURIComponent(getUrl());
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, "_blank");
  };

  const shareToTwitter = () => {
    const url = encodeURIComponent(getUrl());
    const text = encodeURIComponent(title);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, "_blank");
  };

  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
      <button
        onClick={shareToWhatsApp}
        style={{
          background: "#25D366",
          color: "#fff",
          border: "none",
          padding: "6px 12px",
          borderRadius: "6px",
          fontSize: "12px",
          fontWeight: 600,
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: "4px"
        }}
        title="Share on WhatsApp"
      >
        💬 WhatsApp
      </button>

      <button
        onClick={shareToLinkedIn}
        style={{
          background: "#0A66C2",
          color: "#fff",
          border: "none",
          padding: "6px 12px",
          borderRadius: "6px",
          fontSize: "12px",
          fontWeight: 600,
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: "4px"
        }}
        title="Share on LinkedIn"
      >
        💼 LinkedIn
      </button>

      <button
        onClick={shareToTwitter}
        style={{
          background: "#000",
          color: "#fff",
          border: "none",
          padding: "6px 12px",
          borderRadius: "6px",
          fontSize: "12px",
          fontWeight: 600,
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: "4px"
        }}
        title="Share on X (Twitter)"
      >
        𝕏 Post
      </button>

      <button
        onClick={handleCopy}
        style={{
          background: copied ? "#16a34a" : "#f1f5f9",
          color: copied ? "#fff" : "#334155",
          border: "1px solid #cbd5e1",
          padding: "6px 12px",
          borderRadius: "6px",
          fontSize: "12px",
          fontWeight: 500,
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          transition: "all 0.2s"
        }}
      >
        {copied ? "✓ Copied!" : "🔗 Copy Link"}
      </button>
    </div>
  );
}
