import { getDbClient, initDatabaseSchema } from "../lib/db.js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const BASE_URL = "https://ananyahisolutions.com";

const SERVICES = [
  "web-design",
  "digital-marketing",
  "mobile-app",
  "ecommerce-app",
  "video-production",
  "software-development",
  "seo",
  "aeo",
  "geo",
  "aio",
  "sxo",
  "youtube-seo",
  "youtube-ads",
];

export default async function sitemap() {
  const currentDate = new Date().toISOString();

  // 1. Static Core Pages (Public Only)
  const staticRoutes = [
    {
      url: `${BASE_URL}`,
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/careers`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/careers/apply`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/packages`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/packages/compare`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/packages/plans`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/blogs`,
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 0.7,
    },
  ];

  // 2. Service Pages (13 Services)
  const serviceRoutes = SERVICES.map((serviceId) => ({
    url: `${BASE_URL}/services/${serviceId}`,
    lastModified: currentDate,
    changeFrequency: "weekly",
    priority: 0.9,
  }));

  // 3. Dynamic Blog Articles from Database (filter out any admin/api entries)
  let blogRoutes = [];
  try {
    await initDatabaseSchema();
    const db = getDbClient();
    const result = await db.execute(`
      SELECT slug, id, updated_at as updatedAt, publish_date as publishDate, created_at as createdAt
      FROM blogs
      ORDER BY created_at DESC
    `);

    if (result.rows && result.rows.length > 0) {
      blogRoutes = result.rows
        .filter((blog) => {
          const rawSlug = String(blog.slug || blog.id || "").toLowerCase();
          return (
            rawSlug &&
            !rawSlug.startsWith("admin") &&
            !rawSlug.startsWith("api")
          );
        })
        .map((blog) => {
          const slug = blog.slug || blog.id;
          const lastMod =
            blog.updatedAt || blog.publishDate || blog.createdAt || currentDate;
          let safeDate = currentDate;
          try {
            const parsed = new Date(lastMod);
            if (!isNaN(parsed.getTime())) {
              safeDate = parsed.toISOString();
            }
          } catch (e) {
            safeDate = currentDate;
          }
          return {
            url: `${BASE_URL}/blogs/${encodeURIComponent(slug)}`,
            lastModified: safeDate,
            changeFrequency: "weekly",
            priority: 0.7,
          };
        });
    }
  } catch (error) {
    console.error("Error generating blog routes for sitemap:", error);
  }

  return [...staticRoutes, ...serviceRoutes, ...blogRoutes];
}
