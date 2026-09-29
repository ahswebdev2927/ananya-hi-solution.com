"use client";

import React, { useState, useEffect, useRef, use } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import Header from "../../components/Header";
import GlobalFooter from "../../components/GlobalFooter";
// Crisp Inline SVG Logo Component for Footer
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



// Render dynamic paragraph with hyperlink for first paragraph (Format matching Image 3 Link)
function renderParagraph(text, index, serviceId) {
  if (index !== 0) return <p key={index}>{text}</p>;
  
  let htmlContent = text;
  switch (serviceId) {
    case "web-design":
      htmlContent = text.replace("website", `<a href="/services/web-design" style="color: var(--primary-blue); text-decoration: underline; font-weight: 600;">website</a>`);
      break;
    case "digital-marketing":
      htmlContent = text.replace("digital marketing", `<a href="/services/digital-marketing" style="color: var(--primary-blue); text-decoration: underline; font-weight: 600;">digital marketing</a>`);
      break;
    case "mobile-app":
      htmlContent = text.replace("mobile applications", `<a href="/services/mobile-app" style="color: var(--primary-blue); text-decoration: underline; font-weight: 600;">mobile applications</a>`);
      break;
    case "ecommerce-app":
      htmlContent = text.replace("eCommerce", `<a href="/services/ecommerce-app" style="color: var(--primary-blue); text-decoration: underline; font-weight: 600;">eCommerce</a>`);
      break;
    case "video-production":
      htmlContent = text.replace("video production", `<a href="/services/video-production" style="color: var(--primary-blue); text-decoration: underline; font-weight: 600;">video production</a>`);
      break;
    case "software-development":
      htmlContent = text.replace("software", `<a href="/services/software-development" style="color: var(--primary-blue); text-decoration: underline; font-weight: 600;">software</a>`);
      break;
    case "aeo":
      htmlContent = text.replace("Answer Engine Optimization", `<a href="/services/aeo" style="color: var(--primary-blue); text-decoration: underline; font-weight: 600;">Answer Engine Optimization</a>`);
      break;
    case "geo":
      htmlContent = text.replace("Google Engine Optimization", `<a href="/services/geo" style="color: var(--primary-blue); text-decoration: underline; font-weight: 600;">Google Engine Optimization</a>`);
      break;
    case "aio":
      htmlContent = text.replace("Artificial Intelligence Optimization", `<a href="/services/aio" style="color: var(--primary-blue); text-decoration: underline; font-weight: 600;">Artificial Intelligence Optimization</a>`);
      break;
    case "sxo":
      htmlContent = text.replace("Search Experience Optimization", `<a href="/services/sxo" style="color: var(--primary-blue); text-decoration: underline; font-weight: 600;">Search Experience Optimization</a>`);
      break;
    case "youtube-seo":
      htmlContent = text.replace("YouTube SEO", `<a href="/services/youtube-seo" style="color: var(--primary-blue); text-decoration: underline; font-weight: 600;">YouTube SEO</a>`);
      break;
    case "youtube-ads":
      htmlContent = text.replace("YouTube Ads", `<a href="/services/youtube-ads" style="color: var(--primary-blue); text-decoration: underline; font-weight: 600;">YouTube Ads</a>`);
      break;
    default:
      break;
  }
  
  return <p key={index} dangerouslySetInnerHTML={{ __html: htmlContent }} />;
}

