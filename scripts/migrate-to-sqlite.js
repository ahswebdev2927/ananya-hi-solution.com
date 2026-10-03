const fs = require("fs");
const path = require("path");
const { createClient } = require("@libsql/client");

async function migrate() {
  console.log("🚀 Starting database migration from src/data/db.json to SQLite...");

  const dataDir = path.join(__dirname, "..", "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const dbPath = path.join(dataDir, "ananya.db");
  const jsonPath = path.join(__dirname, "..", "src", "data", "db.json");

  if (!fs.existsSync(jsonPath)) {
    console.error("❌ db.json not found at:", jsonPath);
    process.exit(1);
  }

  const rawJson = fs.readFileSync(jsonPath, "utf-8");
  const dbJson = JSON.parse(rawJson);

  const client = createClient({
    url: `file:${dbPath}`
  });

  console.log("📦 Creating database schema...");

  // Schema creation
  const schemaStatements = [
    `CREATE TABLE IF NOT EXISTS services (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      desc TEXT NOT NULL,
      icon_name TEXT DEFAULT 'globe',
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      department TEXT NOT NULL,
      location TEXT NOT NULL,
      experience TEXT NOT NULL,
      qualifications TEXT DEFAULT '',
      type TEXT NOT NULL DEFAULT 'Full-Time',
      description TEXT NOT NULL,
      requirements TEXT NOT NULL DEFAULT '[]',
      is_active INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS blogs (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT NOT NULL,
      author TEXT DEFAULT 'Ananya Hi Solutions',
      cover_image TEXT,
      publish_date TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS package_categories (
      key TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      is_single_card INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS package_cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_key TEXT NOT NULL,
      title TEXT NOT NULL UNIQUE,
      image TEXT NOT NULL,
      features TEXT NOT NULL DEFAULT '[]',
      link TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS pricing_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      card_title TEXT NOT NULL,
      name TEXT NOT NULL,
      icon TEXT DEFAULT '🎯',
      price TEXT NOT NULL,
      billing TEXT NOT NULL,
      is_popular INTEGER DEFAULT 0,
      features TEXT NOT NULL DEFAULT '[]',
      note TEXT DEFAULT '',
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS banners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT DEFAULT '',
      desc TEXT DEFAULT '',
      path TEXT NOT NULL,
      bg_image TEXT NOT NULL,
      btn_text TEXT DEFAULT '',
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS marquee_logos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      src TEXT NOT NULL,
      name TEXT NOT NULL,
      row_number INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS job_applications (
      id TEXT PRIMARY KEY,
      job_id TEXT NOT NULL,
      job_title TEXT NOT NULL,
      candidate_name TEXT NOT NULL,
      candidate_email TEXT NOT NULL,
      candidate_phone TEXT NOT NULL,
      cover_letter TEXT,
      resume_file_name TEXT NOT NULL,
      resume_size INTEGER,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS unlocked_leads (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      company TEXT,
      package_title TEXT NOT NULL,
      sub_id TEXT,
      submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS audit_requests (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      company TEXT,
      website TEXT,
      submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS contact_messages (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT NOT NULL,
      message TEXT NOT NULL,
      submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE INDEX IF NOT EXISTS idx_package_cards_category ON package_cards(category_key);`,
    `CREATE INDEX IF NOT EXISTS idx_pricing_plans_card ON pricing_plans(card_title);`,
    `CREATE INDEX IF NOT EXISTS idx_jobs_active ON jobs(is_active);`,
    `CREATE INDEX IF NOT EXISTS idx_blogs_category ON blogs(category);`,
    `CREATE INDEX IF NOT EXISTS idx_applications_job ON job_applications(job_id);`
  ];

  for (const stmt of schemaStatements) {
    await client.execute(stmt);
  }

  console.log("✅ Schema initialized successfully.");

  // 1. Services
  if (Array.isArray(dbJson.services)) {
    console.log(`📥 Migrating ${dbJson.services.length} services...`);
    for (let i = 0; i < dbJson.services.length; i++) {
      const s = dbJson.services[i];
      await client.execute({
        sql: `INSERT OR REPLACE INTO services (id, title, desc, icon_name, sort_order) VALUES (?, ?, ?, ?, ?)`,
        args: [s.id, s.title, s.desc, s.iconName || "globe", i]
      });
    }
  }

  // 2. Jobs
  if (Array.isArray(dbJson.jobs)) {
    console.log(`📥 Migrating ${dbJson.jobs.length} jobs...`);
    for (let i = 0; i < dbJson.jobs.length; i++) {
      const j = dbJson.jobs[i];
      await client.execute({
        sql: `INSERT OR REPLACE INTO jobs (id, title, department, location, experience, qualifications, type, description, requirements, is_active, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
        args: [
          j.id,
          j.title,
          j.department,
          j.location,
          j.experience,
          j.qualifications || "",
          j.type || "Full-Time",
          j.description || "",
          JSON.stringify(j.requirements || []),
          i
        ]
      });
    }
  }

  // 3. Blogs
  if (Array.isArray(dbJson.blogs)) {
    console.log(`📥 Migrating ${dbJson.blogs.length} blogs...`);
    for (let i = 0; i < dbJson.blogs.length; i++) {
      const b = dbJson.blogs[i];
      await client.execute({
        sql: `INSERT OR REPLACE INTO blogs (id, title, summary, content, category, author, cover_image, publish_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          b.id,
          b.title,
          b.summary || "",
          b.content || "",
          b.category || "Technology",
          b.author || "Ananya Hi Solutions",
          b.coverImage || "/images/hero/blog_hero_bg.png",
          b.date || new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
        ]
      });
    }
  }

  // 4. Packages & Categories & Cards
  if (Array.isArray(dbJson.packages)) {
    console.log(`📥 Migrating ${dbJson.packages.length} package categories & cards...`);
    for (let catIdx = 0; catIdx < dbJson.packages.length; catIdx++) {
      const cat = dbJson.packages[catIdx];
      await client.execute({
        sql: `INSERT OR REPLACE INTO package_categories (key, title, is_single_card, sort_order) VALUES (?, ?, ?, ?)`,
        args: [cat.key, cat.title, cat.isSingleCard ? 1 : 0, catIdx]
      });

      if (Array.isArray(cat.cards)) {
        for (let cardIdx = 0; cardIdx < cat.cards.length; cardIdx++) {
          const card = cat.cards[cardIdx];
          await client.execute({
            sql: `INSERT OR REPLACE INTO package_cards (category_key, title, image, features, link, sort_order) VALUES (?, ?, ?, ?, ?, ?)`,
            args: [
              cat.key,
              card.title,
              card.image || "",
              JSON.stringify(card.features || []),
              card.link || "",
              cardIdx
            ]
          });
        }
      }
    }
  }

  // 5. Pricing Plans
  if (dbJson.plans && typeof dbJson.plans === "object") {
    const cardTitles = Object.keys(dbJson.plans);
    console.log(`📥 Migrating pricing plans for ${cardTitles.length} cards...`);
    for (const cardTitle of cardTitles) {
      const plansList = dbJson.plans[cardTitle];
      if (Array.isArray(plansList)) {
        for (let pIdx = 0; pIdx < plansList.length; pIdx++) {
          const p = plansList[pIdx];
          await client.execute({
            sql: `INSERT INTO pricing_plans (card_title, name, icon, price, billing, is_popular, features, note, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [
              cardTitle,
              p.name,
              p.icon || "🎯",
              p.price,
              p.billing,
              p.isPopular ? 1 : 0,
              JSON.stringify(p.features || []),
              p.note || "",
              pIdx
            ]
          });
        }
      }
    }
  }

  // 6. Homepage Banners
  if (Array.isArray(dbJson.banners)) {
    console.log(`📥 Migrating ${dbJson.banners.length} banners...`);
    for (let i = 0; i < dbJson.banners.length; i++) {
      const ban = dbJson.banners[i];
      await client.execute({
        sql: `INSERT INTO banners (title, desc, path, bg_image, btn_text, sort_order) VALUES (?, ?, ?, ?, ?, ?)`,
        args: [ban.title || "", ban.desc || "", ban.path, ban.bgImage, ban.btnText || "", i]
      });
    }
  }

  // 7. Marquee Logos
  if (Array.isArray(dbJson.marqueeLogos)) {
    console.log(`📥 Migrating ${dbJson.marqueeLogos.length} marquee logos...`);
    for (let i = 0; i < dbJson.marqueeLogos.length; i++) {
      const logo = dbJson.marqueeLogos[i];
      await client.execute({
        sql: `INSERT INTO marquee_logos (src, name, row_number, sort_order) VALUES (?, ?, ?, ?)`,
        args: [logo.src, logo.name || "", logo.row || 1, i]
      });
    }
  }

  // 8. Job Applications
  if (Array.isArray(dbJson.applications)) {
    console.log(`📥 Migrating ${dbJson.applications.length} job applications...`);
    for (const app of dbJson.applications) {
      await client.execute({
        sql: `INSERT OR REPLACE INTO job_applications (id, job_id, job_title, candidate_name, candidate_email, candidate_phone, cover_letter, resume_file_name, resume_size, applied_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          app.id,
          app.jobId,
          app.jobTitle,
          app.candidateName,
          app.candidateEmail,
          app.candidatePhone,
          app.coverLetter || "",
          app.resumeFileName || "",
          app.resumeSize || 0,
          app.appliedAt || new Date().toISOString()
        ]
      });
    }
  }

  // 9. Unlocked Leads
  if (Array.isArray(dbJson.unlockedPackages)) {
    console.log(`📥 Migrating ${dbJson.unlockedPackages.length} unlocked package leads...`);
    for (const lead of dbJson.unlockedPackages) {
      await client.execute({
        sql: `INSERT OR REPLACE INTO unlocked_leads (id, name, email, phone, company, package_title, sub_id, submitted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          lead.id,
          lead.name,
          lead.email,
          lead.phone,
          lead.company || "",
          lead.packageTitle,
          lead.subId || "",
          lead.submittedAt || new Date().toISOString()
        ]
      });
    }
  }

  // 10. Audit Requests
  if (Array.isArray(dbJson.audits)) {
    console.log(`📥 Migrating ${dbJson.audits.length} audit requests...`);
    for (const aud of dbJson.audits) {
      await client.execute({
        sql: `INSERT OR REPLACE INTO audit_requests (id, name, email, phone, company, website, submitted_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [
          aud.id,
          aud.name,
          aud.email,
          aud.phone,
          aud.company || "",
          aud.website || "",
          aud.submittedAt || new Date().toISOString()
        ]
      });
    }
  }

  // 11. Contact Messages
  if (Array.isArray(dbJson.messages)) {
    console.log(`📥 Migrating ${dbJson.messages.length} contact messages...`);
    for (const msg of dbJson.messages) {
      await client.execute({
        sql: `INSERT OR REPLACE INTO contact_messages (id, name, phone, email, message, submitted_at) VALUES (?, ?, ?, ?, ?, ?)`,
        args: [
          msg.id,
          msg.name,
          msg.phone,
          msg.email,
          msg.message,
          msg.submittedAt || new Date().toISOString()
        ]
      });
    }
  }

  console.log("✨ Migration completed successfully!");

  // Quick summary counts
  const tables = [
    "services",
    "jobs",
    "blogs",
    "package_categories",
    "package_cards",
    "pricing_plans",
    "banners",
    "marquee_logos",
    "job_applications",
    "unlocked_leads",
    "audit_requests",
    "contact_messages"
  ];

  console.log("\n📊 Verification Table Counts:");
  for (const tbl of tables) {
    const res = await client.execute(`SELECT COUNT(*) as count FROM ${tbl}`);
    console.log(`  - ${tbl}: ${res.rows[0].count} records`);
  }
}

migrate().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
