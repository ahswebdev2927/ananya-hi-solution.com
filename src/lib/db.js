import path from "path";
import fs from "fs";
import { createClient } from "@libsql/client";

let dbClient = null;
let schemaInitialized = false;

/**
 * Returns a singleton LibSQL client configured for:
 * - Production: Turso Cloud if TURSO_DATABASE_URL and TURSO_AUTH_TOKEN are provided
 * - Development: Local SQLite file (data/ananya.db)
 */
export function getDbClient() {
  if (dbClient) return dbClient;

  let url = process.env.TURSO_DATABASE_URL?.replace(/^["']|["']$/g, "")
    ?.trim()
    ?.split(/[\s\r\n]+/)[0];
  let authToken = process.env.TURSO_AUTH_TOKEN?.replace(/^["']|["']$/g, "")
    ?.trim()
    ?.split(/[\s\r\n]+/)[0];

  if (url && authToken) {
    if (url.startsWith("libsql://")) {
      url = url.replace("libsql://", "https://");
    }
    dbClient = createClient({
      url,
      authToken,
    });
  } else {
    // Local SQLite file setup
    const dataDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const dbPath = path.join(dataDir, "ananya.db");
    dbClient = createClient({
      url: `file:${dbPath}`,
    });
  }

  return dbClient;
}

/**
 * Ensures all decoupled tables and indexes are created.
 */
export async function initDatabaseSchema() {
  if (schemaInitialized) return;

  const client = getDbClient();

  const statements = [
    // 1. Services Table
    `CREATE TABLE IF NOT EXISTS services (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      desc TEXT NOT NULL,
      icon_name TEXT DEFAULT 'globe',
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,

    // 2. Careers / Jobs Table
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

    // 3. News & Blogs Table
    `CREATE TABLE IF NOT EXISTS blogs (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      slug TEXT UNIQUE,
      summary TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT NOT NULL,
      author TEXT DEFAULT 'Ananya Hi Solutions',
      cover_image TEXT,
      meta_title TEXT,
      meta_description TEXT,
      meta_keywords TEXT,
      publish_date TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,

    // 4. Package Categories Table
    `CREATE TABLE IF NOT EXISTS package_categories (
      key TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      is_single_card INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,

    // 5. Package Cards Table
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

    // 6. Pricing Plans Table
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

    // 7. Banners Table
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

    // 8. Marquee Logos Table
    `CREATE TABLE IF NOT EXISTS marquee_logos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      src TEXT NOT NULL,
      name TEXT NOT NULL,
      row_number INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,

    // 9. Job Applications Table
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

    // 10. Unlocked Leads Table
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

    // 11. Audit Requests Table
    `CREATE TABLE IF NOT EXISTS audit_requests (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      company TEXT,
      website TEXT,
      submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,

    // 12. Contact Messages Table
    `CREATE TABLE IF NOT EXISTS contact_messages (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT NOT NULL,
      message TEXT NOT NULL,
      submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,

    // Indexes for fast querying
    `CREATE INDEX IF NOT EXISTS idx_package_cards_category ON package_cards(category_key);`,
    `CREATE INDEX IF NOT EXISTS idx_pricing_plans_card ON pricing_plans(card_title);`,
    `CREATE INDEX IF NOT EXISTS idx_jobs_active ON jobs(is_active);`,
    `CREATE INDEX IF NOT EXISTS idx_blogs_category ON blogs(category);`,
    `CREATE INDEX IF NOT EXISTS idx_applications_job ON job_applications(job_id);`,
  ];

  for (const stmt of statements) {
    await client.execute(stmt);
  }

  // Safe migration checks for blogs table extensions (slug & SEO fields)
  const blogAlterStatements = [
    "ALTER TABLE blogs ADD COLUMN slug TEXT",
    "ALTER TABLE blogs ADD COLUMN meta_title TEXT",
    "ALTER TABLE blogs ADD COLUMN meta_description TEXT",
    "ALTER TABLE blogs ADD COLUMN meta_keywords TEXT"
  ];

  for (const alterStmt of blogAlterStatements) {
    try {
      await client.execute(alterStmt);
    } catch {
      // Column may already exist in SQLite/Turso
    }
  }

  try {
    await client.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_blogs_slug ON blogs(slug);");
  } catch {}

  // Backfill missing slugs for any legacy blog records
  try {
    const unslugged = await client.execute("SELECT id, title FROM blogs WHERE slug IS NULL OR slug = ''");
    if (unslugged.rows && unslugged.rows.length > 0) {
      for (const row of unslugged.rows) {
        const generatedSlug = (row.title || row.id)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)+/g, "");
        await client.execute({
          sql: "UPDATE blogs SET slug = ? WHERE id = ?",
          args: [generatedSlug || row.id, row.id]
        });
      }
    }
  } catch (err) {
    console.error("Slug backfill non-critical error:", err);
  }

  schemaInitialized = true;
}
