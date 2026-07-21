import { getRouteComponent } from "../../router/routers";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug?: string[] }>;
}

// Fetch helper that runs fully on the server side
async function fetchProductData(productId: string) {
  const endpoints = [
    `http://localhost:5001/api/products/${productId}`,
    `https://sdsmart.in/api/products/${productId}`
  ];

  for (const url of endpoints) {
    try {
      const response = await fetch(url, { next: { revalidate: 3600 } });
      if (response.ok) {
        const data = await response.json();
        const p = data.product || data.data;
        if (p) return p;
      }
    } catch (e) {
      // Continue
    }
  }

  // Fallback static list matching model schema
  const fallbackList = [
    {
      id: "prod-bestseller-1",
      name: "SD Smart IoT Pressure Cooker Pro",
      category: "pressure-cookers",
      categoryLabel: "Pressure Cookers",
      productDescription: "Our flagship smart cooker combines safety, efficiency, and smart connectivity. Designed for modern Indian kitchens, it syncs with our mobile app to automatically execute recipes.",
      image: "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?q=80&w=400",
      price: 6499,
      sku: "SD-PC-IOT-5L",
      modelNumber: "Smart Cooker Pro 5L",
      rating: 4.8,
      reviewCount: 342,
      inStock: true
    },
    {
      id: "prod-bestseller-2",
      name: "SD Ultra-Silent Wet Grinder Pro",
      category: "wet-grinders",
      categoryLabel: "Wet Grinders",
      productDescription: "Redefining wet grinding. Prepare fresh batters silently in peace. Equipped with premium black granite grinding stones and digital timer operations.",
      image: "https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?q=80&w=400",
      price: 7999,
      sku: "SD-WG-SL-2L",
      modelNumber: "Premium Silent WG",
      rating: 4.9,
      reviewCount: 189,
      inStock: true
    },
    {
      id: "prod-bestseller-3",
      name: "SD Intelli-Flame 3-Burner LPG Stove",
      category: "gas-stoves",
      categoryLabel: "LPG Stoves",
      productDescription: "Intelligent auto ignition 3-burner gas stove with high efficiency brass burners and sleek black glass top.",
      image: "https://images.unsplash.com/photo-1621972750749-0fbb1abb7736?q=80&w=400",
      price: 5499,
      sku: "SD-ST-3B",
      modelNumber: "Intelli-Flame 3B",
      rating: 4.7,
      reviewCount: 275,
      inStock: true
    },
    {
      id: "prod-featured-1",
      name: "SD Smart Pressure Cooker Pro (IoT Edition)",
      category: "pressure-cookers",
      categoryLabel: "Pressure Cookers",
      productDescription: "IoT enabled smart pressure cooker with 9-level redundant safety, app-controlled cooking, and tri-ply stainless steel body.",
      image: "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?q=80&w=600",
      price: 6499,
      sku: "SD-PC-IOT-5L-FE",
      modelNumber: "Smart Cooker IoT FE",
      rating: 4.8,
      reviewCount: 342,
      inStock: true
    },
    {
      id: "prod-featured-2",
      name: "SD Premium Silent Wet Grinder",
      category: "wet-grinders",
      categoryLabel: "Wet Grinders",
      productDescription: "Premium wet grinder with dual granite rollers, 150W induction motor, and 0-45 mins digital timer cut-off.",
      image: "https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?q=80&w=600",
      price: 7999,
      sku: "SD-WG-PS-2L-FE",
      modelNumber: "Premium Silent WG FE",
      rating: 4.9,
      reviewCount: 189,
      inStock: true
    }
  ];

  return fallbackList.find(p => p.id === productId) || null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const slug = resolvedParams.slug || [];
  const path = "/" + slug.join("/");

  // Dashboard & Admin protection pages should not be indexed by search engines
  if (path.startsWith("/admin") || path.startsWith("/sales") || path.startsWith("/dashboard") || path.startsWith("/distributor/dashboard")) {
    return {
      title: "Dashboard",
      robots: { index: false, follow: false },
    };
  }

  const baseUrl = "https://sdsmart.in";
  const canonicalUrl = `${baseUrl}${path}`;

  // Product detail pages
  if (path.startsWith("/product/") || path.startsWith("/products/")) {
    const productId = path.split("/product/")[1] || path.split("/products/")[1] || "";
    const product = await fetchProductData(productId);

    if (product) {
      const title = `${product.name} | SD Smart ${product.categoryLabel || "Appliances"}`;
      const desc = product.productDescription || product.description || `Buy ${product.name} online from SD Smart Appliances. Premium kitchen appliance with reliable warranty.`;
      const imgUrl = product.image || "/SD-logo.png";
      const productKeywords = [
        product.name,
        product.categoryLabel || "",
        "SD Smart",
        product.modelNumber || "",
        "Buy online India"
      ].filter(Boolean);

      return {
        title,
        description: desc,
        keywords: productKeywords,
        alternates: { canonical: canonicalUrl },
        openGraph: {
          title,
          description: desc,
          url: canonicalUrl,
          type: "website",
          images: [{ url: imgUrl, width: 600, height: 600, alt: product.name }],
        },
        twitter: {
          card: "summary_large_image",
          title,
          description: desc,
          images: [imgUrl],
        },
      };
    }
  }

  // Categories pages (clean URL mapping)
  if (path.startsWith("/categories/")) {
    const categorySlug = path.split("/categories/")[1] || "";
    const displayCategory = categorySlug
      .split("-")
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

    const title = `${displayCategory} | Premium Kitchen Appliances | SD Smart`;
    const desc = `Browse our premium collection of ${displayCategory} engineered for smart efficiency, durability, and safety in modern Indian kitchens.`;
    return {
      title,
      description: desc,
      keywords: [displayCategory, "SD Smart", "Kitchen Appliances India", "Coimbatore Manufacturer"],
      alternates: { canonical: canonicalUrl },
      openGraph: {
        title,
        description: desc,
        url: canonicalUrl,
        images: [{ url: "/SD-logo.png" }],
      },
    };
  }

  // Predefined SEO titles and descriptions for static public routes
  const metadataMap: Record<string, { title: string; desc: string; keywords?: string[] }> = {
    "/about": {
      title: "About Us | SD Smart Kitchen Appliances Manufacturer",
      desc: "Learn about SD Smart Appliances, a leading Indian kitchen appliances brand committed to safety, premium build, and state-of-the-art kitchen innovations.",
      keywords: ["About SD Smart", "Kitchen Appliance Manufacturer India", "Coimbatore Industry"]
    },
    "/contact": {
      title: "Contact Us | SD Smart Customer Care & Enquiries",
      desc: "Get in touch with SD Smart Appliances customer support. Find toll-free numbers, office address, and contact forms for sales and distribution enquiries.",
      keywords: ["SD Smart Customer Care", "Appliance Service Number", "Contact SD Smart"]
    },
    "/shop": {
      title: "Shop Premium Kitchen Appliances Online | SD Smart",
      desc: "Buy mixer grinders, pressure cookers, wet grinders, and gas stoves directly from SD Smart. Avail free delivery, direct warranty, and discounts.",
      keywords: ["Shop Smart Appliances", "Buy Kitchenware Online", "Pressure Cookers Store"]
    },
    "/warranty-registration": {
      title: "Online Warranty Registration | SD Smart Appliances",
      desc: "Register your SD Smart kitchen appliances warranty online. Secure your 5-year or 10-year product warranty easily with your purchase invoice.",
      keywords: ["Appliance Warranty Register", "Online Warranty India", "SD Smart Warranty"]
    },
    "/service-request": {
      title: "Book Kitchen Appliance Service & Repair | SD Smart",
      desc: "Submit a service request or repair ticket for your SD Smart cooker, wet grinder, or stove. Certified technicians and genuine spare parts.",
      keywords: ["Request Appliance Service", "Doorstep Cooker Repair", "Wet Grinder Service"]
    },
    "/support": {
      title: "Help Center & Customer Support | SD Smart Appliances",
      desc: "Access user manuals, troubleshooting guides, warranty details, and locate service centers near you. We're here to help.",
      keywords: ["Help Center", "Troubleshooting Guide", "Service Center Locator"]
    },
    "/return-policy": {
      title: "Returns & Refund Policy | SD Smart Appliances",
      desc: "Read our terms for return, replacement, and refunds on kitchen appliances purchased online. Hassle-free customer satisfaction policy.",
    },
    "/faqs": {
      title: "Frequently Asked Questions (FAQs) | SD Smart Appliances",
      desc: "Answers to common queries about product operations, maintenance tips, warranty claims, dealer applications, and shipping support.",
    },
    "/track-order": {
      title: "Track Your Appliance Order | SD Smart Appliances",
      desc: "Enter your order ID or tracking code to trace your package delivery status in real-time.",
    },
    "/track-service-request": {
      title: "Track Service Ticket Status | SD Smart Repair",
      desc: "Check the live status of your home service appointment, technician visit, and repair progress.",
    },
    "/auth/login": {
      title: "Dealer & Customer Login | SD Smart Portal",
      desc: "Access your dashboard to view dealer pricing, order history, track shipments, and request support.",
    },
    "/auth/signup": {
      title: "Create Account | SD Smart Appliances Online Shop",
      desc: "Sign up as a customer to buy premium smart appliances, save wishlist products, and track orders.",
    },
    "/auth/distributor-signup": {
      title: "Distributor & Dealer Registration | Partner with SD Smart",
      desc: "Join our fast-growing sales network. Apply online to become an authorized distributor or dealer of SD Smart Appliances.",
    },
  };

  const pageMeta = metadataMap[path] || {
    title: "SD Smart Appliances | Indian Kitchen Appliances Brand",
    desc: "SD Smart Appliances offers premium pressure cookers, wet grinders, mixer grinders, gas stoves, and cookware with long manufacturer warranties.",
  };

  return {
    title: pageMeta.title,
    description: pageMeta.desc,
    keywords: pageMeta.keywords,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: pageMeta.title,
      description: pageMeta.desc,
      url: canonicalUrl,
      images: [{ url: "/SD-logo.png" }],
    },
    twitter: {
      card: "summary_large_image",
      title: pageMeta.title,
      description: pageMeta.desc,
      images: ["/SD-logo.png"],
    },
  };
}