// Rich services configuration matching exact specifications and Unsplash stock visual backgrounds
const SERVICES_DETAIL_DATA = {
  "web-design": {
    title: "Website Design",
    bannerTitle: "Website Design Company in Hyderabad",
    bannerDesc: "Ananya Hi Solutions is your trusted partner for affordable, SEO-friendly & mobile-optimized website design in Hyderabad. We create websites that not only look stunning but also bring you more traffic, leads & sales.",
    bannerBadge: "✓ 100+ Websites Delivered in Hyderabad | ⭐️ Rated 5/5 by Local Businesses",
    heroVisual: "/images/hero/web-design.jpg",
    subtypesTitle: "Website Development Agency in Hyderabad for Startups & Brands",
    subtypesDesc: "Get SEO-friendly static, dynamic, and e-commerce websites that drive traffic, leads & sales. Trusted by startups & brands in Hyderabad.",
    row1Image: "/images/web-design-overview.png",
    row2Image: "/images/web-design-capabilities.png",
    types: [
      { 
        id: "static", 
        title: "Static Website Design", 
        bgImage: "/images/static_website_mockup.jpg",
        desc: "Perfect for startups & small businesses. Fast loading, fully responsive, and SEO-friendly landing pages." 
      },
      { 
        id: "dynamic", 
        title: "Dynamic Website", 
        bgImage: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80",
        desc: "Custom content management systems (CMS), corporate portals, and interactive, database-driven sites." 
      },
      { 
        id: "ecommerce", 
        title: "E-Commerce Website", 
        bgImage: "https://images.unsplash.com/photo-1557821552-17105176677c?auto=format&fit=crop&w=800&q=80",
        desc: "Full-scale online stores featuring advanced shopping pipelines, secure payments, and inventory dashboards." 
      }
    ],
    overviewTitle: "Professional Website Design and Development Services in Hyderabad",
    paragraphs: [
      "In today's digital-first world, your website is often the first impression potential customers have of your business. At Ananya Hi Solutions, we create stunning, high-performance websites that not only look exceptional but drive real business results.",
      "Our website design and development services combine aesthetic excellence with technical sophistication. Every website we build is fully responsive (mobile, tablet, desktop), optimized for search engines, designed for fast loading speeds, and focused on user experience and conversion optimization.",
      "We specialize in diverse web solutions including corporate websites, e-commerce platforms, portfolio sites, landing pages, web applications, CMS-based sites (WordPress, Shopify), and custom PHP/React development. Whether you need a simple brochure site or a complex web application, we have the expertise to deliver."
    ],
    faqs: [
      { q: "What technologies does Ananya Hi Solutions use for website development?", a: "We leverage modern technology stacks including React, Next.js, HTML5/CSS3, Node.js, and popular content management systems (WordPress, Shopify, custom headless CMS) to build secure, robust, and lightning-fast websites tailored to your business." },
      { q: "How much does website design and development cost at Ananya Hi Solutions?", a: "The cost depends on the scope, features, and complexity of the project. We offer customized packages ranging from basic static websites for startups to advanced e-commerce platforms and custom web applications. Contact us for a free detailed quote." },
      { q: "What is included in your website design package?", a: "Our standard packages include custom UI/UX design, fully responsive layout, basic SEO optimization, contact form integration, social media linkage, and post-launch technical support." },
      { q: "How do you ensure websites are mobile-friendly and responsive?", a: "We follow a mobile-first design philosophy. Every website is built using fluid layouts and tested across multiple physical devices and screen sizes to ensure a flawless user experience on mobile, tablet, and desktop." },
      { q: "What ongoing support do you provide after website launch?", a: "We provide comprehensive post-launch support, including regular software updates, security monitoring, database backups, content updates, and troubleshooting to keep your website running smoothly 24/7." }
    ]
  },
  "digital-marketing": {
    title: "Digital Marketing",
    bannerTitle: "Digital Marketing Agency in Hyderabad",
    bannerDesc: "Ananya Hi Solutions is a top-rated digital marketing company in Hyderabad. We build data-driven organic search campaigns, paid ad pipelines, and viral social campaigns designed to multiply your sales and ROI.",
    bannerBadge: "✓ 50+ Growth Campaigns Managed | ⭐️ Rated 4.9/5 by Brand Managers",
    heroVisual: "/images/hero/digital-marketing.jpg",
    subtypesTitle: "Digital Marketing Services in Hyderabad for Startups & Brands",
    subtypesDesc: "Drive high-intent traffic, build active communities, and generate consistent leads with targeted digital campaigns.",
    row1Image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80",
    row2Image: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=800&q=80",
    types: [
      { 
        id: "seo", 
        title: "SEO", 
        bgImage: "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?auto=format&fit=crop&w=800&q=80",
        desc: "Rank at the top of organic search engine results for high-intent buyer keywords to drive consistent leads." 
      },
      { 
        id: "smm", 
        title: "Social Media Marketing", 
        bgImage: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=800&q=80",
        desc: "Cultivate high-engagement follower bases across Instagram, LinkedIn, Facebook, and Twitter." 
      },
      { 
        id: "google-ads", 
        title: "Google Ads/PPC Ads", 
        bgImage: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80",
        desc: "Target immediate prospective buyers with high-converting search, shopping, and display ad setups." 
      },
      { 
        id: "content-marketing", 
        title: "Content Marketing", 
        bgImage: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=800&q=80",
        desc: "Position your brand as an industry authority with search-optimized copy, blogs, and creative infographics." 
      }
    ],
    overviewTitle: "Professional Digital Marketing Services in Hyderabad",
    paragraphs: [
      "Online visibility is the single most critical factor for modern business growth. At Ananya Hi Solutions, we implement comprehensive digital marketing campaigns designed to position your brand at the forefront of your industry.",
      "We combine technical search audits, high-intent keyword strategies, creative social copywriting, and conversion-optimized ad placements to deliver predictable customer acquisitions.",
      "Whether you are looking to boost your local foot traffic in Hyderabad, rank organically globally, or launch paid funnels on Meta and Google, our certified marketing team executes campaigns with transparent monthly reporting."
    ],
    faqs: [
      { q: "How long does it take to see results from SEO campaigns?", a: "SEO is a medium-to-long-term strategy. While initial technical fixes improve search crawls quickly, significant ranking shifts and organic traffic growth typically take 3 to 6 months of consistent optimization." },
      { q: "What budget do I need for Google and Meta PPC campaigns?", a: "We design campaigns tailored to your specific budget. You can start with a modest daily ad spend and scale up once we optimize the campaign for positive return-on-ad-spend (ROAS)." },
      { q: "Do you provide monthly reports and conversion tracking?", a: "Yes. We configure full-funnel tracking using Google Analytics 4 and provide comprehensive monthly reports outlining clicks, impressions, costs, and generated leads." },
      { q: "How do you select keywords for our industry?", a: "We analyze competitor keyword rankings, search volume trends, buyer search intent, and historical data to select the most profitable target phrases for your campaign." },
      { q: "What social media platforms should my business focus on?", a: "This depends on your target demographic. B2B brands typically see the highest returns on LinkedIn and Twitter, while retail or lifestyle brands excel on Instagram, Facebook, and YouTube." }
    ]
  },
  "mobile-app": {
    title: "Mobile Application",
    bannerTitle: "Mobile App Development Company in Hyderabad",
    bannerDesc: "Ananya Hi Solutions engineers elite mobile applications for iOS and Android platforms. We design fluid, high-performance apps that drive user engagement and scale your services.",
    bannerBadge: "✓ 30+ Custom Apps Launched | ⭐️ Rated 5/5 by Product Owners",
    heroVisual: "/images/hero/mobile-app.jpg",
    subtypesTitle: "Mobile App Development Services in Hyderabad",
    subtypesDesc: "Deploy high-performance Swift, Kotlin, or cross-platform mobile applications tailored to your business specifications.",
    row1Image: "https://images.unsplash.com/photo-1522542550221-31fd19575a2d?auto=format&fit=crop&w=800&q=80",
    row2Image: "https://images.unsplash.com/photo-1531498860502-7c67cf02f657?auto=format&fit=crop&w=800&q=80",
    types: [
      { 
        id: "app-dev", 
        title: "App Development", 
        bgImage: "/images/subservices/ios_app_detail.jpg",
        desc: "We engineer fluid, native, and cross-platform mobile apps for iOS and Android using Swift, Kotlin, Flutter, or React Native." 
      }
    ],
    overviewTitle: "Professional Mobile App Development in Hyderabad",
    paragraphs: [
      "Mobile apps have become the primary touchpoint for customer interaction. We craft responsive, secure, and feature-rich applications that keep your brand inside your customers' pockets.",
      "Our engineering process covers full-cycle design: initial UI wireframing, fluid frontend coding, robust API integrations, real-time database management, and store deployment.",
      "We build native apps using Kotlin and Swift to extract maximum hardware performance, as well as cross-platform frameworks (Flutter/React Native) for faster market delivery."
    ],
    faqs: [
      { q: "What is the difference between native and cross-platform apps?", a: "Native apps are built specifically for one operating system (Swift for iOS, Kotlin for Android), offering maximum performance. Cross-platform apps use a single codebase (like Flutter) to run on both platforms, saving development time and costs." },
      { q: "How long does it take to develop a custom mobile application?", a: "A standard mobile app takes 8 to 12 weeks to design, develop, test, and publish. More complex enterprise applications with real-time syncs or custom APIs may take longer." },
      { q: "Do you handle App Store and Google Play Store submissions?", a: "Yes. We manage the entire deployment process, ensuring your application complies with Apple and Google design guidelines and security policies." },
      { q: "Can your mobile apps work offline?", a: "Yes. We can integrate local offline databases (like SQLite or CoreData) so users can access core features without an active internet connection, syncing data once reconnected." },
      { q: "How do you secure user data in your mobile apps?", a: "We implement advanced encryption protocols, secure token-based authentication (JWT), and encrypted SSL communication to protect all user transactions and personal information." }
    ]
  },
  "ecommerce-app": {
    title: "Ecommerce Application",
    bannerTitle: "Ecommerce Development Company in Hyderabad",
    bannerDesc: "Scale your retail sales with high-converting eCommerce stores. Ananya Hi Solutions builds blazing-fast multi-vendor marketplaces and single-brand storefronts.",
    bannerBadge: "✓ 40+ E-Commerce Platforms Built | ⭐️ Rated 5/5 by Online Retailers",
    heroVisual: "/images/hero/ecommerce-app.jpg",
    subtypesTitle: "eCommerce Store Development in Hyderabad",
    subtypesDesc: "Deploy highly secure, scalable, and fast shopping pipelines with inventory systems and payment integrations.",
    row1Image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80",
    row2Image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=800&q=80",
    types: [
      { 
        id: "single-vendor", 
        title: "Single Vendor Store", 
        bgImage: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80",
        desc: "Custom standalone digital storefronts for singular brands looking to scale online retail sales." 
      },
      { 
        id: "multi-vendor", 
        title: "Multi Vendor Marketplace", 
        bgImage: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=800&q=80",
        desc: "Amazon-style split-fee marketplace platforms where multiple independent merchants list products." 
      }
    ],
    overviewTitle: "Professional E-Commerce Development Services in Hyderabad",
    paragraphs: [
      "An online store needs to be fast, secure, and simple to navigate. We engineer conversion-focused eCommerce systems equipped with advanced filter searches, rapid checkout workflows, and dynamic stock tracking.",
      "We build single-brand stores to highlight your brand's unique identity, as well as complex multi-vendor marketplaces allowing sellers to register, set up storefronts, and manage inventory easily.",
      "Every system is integrated with robust payment gateways (Razorpay, Stripe, Paytm), courier tracking APIs, automated invoice generators, and comprehensive admin dashboard panels."
    ],
    faqs: [
      { q: "What e-commerce platforms do you specialize in?", a: "We develop custom e-commerce applications using Next.js and Node.js for high-performance needs, as well as platforms like Shopify, WooCommerce, and Magento for rapid deployments." },
      { q: "Is there a limit to the number of products my online store can hold?", a: "No. Our database architectures are designed to support unlimited products, categories, and attributes without impacting loading speeds." },
      { q: "How do we manage shipping and courier tracking?", a: "We integrate logistics APIs (like Shiprocket, Delhivery, or FedEx) to automatically calculate shipping costs, print labels, and send live tracking codes to customers." },
      { q: "Can I accept international credit cards and payments?", a: "Yes. We configure multi-currency support and link international payment gateways like Stripe or PayPal to accept payments worldwide." },
      { q: "How do you optimize checkout to reduce cart abandonment?", a: "We design clean, single-page checkouts with auto-fill fields, multiple payment options (UPI, Cards, NetBanking, COD), and automated cart abandonment email reminders." }
    ]
  },
  "video-production": {
    title: "Video Production",
    bannerTitle: "Video Production Company in Hyderabad",
    bannerDesc: "Ananya Hi Solutions delivers premium cinematic video production. We script, film, and edit corporate profiles, social media loops, and product explainers that captivate audiences.",
    bannerBadge: "✓ 200+ Videos Produced | ⭐️ Rated 4.9/5 by Corporate Clients",
    heroVisual: "/images/hero/video-production.jpg",
    subtypesTitle: "Professional Video Production Services in Hyderabad",
    subtypesDesc: "High-definition corporate profiles, marketing promotions, explainers, event highlights, and social loops.",
    row1Image: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=800&q=80",
    row2Image: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=800&q=80",
    types: [
      { 
        id: "corporate", 
        title: "Corporate Video Production", 
        bgImage: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=800&q=80",
        desc: "Cinematic company profiles, executive interviews, culture reels, and professional walkthroughs." 
      },
      { 
        id: "promo", 
        title: "Promotional Marketing Videos", 
        bgImage: "/images/subservices/promo-video.jpg",
        desc: "Hook-oriented visual ad creatives and product campaigns designed to maximize CTR and conversions." 
      },
      { 
        id: "event", 
        title: "Event Coverage & Highlights", 
        bgImage: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80",
        desc: "Multi-camera setups, stage lighting captures, aerial drone recordings, and rapid highlight cuts." 
      },
      { 
        id: "explainer", 
        title: "Product Explainer Videos", 
        bgImage: "/images/subservices/explainer-video.jpg",
        desc: "Custom 2D/3D explainers outlining custom workflows, features, and complex software platforms." 
      },
      { 
        id: "social", 
        title: "Social Media Content", 
        bgImage: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80",
        desc: "Engaging vertical reels, interactive TikTok styles, and dynamic loops engineered for algorithm reach." 
      },
      { 
        id: "music-video", 
        title: "Music Video Production", 
        bgImage: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=800&q=80",
        desc: "Cinematic directions, screenplays, multi-point color grading, and dynamic post-production synchronization." 
      },
      { 
        id: "short-films", 
        title: "Short Films & Web Series Production", 
        bgImage: "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=800&q=80",
        desc: "Script-to-screen drama, screenplays, professional color mastering, casting, and sound design." 
      },
      { 
        id: "professional-dslr", 
        title: "Professional DSLR", 
        bgImage: "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=800&q=80",
        desc: "High-resolution DSLR multi-camera video shoots for premium branding, interviews, and advertisements." 
      },
      { 
        id: "iphone-shoot", 
        title: "Iphone Shoot", 
        bgImage: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80",
        desc: "Dynamic 4K iPhone video shoots, perfect for social media reels, organic content, and rapid visual marketing." 
      }
    ],
    overviewTitle: "Professional Video Production and Storytelling in Hyderabad",
    paragraphs: [
      "Video is the most powerful medium to communicate your brand story. Our production team combines creative scriptwriting, high-definition 4K filming, cinematic lighting, and custom sound design to deliver videos that stick with viewers.",
      "We manage the entire video lifecycle: pre-production storyboards, multi-camera shoots, post-production editing, motion graphics, professional voiceovers, and audio mixing.",
      "Whether you need an elegant corporate documentary, a batch of viral Instagram Reels, or a detailed product explainer animation, our visual content drives deep customer trust."
    ],
    faqs: [
      { q: "What is your video production process?", a: "Our process consists of three main phases: Pre-production (scripting, storyboarding, scheduling), Production (filming, lighting, audio recording), and Post-production (editing, color grading, voiceover, sound effects)." },
      { q: "Do you write scripts and provide professional voiceover artists?", a: "Yes. We have dedicated copywriters who draft compelling scripts and a network of professional voiceover artists in multiple languages and accents." },
      { q: "Can you film corporate events or offices anywhere in Hyderabad?", a: "Yes. Our production crew travels across Hyderabad and surrounding regions equipped with cinematic cameras, stabilization rigs, and aerial drones." },
      { q: "How long does it take to edit and deliver the final video?", a: "Delivery timelines depend on video length and complexity. Vertical social videos are delivered within 5-7 days, while corporate videos or animations take 2-4 weeks." },
      { q: "In what formats do you deliver the finished videos?", a: "We deliver master copies in high-definition MP4/MOV formats optimized for website hosting, YouTube, social media platforms, or television broadcasts." }
    ]
  },
  "software-development": {
    title: "Software Development",
    bannerTitle: "Software Development Company in Hyderabad",
    bannerDesc: "Ananya Hi Solutions develops robust enterprise-grade software. We build custom CRMs, Billing engines, LMS portals, and College management systems to automate your workflows.",
    bannerBadge: "✓ 60+ Custom Software Builds | ⭐️ Rated 5/5 by Operations Directors",
    heroVisual: "/images/hero/software-development.png",
    subtypesTitle: "Enterprise Software Development in Hyderabad",
    subtypesDesc: "Custom business tools, educational dashboards, billing structures, and operations systems built to scale.",
    row1Image: "https://images.unsplash.com/photo-1504639725590-34d0984388bd?auto=format&fit=crop&w=800&q=80",
    row2Image: "https://images.unsplash.com/photo-1600132806370-bf17e65e942f?auto=format&fit=crop&w=800&q=80",
    types: [
      { 
        id: "crm", 
        title: "CRM Software Development", 
        bgImage: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=800&q=80",
        desc: "Tailored CRM databases to organize sales workflows, store pipeline data, and sync communications." 
      },
      { 
        id: "billing", 
        title: "Billing Software Development", 
        bgImage: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80",
        desc: "GST-ready POS invoice portals, multi-point ledger ledgers, and automated payment receipts." 
      },
      { 
        id: "college", 
        title: "College Management System", 
        bgImage: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=800&q=80",
        desc: "Comprehensive institution ERPs to connect attendance logs, marks, fees, and students." 
      },
      { 
        id: "lms", 
        title: "Learning Management System", 
        bgImage: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80",
        desc: "Scalable e-learning portals featuring interactive quiz components and live course video streams." 
      },
      { 
        id: "hospital-management", 
        title: "Hospital Management System", 
        bgImage: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80",
        desc: "Automated healthcare ERPs connecting patient registrations, doctor schedules, billing, and lab report workflows." 
      }
    ],
    overviewTitle: "Custom Software Engineering Services in Hyderabad",
    paragraphs: [
      "Off-the-shelf software rarely fits unique business models. We build secure, customized software architectures designed to solve specific operational bottlenecks and improve team efficiency.",
      "We construct robust CRM customer frameworks, offline-first billing point-of-sale systems, institutional college databases, and high-traffic learning platforms (LMS).",
      "Our systems are built using modern backend frameworks, ensuring smooth data synchronizations, clean APIs, automated cloud backups, and high security protocols."
    ],
    faqs: [
      { q: "What programming languages and frameworks do you use?", a: "We build custom software using Next.js/React, Node.js, Python, PostgreSQL, and secure cloud infrastructures (AWS/Azure) to ensure stability and speed." },
      { q: "Can your custom software integrate with our existing tools?", a: "Yes. We build custom API connectors to link your new software with external tools like WhatsApp, accounting suites, email servers, and payment portals." },
      { q: "Do we own the source code of the custom software?", a: "Yes. Upon project completion and payment settlement, full intellectual property and source code ownership are transferred to you." },
      { q: "What security measures do you implement to protect company databases?", a: "We enforce role-based access control, secure HTTPS/TLS data encryptions, daily automated backups, and protection against common web threats." },
      { q: "Can your billing software work without an active internet connection?", a: "Yes. We build offline-first billing portals that record invoices locally and automatically sync data with cloud servers once internet connection is restored." }
    ]
  },
  "aeo": {
    title: "AEO (Answer Engine)",
    bannerTitle: "Answer Engine Optimization (AEO) in Hyderabad",
    bannerDesc: "Optimize your digital presence for conversational search tools. Ananya Hi Solutions structures your site to rank as a cited reference within ChatGPT, Claude, and Gemini.",
    bannerBadge: "✓ AI-Search Indexing Ready | ⭐️ Rated 5/5 by Tech Startups",
    heroVisual: "/images/hero/aeo.png",
    subtypesTitle: "AEO Services in Hyderabad",
    subtypesDesc: "Structure your site to get cited as a primary reference within ChatGPT Search, Gemini, and Claude.",
    row1Image: "/images/subservices/aeo-overview.jpg",
    row2Image: "/images/subservices/aeo-capabilities.jpg",
    row2Title: "Maximize AI Search Engine Visibility",
    types: [
      {
        id: "aeo",
        title: "AEO, GEO, AIO, SXO Package",
        bgImage: "/images/subservices/aeo-capabilities.jpg",
        desc: "Unlock comprehensive AEO, GEO, AIO, and SXO pricing models designed for startups and modern tech brands."
      }
    ],
    overviewTitle: "Pioneering Answer Engine Optimization",
    paragraphs: [
      "Traditional search behavior is transitioning rapidly from basic links to direct conversational answers. Answer Engine Optimization (AEO) structures and optimizes your content footprint so that conversational AI platforms select your business as the definitive source.",
      "We build advanced schema markups, structure FAQ data networks, and craft direct, query-focused content that aligns perfectly with how large language models (LLMs) parse and retrieve information.",
      "Early adoption of AEO ensures your brand remains visible inside ChatGPT Search, Gemini, and Claude answers, driving compounding organic authority and building trust before a user ever clicks a link."
    ],
    faqs: [
      { q: "What is Answer Engine Optimization (AEO)?", a: "AEO is the practice of optimizing content so AI engines like ChatGPT, Gemini, and Claude can easily read, index, and cite your website as the source when answering user questions." },
      { q: "How do conversational AI search engines find my site?", a: "AI engines crawl structured web indexes, looking for authoritative, highly structured, direct answers. We configure advanced JSON-LD semantic markup to make your content easy for LLMs to reference." },
      { q: "Is AEO suitable for small businesses?", a: "Yes. Early adoption of AI search optimization gives small businesses and startups a massive competitive advantage, enabling them to outrank larger competitors inside AI search responses." }
    ]
  },
  "geo": {
    title: "GEO (Google Engine)",
    bannerTitle: "Google Engine Optimization (GEO) in Hyderabad",
    bannerDesc: "Secure SGE citations. We optimize your website content and structure to occupy AI summary panels and snapshot recommendations in Google SGE.",
    bannerBadge: "✓ Google SGE Citations Strategy | ⭐️ Rated 4.9/5 by Brand Managers",
    heroVisual: "/images/hero/geo.jpg",
    subtypesTitle: "GEO Services in Hyderabad",
    subtypesDesc: "Secure SGE citations and snapshot recommendations in Google's Search Generative Experience.",
    row1Image: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=800&q=80",
    row2Image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80",
    types: [
      {
        id: "geo",
        title: "AEO, GEO, AIO, SXO Package",
        bgImage: "/images/subservices/aeo-capabilities.jpg",
        desc: "Unlock comprehensive AEO, GEO, AIO, and SXO pricing models designed for startups and modern tech brands."
      }
    ],
    overviewTitle: "Dominating Google Search Generative Experience",
    paragraphs: [
      "Google's Search Generative Experience (SGE) represents the biggest shift in search engine history. SGE presents AI-synthesized responses at the top of results, citing only a select few websites. GEO is the practice of optimizing your site to be one of those citations.",
      "We restructure your site architecture, improve content authority using semantic SEO techniques, and align pages with Google's SGE indexing algorithms to secure your place in the generative snapshots.",
      "By securing these high-visibility citations, your brand captures high-intent organic users who trust Google's direct recommendations, increasing search CTR and conversions."
    ],
    faqs: [
      { q: "What is GEO and SGE?", a: "SGE is Google's Search Generative Experience, which shows AI-generated answers above search results. GEO (Google Engine Optimization) optimizes your site to get cited inside those SGE boxes." },
      { q: "How does GEO differ from traditional SEO?", a: "GEO focuses on securing citations in Google's AI snapshots, whereas traditional SEO focuses on links ranking in the search index. GEO requires higher semantic density and clear factual declarations." },
      { q: "When will I see results from GEO optimization?", a: "Google SGE crawls and updates its snapshots continuously. Once we deploy structured semantic markup and optimized content, citations can appear within a few weeks." }
    ]
  },
  "aio": {
    title: "AIO (AI Optimization)",
    bannerTitle: "Artificial Intelligence Optimization (AIO) in Hyderabad",
    bannerDesc: "Optimize your brand's digital footprint so that leading AI models (like ChatGPT, Claude, Perplexity, and Gemini) cite and recommend your services.",
    bannerBadge: "✓ AI Recommendation Engine Optimization | ⭐️ Rated 5/5 by Tech Brands",
    heroVisual: "/images/hero/aio.jpg",
    subtypesTitle: "AIO Services in Hyderabad",
    subtypesDesc: "Optimize your brand's digital footprint so that leading AI models recommend your services.",
    row1Image: "/images/subservices/aio-detail.jpg",
    row2Image: "/images/subservices/aio-capabilities.jpg",
    row2Title: "Driving AI-Powered Business Growth",
    types: [
      {
        id: "aio",
        title: "AEO, GEO, AIO, SXO Package",
        bgImage: "/images/subservices/aio-capabilities.jpg",
        desc: "Unlock comprehensive AEO, GEO, AIO, and SXO pricing models designed for startups and modern tech brands."
      }
    ],
    overviewTitle: "Optimize for AI Search Recommendations",
    paragraphs: [
      "We optimize your brand's digital presence to ensure conversational AI engines (like ChatGPT, Claude, Perplexity, and Gemini) cite and recommend your services. By structuring semantic content and building trusted citations, we position your business as a preferred answer for high-intent queries.",
      "",
      "By aligning your content with LLM patterns and indexing snapshots, we maximize your visibility on recommendation engines. Early AIO adoption drives pre-qualified traffic directly to your site, bypassing traditional search competition."
    ],
    faqs: [
      { q: "What is Artificial Intelligence Optimization (AIO)?", a: "AIO is the practice of structuring and optimizing your online presence so that conversational AI models cite, mention, and recommend your brand when answering user queries." },
      { q: "Which AI engines do you optimize for?", a: "We optimize for all leading LLM recommendation engines, including OpenAI's ChatGPT Search, Microsoft Copilot, Anthropic's Claude, Perplexity AI, and Google Gemini." },
      { q: "Why is AIO important?", a: "With millions of users querying AI directly for product and service recommendations, appearing as a top-cited source in AI summaries is the modern equivalent of ranking #1 on traditional search." }
    ]
  },
  "sxo": {
    title: "SXO (Search Experience)",
    bannerTitle: "Search Experience Optimization (SXO) in Hyderabad",
    bannerDesc: "Merge traditional search engine optimization with high-fidelity UX design to capture search traffic and convert visitors into active leads.",
    bannerBadge: "✓ Higher Search CTR & Conversions | ⭐️ Rated 4.9/5 by Growth Marketers",
    heroVisual: "/images/hero/sxo.jpg",
    subtypesTitle: "SXO Services in Hyderabad",
    subtypesDesc: "Merge traditional search engine optimization with user experience design to convert traffic.",
    row1Image: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=800&q=80",
    row2Image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80",
    types: [
      {
        id: "sxo",
        title: "AEO, GEO, AIO, SXO Package",
        bgImage: "/images/subservices/aeo-capabilities.jpg",
        desc: "Unlock comprehensive AEO, GEO, AIO, and SXO pricing models designed for startups and modern tech brands."
      }
    ],
    overviewTitle: "Merging Search Performance and User Experience",
    paragraphs: [
      "Traditional SEO gets visitors to your website; SXO ensures they stay there and convert. Search Experience Optimization bridges search engine rankings with user experience engineering to align with Google's Core Web Vitals and user-satisfaction signals.",
      "We design blazing-fast web interfaces, optimize customer conversion funnels, and build highly engaging page flows that satisfy both search spiders and human visitors.",
      "By matching search intent with a frictionless page journey, SXO increases time-on-site, minimizes bounce rates, and maximizes conversion outcomes for all organic traffic."
    ],
    faqs: [
      { q: "What is Search Experience Optimization (SXO)?", a: "SXO combines SEO and UX design. It focuses on satisfying user intent from the moment they search for a query to the final conversion action on your site." },
      { q: "How does SXO help search engine rankings?", a: "Search engines like Google prioritize user experience signals (like page speed, dwell time, and low bounce rates). Satisfying users directly translates to higher and more stable rankings." },
      { q: "What is the primary benefit of SXO?", a: "SXO increases conversion rates on organic search traffic, turning casual search visitors into customers and maximizing the ROI of your search campaigns." }
    ]
  },
  "youtube-seo": {
    title: "YouTube SEO",
    bannerTitle: "YouTube SEO Company in Hyderabad",
    bannerDesc: "Dominate video recommendation algorithms. We optimize metadata, playlists, descriptions, and closed captions to rank your channel organically.",
    bannerBadge: "✓ YouTube Search Domination | ⭐️ Rated 5/5 by Creators & Brands",
    heroVisual: "/images/hero/youtube-seo.jpg",
    subtypesTitle: "YouTube SEO Services in Hyderabad",
    subtypesDesc: "Rank your channel organically and drive long-term video views and subscribers.",
    row1Image: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=800&q=80",
    row2Image: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=800&q=80",
    types: [
      {
        id: "youtube-seo",
        title: "YouTube Production Package",
        bgImage: "/images/hero/youtube-seo.jpg",
        desc: "Unlock comprehensive YouTube optimization, content planning, and audience building packages."
      }
    ],
    overviewTitle: "Unlocking Algorithmic Video Reach",
    paragraphs: [
      "YouTube is the second largest search engine globally. To rank organically, your videos must satisfy both user retention metrics and search indexing algorithms. Our YouTube SEO services optimize your videos from script to upload.",
      "We perform high-volume video keyword research, optimize video titles, tags, closed captions, and description schemas, and design visual masterclass thumbnails that maximize click-through rate (CTR).",
      "By aligning your videos with search trends and YouTube's recommendation feed parameters, we build consistent, compounding organic views and channel subscribers."
    ],
    faqs: [
      { q: "Why should my business focus on YouTube SEO?", a: "YouTube search ranks your videos for high-traffic buyer keywords, expanding your brand reach to a visual-first audience and driving long-term passive leads." },
      { q: "What elements do you optimize for YouTube SEO?", a: "We optimize video file names, titles, descriptions, tag fields, timestamps, custom thumbnails, and closed captions (transcripts) to feed clear signals to the algorithm." },
      { q: "Do you also help with thumbnail designs?", a: "Yes. We design custom high-CTR thumbnails and advise on video hooks to maximize user retention, which is a major ranking factor." }
    ]
  },
  "youtube-ads": {
    title: "YouTube Ads",
    bannerTitle: "YouTube Ads Management Agency in Hyderabad",
    bannerDesc: "Build and scale high-ROAS visual video campaigns. We manage scripthooks, precise channel placements, and landing page conversion funnels.",
    bannerBadge: "✓ High-ROI YouTube Ads Setup | ⭐️ Rated 5/5 by E-commerce Brands",
    heroVisual: "/images/hero/youtube-ads.jpg",
    subtypesTitle: "YouTube Ads Services in Hyderabad",
    subtypesDesc: "Build and scale high-ROI video campaign strategies to drive conversions.",
    row1Image: "https://images.unsplash.com/photo-1551836022-8b2858c9c69b?auto=format&fit=crop&w=800&q=80",
    row2Image: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=800&q=80",
    types: [
      {
        id: "youtube-ads",
        title: "YouTube Production Package",
        bgImage: "/images/hero/youtube-ads.jpg",
        desc: "Unlock comprehensive YouTube advertising, channel setups, and growth packages."
      }
    ],
    overviewTitle: "High-Performance Video Advertising",
    paragraphs: [
      "Video ads offer unparalleled narrative persuasion. We design, write, target, and monitor custom YouTube ad campaigns (In-Stream, Bumper, Display) that capture buyer interest and multiply ROAS.",
      "We script strong hooks to reduce skips, integrate Google Ads placement parameters, set custom target profiles, and build clean landing page funnels to optimize conversions.",
      "With transparent daily budget tracking, A/B ad creative testing, and weekly performance reviews, we scale video campaigns that drive predictable acquisitions."
    ],
    faqs: [
      { q: "What types of YouTube ads do you run?", a: "We run Skippable In-Stream ads, Non-Skippable ads, 6-second Bumper ads, and In-Feed video ads depending on whether your goal is brand awareness or direct lead conversion." },
      { q: "How do you ensure our ads target the right audience?", a: "We use custom placement targeting (showing ads on specific channels or videos), intent-based keywords, competitor channel targeting, and demographic filtering." },
      { q: "What budget is required for YouTube ads?", a: "We configure campaigns based on your comfortable budget. You can start with a modest daily ad spend and scale up as we optimize for positive return-on-ad-spend (ROAS)." }
    ]
  }
};

