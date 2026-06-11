import dynamic from "next/dynamic";
import React from "react";

// Helper loading component
const PageLoader = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-slate-950 font-sans">
    <div className="w-12 h-12 border-4 border-[#D71920]/25 border-t-[#D71920] rounded-full animate-spin"></div>
    <p className="mt-4 text-sm font-semibold text-neutral-500 tracking-wider">Loading...</p>
  </div>
);

// Lazy-loaded route page components

// Auth pages
const LoginPage = dynamic(() => import("../app/auth/login_page"), {
  loading: PageLoader,
  ssr: true,
});

const SignupPage = dynamic(() => import("../app/auth/signup_page"), {
  loading: PageLoader,
  ssr: true,
});

const ForgotPasswordPage = dynamic(() => import("../app/auth/forgot-password_page"), {
  loading: PageLoader,
  ssr: true,
});

// Other pages
const LandingPage = dynamic(() => import("../app/LandingPage/LandingPage"), {
  loading: PageLoader,
  ssr: true,
});

const AboutPage = dynamic(() => import("../app/about/aboutpage"), {
  loading: PageLoader,
  ssr: true,
});

const ContactPage = dynamic(() => import("../app/contact/contactpage"), {
  loading: PageLoader,
  ssr: true,
});

const CartPage = dynamic(() => import("../app/cart/cartpage"), {
  loading: PageLoader,
  ssr: true,
});

const WishlistPage = dynamic(() => import("../app/wishlist/wishlistpage"), {
  loading: PageLoader,
  ssr: true,
});

const AccountPage = dynamic(() => import("../app/account/accountpage"), {
  loading: PageLoader,
  ssr: true,
});

const CheckoutPage = dynamic(() => import("../app/checkout/checkoutpage"), {
  loading: PageLoader,
  ssr: true,
});

const ShopPage = dynamic(() => import("../app/shop/shoppage"), {
  loading: PageLoader,
  ssr: true,
});

// Category components
const PressureCookersPage = dynamic(() => import("../app/shop/pressure-cookers/pressure-cookerspage"), {
  loading: PageLoader,
  ssr: true,
});

const WetGrindersPage = dynamic(() => import("../app/shop/wet-grinders/wet-grinderspage"), {
  loading: PageLoader,
  ssr: true,
});

const GasStovesPage = dynamic(() => import("../app/shop/gas-stoves/gas-stovespage"), {
  loading: PageLoader,
  ssr: true,
});

const NonStickPage = dynamic(() => import("../app/shop/non-stick/non-stickpage"), {
  loading: PageLoader,
  ssr: true,
});

const CommercialPage = dynamic(() => import("../app/shop/commercial/commercialpage"), {
  loading: PageLoader,
  ssr: true,
});

const AccessoriesPage = dynamic(() => import("../app/shop/accessories/accessoriespage"), {
  loading: PageLoader,
  ssr: true,
});

// Support & policies
const SupportPage = dynamic(() => import("../app/support/supportpage"), {
  loading: PageLoader,
  ssr: true,
});

const WarrantyRegistrationPage = dynamic(() => import("../app/warranty-registration/warranty-registrationpage"), {
  loading: PageLoader,
  ssr: true,
});

const ServiceRequestPage = dynamic(() => import("../app/service-request/service-requestpage"), {
  loading: PageLoader,
  ssr: true,
});

const TrackOrderPage = dynamic(() => import("../app/track-order/track-orderpage"), {
  loading: PageLoader,
  ssr: true,
});

const ReturnPolicyPage = dynamic(() => import("../app/return-policy/return-policypage"), {
  loading: PageLoader,
  ssr: true,
});

const FAQsPage = dynamic(() => import("../app/faqs/faqspage"), {
  loading: PageLoader,
  ssr: true,
});

export const routes: Record<string, React.ComponentType<any>> = {
  "/": LandingPage,
  "/auth/login": LoginPage,
  "/auth/signup": SignupPage,
  "/auth/forgot-password": ForgotPasswordPage,
  "/about": AboutPage,
  "/contact": ContactPage,
  "/cart": CartPage,
  "/wishlist": WishlistPage,
  "/account": AccountPage,
  "/checkout": CheckoutPage,
  "/shop": ShopPage,
  "/shop/pressure-cookers": PressureCookersPage,
  "/shop/wet-grinders": WetGrindersPage,
  "/shop/gas-stoves": GasStovesPage,
  "/shop/non-stick": NonStickPage,
  "/shop/commercial": CommercialPage,
  "/shop/accessories": AccessoriesPage,
  "/support": SupportPage,
  "/warranty-registration": WarrantyRegistrationPage,
  "/service-request": ServiceRequestPage,
  "/track-order": TrackOrderPage,
  "/return-policy": ReturnPolicyPage,
  "/faqs": FAQsPage,
};

export function getRouteComponent(path: string) {
  const cleanPath = path === "/" ? "/" : path.replace(/\/$/, "");
  return routes[cleanPath] || null;
}
