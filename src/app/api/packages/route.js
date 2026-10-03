import { NextResponse } from "next/server";
import { getDbClient, initDatabaseSchema, verifyToken } from "../db-helper";

export async function GET() {
  try {
    await initDatabaseSchema();
    const db = getDbClient();

    const [categoriesRes, cardsRes, plansRes] = await Promise.all([
      db.execute("SELECT key, title, is_single_card as isSingleCard, sort_order FROM package_categories ORDER BY sort_order ASC, rowid ASC"),
      db.execute("SELECT category_key, title, image, features, link, sort_order FROM package_cards ORDER BY sort_order ASC, id ASC"),
      db.execute("SELECT card_title, name, icon, price, billing, is_popular as isPopular, features, note, sort_order FROM pricing_plans ORDER BY sort_order ASC, id ASC")
    ]);

    // Group cards by category
    const cardsByCategory = {};
    for (const card of cardsRes.rows) {
      let parsedFeatures = [];
      try {
        parsedFeatures = typeof card.features === "string" ? JSON.parse(card.features) : (card.features || []);
      } catch (e) {
        parsedFeatures = [];
      }

      if (!cardsByCategory[card.category_key]) {
        cardsByCategory[card.category_key] = [];
      }

      cardsByCategory[card.category_key].push({
        title: card.title,
        image: card.image,
        features: parsedFeatures,
        link: card.link
      });
    }

    // Build packages list
    const packages = categoriesRes.rows.map((cat) => ({
      key: cat.key,
      title: cat.title,
      isSingleCard: Boolean(cat.isSingleCard),
      cards: cardsByCategory[cat.key] || []
    }));

    // Group plans by card_title
    const plans = {};
    for (const p of plansRes.rows) {
      let parsedFeatures = [];
      try {
        parsedFeatures = typeof p.features === "string" ? JSON.parse(p.features) : (p.features || []);
      } catch (e) {
        parsedFeatures = [];
      }

      if (!plans[p.card_title]) {
        plans[p.card_title] = [];
      }

      plans[p.card_title].push({
        name: p.name,
        icon: p.icon || "🎯",
        price: p.price,
        billing: p.billing,
        isPopular: Boolean(p.isPopular),
        features: parsedFeatures,
        note: p.note || ""
      });
    }

    return NextResponse.json({ packages, plans });
  } catch (error) {
    console.error("Error fetching packages & plans:", error);
    return NextResponse.json({ error: "Failed to fetch packages" }, { status: 500 });
  }
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

    await initDatabaseSchema();
    const db = getDbClient();

    // Prepare batch operations
    const batchStatements = [];

    // 1. Clear existing package structures
    batchStatements.push({ sql: "DELETE FROM package_cards", args: [] });
    batchStatements.push({ sql: "DELETE FROM package_categories", args: [] });
    batchStatements.push({ sql: "DELETE FROM pricing_plans", args: [] });

    // 2. Insert categories & cards
    if (Array.isArray(packages)) {
      for (let catIdx = 0; catIdx < packages.length; catIdx++) {
        const cat = packages[catIdx];
        batchStatements.push({
          sql: "INSERT INTO package_categories (key, title, is_single_card, sort_order) VALUES (?, ?, ?, ?)",
          args: [cat.key, cat.title, cat.isSingleCard ? 1 : 0, catIdx]
        });

        if (Array.isArray(cat.cards)) {
          for (let cardIdx = 0; cardIdx < cat.cards.length; cardIdx++) {
            const card = cat.cards[cardIdx];
            batchStatements.push({
              sql: "INSERT INTO package_cards (category_key, title, image, features, link, sort_order) VALUES (?, ?, ?, ?, ?, ?)",
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

    // 3. Insert pricing plans
    if (plans && typeof plans === "object") {
      const cardTitles = Object.keys(plans);
      for (const cardTitle of cardTitles) {
        const plansList = plans[cardTitle];
        if (Array.isArray(plansList)) {
          for (let pIdx = 0; pIdx < plansList.length; pIdx++) {
            const p = plansList[pIdx];
            batchStatements.push({
              sql: "INSERT INTO pricing_plans (card_title, name, icon, price, billing, is_popular, features, note, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
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

    await db.batch(batchStatements, "write");

    return NextResponse.json({ success: true, packages, plans });
  } catch (error) {
    console.error("Error saving packages & plans:", error);
    return NextResponse.json({ error: error.message || "Failed to save packages" }, { status: 500 });
  }
}
