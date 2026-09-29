import { promises as fs } from "fs";
import path from "path";
import { createClient } from "@libsql/client";

// Return database absolute path
export function getDbPath() {
  return path.join(process.cwd(), "src", "data", "db.json");
}

// Get Turso client if configured
function getTursoClient() {
  let url = process.env.TURSO_DATABASE_URL?.replace(/^["']|["']$/g, "")?.trim()?.split(/[\s\r\n]+/)[0];
  let authToken = process.env.TURSO_AUTH_TOKEN?.replace(/^["']|["']$/g, "")?.trim()?.split(/[\s\r\n]+/)[0];

  if (url && authToken) {
    // Convert libsql:// to https:// for serverless environments (Vercel)
    if (url.startsWith("libsql://")) {
      url = url.replace("libsql://", "https://");
    }
    return createClient({
      url: url,
      authToken: authToken
    });
  }
  return null;
}

// Read whole DB
export async function readDb() {
  // 1. Try Turso if configured
  const turso = getTursoClient();
  if (turso) {
    try {
      // Ensure the table exists
      await turso.execute(`
        CREATE TABLE IF NOT EXISTS site_data (
          key TEXT PRIMARY KEY,
          value TEXT
        )
      `);

      const result = await turso.execute({
        sql: "SELECT value FROM site_data WHERE key = ?",
        args: ["db_root"]
      });

      if (result.rows && result.rows.length > 0 && result.rows[0].value) {
        return JSON.parse(result.rows[0].value);
      }
      console.warn("Turso table is empty, falling back to local file");
    } catch (error) {
      console.error("Error reading from Turso, falling back to local file:", error);
    }
  }

  // 2. Try Supabase if configured
  const supabaseUrl = process.env.SUPABASE_URL?.replace(/^["']|["']$/g, "");
  const supabaseKey = process.env.SUPABASE_ANON_KEY?.replace(/^["']|["']$/g, "");
  if (supabaseUrl && supabaseKey) {
    try {
      const url = `${supabaseUrl.replace(/\/$/, "")}/rest/v1/site_data?key=eq.db_root`;
      const res = await fetch(url, {
        headers: {
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`
        },
        cache: "no-store"
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0 && data[0].value) {
          return data[0].value;
        }
      } else {
        console.warn(`Supabase fetch returned status ${res.status}, falling back to local file`);
      }
    } catch (error) {
      console.error("Error reading from Supabase, falling back to local file:", error);
    }
  }

  // 3. Fallback to local db.json
  try {
    const filePath = getDbPath();
    const data = await fs.readFile(filePath, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading database file:", error);
    return { services: [], jobs: [], blogs: [] };
  }
}

// Write whole DB
export async function writeDb(data) {
  // 1. Try Turso if configured
  const turso = getTursoClient();
  if (turso) {
    try {
      // Ensure the table exists
      await turso.execute(`
        CREATE TABLE IF NOT EXISTS site_data (
          key TEXT PRIMARY KEY,
          value TEXT
        )
      `);

      // Upsert using INSERT OR REPLACE
      await turso.execute({
        sql: "INSERT OR REPLACE INTO site_data (key, value) VALUES (?, ?)",
        args: ["db_root", JSON.stringify(data)]
      });
      return true;
    } catch (error) {
      console.error("Error writing to Turso database:", error);
      return false;
    }
  }

  // 2. Try Supabase if configured
  const supabaseUrl = process.env.SUPABASE_URL?.replace(/^["']|["']$/g, "");
  const supabaseKey = process.env.SUPABASE_ANON_KEY?.replace(/^["']|["']$/g, "");
  if (supabaseUrl && supabaseKey) {
    try {
      const baseUrl = supabaseUrl.replace(/\/$/, "");
      const res = await fetch(`${baseUrl}/rest/v1/site_data`, {
        method: "POST",
        headers: {
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
          "Prefer": "resolution=merge-duplicates"
        },
        body: JSON.stringify({
          key: "db_root",
          value: data
        })
      });
      if (res.ok) {
        return true;
      }
      const errorText = await res.text();
      console.error("Supabase write failed:", res.status, errorText);
      return false;
    } catch (error) {
      console.error("Error writing to Supabase database:", error);
      return false;
    }
  }

  // 3. Fallback to local db.json
  try {
    const filePath = getDbPath();
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
    return true;
  } catch (error) {
    console.error("Error writing database file:", error);
    return false;
  }
}

// Simple token validation helper
export function verifyToken(req) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return false;
  
  const token = authHeader.replace("Bearer ", "");
  return token === "ananya-secure-admin-token-2026";
}
