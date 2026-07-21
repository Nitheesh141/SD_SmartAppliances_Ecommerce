import { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://sdsmart.in";

  // Static pages of the website
  const staticRoutes = [
    "",
    "/about",
    "/contact",
    "/shop",
    "/warranty-registration",
    "/service-request",
    "/support",
    "/return-policy",
    "/faqs",
    "/track-order",
    "/track-service-request",
    "/auth/login",
    "/auth/signup",
    "/auth/distributor-signup",
  ];

  const sitemapEntries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "daily" : "weekly",
    priority: route === "" ? 1.0 : 0.8,
  }));

  // Add category pages with clean URLs
  const categories = [
    "pressure-cookers",
    "non-stick",
    "gas-stoves",
    "wet-grinders",
    "commercial",
  ];

  categories.forEach((cat) => {
    sitemapEntries.push({
      url: `${baseUrl}/categories/${cat}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    });
  });

  // Dynamically fetch products from API
  const productIds = ["prod-bestseller-1", "prod-bestseller-2", "prod-bestseller-3", "prod-featured-1", "prod-featured-2"];
  let productsData: any[] = [];

  const endpoints = [
    "http://localhost:5001/api/products",
    "https://sdsmart.in/api/products"
  ];

  for (const url of endpoints) {
    try {
      const response = await fetch(url, { next: { revalidate: 3600 } });
      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data.products) && data.products.length > 0) {
          productsData = data.products;
          break;
        }
      }
    } catch (e) {
      // Ignore and try next endpoint
    }
  }

  if (productsData.length > 0) {
    productsData.forEach((product: any) => {
      sitemapEntries.push({
        url: `${baseUrl}/product/${product.id}`,
        lastModified: new Date(product.updatedAt || new Date()),
        changeFrequency: "daily",
        priority: 0.7,
      });
    });
  } else {
    // Fallback to hardcoded list if API is offline during build
    productIds.forEach((id) => {
      sitemapEntries.push({
        url: `${baseUrl}/product/${id}`,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 0.7,
      });
    });
  }

  return sitemapEntries;
}
