export default function robots() {
  const baseUrl = "https://ananyahisolutions.com";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
