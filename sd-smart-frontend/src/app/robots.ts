import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin/",
        "/admin",
        "/dashboard/",
        "/dashboard",
        "/api/",
        "/api",
        "/sales/",
        "/sales",
        "/distributor/dashboard",
        "/account/",
        "/checkout",
        "/cart",
        "/wishlist",
      ],
    },
    sitemap: "https://sdsmart.in/sitemap.xml",
  };
}
