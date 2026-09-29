"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Data states
  const [services, setServices] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [packages, setPackages] = useState([]);
  const [plans, setPlans] = useState({});
  const [editingCard, setEditingCard] = useState(null);
  const [editingPlansCardTitle, setEditingPlansCardTitle] = useState(null);
  const [tempPlans, setTempPlans] = useState([]);
  const [newCategoryTitle, setNewCategoryTitle] = useState("");
  const [banners, setBanners] = useState([]);
  const [marqueeLogos, setMarqueeLogos] = useState([]);

  // Loading & feedback states
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Modal control states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState(""); // 'service', 'job', 'blog'
  const [modalAction, setModalAction] = useState(""); // 'add', 'edit'
  const [currentItem, setCurrentItem] = useState(null);

  // Form input states
  // Service
  const [serviceId, setServiceId] = useState("");
  const [serviceTitle, setServiceTitle] = useState("");
  const [serviceDesc, setServiceDesc] = useState("");
  const [serviceIcon, setServiceIcon] = useState("globe");

  // Job
  const [jobTitle, setJobTitle] = useState("");
  const [jobDept, setJobDept] = useState("");
  const [jobLoc, setJobLoc] = useState("");
  const [jobExp, setJobExp] = useState("");
  const [jobQual, setJobQual] = useState("");
  const [jobType, setJobType] = useState("Full-Time");
  const [jobDesc, setJobDesc] = useState("");
  const [jobReqs, setJobReqs] = useState("");

  // Blog
  const [blogTitle, setBlogTitle] = useState("");
  const [blogSummary, setBlogSummary] = useState("");
  const [blogContent, setBlogContent] = useState("");
  const [blogCategory, setBlogCategory] = useState("Technology");
  const [blogAuthor, setBlogAuthor] = useState("Ananya Hi Solutions");
  const [blogCoverImage, setBlogCoverImage] = useState("");

  // Authorization Check
  useEffect(() => {
    const token = localStorage.getItem("ananya_admin_token");
    if (token !== "ananya-secure-admin-token-2026") {
      router.push("/admin/login");
    } else {
      setIsAuthorized(true);
      fetchData();
    }
  }, [router]);

  // Fetch all databases
  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [resServices, resJobs, resBlogs, resPackages, resBanners, resLogos] = await Promise.all([
        fetch("/api/services"),
        fetch("/api/jobs"),
        fetch("/api/blogs"),
        fetch("/api/packages"),
        fetch("/api/banners"),
        fetch("/api/marquee-logos"),
      ]);

      if (!resServices.ok || !resJobs.ok || !resBlogs.ok || !resPackages.ok || !resBanners.ok || !resLogos.ok) {
        throw new Error("Failed to load some resources.");
      }

      const [dataServices, dataJobs, dataBlogs, dataPackages, dataBanners, dataLogos] = await Promise.all([
        resServices.json(),
        resJobs.json(),
        resBlogs.json(),
        resPackages.json(),
        resBanners.json(),
        resLogos.json(),
      ]);

      setServices(dataServices);
      setJobs(dataJobs);
      setBlogs(dataBlogs);
      setPackages(dataPackages.packages || []);
      setPlans(dataPackages.plans || {});
      setBanners(dataBanners || []);
      setMarqueeLogos(dataLogos || []);
    } catch (err) {
      setError("Error syncing with local database. Please refresh.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Helper for auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem("ananya_admin_token");
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  };

  // Show Toast
  const showToast = (message, isSuccess = true) => {
    if (isSuccess) {
      setSuccessMessage(message);
      setTimeout(() => setSuccessMessage(""), 4000);
    } else {
      setError(message);
      setTimeout(() => setError(""), 5000);
    }
  };

  // Handlers for deleting items
  const handleDelete = async (type, id) => {
    if (!window.confirm(`Are you absolutely sure you want to delete this ${type}?`)) return;
    
    setActionLoading(true);
    try {
      const response = await fetch(`/api/${type}s?id=${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully!`);
        fetchData();
      } else {
        showToast(data.error || `Failed to delete ${type}`, false);
      }
    } catch (err) {
      showToast(`Network error deleting ${type}`, false);
    } finally {
      setActionLoading(false);
    }
  };

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem("ananya_admin_token");
    router.push("/admin/login");
  };

  // Packages Category & Plans Handlers
  const handleAddCategory = () => {
    if (!newCategoryTitle.trim()) return;
    const key = newCategoryTitle.trim().toLowerCase().replace(/\s+/g, "-");
    
    if (packages.some(c => c.key === key)) {
      showToast("Category key already exists", false);
      return;
    }

    const newCat = {
      title: newCategoryTitle.trim(),
      key: key,
      cards: []
    };
    setPackages([...packages, newCat]);
    setNewCategoryTitle("");
  };

  const handleDeleteCategory = (catIdx) => {
    if (!window.confirm("Are you sure you want to delete this category? This will delete all cards inside it.")) return;
    const updated = packages.filter((_, idx) => idx !== catIdx);
    setPackages(updated);
  };

  const handleAddCardClick = (catIdx) => {
    setEditingCard({
      categoryIdx: catIdx,
      cardIdx: -1,
      card: {
        title: "",
        image: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=800&q=80",
        features: ["Feature 1", "Feature 2", "Feature 3", "Feature 4"],
        link: ""
      }
    });
  };

  const handleEditCardClick = (catIdx, cardIdx) => {
    setEditingCard({
      categoryIdx: catIdx,
      cardIdx: cardIdx,
      card: { ...packages[catIdx].cards[cardIdx] }
    });
  };

  const handleDeleteCard = (catIdx, cardIdx) => {
    if (!window.confirm("Are you sure you want to delete this card? This will also clean up its plans data.")) return;
    const updatedCats = [...packages];
    const cardTitle = updatedCats[catIdx].cards[cardIdx].title;
    updatedCats[catIdx].cards.splice(cardIdx, 1);
    
    const updatedPlans = { ...plans };
    if (updatedPlans[cardTitle]) {
      delete updatedPlans[cardTitle];
    }
    
    setPackages(updatedCats);
    setPlans(updatedPlans);
  };

  const handleSaveCard = async (e) => {
    e.preventDefault();
    const { categoryIdx, cardIdx, card } = editingCard;
    
    if (!card.title.trim()) {
      showToast("Card title is required", false);
      return;
    }

    const updatedCats = [...packages];
    const updatedPlans = { ...plans };
    
    if (cardIdx === -1) {
      let duplicate = false;
      updatedCats.forEach(c => {
        if (c.cards && c.cards.some(cd => cd.title.toLowerCase() === card.title.toLowerCase())) {
          duplicate = true;
        }
      });
      if (duplicate) {
        showToast("Card title already exists in another category", false);
        return;
      }

      if (!updatedCats[categoryIdx].cards) {
        updatedCats[categoryIdx].cards = [];
      }
      updatedCats[categoryIdx].cards.push(card);
      
      if (!updatedPlans[card.title]) {
        updatedPlans[card.title] = [
          { name: "Basic Plan", icon: "🎯", price: "₹9,999", billing: "+ GST/Month", isPopular: false, features: ["Setup Ads Campaign", "Monthly Reports"], note: "" },
          { name: "Standard Plan", icon: "🚀", price: "₹19,999", billing: "+ GST/Month", isPopular: true, features: ["Everything in Basic", "Advanced Campaign Setup"], note: "" },
          { name: "Premium Plan", icon: "👑", price: "₹29,999", billing: "+ GST/Month", isPopular: false, features: ["Everything in Standard", "Video Shoots & Management"], note: "" }
        ];
      }
    } else {
      const oldTitle = updatedCats[categoryIdx].cards[cardIdx].title;
      updatedCats[categoryIdx].cards[cardIdx] = card;
      
      if (oldTitle !== card.title && updatedPlans[oldTitle]) {
        updatedPlans[card.title] = updatedPlans[oldTitle];
        delete updatedPlans[oldTitle];
      }
    }
    
    setPackages(updatedCats);
    setPlans(updatedPlans);
    setEditingCard(null);

    // Save directly to the database!
    setActionLoading(true);
    try {
      const response = await fetch("/api/packages", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          packages: updatedCats,
          plans: updatedPlans
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        showToast("Card saved to database successfully!");
        fetchData();
      } else {
        showToast(data.error || "Failed to save card to database", false);
      }
    } catch (err) {
      showToast("Network error saving card", false);
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditPlansClick = (cardTitle) => {
    const existingPlans = plans[cardTitle] || [
      { name: "Basic Plan", icon: "🎯", price: "₹9,999", billing: "+ GST/Month", isPopular: false, features: ["Setup Ads Campaign"], note: "" },
      { name: "Standard Plan", icon: "🚀", price: "₹19,999", billing: "+ GST/Month", isPopular: true, features: ["Everything in Basic"], note: "" },
      { name: "Premium Plan", icon: "👑", price: "₹29,999", billing: "+ GST/Month", isPopular: false, features: ["Everything in Standard"], note: "" }
    ];
    setEditingPlansCardTitle(cardTitle);
    setTempPlans(JSON.parse(JSON.stringify(existingPlans)));
  };

  const handleSavePlansTemp = async (e) => {
    e.preventDefault();
    const updatedPlans = { ...plans };
    updatedPlans[editingPlansCardTitle] = tempPlans;
    setPlans(updatedPlans);
    setEditingPlansCardTitle(null);

    // Save directly to the database!
    setActionLoading(true);
    try {
      const response = await fetch("/api/packages", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          packages: packages,
          plans: updatedPlans
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        showToast("Plans saved directly to database successfully!");
        fetchData();
      } else {
        showToast(data.error || "Failed to save plans to database", false);
      }
    } catch (err) {
      showToast("Network error saving plans", false);
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSavePackages = async () => {
    setActionLoading(true);
    try {
      const response = await fetch("/api/packages", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          packages: packages,
          plans: plans
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        showToast("Changes saved successfully!");
        fetchData();
      } else {
        showToast(data.error || "Failed to save packages", false);
      }
    } catch (err) {
      showToast("Network error saving packages", false);
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  // Reordering packages and cards
  const moveCategory = (index, direction) => {
    const updated = [...packages];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= updated.length) return;
    
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    
    setPackages(updated);
  };

  const moveCard = (catIdx, cardIdx, direction) => {
    const updatedCats = [...packages];
    const cards = [...updatedCats[catIdx].cards];
    const targetIndex = direction === "left" ? cardIdx - 1 : cardIdx + 1;
    if (targetIndex < 0 || targetIndex >= cards.length) return;
    
    const temp = cards[cardIdx];
    cards[cardIdx] = cards[targetIndex];
    cards[targetIndex] = temp;
    
    updatedCats[catIdx].cards = cards;
    setPackages(updatedCats);
  };

  // Banner Helpers
  const handleAddBanner = () => {
    const newBanner = {
      title: "",
      desc: "",
      path: "/packages",
      bgImage: "/images/hero/digital-marketing.png",
      btnText: ""
    };
    setBanners([...banners, newBanner]);
  };

  const handleDeleteBanner = (idx) => {
    if (!window.confirm("Are you sure you want to delete this slide?")) return;
    const updated = banners.filter((_, i) => i !== idx);
    setBanners(updated);
  };

  const moveBanner = (idx, direction) => {
    const updated = [...banners];
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= updated.length) return;
    
    const temp = updated[idx];
    updated[idx] = updated[targetIdx];
    updated[targetIdx] = temp;
    
    setBanners(updated);
  };

  const handleSaveBanners = async () => {
    setActionLoading(true);
    try {
      const response = await fetch("/api/banners", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ banners })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        showToast("Changes saved successfully!");
        fetchData();
      } else {
        showToast(data.error || "Failed to save banners", false);
      }
    } catch (err) {
      showToast("Network error saving banners", false);
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  // Marquee Logos Helpers
  const handleAddMarqueeLogo = () => {
    const newLogo = { src: "/portfolio_images/zuxa_logo.png", name: "", row: 1 };
    setMarqueeLogos([...marqueeLogos, newLogo]);
  };

  const handleDeleteMarqueeLogo = (idx) => {
    if (!window.confirm("Are you sure you want to delete this logo?")) return;
    const updated = marqueeLogos.filter((_, i) => i !== idx);
    setMarqueeLogos(updated);
  };

  const updateMarqueeLogo = (idx, field, value) => {
    const updated = [...marqueeLogos];
    updated[idx][field] = value;
    setMarqueeLogos(updated);
  };

  const handleSaveMarqueeLogos = async () => {
    setActionLoading(true);
    try {
      const response = await fetch("/api/marquee-logos", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ logos: marqueeLogos })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        showToast("Changes saved successfully!");
        fetchData();
      } else {
        showToast(data.error || "Failed to save marquee logos", false);
      }
    } catch (err) {
      showToast("Network error saving marquee logos", false);
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  // Modal controls
  const openModal = (type, action, item = null) => {
    setModalType(type);
    setModalAction(action);
    setCurrentItem(item);
    setError("");

    if (action === "edit" && item) {
      if (type === "service") {
        setServiceId(item.id);
        setServiceTitle(item.title);
        setServiceDesc(item.desc);
        setServiceIcon(item.iconName || "globe");
      } else if (type === "job") {
        setJobTitle(item.title);
        setJobDept(item.department);
        setJobLoc(item.location);
        setJobExp(item.experience);
        setJobQual(item.qualifications || "");
        setJobType(item.type);
        setJobDesc(item.description);
        setJobReqs(item.requirements ? item.requirements.join("\n") : "");
      } else if (type === "blog") {
        setBlogTitle(item.title);
        setBlogSummary(item.summary);
        setBlogContent(item.content);
        setBlogCategory(item.category);
        setBlogAuthor(item.author || "Ananya Hi Solutions");
        setBlogCoverImage(item.coverImage || "");
      }
    } else {
      // Clear forms for Add action
      if (type === "service") {
        setServiceId("");
        setServiceTitle("");
        setServiceDesc("");
        setServiceIcon("globe");
      } else if (type === "job") {
        setJobTitle("");
        setJobDept("");
        setJobLoc("");
        setJobExp("");
        setJobQual("");
        setJobType("Full-Time");
        setJobDesc("");
        setJobReqs("");
      } else if (type === "blog") {
        setBlogTitle("");
        setBlogSummary("");
        setBlogContent("");
        setBlogCategory("Technology");
        setBlogAuthor("Ananya Hi Solutions");
        setBlogCoverImage("");
      }
    }

    setIsModalOpen(true);
  };

  // Load dynamic scripts (e.g. mammoth, pdfjs)
  const loadScript = (src) => {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve();
        return;
      }
      const script = document.createElement("script");
      script.src = src;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
      document.body.appendChild(script);
    });
  };

  // Handle parsing PDF/DOCX
  const handleDocumentUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileType = file.name.split('.').pop().toLowerCase();
    showToast("Extracting document text...", true);

    try {
      if (fileType === "docx") {
        if (!window.mammoth) {
          await loadScript("https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js");
        }
        
        const reader = new FileReader();
        reader.onload = (event) => {
          const arrayBuffer = event.target.result;
          window.mammoth.extractRawText({ arrayBuffer: arrayBuffer })
            .then((result) => {
              const text = result.value;
              setBlogContent(text);
              // Auto-fill summary helper
              const trimmed = text.replace(/\s+/g, ' ').trim();
              setBlogSummary(trimmed.slice(0, 180) + (trimmed.length > 180 ? "..." : ""));
              showToast("Successfully extracted .docx content!", true);
            })
            .catch((err) => {
              showToast("Error parsing docx content", false);
              console.error(err);
            });
        };
        reader.readAsArrayBuffer(file);
      } else if (fileType === "pdf") {
        if (!window['pdfjs-dist/build/pdf']) {
          await loadScript("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js");
        }
        
        const reader = new FileReader();
        reader.onload = async (event) => {
          const typedarray = new Uint8Array(event.target.result);
          const pdfjsLib = window['pdfjs-dist/build/pdf'];
          pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
          
          try {
            const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise;
            let fullText = "";
            for (let i = 1; i <= pdf.numPages; i++) {
              const page = await pdf.getPage(i);
              const textContent = await page.getTextContent();
              const pageText = textContent.items.map((item) => item.str).join(" ");
              fullText += pageText + "\n";
            }
            setBlogContent(fullText);
            // Auto-fill summary helper
            const trimmed = fullText.replace(/\s+/g, ' ').trim();
            setBlogSummary(trimmed.slice(0, 180) + (trimmed.length > 180 ? "..." : ""));
            showToast("Successfully extracted .pdf content!", true);
          } catch (err) {
            showToast("Error extracting PDF text pages", false);
            console.error(err);
          }
        };
        reader.readAsArrayBuffer(file);
      }
    } catch (err) {
      showToast("Error loading parsing libraries", false);
      console.error(err);
    }
  };

  // Handle image uploading & conversion to base64
  const handleCoverImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setBlogCoverImage(event.target.result);
      showToast("Cover image loaded successfully!", true);
    };
    reader.onerror = () => {
      showToast("Failed to read cover image file", false);
    };
    reader.readAsDataURL(file);
  };

  // Form Submit Handler
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError("");

    let payload = {};
    let url = `/api/${modalType}s`;
    let method = modalAction === "edit" ? "PUT" : "POST";

    if (modalType === "service") {
      payload = {
        id: serviceId.trim().toLowerCase().replace(/\s+/g, "-"),
        title: serviceTitle,
        desc: serviceDesc,
        iconName: serviceIcon,
      };
      if (modalAction === "edit") {
        payload.id = currentItem.id; // Keep original ID
      }
    } else if (modalType === "job") {
      const requirementsArray = jobReqs
        .split("\n")
        .map((r) => r.trim())
        .filter((r) => r.length > 0);

      payload = {
        title: jobTitle,
        department: jobDept,
        location: jobLoc,
        experience: jobExp,
        qualifications: jobQual,
        type: jobType,
        description: jobDesc,
        requirements: requirementsArray,
      };

      if (modalAction === "edit") {
        payload.id = currentItem.id;
      }
    } else if (modalType === "blog") {
      payload = {
        title: blogTitle,
        summary: blogSummary,
        content: blogContent,
        category: blogCategory,
        author: blogAuthor || "Ananya Hi Solutions",
        coverImage: blogCoverImage,
      };

      if (modalAction === "edit") {
        payload.id = currentItem.id;
        payload.date = currentItem.date; // Preserve date
      }
    }

    try {
      const response = await fetch(url, {
        method: method,
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && (data.success || data.service || data.job || data.blog)) {
        showToast(
          `${modalType.charAt(0).toUpperCase() + modalType.slice(1)} ${
            modalAction === "edit" ? "updated" : "created"
          } successfully!`
        );
        setIsModalOpen(false);
        fetchData();
      } else {
        setError(data.error || `Failed to save changes to database.`);
      }
    } catch (err) {
      setError(`Server or network error occurred during saving.`);
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="admin-loading-screen">
        <span className="spinner-dashboard"></span>
        <p>Verifying secure credentials...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-container">
      {/* Success/Error Toast notification top right */}
      {successMessage && (
        <div className="admin-toast success">
          <span className="toast-icon">✨</span>
          <p>{successMessage}</p>
        </div>
      )}
      {error && !isModalOpen && (
        <div className="admin-toast error">
          <span className="toast-icon">⚠️</span>
          <p>{error}</p>
        </div>
      )}

      {/* 1. Sidebar Navigation */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <img
            src="/logo.png"
            alt="Ananya Hi Solutions"
            className="admin-sidebar-logo"
          />
          <span className="admin-sidebar-badge">CONTROL PANEL</span>
        </div>

        <nav className="admin-sidebar-nav">
          <button
            className={`admin-nav-item ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            <span className="nav-icon">📊</span> Overview
          </button>
          <button
            className={`admin-nav-item ${activeTab === "services" ? "active" : ""}`}
            onClick={() => setActiveTab("services")}
          >
            <span className="nav-icon">🌐</span> Services List
          </button>
          <button
            className={`admin-nav-item ${activeTab === "careers" ? "active" : ""}`}
            onClick={() => setActiveTab("careers")}
          >
            <span className="nav-icon">💼</span> Careers / Jobs
          </button>
          <button
            className={`admin-nav-item ${activeTab === "blogs" ? "active" : ""}`}
            onClick={() => setActiveTab("blogs")}
          >
            <span className="nav-icon">📰</span> News & Blogs
          </button>
          <button
            className={`admin-nav-item ${activeTab === "packages" ? "active" : ""}`}
            onClick={() => setActiveTab("packages")}
          >
            <span className="nav-icon">📦</span> Packages & Plans
          </button>
          <button
            className={`admin-nav-item ${activeTab === "banners" ? "active" : ""}`}
            onClick={() => setActiveTab("banners")}
          >
            <span className="nav-icon">🖼️</span> Homepage Banners
          </button>
          <button
            className={`admin-nav-item ${activeTab === "marquee-logos" ? "active" : ""}`}
            onClick={() => setActiveTab("marquee-logos")}
          >
            <span className="nav-icon">✨</span> Scroll Logos
          </button>
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-sidebar-user">
            <div className="user-avatar">👤</div>
            <div className="user-details">
              <h4>Administrator</h4>
              <p>Security Level: Full</p>
            </div>
          </div>
          <button className="admin-logout-btn" onClick={handleLogout}>
            🚪 Sign Out
          </button>
        </div>
      </aside>

      {/* 2. Main Dashboard Content Panel */}
      <main className="admin-main-panel">
        <header className="admin-main-header">
          <div className="header-breadcrumbs">
            <span>Admin</span> / <span className="active-breadcrumb">{activeTab}</span>
          </div>
          <div className="header-actions">
            <Link href="/" target="_blank" className="admin-btn btn-view-site">
              ← Visit Frontend Site
            </Link>
          </div>
        </header>

        {loading ? (
          <div className="admin-tab-loading">
            <span className="spinner-dashboard"></span>
            <p>Loading database settings...</p>
          </div>
        ) : (
          <div className="admin-tab-content animate-fade-in">
            {/* OVERVIEW TAB */}
            {activeTab === "overview" && (
              <div className="dashboard-overview">
                <div className="overview-welcome-card">
                  <div className="welcome-text">
                    <h1>Welcome back, Web Expert! 👋</h1>
                    <p>
                      Easily edit, add, or delete the dynamic content on Ananya Hi Solutions homepage in real-time. No code-level changes needed.
                    </p>
                  </div>
                  <div className="welcome-decor">📂</div>
                </div>

                <div className="overview-stats-grid">
                  <div className="stat-card card-blue" onClick={() => setActiveTab("services")}>
                    <div className="stat-icon">🌐</div>
                    <div className="stat-value">{services.length}</div>
                    <div className="stat-label">Services Provided</div>
                    <span className="stat-link">Manage services →</span>
                  </div>

                  <div className="stat-card card-orange" onClick={() => setActiveTab("careers")}>
                    <div className="stat-icon">💼</div>
                    <div className="stat-value">{jobs.length}</div>
                    <div className="stat-label">Active Career Listings</div>
                    <span className="stat-link">Manage job openings →</span>
                  </div>

                  <div className="stat-card card-purple" onClick={() => setActiveTab("blogs")}>
                    <div className="stat-icon">📰</div>
                    <div className="stat-value">{blogs.length}</div>
                    <div className="stat-label">Published Blog Posts</div>
                    <span className="stat-link">Manage blog articles →</span>
                  </div>
                </div>

                <div className="overview-meta-section">
                  <div className="integrity-card">
                    <h3>🛡️ System & Database Integrity</h3>
                    <div className="integrity-status-list">
                      <div className="status-item">
                        <span className="status-dot green"></span>
                        <div className="status-info">
                          <h5>Database Connectivity</h5>
                          <p>FS-Persisted JSON storage active and safe</p>
                        </div>
                      </div>
                      <div className="status-item">
                        <span className="status-dot green"></span>
                        <div className="status-info">
                          <h5>Write & Read Access</h5>
                          <p>Perfect authorization permissions inside /src/data/db.json</p>
                        </div>
                      </div>
                      <div className="status-item">
                        <span className="status-dot green"></span>
                        <div className="status-info">
                          <h5>Next.js Development Framework</h5>
                          <p>App Router, Client & Server side syncing active</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="quick-actions-card">
                    <h3>⚡ Quick Database Actions</h3>
                    <div className="quick-actions-grid">
                      <button className="q-action-btn" onClick={() => openModal("service", "add")}>
                        ➕ Add Service Card
                      </button>
                      <button className="q-action-btn" onClick={() => openModal("job", "add")}>
                        💼 Post Career Opening
                      </button>
                      <button className="q-action-btn" onClick={() => openModal("blog", "add")}>
                        ✍️ Publish Blog Article
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SERVICES LIST TAB */}
            {activeTab === "services" && (
              <div className="dashboard-tab-panel">
                <div className="panel-header">
                  <div className="panel-title-desc">
                    <h2>Core Business Services</h2>
                    <p>These services display on the main home page under 'Our Core Services'</p>
                  </div>
                  <button className="admin-btn btn-primary-custom" onClick={() => openModal("service", "add")}>
                    ➕ Add Service Card
                  </button>
                </div>

                <div className="panel-table-wrapper">
                  <table className="panel-table">
                    <thead>
                      <tr>
                        <th>Icon</th>
                        <th>Unique ID</th>
                        <th>Service Title</th>
                        <th>Description (Summary)</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {services.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="table-empty-row">No services found in database. Add one to begin.</td>
                        </tr>
                      ) : (
                        services.map((item) => (
                          <tr key={item.id}>
                            <td className="cell-icon">
                              <span className="icon-badge">{item.iconName ? `🎨 ${item.iconName}` : "🌐"}</span>
                            </td>
                            <td className="cell-id"><code>{item.id}</code></td>
                            <td className="cell-title font-bold">{item.title}</td>
                            <td className="cell-desc">{item.desc}</td>
                            <td className="cell-actions">
                              <button className="btn-action edit" onClick={() => openModal("service", "edit", item)}>
                                ✏️ Edit
                              </button>
                              <button className="btn-action delete" onClick={() => handleDelete("service", item.id)} disabled={actionLoading}>
                                🗑️ Delete
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* CAREERS / JOBS TAB */}
            {activeTab === "careers" && (
              <div className="dashboard-tab-panel">
                <div className="panel-header">
                  <div className="panel-title-desc">
                    <h2>Active Career Postings</h2>
                    <p>These openings display in the Careers section on the frontend home page</p>
                  </div>
                  <button className="admin-btn btn-primary-custom" onClick={() => openModal("job", "add")}>
                    💼 Post Career Opening
                  </button>
                </div>

                <div className="panel-table-wrapper">
                  <table className="panel-table">
                    <thead>
                      <tr>
                        <th>Job Title</th>
                        <th>Department</th>
                        <th>Location</th>
                        <th>Job Type</th>
                        <th>Experience</th>
                        <th>Qualifications</th>
                        <th>Requirements</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {jobs.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="table-empty-row">No active job postings found. Create one.</td>
                        </tr>
                      ) : (
                        jobs.map((item) => (
                          <tr key={item.id}>
                            <td className="cell-title font-bold">{item.title}</td>
                            <td className="cell-badge">
                              <span className="badge-dept">{item.department}</span>
                            </td>
                            <td>{item.location}</td>
                            <td className="cell-badge">
                              <span className="badge-type">{item.type}</span>
                            </td>
                            <td>{item.experience}</td>
                            <td>{item.qualifications || "N/A"}</td>
                            <td className="cell-desc">
                              {item.requirements ? `${item.requirements.length} item(s)` : "0 items"}
                            </td>
                            <td className="cell-actions">
                              <button className="btn-action edit" onClick={() => openModal("job", "edit", item)}>
                                ✏️ Edit
                              </button>
                              <button className="btn-action delete" onClick={() => handleDelete("job", item.id)} disabled={actionLoading}>
                                🗑️ Delete
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* NEWS & BLOGS TAB */}
            {activeTab === "blogs" && (
              <div className="dashboard-tab-panel">
                <div className="panel-header">
                  <div className="panel-title-desc">
                    <h2>News & Published Articles</h2>
                    <p>Publish helpful SEO content and press releases directly to the blog home section</p>
                  </div>
                  <button className="admin-btn btn-primary-custom" onClick={() => openModal("blog", "add")}>
                    ✍️ Publish Blog Article
                  </button>
                </div>

                <div className="panel-table-wrapper">
                  <table className="panel-table">
                    <thead>
                      <tr>
                        <th>Article Title</th>
                        <th>Category</th>
                        <th>Publish Date</th>
                        <th>Author</th>
                        <th>Summary</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {blogs.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="table-empty-row">No published blog posts. Write your first article today.</td>
                        </tr>
                      ) : (
                        blogs.map((item) => (
                          <tr key={item.id}>
                            <td className="cell-title font-bold">{item.title}</td>
                            <td className="cell-badge">
                              <span className="badge-cat">{item.category}</span>
                            </td>
                            <td>{item.date}</td>
                            <td>{item.author}</td>
                            <td className="cell-desc">{item.summary}</td>
                            <td className="cell-actions">
                              <button className="btn-action edit" onClick={() => openModal("blog", "edit", item)}>
                                ✏️ Edit
                              </button>
                              <button className="btn-action delete" onClick={() => handleDelete("blog", item.id)} disabled={actionLoading}>
                                🗑️ Delete
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* PACKAGES & PLANS TAB */}
            {activeTab === "packages" && (
              <div className="dashboard-tab-panel animate-fade-in">
                <div className="panel-header">
                  <div className="panel-title-desc">
                    <h2>Packages & Plans Management</h2>
                    <p>Manage categories, service cards, and pricing plans dynamically without touching code.</p>
                  </div>
                  <button 
                    className="admin-btn btn-primary-custom"
                    onClick={handleSavePackages}
                    disabled={actionLoading}
                  >
                    {actionLoading ? "💾 Saving..." : "💾 Save All Changes"}
                  </button>
                </div>

                {/* Category List */}
                <div style={{ display: "flex", flexDirection: "column", gap: "30px", marginTop: "20px" }}>
                  {packages.map((category, catIdx) => (
                    <div key={catIdx} style={{
                      background: "white",
                      border: "1px solid #e2e8f0",
                      borderRadius: "12px",
                      padding: "24px",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
                    }}>
                       {/* Category Header */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f1f5f9", paddingBottom: "16px", marginBottom: "20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", width: "60%" }}>
                          <span style={{ fontSize: "14px", fontWeight: "700", color: "#64748b" }}>Category Title:</span>
                          <input 
                            type="text" 
                            value={category.title} 
                            onChange={(e) => {
                              const updated = [...packages];
                              updated[catIdx].title = e.target.value;
                              updated[catIdx].key = e.target.value.toLowerCase().replace(/\s+/g, "-");
                              setPackages(updated);
                            }}
                            style={{
                              padding: "8px 12px",
                              border: "1px solid #cbd5e1",
                              borderRadius: "6px",
                              fontSize: "16px",
                              fontWeight: "700",
                              color: "#0f172a",
                              width: "100%"
                            }}
                          />
                        </div>
                        <div style={{ display: "flex", gap: "4px" }}>
                          <button 
                            disabled={catIdx === 0}
                            onClick={() => moveCategory(catIdx, "up")}
                            style={{ padding: "6px 10px", background: catIdx === 0 ? "#cbd5e1" : "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "6px", cursor: catIdx === 0 ? "not-allowed" : "pointer", fontSize: "12px", color: "#475569" }}
                            title="Move Category Up"
                          >
                            ▲ Up
                          </button>
                          <button 
                            disabled={catIdx === packages.length - 1}
                            onClick={() => moveCategory(catIdx, "down")}
                            style={{ padding: "6px 10px", background: catIdx === packages.length - 1 ? "#cbd5e1" : "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "6px", cursor: catIdx === packages.length - 1 ? "not-allowed" : "pointer", fontSize: "12px", color: "#475569" }}
                            title="Move Category Down"
                          >
                            ▼ Down
                          </button>
                        </div>
                        <div style={{ display: "flex", gap: "10px" }}>
                          <button 
                            className="btn-action edit"
                            onClick={() => handleAddCardClick(catIdx)}
                          >
                            ➕ Add Card
                          </button>
                          <button 
                            className="btn-action delete"
                            onClick={() => handleDeleteCategory(catIdx)}
                          >
                            🗑️ Delete Category
                          </button>
                        </div>
                      </div>

                      {/* Cards Grid */}
                      <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                        gap: "20px"
                      }}>
                        {category.cards && category.cards.map((card, cardIdx) => (
                          <div key={cardIdx} style={{
                            border: "1px solid #f1f5f9",
                            borderRadius: "8px",
                            padding: "16px",
                            background: "#f8fafc",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                            gap: "12px"
                          }}>
                            <div>
                              <div style={{ height: "120px", borderRadius: "6px", backgroundSize: "cover", backgroundPosition: "center", backgroundImage: `url(${card.image})`, marginBottom: "12px" }} />
                              <h4 style={{ margin: "0 0 4px 0", fontSize: "15px", fontWeight: "700", color: "#0f172a" }}>{card.title}</h4>
                              <p style={{ margin: "0", fontSize: "11px", color: "#64748b" }}>Link: {card.link || "N/A"}</p>
                              
                              <div style={{ marginTop: "10px" }}>
                                <span style={{ fontSize: "11px", fontWeight: "700", color: "#64748b" }}>Visible Points:</span>
                                <ul style={{ margin: "4px 0 0 0", paddingLeft: "16px", fontSize: "11px", color: "#475569" }}>
                                  {card.features && card.features.map((f, fIdx) => (
                                    <li key={fIdx} style={{ display: "list-item", listStyleType: "disc" }}>{f}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "12px" }}>
                              <div style={{ display: "flex", gap: "8px" }}>
                                <button 
                                  style={{ flex: 1, padding: "8px", fontSize: "12px" }}
                                  className="btn-action edit"
                                  onClick={() => handleEditCardClick(catIdx, cardIdx)}
                                >
                                  ✏️ Edit Card
                                </button>
                                <button 
                                  style={{ padding: "8px", fontSize: "12px" }}
                                  className="btn-action delete"
                                  onClick={() => handleDeleteCard(catIdx, cardIdx)}
                                >
                                  🗑️ Delete
                                </button>
                              </div>
                              <div style={{ display: "flex", gap: "4px" }}>
                                <button 
                                  type="button"
                                  disabled={cardIdx === 0}
                                  onClick={() => moveCard(catIdx, cardIdx, "left")}
                                  style={{ flex: 1, padding: "6px", fontSize: "11px", background: cardIdx === 0 ? "#cbd5e1" : "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "4px", cursor: cardIdx === 0 ? "not-allowed" : "pointer", color: "#475569", fontWeight: "600" }}
                                  title="Move Card Left"
                                >
                                  ◀ Left
                                </button>
                                <button 
                                  type="button"
                                  disabled={cardIdx === category.cards.length - 1}
                                  onClick={() => moveCard(catIdx, cardIdx, "right")}
                                  style={{ flex: 1, padding: "6px", fontSize: "11px", background: cardIdx === category.cards.length - 1 ? "#cbd5e1" : "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "4px", cursor: cardIdx === category.cards.length - 1 ? "not-allowed" : "pointer", color: "#475569", fontWeight: "600" }}
                                  title="Move Card Right"
                                >
                                  Right ▶
                                </button>
                              </div>
                              <button 
                                style={{ width: "100%", padding: "10px", background: "#2563eb", color: "white", border: "none", borderRadius: "6px", fontWeight: "700", fontSize: "12px", cursor: "pointer" }}
                                onClick={() => handleEditPlansClick(card.title)}
                              >
                                ⚙️ Edit Plans ({plans[card.title] ? plans[card.title].length : 0})
                              </button>
                            </div>
                          </div>
                        ))}
                        {(!category.cards || category.cards.length === 0) && (
                          <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "30px", color: "#94a3b8", fontSize: "14px" }}>
                            No cards in this category. Click "+ Add Card" above to create one.
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Add Category Section */}
                  <div style={{
                    background: "#f8fafc",
                    border: "2px dashed #cbd5e1",
                    borderRadius: "12px",
                    padding: "24px",
                    textAlign: "center",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "12px"
                  }}>
                    <h3 style={{ margin: "0", fontSize: "16px", color: "#475569" }}>Add New Package Category</h3>
                    <div style={{ display: "flex", gap: "10px", width: "100%", maxWidth: "480px" }}>
                      <input 
                        type="text" 
                        placeholder="e.g. SEO Packages" 
                        value={newCategoryTitle}
                        onChange={(e) => setNewCategoryTitle(e.target.value)}
                        style={{
                          flex: 1,
                          padding: "10px 14px",
                          border: "1px solid #cbd5e1",
                          borderRadius: "6px",
                          fontSize: "14px",
                          color: "#0f172a"
                        }}
                      />
                      <button 
                        className="admin-btn btn-primary-custom"
                        onClick={handleAddCategory}
                        style={{ padding: "10px 20px" }}
                      >
                        ➕ Add Category
                      </button>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "30px" }}>
                  <button 
                    className="admin-btn btn-primary-custom"
                    style={{ padding: "15px 30px", fontSize: "16px" }}
                    onClick={handleSavePackages}
                    disabled={actionLoading}
                  >
                    {actionLoading ? "💾 Saving Changes..." : "💾 Save All Changes"}
                  </button>
                </div>
              </div>
            )}

            {/* HOMEPAGE BANNERS TAB */}
            {activeTab === "banners" && (
              <div className="dashboard-tab-panel animate-fade-in">
                <div className="panel-header">
                  <div className="panel-title-desc">
                    <h2>Homepage Banners Manager</h2>
                    <p>Add, edit, or remove the slideshow banners displaying at the starting of your homepage.</p>
                  </div>
                  <button 
                    className="admin-btn btn-primary-custom"
                    onClick={handleSaveBanners}
                    disabled={actionLoading}
                  >
                    {actionLoading ? "💾 Saving..." : "💾 Save Banners"}
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "24px", marginTop: "20px" }}>
                  {banners.map((slide, idx) => (
                    <div key={idx} style={{
                      background: "white",
                      border: "1px solid #e2e8f0",
                      borderRadius: "12px",
                      padding: "24px",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid #f1f5f9", paddingBottom: "12px" }}>
                        <h3 style={{ margin: 0, fontSize: "16px", color: "#1e293b", fontWeight: "700" }}>
                          Slide #{idx + 1}
                        </h3>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button 
                            type="button"
                            disabled={idx === 0}
                            onClick={() => moveBanner(idx, "up")}
                            style={{ padding: "6px 10px", background: idx === 0 ? "#cbd5e1" : "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "6px", cursor: idx === 0 ? "not-allowed" : "pointer", fontSize: "12px", color: "#475569" }}
                          >
                            ▲ Up
                          </button>
                          <button 
                            type="button"
                            disabled={idx === banners.length - 1}
                            onClick={() => moveBanner(idx, "down")}
                            style={{ padding: "6px 10px", background: idx === banners.length - 1 ? "#cbd5e1" : "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "6px", cursor: idx === banners.length - 1 ? "not-allowed" : "pointer", fontSize: "12px", color: "#475569" }}
                          >
                            ▼ Down
                          </button>
                          <button 
                            type="button"
                            className="btn-action delete"
                            onClick={() => handleDeleteBanner(idx)}
                            style={{ padding: "6px 12px", fontSize: "12px" }}
                          >
                            🗑️ Delete Slide
                          </button>
                        </div>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                        <div>
                          <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#64748b", marginBottom: "6px" }}>Background Image URL/Path</label>
                          <div style={{ display: "flex", gap: "8px" }}>
                            <input 
                              type="text" 
                              value={slide.bgImage} 
                              onChange={(e) => {
                                const updated = [...banners];
                                updated[idx].bgImage = e.target.value;
                                setBanners(updated);
                              }}
                              placeholder="e.g. /images/hero/digital-marketing.png"
                              style={{ flex: 1, padding: "10px 14px", border: "1px solid #cbd5e1", borderRadius: "6px", color: "#0f172a", fontSize: "14px" }}
                            />
                            <label style={{ padding: "10px 16px", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "6px", cursor: "pointer", fontSize: "13px", fontWeight: "600", color: "#475569", display: "inline-flex", alignItems: "center" }}>
                              📁 Upload
                              <input 
                                type="file" 
                                accept="image/*"
                                onChange={async (e) => {
                                  const file = e.target.files[0];
                                  if (!file) return;
                                  showToast("Uploading image...", true);
                                  const formData = new FormData();
                                  formData.append("file", file);
                                  try {
                                    const res = await fetch("/api/upload", {
                                      method: "POST",
                                      headers: {
                                        Authorization: `Bearer ${localStorage.getItem("ananya_admin_token")}`
                                      },
                                      body: formData
                                    });
                                    const data = await res.json();
                                    if (res.ok && data.url) {
                                      const updated = [...banners];
                                      updated[idx].bgImage = data.url;
                                      setBanners(updated);
                                      showToast("Image uploaded successfully!", true);
                                    } else {
                                      showToast(data.error || "Failed to upload image", false);
                                    }
                                  } catch (err) {
                                    showToast("Network error uploading image", false);
                                    console.error(err);
                                  }
                                }}
                                style={{ display: "none" }}
                              />
                            </label>
                          </div>
                        </div>

                        <div>
                          <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#64748b", marginBottom: "6px" }}>Navigation Link Path (Route)</label>
                          <input 
                            type="text" 
                            value={slide.path} 
                            onChange={(e) => {
                              const updated = [...banners];
                              updated[idx].path = e.target.value;
                              setBanners(updated);
                            }}
                            placeholder="e.g. /packages or /services/digital-marketing/smm"
                            style={{ width: "100%", padding: "10px 14px", border: "1px solid #cbd5e1", borderRadius: "6px", color: "#0f172a", fontSize: "14px" }}
                          />
                        </div>
                      </div>

                      <div style={{ marginTop: "15px", border: "1px solid #e2e8f0", borderRadius: "8px", overflow: "hidden", height: "140px", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                        {slide.bgImage ? (
                          <div style={{ width: "100%", height: "100%", backgroundSize: "cover", backgroundPosition: "center", backgroundImage: `url(${slide.bgImage})` }} />
                        ) : (
                          <span style={{ fontSize: "13px", color: "#94a3b8", fontWeight: "650" }}>No background preview</span>
                        )}
                      </div>
                    </div>
                  ))}

                  {banners.length === 0 && (
                    <div style={{ background: "white", padding: "40px", borderRadius: "12px", textAlign: "center", border: "1px solid #e2e8f0", color: "#64748b" }}>
                      No homepage banners found. Click "+ Add Banner Slide" below to create one.
                    </div>
                  )}

                  <button 
                    type="button"
                    onClick={handleAddBanner}
                    style={{ padding: "16px", background: "white", border: "2px dashed #cbd5e1", borderRadius: "12px", color: "#475569", fontWeight: "700", cursor: "pointer", fontSize: "14px" }}
                  >
                    ➕ Add Banner Slide
                  </button>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "30px" }}>
                  <button 
                    className="admin-btn btn-primary-custom"
                    style={{ padding: "15px 30px", fontSize: "16px" }}
                    onClick={handleSaveBanners}
                    disabled={actionLoading}
                  >
                    {actionLoading ? "💾 Saving Banners..." : "💾 Save Banners"}
                  </button>
                </div>
              </div>
            )}

            {activeTab === "marquee-logos" && (
              <div className="dashboard-tab-panel animate-fade-in">
                <div className="panel-header">
                  <div className="panel-title-desc">
                    <h2>Scrolling Logos Manager</h2>
                    <p>Add, edit, or remove the client/portfolio logos that scroll above the portfolio section on the About page.</p>
                  </div>
                  <button 
                    className="admin-btn btn-primary-custom"
                    onClick={handleSaveMarqueeLogos}
                    disabled={actionLoading}
                  >
                    {actionLoading ? "💾 Saving..." : "💾 Save Changes"}
                  </button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px", marginTop: "20px" }}>
                  {marqueeLogos.map((logo, idx) => (
                    <div key={idx} style={{
                      background: "white",
                      border: "1px solid #e2e8f0",
                      borderRadius: "12px",
                      padding: "20px",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                      position: "relative"
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "12px", fontWeight: "800", color: "#64748b" }}>LOGO #{idx + 1}</span>
                        <button 
                          type="button"
                          className="btn-action delete"
                          onClick={() => handleDeleteMarqueeLogo(idx)}
                          style={{ padding: "4px 8px", fontSize: "11px" }}
                        >
                          🗑️ Delete
                        </button>
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#64748b", marginBottom: "4px" }}>Logo Image URL/Path</label>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <input 
                            type="text" 
                            value={logo.src} 
                            onChange={(e) => updateMarqueeLogo(idx, "src", e.target.value)}
                            placeholder="/portfolio_images/logo.png"
                            style={{ flex: 1, padding: "8px 10px", border: "1px solid #cbd5e1", borderRadius: "6px", color: "#0f172a", fontSize: "13px" }}
                          />
                          <label style={{ padding: "8px 12px", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "600", color: "#475569", display: "inline-flex", alignItems: "center" }}>
                            📁 Upload
                            <input 
                              type="file" 
                              accept="image/*"
                              onChange={async (e) => {
                                const file = e.target.files[0];
                                if (!file) return;
                                showToast("Uploading logo...", true);
                                const formData = new FormData();
                                formData.append("file", file);
                                try {
                                  const res = await fetch("/api/upload", {
                                    method: "POST",
                                    headers: {
                                      Authorization: `Bearer ${localStorage.getItem("ananya_admin_token")}`
                                    },
                                    body: formData
                                  });
                                  const data = await res.json();
                                  if (res.ok && data.url) {
                                    updateMarqueeLogo(idx, "src", data.url);
                                    showToast("Logo uploaded successfully!", true);
                                  } else {
                                    showToast(data.error || "Failed to upload image", false);
                                  }
                                } catch (err) {
                                  showToast("Network error uploading image", false);
                                  console.error(err);
                                }
                              }}
                              style={{ display: "none" }}
                            />
                          </label>
                        </div>
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#64748b", marginBottom: "4px" }}>Company/Client Name</label>
                        <input 
                          type="text" 
                          value={logo.name} 
                          onChange={(e) => updateMarqueeLogo(idx, "name", e.target.value)}
                          placeholder="e.g. Zuxa Beauty & Spa"
                          style={{ width: "100%", padding: "8px 10px", border: "1px solid #cbd5e1", borderRadius: "6px", color: "#0f172a", fontSize: "13px" }}
                        />
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#64748b", marginBottom: "4px" }}>Display Row / Scroll Line</label>
                        <select 
                          value={logo.row || 1} 
                          onChange={(e) => updateMarqueeLogo(idx, "row", parseInt(e.target.value, 10))}
                          style={{ width: "100%", padding: "8px 10px", border: "1px solid #cbd5e1", borderRadius: "6px", color: "#0f172a", fontSize: "13px", background: "#ffffff" }}
                        >
                          <option value={1}>Scroll Line 1 (Right to Left)</option>
                          <option value={2}>Scroll Line 2 (Left to Right)</option>
                        </select>
                      </div>

                      <div style={{ border: "1px solid #e2e8f0", borderRadius: "8px", overflow: "hidden", height: "80px", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {logo.src ? (
                          <img src={logo.src} alt={logo.name || "Logo preview"} style={{ height: "40px", width: "auto", objectFit: "contain" }} />
                        ) : (
                          <span style={{ fontSize: "11px", color: "#94a3b8", fontWeight: "650" }}>No Logo Preview</span>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Add Logo button */}
                  <button 
                    type="button"
                    onClick={handleAddMarqueeLogo}
                    style={{ border: "2px dashed #cbd5e1", borderRadius: "12px", background: "#f8fafc", color: "#475569", fontWeight: "700", cursor: "pointer", fontSize: "14px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "10px", minHeight: "260px" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "#0f75bc";
                      e.currentTarget.style.color = "#0f75bc";
                      e.currentTarget.style.background = "#ffffff";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "#cbd5e1";
                      e.currentTarget.style.color = "#475569";
                      e.currentTarget.style.background = "#f8fafc";
                    }}
                  >
                    <span style={{ fontSize: "24px" }}>➕</span>
                    <span>Add New Logo</span>
                  </button>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "30px" }}>
                  <button 
                    className="admin-btn btn-primary-custom"
                    style={{ padding: "15px 30px", fontSize: "16px" }}
                    onClick={handleSaveMarqueeLogos}
                    disabled={actionLoading}
                  >
                    {actionLoading ? "💾 Saving Changes..." : "💾 Save Changes"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* 3. Sliding Glassmorphic Form Modal */}
      {isModalOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card glassmorphic-modal animate-slide-up">
            <div className="modal-header">
              <h3>
                {modalAction === "edit" ? "✏️ Edit" : "➕ Add New"}{" "}
                {modalType === "service" && "Service Card"}
                {modalType === "job" && "Career Posting"}
                {modalType === "blog" && "News/Blog Article"}
              </h3>
              <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}>
                ✕
              </button>
            </div>

            {error && (
              <div className="modal-error-alert">
                <span>⚠️</span>
                <p>{error}</p>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="modal-form">
              {/* SERVICE FIELDS */}
              {modalType === "service" && (
                <>
                  {modalAction === "add" && (
                    <div className="modal-form-group">
                      <label htmlFor="serv-id">Unique Service ID (Slug)</label>
                      <input
                        id="serv-id"
                        type="text"
                        value={serviceId}
                        onChange={(e) => setServiceId(e.target.value)}
                        placeholder="e.g. cloud-computing"
                        required
                      />
                      <small>Lowercase, letters, numbers, and dashes only. Fixed once created.</small>
                    </div>
                  )}

                  <div className="modal-form-group">
                    <label htmlFor="serv-title">Service Title</label>
                    <input
                      id="serv-title"
                      type="text"
                      value={serviceTitle}
                      onChange={(e) => setServiceTitle(e.target.value)}
                      placeholder="e.g. Cloud Architecture Solutions"
                      required
                    />
                  </div>

                  <div className="modal-form-group">
                    <label htmlFor="serv-icon">Service Icon Vector Class</label>
                    <select
                      id="serv-icon"
                      value={serviceIcon}
                      onChange={(e) => setServiceIcon(e.target.value)}
                    >
                      <option value="globe">🌐 globe (Web Design)</option>
                      <option value="trending-up">📈 trending-up (Marketing)</option>
                      <option value="smartphone">📱 smartphone (Mobile App)</option>
                      <option value="shopping-cart">🛒 shopping-cart (eCommerce)</option>
                      <option value="video">🎥 video (Video Production)</option>
                      <option value="code">💻 code (Software Dev)</option>
                    </select>
                  </div>

                  <div className="modal-form-group">
                    <label htmlFor="serv-desc">Description Summary</label>
                    <textarea
                      id="serv-desc"
                      value={serviceDesc}
                      onChange={(e) => setServiceDesc(e.target.value)}
                      placeholder="Enter a stunning high-converting description card text..."
                      rows="4"
                      required
                    ></textarea>
                  </div>
                </>
              )}

              {/* JOB FIELDS */}
              {modalType === "job" && (
                <>
                  <div className="modal-form-row">
                    <div className="modal-form-group flex-1">
                      <label htmlFor="job-title">Job Title</label>
                      <input
                        id="job-title"
                        type="text"
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                        placeholder="e.g. senior flutter engineer"
                        required
                      />
                    </div>
                    <div className="modal-form-group flex-1">
                      <label htmlFor="job-dept">Department</label>
                      <input
                        id="job-dept"
                        type="text"
                        value={jobDept}
                        onChange={(e) => setJobDept(e.target.value)}
                        placeholder="e.g. Engineering, Marketing"
                        required
                      />
                    </div>
                  </div>

                  <div className="modal-form-row">
                    <div className="modal-form-group flex-1">
                      <label htmlFor="job-loc">Location</label>
                      <input
                        id="job-loc"
                        type="text"
                        value={jobLoc}
                        onChange={(e) => setJobLoc(e.target.value)}
                        placeholder="e.g. Begumpet, Hyderabad (On-site)"
                        required
                      />
                    </div>
                    <div className="modal-form-group flex-1">
                      <label htmlFor="job-exp">Experience Level</label>
                      <input
                        id="job-exp"
                        type="text"
                        value={jobExp}
                        onChange={(e) => setJobExp(e.target.value)}
                        placeholder="e.g. 2-4 Years, Freshers"
                        required
                      />
                    </div>
                  </div>

                  <div className="modal-form-group">
                    <label htmlFor="job-qual">Qualifications Required</label>
                    <input
                      id="job-qual"
                      type="text"
                      value={jobQual}
                      onChange={(e) => setJobQual(e.target.value)}
                      placeholder="e.g. B.Tech, MCA, MBA or equivalent degree"
                      required
                    />
                  </div>

                  <div className="modal-form-group">
                    <label htmlFor="job-type">Employment Type</label>
                    <select
                      id="job-type"
                      value={jobType}
                      onChange={(e) => setJobType(e.target.value)}
                    >
                      <option value="Full-Time">Full-Time (Begumpet HQ)</option>
                      <option value="Part-Time">Part-Time / Intern</option>
                      <option value="Contract">Contract / Remote</option>
                    </select>
                  </div>

                  <div className="modal-form-group">
                    <label htmlFor="job-desc">Job Overview & Description</label>
                    <textarea
                      id="job-desc"
                      value={jobDesc}
                      onChange={(e) => setJobDesc(e.target.value)}
                      placeholder="Describe the candidate's responsibilities and overall role overview..."
                      rows="4"
                      required
                    ></textarea>
                  </div>

                  <div className="modal-form-group">
                    <label htmlFor="job-reqs">Candidate Requirements (One per line)</label>
                    <textarea
                      id="job-reqs"
                      value={jobReqs}
                      onChange={(e) => setJobReqs(e.target.value)}
                      placeholder="e.g. Robust experience with React Native.&#10;Excellent communication skills.&#10;Familiarity with REST APIs."
                      rows="4"
                    ></textarea>
                    <small>Separate each criteria point by pressing Enter.</small>
                  </div>
                </>
              )}

              {/* BLOG FIELDS */}
              {modalType === "blog" && (
                <>
                  <div className="modal-form-group">
                    <label htmlFor="blog-title">Article Title</label>
                    <input
                      id="blog-title"
                      type="text"
                      value={blogTitle}
                      onChange={(e) => setBlogTitle(e.target.value)}
                      placeholder="e.g. How Web Designs Influence E-commerce Revenue"
                      required
                    />
                  </div>

                  <div className="modal-form-row">
                    <div className="modal-form-group flex-1">
                      <label htmlFor="blog-cover">Cover Image URL</label>
                      <input
                        id="blog-cover"
                        type="text"
                        value={blogCoverImage}
                        onChange={(e) => setBlogCoverImage(e.target.value)}
                        placeholder="e.g. /images/hero/digital-marketing.png"
                      />
                    </div>
                    <div className="modal-form-group flex-1">
                      <label htmlFor="blog-cover-file">Upload Cover Image</label>
                      <input
                        id="blog-cover-file"
                        type="file"
                        accept="image/*"
                        onChange={handleCoverImageUpload}
                        className="file-input-custom"
                        style={{
                          padding: "6px",
                          border: "1px dashed rgba(15, 117, 188, 0.3)",
                          borderRadius: "var(--radius-sm)",
                          background: "rgba(15, 117, 188, 0.02)",
                          fontSize: "12px",
                          color: "#334155"
                        }}
                      />
                    </div>
                  </div>

                  <div className="modal-form-group">
                    <label htmlFor="blog-doc-file">Upload Content File (.docx or .pdf)</label>
                    <input
                      id="blog-doc-file"
                      type="file"
                      accept=".docx,.pdf"
                      onChange={handleDocumentUpload}
                      className="file-input-custom"
                      style={{
                        padding: "8px",
                        border: "1px dashed #ea580c",
                        borderRadius: "var(--radius-sm)",
                        background: "rgba(234, 88, 12, 0.02)",
                        fontSize: "12px",
                        color: "#334155"
                      }}
                    />
                    <small style={{ color: "#475569", marginTop: "4px", display: "block", fontSize: "11px" }}>
                      Selecting a document will extract its plain text directly into the article content box below.
                    </small>
                  </div>

                  <div className="modal-form-row">
                    <div className="modal-form-group flex-1">
                      <label htmlFor="blog-cat">Category</label>
                      <input
                        id="blog-cat"
                        type="text"
                        value={blogCategory}
                        onChange={(e) => setBlogCategory(e.target.value)}
                        placeholder="e.g. Technology, Digital Marketing"
                        required
                      />
                    </div>
                    <div className="modal-form-group flex-1">
                      <label htmlFor="blog-author">Author Name</label>
                      <input
                        id="blog-author"
                        type="text"
                        value={blogAuthor}
                        onChange={(e) => setBlogAuthor(e.target.value)}
                        placeholder="e.g. Senior SEO Consultant"
                        required
                      />
                    </div>
                  </div>

                  <div className="modal-form-group">
                    <label htmlFor="blog-sum">Article Summary / Card Snippet</label>
                    <textarea
                      id="blog-sum"
                      value={blogSummary}
                      onChange={(e) => setBlogSummary(e.target.value)}
                      placeholder="A short engaging teaser showing in the card list grid..."
                      rows="2"
                      required
                    ></textarea>
                  </div>

                  <div className="modal-form-group">
                    <label htmlFor="blog-content">Full Article Content (Markdown or HTML support)</label>
                    <textarea
                      id="blog-content"
                      value={blogContent}
                      onChange={(e) => setBlogContent(e.target.value)}
                      placeholder="Write your detailed high-fidelity news or SEO strategies here..."
                      rows="8"
                      required
                    ></textarea>
                  </div>
                </>
              )}

              <div className="modal-actions-buttons">
                <button
                  type="button"
                  className="modal-btn btn-cancel-custom"
                  onClick={() => setIsModalOpen(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`modal-btn btn-save-custom ${actionLoading ? "loading" : ""}`}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <span className="spinner-save"></span>
                  ) : (
                    "💾 Save to Database"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Edit Card Modal */}
      {editingCard && (
        <div className="admin-modal-overlay" style={{ display: "flex", alignItems: "center", justifyContent: "center", position: "fixed", inset: 0, background: "rgba(3,24,37,0.7)", backdropFilter: "blur(8px)", zIndex: 9999, padding: "20px" }}>
          <div className="admin-modal-card glassmorphic-modal animate-slide-up" style={{ maxWidth: "560px", width: "100%", background: "white", borderRadius: "12px", padding: "24px" }}>
            <div className="modal-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700" }}>
                {editingCard.cardIdx === -1 ? "➕ Add New Card" : "✏️ Edit Card"}
              </h3>
              <button onClick={() => setEditingCard(null)} style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: "#64748b" }}>✕</button>
            </div>
            <form onSubmit={handleSaveCard} style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "20px 0" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>Card Title</label>
                <input 
                  type="text" 
                  required 
                  value={editingCard.card.title} 
                  onChange={(e) => setEditingCard({ ...editingCard, card: { ...editingCard.card, title: e.target.value } })}
                  placeholder="e.g. Social Media Marketing" 
                  style={{ width: "100%", padding: "10px 14px", border: "1px solid #cbd5e1", borderRadius: "6px", color: "#0f172a" }} 
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>Image URL</label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input 
                    type="text" 
                    required 
                    value={editingCard.card.image} 
                    onChange={(e) => setEditingCard({ ...editingCard, card: { ...editingCard.card, image: e.target.value } })}
                    placeholder="e.g. https://images.unsplash.com/..." 
                    style={{ flex: 1, padding: "10px 14px", border: "1px solid #cbd5e1", borderRadius: "6px", color: "#0f172a" }} 
                  />
                  <label style={{ padding: "10px 16px", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "6px", cursor: "pointer", fontSize: "13px", fontWeight: "600", color: "#475569", display: "inline-flex", alignItems: "center" }}>
                    📁 Upload
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        if (!file) return;
                        showToast("Uploading image...", true);
                        const formData = new FormData();
                        formData.append("file", file);
                        try {
                          const res = await fetch("/api/upload", {
                            method: "POST",
                            headers: {
                              Authorization: `Bearer ${localStorage.getItem("ananya_admin_token")}`
                            },
                            body: formData
                          });
                          const data = await res.json();
                          if (res.ok && data.url) {
                            setEditingCard({ ...editingCard, card: { ...editingCard.card, image: data.url } });
                            showToast("Image uploaded successfully!", true);
                          } else {
                            showToast(data.error || "Failed to upload image", false);
                          }
                        } catch (err) {
                          showToast("Network error uploading image", false);
                          console.error(err);
                        }
                      }}
                      style={{ display: "none" }}
                    />
                  </label>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>Frontend Route Link</label>
                <input 
                  type="text" 
                  required 
                  value={editingCard.card.link} 
                  onChange={(e) => setEditingCard({ ...editingCard, card: { ...editingCard.card, link: e.target.value } })}
                  placeholder="e.g. /services/digital-marketing/smm" 
                  style={{ width: "100%", padding: "10px 14px", border: "1px solid #cbd5e1", borderRadius: "6px", color: "#0f172a" }} 
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>Visible Points (4 items, one per line)</label>
                <textarea 
                  rows={4} 
                  required
                  value={editingCard.card.features ? editingCard.card.features.join("\n") : ""} 
                  onChange={(e) => setEditingCard({ ...editingCard, card: { ...editingCard.card, features: e.target.value.split("\n") } })}
                  placeholder="Point 1&#10;Point 2&#10;Point 3&#10;Point 4" 
                  style={{ width: "100%", padding: "10px 14px", border: "1px solid #cbd5e1", borderRadius: "6px", fontFamily: "monospace", color: "#0f172a" }} 
                />
              </div>

              <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
                <button type="button" className="admin-btn btn-secondary-custom" style={{ flex: 1 }} onClick={() => setEditingCard(null)}>
                  Cancel
                </button>
                 <button type="submit" className="admin-btn btn-primary-custom" style={{ flex: 1 }}>
                  Save Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Edit Plans Modal */}
      {editingPlansCardTitle && (
        <div className="admin-modal-overlay" style={{ display: "flex", alignItems: "center", justifyContent: "center", position: "fixed", inset: 0, background: "rgba(3,24,37,0.7)", backdropFilter: "blur(8px)", zIndex: 9999, padding: "20px" }}>
          <div className="admin-modal-card glassmorphic-modal animate-slide-up" style={{ maxWidth: "1000px", width: "95%", background: "white", borderRadius: "12px", padding: "24px" }}>
            <div className="modal-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700" }}>
                ⚙️ Manage Plans for: {editingPlansCardTitle}
              </h3>
              <button onClick={() => setEditingPlansCardTitle(null)} style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: "#64748b" }}>✕</button>
            </div>
            <form onSubmit={handleSavePlansTemp} style={{ padding: "10px 0" }}>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "20px",
                maxHeight: "60vh",
                overflowY: "auto",
                paddingRight: "10px",
                marginBottom: "20px",
                paddingTop: "10px"
              }}>
                {tempPlans.map((plan, pIdx) => (
                  <div key={pIdx} style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    padding: "20px",
                    background: plan.isPopular ? "#eff6ff" : "white",
                    borderColor: plan.isPopular ? "#bfdbfe" : "#e2e8f0"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "12px", gap: "10px" }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#64748b", marginBottom: "4px" }}>Plan Name</label>
                        <input 
                          type="text" 
                          required
                          value={plan.name} 
                          onChange={(e) => {
                            const updated = [...tempPlans];
                            updated[pIdx].name = e.target.value;
                            setTempPlans(updated);
                          }}
                          placeholder="e.g. Basic Plan"
                          style={{ width: "100%", padding: "6px 10px", border: "1px solid #cbd5e1", borderRadius: "6px", fontWeight: "700", color: "#1e3a8a", fontSize: "13px" }}
                        />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px" }}>
                        {tempPlans.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const updated = tempPlans.filter((_, idx) => idx !== pIdx);
                              setTempPlans(updated);
                            }}
                            style={{
                              background: "#fef2f2",
                              border: "1px solid #fee2e2",
                              color: "#ef4444",
                              fontSize: "11px",
                              fontWeight: "700",
                              cursor: "pointer",
                              padding: "4px 8px",
                              borderRadius: "4px"
                            }}
                          >
                            ✕ Delete
                          </button>
                        )}
                        <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", cursor: "pointer", fontWeight: "600", color: "#475569" }}>
                          <input 
                            type="checkbox" 
                            checked={plan.isPopular} 
                            onChange={(e) => {
                              const updated = [...tempPlans];
                              updated[pIdx].isPopular = e.target.checked;
                              setTempPlans(updated);
                            }}
                          />
                          Popular
                        </label>
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      <div style={{ display: "flex", gap: "10px" }}>
                        <div style={{ width: "30%" }}>
                          <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#64748b", marginBottom: "4px" }}>Icon</label>
                          <input 
                            type="text" 
                            value={plan.icon || ""} 
                            onChange={(e) => {
                              const updated = [...tempPlans];
                              updated[pIdx].icon = e.target.value;
                              setTempPlans(updated);
                            }}
                            placeholder="🎯"
                            style={{ width: "100%", padding: "8px 10px", border: "1px solid #cbd5e1", borderRadius: "6px", color: "#0f172a" }}
                          />
                        </div>
                        <div style={{ flex: 1 }}>
                          <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#64748b", marginBottom: "4px" }}>Price String</label>
                          <input 
                            type="text" 
                            required
                            value={plan.price} 
                            onChange={(e) => {
                              const updated = [...tempPlans];
                              updated[pIdx].price = e.target.value;
                              setTempPlans(updated);
                            }}
                            placeholder="e.g. ₹16,999"
                            style={{ width: "100%", padding: "8px 10px", border: "1px solid #cbd5e1", borderRadius: "6px", color: "#0f172a" }}
                          />
                        </div>
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#64748b", marginBottom: "4px" }}>Billing Suffix</label>
                        <input 
                          type="text" 
                          required
                          value={plan.billing} 
                          onChange={(e) => {
                            const updated = [...tempPlans];
                            updated[pIdx].billing = e.target.value;
                            setTempPlans(updated);
                          }}
                          placeholder="e.g. + GST/Month"
                          style={{ width: "100%", padding: "8px 10px", border: "1px solid #cbd5e1", borderRadius: "6px", color: "#0f172a" }}
                        />
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#64748b", marginBottom: "4px" }}>Plan Features (one per line)</label>
                        <textarea 
                          rows={6} 
                          required
                          value={plan.features ? plan.features.join("\n") : ""} 
                          onChange={(e) => {
                            const updated = [...tempPlans];
                            updated[pIdx].features = e.target.value.split("\n").map(f => f.trim()).filter(f => f.length > 0);
                            setTempPlans(updated);
                          }}
                          placeholder="Feature 1&#10;Feature 2&#10;Feature 3" 
                          style={{ width: "100%", padding: "8px 10px", border: "1px solid #cbd5e1", borderRadius: "6px", fontFamily: "monospace", fontSize: "11px", color: "#0f172a" }}
                        />
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#64748b", marginBottom: "4px" }}>Note Box Warning Text</label>
                        <input 
                          type="text" 
                          value={plan.note || ""} 
                          onChange={(e) => {
                            const updated = [...tempPlans];
                            updated[pIdx].note = e.target.value;
                            setTempPlans(updated);
                          }}
                          placeholder="e.g. Campaign charge not included."
                          style={{ width: "100%", padding: "8px 10px", border: "1px solid #cbd5e1", borderRadius: "6px", color: "#0f172a" }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", gap: "12px", justifyContent: "space-between", alignItems: "center" }}>
                <button 
                  type="button" 
                  className="admin-btn btn-primary-custom" 
                  style={{ padding: "10px 20px", display: "flex", alignItems: "center", gap: "6px", background: "#10b981", borderColor: "#10b981" }}
                  onClick={() => {
                    const newPlan = { 
                      name: `Plan ${tempPlans.length + 1}`, 
                      icon: "🎯", 
                      price: "₹9,999", 
                      billing: "+ GST/Month", 
                      isPopular: false, 
                      features: ["Setup Ads Campaign"], 
                      note: "" 
                    };
                    setTempPlans([...tempPlans, newPlan]);
                  }}
                >
                  ➕ Add New Plan
                </button>
                <div style={{ display: "flex", gap: "12px" }}>
                  <button type="button" className="admin-btn btn-secondary-custom" style={{ padding: "10px 20px" }} onClick={() => setEditingPlansCardTitle(null)}>
                    Cancel
                  </button>
                   <button type="submit" className="admin-btn btn-primary-custom" style={{ padding: "10px 25px" }}>
                    Save Plans
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
