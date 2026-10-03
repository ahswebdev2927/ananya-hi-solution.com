const fs = require("fs");
const path = require("path");
const { createClient } = require("@libsql/client");

// Helper to parse .env file manually if dotenv is not present
function loadEnv() {
  const envPaths = [
    path.join(__dirname, "..", ".env"),
    path.join(__dirname, "..", ".env.local"),
    path.join(__dirname, "..", "..", ".env"),
    path.join(__dirname, "..", "..", ".env.local")
  ];

  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf-8");
      const lines = content.split("\n");
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx > 0) {
          const key = trimmed.slice(0, eqIdx).trim();
          let val = trimmed.slice(eqIdx + 1).trim();
          val = val.replace(/^["']|["']$/g, "");
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    }
  }
}

loadEnv();

async function syncToTurso() {
  console.log("🚀 Starting database synchronization from Local SQLite to Turso Cloud...");

  let tursoUrl = process.env.TURSO_DATABASE_URL?.trim();
  let tursoToken = process.env.TURSO_AUTH_TOKEN?.trim();

  if (!tursoUrl || !tursoToken) {
    console.error("❌ Error: TURSO_DATABASE_URL or TURSO_AUTH_TOKEN not found in .env files!");
    console.log("Please check your .env file in AnanyaHiSolutions/.env");
    process.exit(1);
  }

  // Convert libsql:// to https:// for HTTP/REST compatibility
  if (tursoUrl.startsWith("libsql://")) {
    tursoUrl = tursoUrl.replace("libsql://", "https://");
  }

  const localDbPath = path.join(__dirname, "..", "data", "ananya.db");
  if (!fs.existsSync(localDbPath)) {
    console.error("❌ Error: Local SQLite database not found at:", localDbPath);
    process.exit(1);
  }

  const localClient = createClient({
    url: `file:${localDbPath}`
  });

  const tursoClient = createClient({
    url: tursoUrl,
    authToken: tursoToken
  });

  console.log("📡 Connecting to Turso Cloud at:", tursoUrl.split("@").pop().replace(/^(https?:\/\/)/, ""));

  // 1. Initialize schema on Turso
  console.log("📦 Creating schema and tables on Turso Cloud...");

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
    await tursoClient.execute(stmt);
  }
  console.log("✅ Schema initialized on Turso successfully.");

  // 2. Synchronize each table
  const tables = [
    { name: "services", columns: ["id", "title", "desc", "icon_name", "sort_order", "created_at", "updated_at"] },
    { name: "jobs", columns: ["id", "title", "department", "location", "experience", "qualifications", "type", "description", "requirements", "is_active", "sort_order", "created_at", "updated_at"] },
    { name: "blogs", columns: ["id", "title", "summary", "content", "category", "author", "cover_image", "publish_date", "created_at", "updated_at"] },
    { name: "package_categories", columns: ["key", "title", "is_single_card", "sort_order", "created_at"] },
    { name: "package_cards", columns: ["id", "category_key", "title", "image", "features", "link", "sort_order", "created_at"] },
    { name: "pricing_plans", columns: ["id", "card_title", "name", "icon", "price", "billing", "is_popular", "features", "note", "sort_order", "created_at"] },
    { name: "banners", columns: ["id", "title", "desc", "path", "bg_image", "btn_text", "sort_order", "created_at"] },
    { name: "marquee_logos", columns: ["id", "src", "name", "row_number", "sort_order", "created_at"] },
    { name: "job_applications", columns: ["id", "job_id", "job_title", "candidate_name", "candidate_email", "candidate_phone", "cover_letter", "resume_file_name", "resume_size", "applied_at"] },
    { name: "unlocked_leads", columns: ["id", "name", "email", "phone", "company", "package_title", "sub_id", "submitted_at"] },
    { name: "audit_requests", columns: ["id", "name", "email", "phone", "company", "website", "submitted_at"] },
    { name: "contact_messages", columns: ["id", "name", "phone", "email", "message", "submitted_at"] }
  ];

  for (const t of tables) {
    const localRowsRes = await localClient.execute(`SELECT * FROM ${t.name}`);
    const rows = localRowsRes.rows;
    console.log(`📤 Copying ${rows.length} rows to Turso for table: ${t.name}...`);

    if (rows.length > 0) {
      // Clear target table before syncing
      await tursoClient.execute(`DELETE FROM ${t.name}`);

      const cols = t.columns.join(", ");
      const placeholders = t.columns.map(() => "?").join(", ");
      const insertSql = `INSERT INTO ${t.name} (${cols}) VALUES (${placeholders})`;

      const batchStatements = rows.map((r) => ({
        sql: insertSql,
        args: t.columns.map((col) => (r[col] !== undefined ? r[col] : null))
      }));

      // Send in batches of 50 to avoid payload limits
      for (let i = 0; i < batchStatements.length; i += 50) {
        const chunk = batchStatements.slice(i, i + 50);
        await tursoClient.batch(chunk, "write");
      }
    }
  }

  console.log("\n🎉 Synchronization to Turso Cloud finished successfully!");

  console.log("\n📊 Verification Table Counts on Turso:");
  for (const t of tables) {
    const res = await tursoClient.execute(`SELECT COUNT(*) as count FROM ${t.name}`);
    console.log(`  - ${t.name}: ${res.rows[0].count} records`);
  }
}

syncToTurso().catch((err) => {
  console.error("❌ Turso synchronization failed:", err);
  process.exit(1);
});