export default async function CatchAllPage({ params }: PageProps) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug || [];
  const path = "/" + slug.join("/");

  // Server-side admin protection for any admin route slug
  if (path.startsWith("/admin")) {
    const cookieStore = await cookies();
    const userProfileCookie = cookieStore.get("userProfile")?.value;
    let isAdmin = false;

    if (userProfileCookie) {
      try {
        const loggedUser = JSON.parse(decodeURIComponent(userProfileCookie));
        const role = loggedUser?.role?.toUpperCase();
        if (role === "ADMIN" || role === "SUPERADMIN" || loggedUser.role === "admin" || loggedUser.role === "superadmin") {
          isAdmin = true;
        }
      } catch (e) {
        console.error("Failed to parse userProfile cookie in CatchAllPage:", e);
      }
    }

    if (!isAdmin) {
      redirect("/auth/login");
    }
  }

  const PageComponent = getRouteComponent(path);
  console.log(`[CatchAllPage] Path resolved: "${path}", PageComponent found: ${PageComponent ? "YES" : "NO"}`);

  if (!PageComponent) {
    notFound();
  }

  // Generate dynamic schema data based on page route
  let breadcrumbSchema: any = null;
  let productSchema: any = null;
  let faqSchema: any = null;

  // Product detail pages schema
  if (path.startsWith("/product/") || path.startsWith("/products/")) {
    const productId = path.split("/product/")[1] || path.split("/products/")[1] || "";
    const product = await fetchProductData(productId);

    if (product) {
      productSchema = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": product.name,
        "image": product.image || "/SD-logo.png",
        "description": product.productDescription || product.description || `Buy ${product.name} online from SD Smart.`,
        "sku": product.sku || product.id,
        "mpn": product.modelNumber || product.id,
        "brand": {
          "@type": "Brand",
          "name": "SD Smart"
        },
        "offers": {
          "@type": "Offer",
          "url": `https://sdsmart.in/product/${product.id}`,
          "priceCurrency": "INR",
          "price": product.price || 0,
          "priceValidUntil": "2030-12-31",
          "itemCondition": "https://schema.org/NewCondition",
          "availability": product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          "seller": {
            "@type": "Organization",
            "name": "SD Smart Appliances"
          }
        },
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": product.rating || 5.0,
          "reviewCount": product.reviewCount || 1
        }
      };

      breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://sdsmart.in"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "Shop",
            "item": "https://sdsmart.in/shop"
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": product.categoryLabel || "Appliance",
            "item": `https://sdsmart.in/categories/${product.category || "appliances"}`
          },
          {
            "@type": "ListItem",
            "position": 4,
            "name": product.name,
            "item": `https://sdsmart.in/product/${product.id}`
          }
        ]
      };
    }
  }
  // Category pages schema
  else if (path.startsWith("/categories/")) {
    const categorySlug = path.split("/categories/")[1] || "";
    const displayCategory = categorySlug
      .split("-")
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

    breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://sdsmart.in"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Shop",
          "item": "https://sdsmart.in/shop"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": displayCategory,
          "item": `https://sdsmart.in/categories/${categorySlug}`
        }
      ]
    };
  }
  // FAQ page schema
  else if (path === "/faqs") {
    faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "How can I register my SD Smart appliance warranty?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "You can register your warranty online via our warranty registration page by submitting your dealer purchase invoice, serial number, and customer details."
          }
        },
        {
          "@type": "Question",
          "name": "What is the warranty period for SD Smart appliances?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Most SD Smart pressure cookers come with a 5-year or 10-year manufacturer warranty. Mixer grinders and wet grinders generally come with a 2-year or 5-year warranty. Please check your specific product details."
          }
        },
        {
          "@type": "Question",
          "name": "How do I request a service visit or repair?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Go to the Service Request page, submit a ticket detailing your issue, purchase place, and contact number. Our support team will assign a certified technician to inspect and repair your appliance at your doorstep."
          }
        },
        {
          "@type": "Question",
          "name": "How can I apply to become an authorized dealer or distributor?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Interested business partners can fill out the Distributor Registration form under the distributor portal. Our regional sales representative will contact you with dealer pricing lists and schemes."
          }
        }
      ]
    };
  }
  // Other public static page breadcrumbs
  else if (!path.startsWith("/admin") && !path.startsWith("/sales") && !path.startsWith("/auth") && path !== "/") {
    const pageLabel = path.replace("/", "").split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://sdsmart.in"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": pageLabel,
          "item": `https://sdsmart.in${path}`
        }
      ]
    };
  }

  // Intercept category routes and pass the category value down as a prop to ShopPage
  if (path.startsWith("/categories/")) {
    const categorySlug = path.split("/categories/")[1] || "";
    return (
      <>
        {breadcrumbSchema && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
          />
        )}
        <PageComponent initialCategory={categorySlug} />
      </>
    );
  }

  return (
    <>
      {breadcrumbSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        />
      )}
      {productSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
        />
      )}
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
      <PageComponent />
    </>
  );
}
