import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { AuthProvider } from "@/providers/AuthProvider";
import { CartProvider } from "@/providers/CartProvider";
import { WishlistProvider } from "@/providers/WishlistProvider";
import { AppRouteGuard } from "@/providers/AppRouteGuard";
import { Toaster } from "sonner";
import { cookies } from "next/headers";

const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#D71920",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://sdsmart.in"),
  title: {
    default: "SD Smart Appliances | Premium Kitchen Appliances Manufacturer in India",
    template: "%s | SD Smart Appliances",
  },
  description: "SD Smart Appliances is a trusted Indian manufacturer of pressure cookers, mixer grinders, wet grinders, gas stoves, cookware, and kitchen appliances with a growing distributor network across India.",
  keywords: [
    "SD Smart Appliances",
    "Pressure Cookers",
    "Mixer Grinders",
    "Wet Grinders",
    "Gas Stoves",
    "Non-stick Cookware",
    "Kitchen Appliances India",
    "Premium Cookware",
    "Coimbatore Appliances Manufacturer"
  ],
  authors: [{ name: "SD Smart Appliances Team", url: "https://sdsmart.in" }],
  publisher: "SD Smart Appliances Pvt. Ltd.",
  verification: {
    google: "j5UeOSDdPhyxAQftYVzbVk2WOxzOwZxoP4W4CTrZrNc",
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://sdsmart.in",
    siteName: "SD Smart Appliances",
    title: "SD Smart Appliances | Premium Kitchen Appliances Manufacturer in India",
    description: "SD Smart Appliances is a trusted Indian manufacturer of pressure cookers, mixer grinders, wet grinders, gas stoves, cookware, and kitchen appliances with a growing distributor network across India.",
    images: [
      {
        url: "/SD-logo.png",
        width: 800,
        height: 600,
        alt: "SD Smart Appliances Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SD Smart Appliances | Premium Kitchen Appliances Manufacturer in India",
    description: "SD Smart Appliances is a trusted Indian manufacturer of pressure cookers, mixer grinders, wet grinders, gas stoves, cookware, and kitchen appliances with a growing distributor network across India.",
    images: ["/SD-logo.png"],
  },
  category: "kitchen appliances",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const userProfileCookie = cookieStore.get("userProfile")?.value;
  let serverUser = null;
  if (userProfileCookie) {
    try {
      serverUser = JSON.parse(decodeURIComponent(userProfileCookie));
    } catch (e) {
      console.error("Failed to parse userProfile cookie in layout:", e);
    }
  }

  return (
    <html
      lang="en"
      suppressHydrationWarning={true}
      className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, "font-sans", jetbrainsMono.variable)}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('admin-theme');
                  var path = window.location.pathname;
                  
                  if (path.indexOf('/admin') !== -1) {
                    if (theme === 'light') {
                      document.documentElement.classList.remove('dark');
                      document.documentElement.style.colorScheme = 'light';
                    } else {
                      document.documentElement.classList.add('dark');
                      document.documentElement.style.colorScheme = 'dark';
                    }
                  } else {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.style.colorScheme = 'light';
                  }
                } catch (e) {}
              })();
            `
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <WishlistProvider>
            <CartProvider>
              <AppRouteGuard serverUser={serverUser}>
                {children}
              </AppRouteGuard>
              <Toaster position="bottom-right" richColors />
            </CartProvider>
          </WishlistProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
