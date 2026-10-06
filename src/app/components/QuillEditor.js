"use client";

import React, { useMemo } from "react";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";

// Dynamically import ReactQuill to prevent SSR window issues
const ReactQuill = dynamic(
  async () => {
    const rq = await import("react-quill-new");
    return rq.default;
  },
  { 
    ssr: false,
    loading: () => (
      <div className="quill-loading-placeholder">
        <span className="spinner-dashboard" style={{ width: "20px", height: "20px" }}></span>
        <span style={{ fontSize: "13px", color: "#64748b" }}>Loading Rich Text Editor...</span>
      </div>
    )
  }
);

export default function QuillEditor({ value, onChange, placeholder = "Write your high-impact blog article here..." }) {
  const modules = useMemo(
    () => ({
      toolbar: [
        [{ header: [1, 2, 3, false] }],
        ["bold", "italic", "underline", "strike"],
        [{ list: "ordered" }, { list: "bullet" }],
        ["blockquote", "code-block"],
        ["link"],
        ["clean"],
      ],
      clipboard: {
        matchVisual: false,
      },
    }),
    []
  );

  const formats = [
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "list",
    "blockquote",
    "code-block",
    "link",
  ];

  return (
    <div className="quill-editor-wrapper">
      <ReactQuill
        theme="snow"
        value={value || ""}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
      />
    </div>
  );
}
