import crypto from "crypto";
import { NextResponse } from "next/server";
import { getDbClient, ensureInitialized } from "@/lib/db";

export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate",
};

const CATEGORY_PREFIX_MAP = {
  "digital-marketing": "DM",
  "web-development": "WD",
  "app-development": "AD",
  "spa-services": "SPA",
};

/**
 * Constant-time verification of the CRM sync API key.
 * Checks `Authorization: Bearer <token>` or `x-crm-api-key: <token>`.
 */
function verifyCrmRequest(request) {
  const configuredKey = process.env.CRM_SYNC_API_KEY?.replace(/^["']|["']$/g, "").trim();

  if (!configuredKey || configuredKey.length < 16) {
    return {
      ok: false,
      status: 503,
      error: "CRM sync API key is not configured on the server",
    };
  }

  let incomingToken = "";
  const authHeader = request.headers.get("authorization");
  if (authHeader && /^Bearer\s+/i.test(authHeader)) {
    incomingToken = authHeader.replace(/^Bearer\s+/i, "").trim();
  } else {
    const headerKey = request.headers.get("x-crm-api-key");
    if (headerKey) {
      incomingToken = headerKey.trim();
    }
  }

  if (!incomingToken) {
    return {
      ok: false,
      status: 401,
      error: "Missing CRM API key",
    };
  }

  const hashIncoming = crypto.createHash("sha256").update(incomingToken, "utf8").digest();
  const hashExpected = crypto.createHash("sha256").update(configuredKey, "utf8").digest();

  const isMatch = crypto.timingSafeEqual(
    Buffer.from(hashIncoming),
    Buffer.from(hashExpected)
  );

  if (!isMatch) {
    return {
      ok: false,
      status: 401,
      error: "Invalid CRM API key",
    };
  }

  return { ok: true };
}

/**
 * Safely parse JSON array strings stored in Turso TEXT columns.
 */
function parseJsonArray(raw) {
  if (Array.isArray(raw)) return raw.map((item) => String(item));
  if (typeof raw !== "string" || !raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map((item) => String(item)) : [];
  } catch {
    return [];
  }
}

/**
 * Generate a deterministic uppercase SKU code (max 50 chars) from
 * (category_key, card_title, plan_name).
 * Example: ("digital-marketing", "Social Media Marketing", "Basic") -> "DM-SOCIAL-MEDIA-MARKETING-BASIC"
 */
function buildDeterministicSku(categoryKey, cardTitle, planName) {
  const cleanCategoryKey = String(categoryKey || "gen").toLowerCase().trim();
  const prefix =
    CATEGORY_PREFIX_MAP[cleanCategoryKey] ||
    cleanCategoryKey
      .split(/[^a-z0-9]+/)
      .filter(Boolean)
      .map((w) => w[0])
      .join("")
      .toUpperCase() ||
    "SVC";

  const slugifyUpper = (str) =>
    String(str || "")
      .replace(/\(.*?\)/g, "") // strip parenthetical subtitle for clean SKU
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

  const cardPart = slugifyUpper(cardTitle) || "SERVICE";
  const planPart = slugifyUpper(planName) || "CUSTOM";

  const fullCode = `${prefix}-${cardPart}-${planPart}`;
  if (fullCode.length <= 50) {
    return fullCode;
  }

  // Deterministic truncation preserving prefix and plan suffix within 50 chars
  const maxCardLen = Math.max(8, 50 - prefix.length - planPart.length - 2);
  const truncatedCard = cardPart.slice(0, maxCardLen).replace(/-+$/, "");
  return `${prefix}-${truncatedCard}-${planPart}`.slice(0, 50);
}

/**
 * Parse price text (e.g. "₹15,000") into integer minor units (paise/cents).
 * Defaults to 0 for custom/contact pricing.
 */
function parsePriceMinorUnits(priceText) {
  if (!priceText || typeof priceText !== "string") return 0;
  const cleaned = priceText.replace(/[^0-9.]/g, "");
  if (!cleaned) return 0;
  const numeric = parseFloat(cleaned);
  if (!Number.isFinite(numeric) || numeric < 0) return 0;
  return Math.round(numeric * 100);
}

/**
 * Normalize billing text into "monthly" or "one_time".
 */
function normalizeBillingModel(billingText) {
  const text = String(billingText || "");
  if (/month|mo\b|recurring|retainer|30\s*days/i.test(text)) {
    return "monthly";
  }
  return "one_time";
}

/**
 * Recursively expand "Everything in Basic" and "Everything in Standard"
 * references from sibling plans of the same card_title, mirroring
 * `getExpandedFeatures` in `src/app/packages/plans/page.js`.
 */
function expandPlanFeatures(plan, siblingPlans, visited = new Set()) {
  if (!plan || !Array.isArray(plan.rawFeatures) || visited.has(plan.name)) {
    return [];
  }
  visited.add(plan.name);

  let expanded = [];
  for (const feature of plan.rawFeatures) {
    const cleanFeature = String(feature).trim().toLowerCase();

    if (cleanFeature.startsWith("everything in basic")) {
      const basicPlan = siblingPlans.find((p) =>
        String(p.name || "").toLowerCase().includes("basic")
      );
      if (basicPlan) {
        expanded = [
          ...expanded,
          ...expandPlanFeatures(basicPlan, siblingPlans, new Set(visited)),
        ];
      } else {
        expanded.push(feature);
      }
    } else if (cleanFeature.startsWith("everything in standard")) {
      const standardPlan = siblingPlans.find((p) =>
        String(p.name || "").toLowerCase().includes("standard")
      );
      if (standardPlan) {
        expanded = [
          ...expanded,
          ...expandPlanFeatures(standardPlan, siblingPlans, new Set(visited)),
        ];
      } else {
        expanded.push(feature);
      }
    } else {
      expanded.push(feature);
    }
  }

  return expanded;
}

export async function GET(request) {
  const authResult = verifyCrmRequest(request);
  if (!authResult.ok) {
    return NextResponse.json(
      { success: false, error: authResult.error },
      { status: authResult.status, headers: NO_STORE_HEADERS }
    );
  }

  try {
    await ensureInitialized();
    const db = getDbClient();

    const [categoriesRes, cardsRes, plansRes, servicesRes] = await Promise.all([
      db.execute(
        "SELECT key, title, is_single_card, sort_order FROM package_categories ORDER BY sort_order ASC"
      ),
      db.execute(
        "SELECT id, category_key, title, image, features, link, sort_order FROM package_cards ORDER BY sort_order ASC"
      ),
      db.execute(
        "SELECT id, card_title, name, icon, price, billing, is_popular, features, note, sort_order FROM pricing_plans ORDER BY sort_order ASC"
      ),
      db.execute(
        "SELECT id, title, desc, icon_name, sort_order FROM services ORDER BY sort_order ASC"
      ),
    ]);

    const categoryRows = categoriesRes.rows || [];
    const cardRows = cardsRes.rows || [];
    const planRows = plansRes.rows || [];
    const serviceRows = servicesRes.rows || [];

    // Map categories by key
    const categoryByKey = new Map();
    for (const cat of categoryRows) {
      categoryByKey.set(String(cat.key), {
        key: String(cat.key),
        title: String(cat.title || ""),
        isSingleCard: Boolean(cat.is_single_card),
        sortOrder: Number(cat.sort_order ?? 0),
      });
    }

    // Group pricing plans by card_title (with case-insensitive lookup fallback)
    const plansByCardTitle = new Map();
    for (const p of planRows) {
      const cardTitle = String(p.card_title || "").trim();
      const rawFeatures = parseJsonArray(p.features);
      const planObj = {
        id: p.id,
        cardTitle,
        name: String(p.name || "").trim(),
        icon: String(p.icon || "🎯"),
        priceText: String(p.price || "").trim(),
        billingText: String(p.billing || "").trim(),
        isPopular: Boolean(p.is_popular),
        rawFeatures,
        note: String(p.note || "").trim(),
        sortOrder: Number(p.sort_order ?? 0),
      };

      if (!plansByCardTitle.has(cardTitle)) {
        plansByCardTitle.set(cardTitle, []);
      }
      plansByCardTitle.get(cardTitle).push(planObj);
    }

    const findPlansForCard = (cardTitle) => {
      if (plansByCardTitle.has(cardTitle)) {
        return { matchedKey: cardTitle, plans: plansByCardTitle.get(cardTitle) };
      }
      const lowerTitle = cardTitle.toLowerCase();
      for (const [key, list] of plansByCardTitle.entries()) {
        if (
          key.toLowerCase() === lowerTitle ||
          (lowerTitle.includes("seo") && key.toLowerCase().includes("seo"))
        ) {
          return { matchedKey: key, plans: list };
        }
      }
      return { matchedKey: null, plans: [] };
    };

    const catalogItems = [];
    const matchedPlanCardKeys = new Set();

    // Process each package_card in category + card sort order
    for (const card of cardRows) {
      const cardTitle = String(card.title || "").trim();
      const categoryKey = String(card.category_key || "").trim();
      const categoryObj = categoryByKey.get(categoryKey) || {
        key: categoryKey || "uncategorized",
        title: categoryKey || "Uncategorized Packages",
        isSingleCard: false,
        sortOrder: 999,
      };

      const { matchedKey, plans: cardPlans } = findPlansForCard(cardTitle);
      if (matchedKey) {
        matchedPlanCardKeys.add(matchedKey);
      }

      if (cardPlans.length > 0) {
        for (const plan of cardPlans) {
          const resolvedFeatures = expandPlanFeatures(plan, cardPlans);
          catalogItems.push({
            externalId: `plan:${plan.id}`,
            code: buildDeterministicSku(categoryObj.key, cardTitle, plan.name),
            name: `${cardTitle} - ${plan.name}`,
            category: categoryObj.title,
            categoryKey: categoryObj.key,
            serviceType: cardTitle,
            plan: plan.name,
            billingModel: normalizeBillingModel(plan.billingText),
            billingText: plan.billingText,
            priceMinorUnits: parsePriceMinorUnits(plan.priceText),
            priceText: plan.priceText,
            features: resolvedFeatures,
            rawFeatures: plan.rawFeatures,
            note: plan.note,
            isPopular: plan.isPopular,
            sortOrder: plan.sortOrder,
          });
        }
      } else {
        // Single-card or custom package with no pricing_plans rows
        const cardFeatures = parseJsonArray(card.features);
        catalogItems.push({
          externalId: `card:${card.id}`,
          code: buildDeterministicSku(categoryObj.key, cardTitle, "Custom"),
          name: `${cardTitle} - Custom`,
          category: categoryObj.title,
          categoryKey: categoryObj.key,
          serviceType: cardTitle,
          plan: "Custom",
          billingModel: "one_time",
          billingText: "one-time",
          priceMinorUnits: 0,
          priceText: "Custom",
          features: cardFeatures,
          rawFeatures: cardFeatures,
          note: "",
          isPopular: false,
          sortOrder: Number(card.sort_order ?? 0),
        });
      }
    }

    // Include any pricing_plans whose card_title wasn't matched to a package_cards row
    for (const [cardTitle, orphanPlans] of plansByCardTitle.entries()) {
      if (matchedPlanCardKeys.has(cardTitle)) continue;
      for (const plan of orphanPlans) {
        const resolvedFeatures = expandPlanFeatures(plan, orphanPlans);
        catalogItems.push({
          externalId: `plan:${plan.id}`,
          code: buildDeterministicSku("general", cardTitle, plan.name),
          name: `${cardTitle} - ${plan.name}`,
          category: "General Packages",
          categoryKey: "general",
          serviceType: cardTitle,
          plan: plan.name,
          billingModel: normalizeBillingModel(plan.billingText),
          billingText: plan.billingText,
          priceMinorUnits: parsePriceMinorUnits(plan.priceText),
          priceText: plan.priceText,
          features: resolvedFeatures,
          rawFeatures: plan.rawFeatures,
          note: plan.note,
          isPopular: plan.isPopular,
          sortOrder: plan.sortOrder,
        });
      }
    }

    const standaloneServices = serviceRows.map((svc) => ({
      id: String(svc.id),
      title: String(svc.title || ""),
      description: String(svc.desc || ""),
      iconName: String(svc.icon_name || "globe"),
      sortOrder: Number(svc.sort_order ?? 0),
    }));

    return NextResponse.json(
      {
        success: true,
        syncedAt: new Date().toISOString(),
        source: "ahs-public-website-turso",
        summary: {
          categoriesCount: categoryRows.length,
          serviceTypesCount: cardRows.length,
          catalogItemsCount: catalogItems.length,
          standaloneServicesCount: standaloneServices.length,
        },
        data: {
          catalogItems,
          standaloneServices,
        },
      },
      { status: 200, headers: NO_STORE_HEADERS }
    );
  } catch (error) {
    console.error("Error in GET /api/crm/services:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch live service catalog from Turso database",
      },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}

function methodNotAllowed() {
  return NextResponse.json(
    {
      success: false,
      error: "Method Not Allowed. This endpoint is strictly read-only (GET only).",
    },
    {
      status: 405,
      headers: {
        ...NO_STORE_HEADERS,
        Allow: "GET",
      },
    }
  );
}

export async function POST() {
  return methodNotAllowed();
}

export async function PUT() {
  return methodNotAllowed();
}

export async function PATCH() {
  return methodNotAllowed();
}

export async function DELETE() {
  return methodNotAllowed();
}