const PACKAGE_MAPPING = {
  "static": { category: "Website Packages", plan: "Static Website Design" },
  "dynamic": { category: "Website Packages", plan: "Dynamic Website" },
  "ecommerce": { category: "Website Packages", plan: "E-Commerce Website" },
  "spa": { category: "Special Packages", plan: "Spa Packages" },
  "seo": { category: "Digital Marketing Packages", plan: "Search Engine Optimization (SEO)" },
  "smm": { category: "Digital Marketing Packages", plan: "Social Media Marketing" },
  "google-ads": { category: "Digital Marketing Packages", plan: "Google Ads/PPC Ads" },
  "app-dev": { category: "App Development Packages", plan: "App Development" },
  "aeo": { category: "Digital Marketing Packages", plan: "AEO, GEO, AIO, SXO" },
  "geo": { category: "Digital Marketing Packages", plan: "AEO, GEO, AIO, SXO" },
  "aio": { category: "Digital Marketing Packages", plan: "AEO, GEO, AIO, SXO" },
  "sxo": { category: "Digital Marketing Packages", plan: "AEO, GEO, AIO, SXO" },
  "youtube-seo": { category: "Digital Marketing Packages", plan: "YouTube Production" },
  "youtube-ads": { category: "Digital Marketing Packages", plan: "YouTube Production" }
};

