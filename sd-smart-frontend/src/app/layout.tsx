import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "SD Smart Appliances",
  description: "Buy smart appliances online",
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
      className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, "font-sans", jetbrainsMono.variable)}
    >
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
