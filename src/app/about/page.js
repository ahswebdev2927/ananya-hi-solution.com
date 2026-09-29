"use client";

import GlobalFooter from "../components/GlobalFooter";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Header from "../components/Header";

// Portfolio Showcase Constants
const COLUMN_1_IMAGES = Array.from({ length: 12 }, (_, i) => `/portfolio_images/spa_page_${i + 1}.png`);
const COLUMN_2_IMAGES = Array.from({ length: 5 }, (_, i) => `/portfolio_images/mad_academy_page_${i + 1}.png`);
const COLUMN_3_IMAGES = Array.from({ length: 7 }, (_, i) => `/portfolio_images/qpath_page_${i + 1}.png`);
const COLUMN_4_IMAGES = Array.from({ length: 4 }, (_, i) => `/portfolio_images/shanmukha_gold_portfolio_page_${i + 1}.png`);

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
  { src: "/portfolio_images/shanmukha_logo.png", name: "Shanmukha Gold" }
];

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

export default function AboutPage() {
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

  // FAQ State
  const [activeFaq, setActiveFaq] = useState(0);
  const faqs = [
    {
      q: "What is the experience level of Ananya Hi Solutions team?",
      a: "Our team comprises a great group of passionate professionals with extensive experience in their respective fields. This includes Google Ads certified specialists, Facebook Blueprint certified marketers, certified web developers, UX/UI designers, and project managers. Our leadership team brings highly seasoned digital industry experience.",
    },
    {
      q: "How does Ananya Hi Solutions maintain quality standards?",
      a: "We follow industry-best practices and international quality standards including ISO-compliant processes, agile methodology for project management, code review protocols, multi-stage quality assurance testing, and continuous team training. Every project undergoes rigorous quality checks before delivery.",
    },
    {
      q: "What certifications does your team hold?",
      a: "Our team holds multiple industry certifications including Google Ads Certification, Google Analytics Certification, Facebook Blueprint Certification, HubSpot Inbound Marketing Certification, AWS Cloud Practitioner, and various programming and design certifications. We invest continuously in team development to stay current with evolving technologies.",
    },
    {
      q: "How does Ananya Hi Solutions approach client relationships?",
      a: "We believe in building long-term partnerships, not just transactional relationships. Each client receives dedicated account management, transparent communication, regular progress updates, strategic consultation, and post-project support. We measure our success by your business growth and satisfaction.",
    },
    {
      q: "What is Ananya Hi Solutions' company culture and work philosophy?",
      a: "Our culture centers on continuous innovation, collaborative teamwork, client-centric thinking, and results-driven execution. We foster a learning environment where creativity thrives, encourage open communication, embrace challenges as opportunities, and celebrate both team and client successes.",
    },
  ];







  return (
    <div className="flex flex-col min-h-screen">
      {/* 1. Header & Navigation Bar */}
      <Header activePage="about" />

      {/* 2. About Hero Section */}
      <section className="page-hero">
        <div 
          className="page-hero-bg" 
          style={{ 
            backgroundImage: "url('/images/hero/about-stars.png')"
          }}
        />
        <div className="page-hero-overlay"></div>
        <div className="page-hero-content container">
          <h1>About <span>Ananya Hi Solutions</span></h1>
          <p>
            An industry-leading digital agency based in Hyderabad. We deliver high-performance web solutions, scalable mobile apps, and results-driven marketing strategies globally.
          </p>
        </div>
      </section>

      {/* 3. Who We Are Intro Section */}
      <section className="section section-bg-alt">
        <div className="container">
          <div className="about-story-grid">
            <div className="about-story-visual">
              <div 
                className="corporate-animation-canvas"
                title="Click to replay animation"
                onClick={() => {
                  const el = document.getElementById("corpAnimGroup");
                  if (el) {
                    el.style.animation = 'none';
                    el.offsetHeight; /* trigger reflow */
                    el.style.animation = null;
                  }
                  const lines = document.querySelectorAll(".animate-chart-line, .animate-bar");
                  lines.forEach(line => {
                    const origAnim = line.style.animation;
                    line.style.animation = 'none';
                    line.offsetHeight;
                    line.style.animation = null;
                  });
                }}
              >
                {/* SVG canvas representing corporate collaboration */}
                <svg width="100%" height="100%" viewBox="0 0 580 400" xmlns="http://www.w3.org/2000/svg">
                  {/* Subtle background accents and browser illustration grid */}
                  <g className="corporate-grid-bg">
                    <line x1="40" y1="0" x2="40" y2="400" stroke="#f1f5f9" strokeWidth="1" />
                    <line x1="120" y1="0" x2="120" y2="400" stroke="#f1f5f9" strokeWidth="1" />
                    <line x1="200" y1="0" x2="200" y2="400" stroke="#f1f5f9" strokeWidth="1" />
                    <line x1="280" y1="0" x2="280" y2="400" stroke="#f1f5f9" strokeWidth="1" />
                    <line x1="360" y1="0" x2="360" y2="400" stroke="#f1f5f9" strokeWidth="1" />
                    <line x1="440" y1="0" x2="440" y2="400" stroke="#f1f5f9" strokeWidth="1" />
                    
                    <line x1="0" y1="60" x2="580" y2="60" stroke="#f1f5f9" strokeWidth="1" />
                    <line x1="0" y1="140" x2="580" y2="140" stroke="#f1f5f9" strokeWidth="1" />
                    <line x1="0" y1="220" x2="580" y2="220" stroke="#f1f5f9" strokeWidth="1" />
                    <line x1="0" y1="300" x2="580" y2="300" stroke="#f1f5f9" strokeWidth="1" />
                  </g>

                  {/* Wrapper group rising from the bottom */}
                  <g id="corpAnimGroup" className="animate-office-rise">
                    
                    {/* Background elements */}
                    <rect x="20" y="20" width="60" height="8" rx="4" fill="#a81a2f" />
                    <rect x="500" y="340" width="60" height="8" rx="4" fill="#a81a2f" />
                    <rect x="10" y="180" width="25" height="50" rx="3" fill="#a81a2f" />
                    <rect x="545" y="140" width="25" height="90" rx="6" fill="#a81a2f" />

                    {/* Browser Window outline in background */}
                    <rect x="40" y="50" width="500" height="345" rx="12" fill="none" stroke="#a81a2f" strokeWidth="2" strokeOpacity="0.25" />
                    <line x1="40" y1="80" x2="540" y2="80" stroke="#a81a2f" strokeWidth="2" strokeOpacity="0.25" />
                    <circle cx="60" cy="65" r="4" fill="#a81a2f" fillOpacity="0.25" />
                    <circle cx="75" cy="65" r="4" fill="#a81a2f" fillOpacity="0.25" />
                    <circle cx="90" cy="65" r="4" fill="#a81a2f" fillOpacity="0.25" />

                    {/* Red Speech Bubble in background */}
                    <path d="M 310,100 H 360 Q 370,100 370,110 V 120 Q 370,130 360,130 H 340 L 330,140 V 130 H 310 Q 300,130 300,120 V 110 Q 300,100 310,100 Z" fill="#ffd1cb" fillOpacity="0.15" stroke="#a81a2f" strokeWidth="2" strokeOpacity="0.3" />

                    {/* Ground line */}
                    <line x1="0" y1="395" x2="580" y2="395" stroke="#1e1e24" strokeWidth="6" strokeLinecap="round" />

                    {/* Character 1: Left Man (Waving hand) */}
                    <g className="character-left">
                      {/* Pants */}
                      <path d="M 95,395 L 115,310 H 145 L 165,395 H 142 L 130,345 L 118,345 L 108,395 Z" fill="#1e1e24" />
                      {/* Crimson shirt */}
                      <path d="M 85,310 C 85,255 100,240 130,240 C 160,240 175,255 175,310 Z" fill="#a81a2f" />
                      {/* Left Arm (Viewer's left) - down */}
                      <path d="M 95,245 C 85,252 75,265 72,280 L 88,285 L 102,252 Z" fill="#a81a2f" />
                      <path d="M 80,282 L 68,320" stroke="#ffd1cb" strokeWidth="12" strokeLinecap="round" />
                      <circle cx="68" cy="320" r="7" fill="#ffd1cb" />
                      
                      {/* Neck */}
                      <rect x="122" y="222" width="16" height="20" rx="3" fill="#ffd1cb" />
                      <path d="M 115,240 L 130,252 L 145,240" fill="none" stroke="#1e1e24" strokeWidth="2" strokeLinecap="round" />
                      {/* Face */}
                      <path d="M 110,180 C 110,165 150,165 150,180 C 150,210 150,230 130,230 C 110,230 110,210 110,180 Z" fill="#ffd1cb" />
                      {/* Face details */}
                      <circle cx="122" cy="190" r="2.5" fill="#1e1e24" />
                      <circle cx="138" cy="190" r="2.5" fill="#1e1e24" />
                      <path d="M 125,204 Q 130,210 135,204" fill="none" stroke="#1e1e24" strokeWidth="2" strokeLinecap="round" />
                      <circle cx="117" cy="198" r="4" fill="#ffa8a8" fillOpacity="0.5" />
                      <circle cx="143" cy="198" r="4" fill="#ffa8a8" fillOpacity="0.5" />
                      {/* Hair (Black, parted side-hair) */}
                      <path d="M 108,180 C 105,152 120,140 138,140 C 152,140 154,152 152,172 C 145,164 135,160 125,165 C 115,170 110,175 108,180 Z" fill="#1e1e24" />
                      <path d="M 108,180 H 112 V 190 H 108 Z" fill="#1e1e24" />
                      <path d="M 148,180 H 152 V 190 H 148 Z" fill="#1e1e24" />

                      {/* Right Arm (Viewer's right) - Waving (Animated) */}
                      <g className="waving-arm-group" style={{ transformOrigin: "165px 245px" }}>
                        <path d="M 160,245 C 170,250 180,260 185,275 L 198,265 L 172,240 Z" fill="#a81a2f" />
                        <path d="M 180,265 L 205,210" stroke="#ffd1cb" strokeWidth="11" strokeLinecap="round" />
                        <path d="M 205,210 C 200,200 205,185 212,180 C 218,176 225,185 222,192 C 226,183 232,185 230,192 C 234,185 238,188 236,197 C 238,192 242,194 240,203 C 238,212 222,225 212,220 Z" fill="#ffd1cb" />
                      </g>
                    </g>

                    {/* Character 2: Center Woman (Typing on laptop) */}
                    <g className="character-center">
                      {/* Crimson shirt / Torso */}
                      <path d="M 230,395 C 230,330 250,300 280,300 C 310,300 330,330 330,395 Z" fill="#a81a2f" />
                      {/* Neck */}
                      <rect x="272" y="278" width="16" height="24" rx="2" fill="#ffd1cb" />
                      {/* Face */}
                      <path d="M 260,240 C 260,225 300,225 300,240 C 300,265 300,282 280,282 C 260,282 260,265 260,240 Z" fill="#ffd1cb" />
                      {/* Glasses */}
                      <circle cx="272" cy="245" r="8" fill="none" stroke="#1e1e24" strokeWidth="2" />
                      <circle cx="288" cy="245" r="8" fill="none" stroke="#1e1e24" strokeWidth="2" />
                      <line x1="277" y1="245" x2="283" y2="245" stroke="#1e1e24" strokeWidth="2" />
                      <line x1="264" y1="245" x2="260" y2="245" stroke="#1e1e24" strokeWidth="2" />
                      <line x1="296" y1="245" x2="300" y2="245" stroke="#1e1e24" strokeWidth="2" />
                      {/* Eyes */}
                      <circle cx="272" cy="245" r="2" fill="#1e1e24" />
                      <circle cx="288" cy="245" r="2" fill="#1e1e24" />
                      <path d="M 276,260 Q 280,265 284,260" fill="none" stroke="#1e1e24" strokeWidth="1.5" strokeLinecap="round" />
                      <circle cx="266" cy="254" r="3.5" fill="#ffa8a8" fillOpacity="0.5" />
                      <circle cx="294" cy="254" r="3.5" fill="#ffa8a8" fillOpacity="0.5" />
                      {/* Hair (Black, top bun) */}
                      <path d="M 258,240 C 258,215 270,205 280,205 C 290,205 302,215 302,240 C 300,230 290,225 280,225 C 270,225 260,230 258,240 Z" fill="#1e1e24" />
                      <circle cx="280" cy="192" r="16" fill="#1e1e24" />

                      {/* White Laptop */}
                      <g className="laptop-group">
                        <rect x="240" y="325" width="80" height="50" rx="3" fill="#ffffff" stroke="#1e1e24" strokeWidth="2" />
                        <line x1="250" y1="335" x2="290" y2="335" stroke="#a81a2f" strokeWidth="2" />
                        <line x1="250" y1="345" x2="300" y2="345" stroke="#1e1e24" strokeWidth="2" />
                        <line x1="250" y1="355" x2="275" y2="355" stroke="#a81a2f" strokeWidth="2" />
                        <path d="M 230,375 L 330,375 L 340,385 L 220,385 Z" fill="#ffffff" stroke="#1e1e24" strokeWidth="2" strokeLinejoin="round" />
                      </g>

                      {/* Hands typing */}
                      <g className="typing-hand-left">
                        <path d="M 245,370 Q 255,362 265,372" stroke="#ffd1cb" strokeWidth="7" strokeLinecap="round" fill="none" />
                      </g>
                      <g className="typing-hand-right">
                        <path d="M 315,370 Q 305,362 295,372" stroke="#ffd1cb" strokeWidth="7" strokeLinecap="round" fill="none" />
                      </g>
                    </g>

                    {/* Character 3: Right Woman (Holding smartphone) */}
                    <g className="character-right">
                      {/* Skirt/Pants (Charcoal) */}
                      <path d="M 395,395 L 400,330 H 460 L 465,395 Z" fill="#1e1e24" />
                      {/* Blouse (White) */}
                      <path d="M 400,330 C 400,285 410,275 430,275 C 450,275 460,285 460,330 Z" fill="#ffffff" />
                      {/* Belt */}
                      <rect x="400" y="327" width="60" height="4" fill="#a81a2f" />
                      
                      {/* Left Arm (Viewer's left) - holding phone */}
                      <path d="M 405,280 C 395,290 390,305 388,315 L 402,318 Z" fill="#ffffff" />
                      <path d="M 394,312 L 375,325" stroke="#ffd1cb" strokeWidth="10" strokeLinecap="round" />
                      <circle cx="375" cy="325" r="5" fill="#ffd1cb" />
                      
                      {/* Smartphone */}
                      <g className="phone-group animate-phone-float">
                        <rect x="362" y="295" width="18" height="30" rx="3" fill="#1e1e24" transform="rotate(-10 371 310)" />
                        <rect x="364" y="297" width="14" height="26" rx="1.5" fill="#ffffff" transform="rotate(-10 371 310)" />
                        <line x1="368" y1="305" x2="374" y2="304" stroke="#a81a2f" strokeWidth="1.5" transform="rotate(-10 371 310)" />
                      </g>

                      {/* Right Arm (Viewer's right) - rested */}
                      <path d="M 455,280 C 465,290 470,300 472,315 L 458,318 Z" fill="#ffffff" />
                      <path d="M 464,310 Q 455,325 448,320" stroke="#ffd1cb" strokeWidth="8" strokeLinecap="round" fill="none" />

                      {/* Neck */}
                      <rect x="422" y="254" width="16" height="24" rx="2" fill="#ffd1cb" />
                      {/* Face */}
                      <path d="M 410,215 C 410,200 450,200 450,215 C 450,240 450,256 430,256 C 410,256 410,240 410,215 Z" fill="#ffd1cb" />
                      {/* Face details */}
                      <circle cx="422" cy="220" r="2.5" fill="#1e1e24" />
                      <circle cx="438" cy="220" r="2.5" fill="#1e1e24" />
                      <path d="M 426,232 Q 430,237 434,232" fill="none" stroke="#1e1e24" strokeWidth="1.5" strokeLinecap="round" />
                      <circle cx="418" cy="226" r="3.5" fill="#ffa8a8" fillOpacity="0.5" />
                      <circle cx="442" cy="226" r="3.5" fill="#ffa8a8" fillOpacity="0.5" />
                      {/* Hair (Black, low bun) */}
                      <path d="M 408,215 C 408,195 420,185 430,185 C 440,185 452,195 452,215 C 450,205 440,200 430,200 C 420,200 410,205 408,215 Z" fill="#1e1e24" />
                      <circle cx="454" cy="222" r="14" fill="#1e1e24" />
                    </g>
                  </g>
                </svg>
              </div>
            </div>

            <div className="about-story-text">
              <h3>Who We Are</h3>
              <p>
                Ananya Hi Solutions is one of Hyderabad's most trusted digital transformation partners. Our journey began with a simple vision: to help businesses harness the power of digital technology to achieve extraordinary growth. Today, we're proud to have a great team of passionate professionals, including certified digital marketers, experienced web designers, skilled developers, creative content specialists, and strategic consultants. Each team member brings specialized expertise and unwavering commitment to client success. Our core values drive everything we do: Innovation in every solution, Transparency in all communications, Excellence in execution, and Partnership in relationships. We don't just work for our clients; we work with them as strategic partners invested in their success.
              </p>
              <p>
                We have successfully delivered numerous projects, helping businesses across India and internationally to establish a powerful digital presence, generate quality leads, and scale their operations. Our high client retention rate speaks to the lasting relationships we build, the great team synergy we maintain, and the consistent value we deliver to our partners.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Mission, Vision, and Values Section */}
      <section className="section section-bg-alt">
        <div className="container">
          <div className="section-header">
            <h2>Our Core Pillars</h2>
            <p>Driving excellence, integrity, and sustainable growth for businesses across all digital landscape.</p>
          </div>

          <div className="about-mission-grid">
            {/* Card 1: Mission */}
            <div className="about-mission-card-wrapper">
              <div className="about-mission-card-inner">
                {/* Front Face */}
                <div className="about-mission-card-front">
                  <div className="about-card-icon">🎯</div>
                  <h3>Our Mission</h3>
                </div>
                {/* Back Face */}
                <div className="about-mission-card-back">
                  <h3>Our Mission</h3>
                  <p>
                    To empower brands with state-of-the-art web designs, high-performance applications, and result-oriented digital marketing strategies that guarantee growth.
                  </p>
                </div>
              </div>
            </div>

            {/* Card 2: Vision */}
            <div className="about-mission-card-wrapper">
              <div className="about-mission-card-inner">
                {/* Front Face */}
                <div className="about-mission-card-front">
                  <div className="about-card-icon">👁️</div>
                  <h3>Our Vision</h3>
                </div>
                {/* Back Face */}
                <div className="about-mission-card-back">
                  <h3>Our Vision</h3>
                  <p>
                    To be a trusted global partner recognized for client-first integrations, top-tier user experiences, scalable engineering frameworks, and transparency.
                  </p>
                </div>
              </div>
            </div>

            {/* Card 3: Values */}
            <div className="about-mission-card-wrapper">
              <div className="about-mission-card-inner">
                {/* Front Face */}
                <div className="about-mission-card-front">
                  <div className="about-card-icon">💡</div>
                  <h3>Our Values</h3>
                </div>
                {/* Back Face */}
                <div className="about-mission-card-back">
                  <h3>Our Values</h3>
                  <p>
                    Striving for excellence, maintaining absolute integrity and open communication, and continuously innovating our technological stack.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4.5. Why Choose Ananya Hi Solutions Section */}
      <section className="section bg-white border-t border-slate-100">
        <div className="container">
          <div className="section-header">
            <h2>Why Choose Ananya Hi Solutions?</h2>
            <p>
              No Salesman, Just You & Your Professional Web Expert Agency.
            </p>
          </div>

          <div className="choose-grid">
            <div className="choose-card">
              <div className="choose-icon-wrapper">📈</div>
              <h3>ROI Focused</h3>
              <p>We deliver measurable growth with strategies built for results.</p>
            </div>

            <div className="choose-card">
              <div className="choose-icon-wrapper">🎧</div>
              <h3>Expert Support</h3>
              <p>Round-the-clock assistance to ensure your business never stops.</p>
            </div>

            <div className="choose-card">
              <div className="choose-icon-wrapper">👨‍💻</div>
              <h3>Expert Team</h3>
              <p>Our skilled professionals bring innovation & expertise to every project.</p>
            </div>

            <div className="choose-card">
              <div className="choose-icon-wrapper">🏆</div>
              <h3>Proven Results</h3>
              <p>Trusted by clients with successful projects & long-term partnerships.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Frequently Asked Questions (FAQ) */}
      <section id="faq" className="section section-bg-alt">
        <div className="container">
          <div className="section-header">
            <h2>Frequently Asked Questions</h2>
            <p>Get answers to common queries about our team, standards, and work philosophy.</p>
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

      {/* 6. Footer */}
      <GlobalFooter />


    </div>
  );
}
