import { getDbClient, initDatabaseSchema } from "../../lib/db";

// Simple token validation helper
export function verifyToken(req) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return false;
  
  const token = authHeader.replace("Bearer ", "");
  return token === "ananya-secure-admin-token-2026";
}

export { getDbClient, initDatabaseSchema };
