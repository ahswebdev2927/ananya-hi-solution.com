import { NextResponse } from "next/server";
import { readDb, writeDb, verifyToken } from "../db-helper";
import { PACKAGE_PLANS_DATA } from "../../../data/plans";

// Default Package Categories from packages/page.js to initialize db if empty
const DEFAULT_PACKAGE_CATEGORIES = [
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

export async function GET() {
  const db = await readDb();
  let updated = false;

  // Initialize packages categories if missing
  if (!db.packages) {
    db.packages = DEFAULT_PACKAGE_CATEGORIES;
    updated = true;
  }

  // Initialize plans if missing
  if (!db.plans) {
    db.plans = PACKAGE_PLANS_DATA;
    updated = true;
  }

  if (updated) {
    await writeDb(db);
  }

  return NextResponse.json({
    packages: db.packages,
    plans: db.plans
  });
}

export async function POST(request) {
  if (!verifyToken(request)) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { packages, plans } = body;

    if (!packages || !plans) {
      return NextResponse.json({ error: "Missing required packages or plans data" }, { status: 400 });
    }

    const db = await readDb();
    db.packages = packages;
    db.plans = plans;

    const success = await writeDb(db);
    if (!success) throw new Error("Failed to write updated packages to database");

    return NextResponse.json({ success: true, packages, plans });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Failed to save packages" }, { status: 500 });
  }
}