export default function ServiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;
  const [activeFaq, setActiveFaq] = useState(0);

  // Package Unlock Modal States
  const [unlockModalOpen, setUnlockModalOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState({ category: "", plan: "" });
  const [unlockFormData, setUnlockFormData] = useState({ name: "", email: "", phone: "", company: "" });
  const [unlockSubmitting, setUnlockSubmitting] = useState(false);
  const [unlockSuccess, setUnlockSuccess] = useState(false);
  const [unlockError, setUnlockError] = useState("");

  const handleUnlockInputChange = (e) => {
    const { name, value } = e.target;
    setUnlockFormData((prev) => ({ ...prev, [name]: value }));
  };

  const openUnlockModal = (subId) => {
    const mapping = PACKAGE_MAPPING[subId];
    if (mapping) {
      setSelectedPackage(mapping);
      setUnlockFormData({ name: "", email: "", phone: "", company: "" });
      setUnlockModalOpen(true);
      setUnlockSuccess(false);
      setUnlockError("");
    }
  };

  const handleUnlockSubmit = (e) => {
    e.preventDefault();
    if (!unlockFormData.name || !unlockFormData.email || !unlockFormData.phone) {
      setUnlockError("Please fill in all required fields.");
      return;
    }
    setUnlockSubmitting(true);
    setUnlockError("");

    const targetPlan = selectedPackage.plan;

    // Fire lead data dispatch in the background
    fetch("/api/unlock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: unlockFormData.name,
        email: unlockFormData.email,
        phone: unlockFormData.phone,
        company: unlockFormData.company,
        packageTitle: selectedPackage.category,
        subId: targetPlan
      })
    }).catch((err) => {
      console.error("Error submitting lead in background:", err);
    });

    // Instantly transition to success & redirect
    setUnlockSuccess(true);
    setUnlockFormData({ name: "", email: "", phone: "", company: "" });
    
    // Redirect directly to plans page instantly
    router.push(`/packages/plans?package=${encodeURIComponent(targetPlan)}`);
    
    setTimeout(() => {
      setUnlockModalOpen(false);
      setUnlockSuccess(false);
      setUnlockSubmitting(false);
    }, 500);
  };

  const closeUnlockModal = () => {
    setUnlockModalOpen(false);
    setUnlockSuccess(false);
    setUnlockError("");
  };

  // Enquiry Modal States
  const [enquiryModalOpen, setEnquiryModalOpen] = useState(false);
  const [enquirySubject, setEnquirySubject] = useState("");
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", company: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const openEnquiryModal = (title) => {
    setEnquirySubject(title);
    setEnquiryModalOpen(true);
    setSubmitSuccess(false);
    setSubmitError("");
    setFormData({ name: "", email: "", phone: "", company: "", message: "" });
  };

  const handleEnquirySubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.phone) {
      setSubmitError("Please fill in all required fields.");
      return;
    }
    setSubmitting(true);
    setSubmitError("");

    const messageBody = `Enquiry about Subservice: ${enquirySubject}
Company Name: ${formData.company || "Not provided"}
User Comments: ${formData.message || "None"}`;

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          message: messageBody
        })
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to submit enquiry.");
      }
      setSubmitSuccess(true);
      setFormData({ name: "", email: "", phone: "", company: "", message: "" });
      setTimeout(() => {
        setEnquiryModalOpen(false);
        setSubmitSuccess(false);
      }, 3000);
    } catch (err) {
      setSubmitError(err.message || "An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const closeEnquiryModal = () => {
    setEnquiryModalOpen(false);
    setSubmitSuccess(false);
    setSubmitError("");
  };

  // Chat Widget State
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([
    { sender: "bot", text: "Hello! Welcome to Ananya Hi Solutions. How can I help you regarding this service today?" },
  ]);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, chatOpen]);

  // Fallback to web-design if service page ID is invalid
  const data = SERVICES_DETAIL_DATA[id] || SERVICES_DETAIL_DATA["web-design"];

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const userMsg = chatMessage;
    setChatHistory((prev) => [...prev, { sender: "user", text: userMsg }]);
    setChatMessage("");

    setTimeout(() => {
      let reply = `Thank you for reaching out! Our consultants are ready to assist you with ${data.title}. Drop your email here or write us at info@ananyahisolutions.com.`;
      setChatHistory((prev) => [...prev, { sender: "bot", text: reply }]);
    }, 1000);
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* 1. Navigation Header */}
      <Header activePage="services" />

      {/* 3. Redesigned Hero Section */}
      {true && (
        <section className="premium-service-hero">
          <div className="hero-glow-blob-1"></div>
          <div className="hero-glow-blob-2"></div>
          <div className="hero-shapes-container">
            <div className="hero-shape hero-shape-1"></div>
            <div className="hero-shape hero-shape-2"></div>
          </div>
          <div className="container hero-split-container animate-slide-in">
            {/* Left Column: Text & CTAs */}
            <div className="hero-left-content" style={!data.heroVisual ? { flex: 1, maxWidth: "850px", margin: "0 auto", textAlign: "center" } : {}}>
              <h1 className="hero-title" style={!data.heroVisual ? { textAlign: "center" } : {}}>{data.bannerTitle}</h1>
              <p className="hero-subtitle" style={!data.heroVisual ? { textAlign: "center", margin: "0 auto 30px auto" } : {}}>{data.bannerDesc}</p>
              <div className="hero-actions" style={!data.heroVisual ? { justifyContent: "center" } : {}}>
                <a 
                  href={`https://wa.me/917673935353?text=Hello%20Ananya%20Hi%20Solutions,%20I%20would%20like%20to%20get%20a%20free%20consultation%20regarding%20your%20${encodeURIComponent(data.title)}%20services.`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="btn btn-accent hero-cta-btn"
                >
                  Get Free Consultation
                </a>
              </div>
            </div>
            
            {/* Right Column: Floating Visual Frame */}
            {data.heroVisual && (
              <div className="hero-right-visual">
                <div className="hero-image-frame">
                  <div className="hero-frame-glow"></div>
                  <img 
                    src={data.heroVisual} 
                    alt={`${data.title} Presentation`} 
                    className="hero-frame-image"
                  />
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* 3. Sub-services Cards Section */}
      {data.types && data.types.length > 0 && (
        <section className="section subservices-section" style={{ padding: "100px 0", background: "var(--light-gray)" }}>
          <div className="container" style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 20px" }}>
            <div className="section-header">
              <h2>{data.subtypesTitle}</h2>
              <p>{data.subtypesDesc}</p>
            </div>

            <div className="subservices-premium-grid">
              {data.types.map((type) => {
                const hasPackage = !!PACKAGE_MAPPING[type.id];
                return hasPackage ? (
                  <div 
                    key={type.id} 
                    className="premium-subservice-card"
                    onClick={() => openUnlockModal(type.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="card-bg-image" style={{ backgroundImage: `url(${type.bgImage})` }}></div>
                    <div className="card-overlay"></div>
                    <div className="card-content">
                      <h3 className="card-title">{type.title}</h3>
                      <div className="card-underline"></div>
                      <p className="card-description">{type.desc}</p>
                      <button 
                        onClick={(e) => { e.stopPropagation(); openUnlockModal(type.id); }} 
                        className="card-cta-btn"
                        style={{ border: 'none', cursor: 'pointer' }}
                      >
                        View Packages
                      </button>
                    </div>
                  </div>
                ) : (
                  <div 
                    key={type.id} 
                    className="premium-subservice-card"
                    onClick={() => openEnquiryModal(type.title)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="card-bg-image" style={{ backgroundImage: `url(${type.bgImage})` }}></div>
                    <div className="card-overlay"></div>
                    <div className="card-content">
                      <h3 className="card-title">{type.title}</h3>
                      <div className="card-underline"></div>
                      <p className="card-description">{type.desc}</p>
                      <button 
                        onClick={(e) => { e.stopPropagation(); openEnquiryModal(type.title); }} 
                        className="card-cta-btn"
                        style={{ border: 'none', cursor: 'pointer' }}
                      >
                        Enquire Us
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* 4. Alternating Content Section */}
      <section className="alternating-section bg-white" style={{ padding: "100px 0" }}>
        <div className="container" style={{ maxWidth: "1150px", margin: "0 auto", padding: "0 20px" }}>
          
          {id === "web-design" ? (
            <>
              {/* Row 1: Static Website Design */}
              <div className="alternating-row">
                <div className="row-image-container">
                  <img src="/images/subservices/static_web_detail.jpg" alt="Static Website Design Details" className="row-image" />
                </div>
                <div className="row-content-container">
                  <h2 className="row-heading text-3xl font-extrabold text-slate-900 mb-6" style={{ fontFamily: "var(--font-headings)" }}>
                    Static Website Design
                  </h2>
                  <div className="row-text text-slate-600 text-base md:text-lg leading-relaxed flex flex-col gap-6" style={{ textAlign: "justify" }}>
                    <p>
                      Static website design is ideal for startups and small businesses seeking a fast, secure, and search-optimized online presence. Built with lightweight HTML and CSS, these responsive pages load almost instantly and require zero database maintenance, offering a professional storefront that converts visitors from day one.
                    </p>
                  </div>
                </div>
              </div>

              {/* Row 2: Dynamic Website */}
              <div className="alternating-row row-reverse" style={{ marginTop: "80px" }}>
                <div className="row-image-container">
                  <img src="/images/subservices/dynamic_web_detail.jpg" alt="Dynamic Website Details" className="row-image" />
                </div>
                <div className="row-content-container">
                  <h2 className="row-heading text-3xl font-extrabold text-slate-900 mb-6" style={{ fontFamily: "var(--font-headings)" }}>
                    Dynamic Website
                  </h2>
                  <div className="row-text text-slate-600 text-base md:text-lg leading-relaxed flex flex-col gap-6" style={{ textAlign: "justify" }}>
                    <p>
                      For businesses requiring real-time content updates, user interactive portals, or custom logins, dynamic websites are the perfect solution. Powered by modern frameworks like React and Node.js, we build custom systems with user-friendly admin dashboards that allow your team to manage data feeds effortlessly.
                    </p>
                  </div>
                </div>
              </div>

              {/* Row 3: E-Commerce Website */}
              <div className="alternating-row" style={{ marginTop: "80px" }}>
                <div className="row-image-container">
                  <img src="/images/subservices/ecommerce_web_detail.jpg" alt="E-Commerce Website Details" className="row-image" />
                </div>
                <div className="row-content-container">
                  <h2 className="row-heading text-3xl font-extrabold text-slate-900 mb-6" style={{ fontFamily: "var(--font-headings)" }}>
                    E-Commerce Website
                  </h2>
                  <div className="row-text text-slate-600 text-base md:text-lg leading-relaxed flex flex-col gap-6" style={{ textAlign: "justify" }}>
                    <p>
                      Launch and scale your online store with custom shopping pipelines, secure checkout sequences, and dynamic search filters. Our e-commerce builds integrate secure payment gateways, order tracking, and live inventory management, ensuring friction-free customer transactions even under high traffic.
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : id === "mobile-app" ? (
            <>
              {/* Row 1: iOS App Development */}
              <div className="alternating-row">
                <div className="row-image-container">
                  <img src="/images/subservices/ios_app_detail.jpg" alt="iOS App Development Details" className="row-image" />
                </div>
                <div className="row-content-container">
                  <h2 className="row-heading text-3xl font-extrabold text-slate-900 mb-6" style={{ fontFamily: "var(--font-headings)" }}>
                    iOS App Development
                  </h2>
                  <div className="row-text text-slate-600 text-base md:text-lg leading-relaxed flex flex-col gap-6" style={{ textAlign: "justify" }}>
                    <p>
                      We engineer premium iOS applications using Swift and Xcode, designed to deliver native performance and buttery-smooth user interfaces. Following Apple's Human Interface Guidelines and App Store best practices, our developments ensure optimal memory utilization, robust security, and full ecosystem compatibility.
                    </p>
                  </div>
                </div>
              </div>

              {/* Row 2: Android App Development */}
              <div className="alternating-row row-reverse" style={{ marginTop: "80px" }}>
                <div className="row-image-container">
                  <img src="/images/subservices/android_app_detail.jpg" alt="Android App Development Details" className="row-image" />
                </div>
                <div className="row-content-container">
                  <h2 className="row-heading text-3xl font-extrabold text-slate-900 mb-6" style={{ fontFamily: "var(--font-headings)" }}>
                    Android App Development
                  </h2>
                  <div className="row-text text-slate-600 text-base md:text-lg leading-relaxed flex flex-col gap-6" style={{ textAlign: "justify" }}>
                    <p>
                      Our Android engineering team builds robust, high-performance applications using Kotlin and Java, tailored to fit the diverse device ecosystem. We integrate secure databases, real-time sync architectures, and intuitive Material Design interfaces that scale flawlessly across multiple screen sizes and devices.
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Default Row 1: Image Left + Content Right */}
              <div className="alternating-row">
                <div className="row-image-container">
                  <img src={data.row1Image} alt={`${data.title} Overview`} className="row-image" />
                </div>
                <div className="row-content-container">
                  <h2 className="row-heading text-3xl font-extrabold text-slate-900 mb-6" style={{ fontFamily: "var(--font-headings)" }}>
                    {data.overviewTitle}
                  </h2>
                  <div className="row-text text-slate-600 text-base md:text-lg leading-relaxed flex flex-col gap-6" style={{ textAlign: "justify" }}>
                    {renderParagraph(data.paragraphs[0], 0, id)}
                    {data.paragraphs[1] && <p>{data.paragraphs[1]}</p>}
                  </div>
                </div>
              </div>

              {/* Default Row 2: Content Left + Image Right */}
              {data.paragraphs[2] && (
                <div className="alternating-row row-reverse" style={{ marginTop: "80px" }}>
                  <div className="row-image-container">
                    <img src={data.row2Image} alt={`${data.title} Capabilities`} className="row-image" />
                  </div>
                  <div className="row-content-container">
                    <h2 className="row-heading text-3xl font-extrabold text-slate-900 mb-6" style={{ fontFamily: "var(--font-headings)" }}>
                      {data.row2Title || "Unlocking Premium Growth & Value"}
                    </h2>
                    <div className="row-text text-slate-600 text-base md:text-lg leading-relaxed flex flex-col gap-6" style={{ textAlign: "justify" }}>
                      <p>{data.paragraphs[2]}</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

        </div>
      </section>

      {/* 5. FAQs Accordion Section */}
      <section className="section bg-slate-50/50" style={{ padding: "80px 0", borderTop: "1px solid #f1f5f9" }}>
        <div className="container" style={{ maxWidth: "1000px", margin: "0 auto", padding: "0 20px" }}>
          <div className="section-header">
            <h2>Frequently Asked Questions</h2>
            <p>Answers to common queries about our {data.title} services</p>
          </div>


          <div className="faq-container" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {data.faqs.map((faq, idx) => (
              <div
                key={idx}
                className={`faq-item ${idx === activeFaq ? "active" : ""}`}
                style={{
                  background: "#ffffff",
                  border: idx === activeFaq ? "1px solid var(--primary-blue)" : "1px solid #e2e8f0",
                  borderRadius: "8px",
                  overflow: "hidden",
                  transition: "border 0.2s ease"
                }}
              >
                <button
                  className="faq-question"
                  onClick={() => setActiveFaq(idx === activeFaq ? -1 : idx)}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    width: "100%",
                    padding: "20px 24px",
                    background: "none",
                    border: "none",
                    textAlign: "left",
                    cursor: "pointer",
                    fontWeight: "600",
                    fontSize: "16px",
                    color: "var(--dark-deep)"
                  }}
                >
                  <span>{faq.q}</span>
                  <span 
                    className="faq-toggle-icon" 
                    style={{ 
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "transform 0.2s ease", 
                      transform: idx === activeFaq ? "rotate(180deg)" : "rotate(0deg)" 
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </span>
                </button>
                <div
                  className="faq-answer"
                  style={{
                    maxHeight: idx === activeFaq ? "300px" : "0",
                    transition: "max-height 0.3s ease-out",
                    overflow: "hidden"
                  }}
                >
                  <div className="faq-answer-content" style={{ padding: "0 24px 20px 24px", color: "var(--secondary-slate)", fontSize: "15px", lineHeight: "1.6" }}>
                    <p>{faq.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Premium Final CTA Section */}
      <section className="premium-final-cta">
        <div className="cta-overlay-glow"></div>
        <div className="container cta-content-wrapper text-center animate-slide-in">
          <h2 className="cta-title">Ready to Elevate Your Digital Authority?</h2>
          <p className="cta-subtitle">
            Get a free consultation and let our digital engineers craft a custom strategy tailored to your business goals.
          </p>
          <a 
            href={`https://wa.me/917673935353?text=Hello%20Ananya%20Hi%20Solutions,%20I%20would%20like%20to%20get%20a%20free%20consultation%20regarding%20your%20${encodeURIComponent(data.title)}%20services.`} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="btn btn-accent cta-glow-btn"
          >
            Get Free Consultation
          </a>
        </div>
      </section>


      {/* Global Footer and Chat Widget */}
      {/* Unlock Package Modal */}
      {unlockModalOpen && (
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
          onClick={closeUnlockModal}
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
              onClick={closeUnlockModal}
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
              {unlockSuccess ? (
                <div style={{ textAlign: "center", padding: "20px 0" }}>
                  <div style={{ fontSize: "50px", marginBottom: "15px" }}>🔓</div>
                  <h3 style={{ fontFamily: "var(--font-headings)", color: "var(--dark-deep)", fontSize: "1.45rem", fontWeight: "800", marginBottom: "12px" }}>
                    Package Unlocked!
                  </h3>
                  <p style={{ color: "var(--secondary-slate)", fontSize: "0.95rem", lineHeight: "1.5" }}>
                    Redirecting you to our package plans for {selectedPackage.plan}...
                  </p>
                </div>
              ) : (
                <form onSubmit={handleUnlockSubmit}>
                  <h3 style={{ fontFamily: "var(--font-headings)", color: "var(--dark-deep)", fontSize: "1.45rem", fontWeight: "800", marginBottom: "8px", textAlign: "center" }}>
                    Unlock Packages
                  </h3>
                  <p style={{ color: "var(--secondary-slate)", fontSize: "0.9rem", textAlign: "center", marginBottom: "28px" }}>
                    Please fill out the details below to unlock pricing and details for <strong>{selectedPackage.plan}</strong>.
                  </p>
                  
                  {unlockError && (
                    <div style={{ color: "#ef4444", background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: "8px", padding: "10px 14px", fontSize: "0.85rem", marginBottom: "16px", textAlign: "center" }}>
                      {unlockError}
                    </div>
                  )}

                  <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "24px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", color: "var(--dark-deep)", marginBottom: "6px" }}>Full Name *</label>
                      <input 
                        type="text" 
                        name="name" 
                        required 
                        value={unlockFormData.name} 
                        onChange={handleUnlockInputChange} 
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
                        value={unlockFormData.email} 
                        onChange={handleUnlockInputChange} 
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
                        value={unlockFormData.phone} 
                        onChange={handleUnlockInputChange} 
                        placeholder="e.g. +91 98765 43210" 
                        style={{ width: "100%", padding: "12px 16px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "0.95rem", color: "var(--dark-deep)" }} 
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", color: "var(--dark-deep)", marginBottom: "6px" }}>Company Name (Optional)</label>
                      <input 
                        type="text" 
                        name="company" 
                        value={unlockFormData.company} 
                        onChange={handleUnlockInputChange} 
                        placeholder="e.g. Acme Corp" 
                        style={{ width: "100%", padding: "12px 16px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "0.95rem", color: "var(--dark-deep)" }} 
                      />
                    </div>
                  </div>
                  
                  <button 
                    type="submit" 
                    disabled={unlockSubmitting}
                    style={{ 
                      width: "100%", 
                      background: "var(--accent-orange)", 
                      color: "var(--white)", 
                      padding: "14px", 
                      borderRadius: "8px", 
                      fontWeight: "700", 
                      fontSize: "0.95rem", 
                      border: "none", 
                      cursor: unlockSubmitting ? "not-allowed" : "pointer", 
                      boxShadow: "var(--shadow-orange)", 
                      opacity: unlockSubmitting ? 0.8 : 1, 
                      transition: "all 0.2s" 
                    }}
                  >
                    {unlockSubmitting ? "Unlocking..." : "Unlock Packages"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Enquire Us Modal */}
      {enquiryModalOpen && (
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
          onClick={closeEnquiryModal}
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
              onClick={closeEnquiryModal}
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
                    Enquiry Submitted!
                  </h3>
                  <p style={{ color: "var(--secondary-slate)", fontSize: "0.95rem", lineHeight: "1.5" }}>
                    Thank you for your enquiry regarding {enquirySubject}. Our team will review your requirements and get back to you shortly.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleEnquirySubmit}>
                  <h3 style={{ fontFamily: "var(--font-headings)", color: "var(--dark-deep)", fontSize: "1.45rem", fontWeight: "800", marginBottom: "8px", textAlign: "center" }}>
                    Enquire: {enquirySubject}
                  </h3>
                  <p style={{ color: "var(--secondary-slate)", fontSize: "0.9rem", textAlign: "center", marginBottom: "28px" }}>
                    Please fill out the form below with your project requirements, and we will get back to you with a custom solution.
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
                      <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", color: "var(--dark-deep)", marginBottom: "6px" }}>Project Requirements (Optional)</label>
                      <textarea 
                        name="message" 
                        value={formData.message} 
                        onChange={handleInputChange} 
                        placeholder="e.g. We want to develop a custom SaaS application for our logistics company..." 
                        rows={3}
                        style={{ width: "100%", padding: "12px 16px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "0.95rem", color: "var(--dark-deep)", resize: "vertical" }} 
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
                    {submitting ? "Submitting..." : "Submit Enquiry"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
      <GlobalFooter />
    </div>
  );
}
