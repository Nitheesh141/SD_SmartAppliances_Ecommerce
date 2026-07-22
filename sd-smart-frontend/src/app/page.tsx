import { getRouteComponent } from "../router/routers";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "SD Smart Appliances | Premium Kitchen Appliances Manufacturer in India",
    description: "SD Smart Appliances is a trusted Indian manufacturer of pressure cookers, mixer grinders, wet grinders, gas stoves, cookware, and kitchen appliances with a growing distributor network across India.",
    alternates: {
      canonical: "https://sdsmart.in/",
    },
  };
}

interface HomePageProps {
  searchParams: Promise<{ bypass?: string }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const resolvedSearchParams = await searchParams;
  const bypass = resolvedSearchParams.bypass === "true";

  if (!bypass) {
    const cookieStore = await cookies();
    const adminLandingBypass = cookieStore.get("adminLandingBypass")?.value === "true";

    if (!adminLandingBypass) {
      const userProfileCookie = cookieStore.get("userProfile")?.value;
      if (userProfileCookie) {
        let loggedUser = null;
        try {
          loggedUser = JSON.parse(decodeURIComponent(userProfileCookie));
        } catch (e) {
          console.error("Failed to parse userProfile cookie:", e);
        }

        if (loggedUser) {
          const role = loggedUser?.role?.toUpperCase();
          if (role === "ADMIN" || role === "SUPERADMIN" || loggedUser.role === "admin" || loggedUser.role === "superadmin") {
            redirect("/admin/dashboard");
          }
        }
      }
    }
  }

  const PageComponent = getRouteComponent("/");

  if (!PageComponent) {
    notFound();
  }

  // Home Page Schemas (Organization & Website)
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": "https://sdsmart.in/#organization",
    "name": "SD Smart Appliances",
    "url": "https://sdsmart.in",
    "logo": "https://sdsmart.in/SD-logo.png",
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "1800-123-9397",
      "contactType": "customer service",
      "areaServed": "IN",
      "availableLanguage": "en"
    },
    "sameAs": [
      "https://facebook.com/sdsmartappliances",
      "https://instagram.com/sdsmartappliances",
      "https://twitter.com/sdsmartappliances"
    ]
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": "https://sdsmart.in/#website",
    "url": "https://sdsmart.in",
    "name": "SD Smart Appliances",
    "description": "SD Smart Appliances is a trusted Indian manufacturer of pressure cookers, mixer grinders, wet grinders, gas stoves, cookware, and kitchen appliances.",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://sdsmart.in/shop?search={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <PageComponent />
    </>
  );
}
