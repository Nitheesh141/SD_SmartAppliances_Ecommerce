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

// Admin pages
const AdminDashboardPage = dynamic(() => import("../app/admin/dashboard_page"), {
  loading: PageLoader,
  ssr: true,
});

const AdminManageProductPage = dynamic(() => import("../app/admin/manage-product_page"), {
  loading: PageLoader,
  ssr: true,
});

const AdminProductsPage = dynamic(() => import("../app/admin/products"), {
  loading: PageLoader,
  ssr: true,
});

const AdminMarketingPage = dynamic(() => import("../app/admin/marketing"), {
  loading: PageLoader,
  ssr: true,
});

const AdminOrdersPage = dynamic(() => import("../app/admin/orders_page"), {
  loading: PageLoader,
  ssr: true,
});

const AdminSettingsPage = dynamic(() => import("../app/admin/settings_page"), {
  loading: PageLoader,
  ssr: true,
});

const AdminServiceRequestsPage = dynamic(() => import("../app/admin/service_requests_page"), {
  loading: PageLoader,
  ssr: true,
});

const ForgotPasswordPage = dynamic(() => import("../app/auth/forgot-password_page"), {
  loading: PageLoader,
  ssr: true,
});

const DistributorSignupPage = dynamic(() => import("../app/auth/distributor_signup_page"), {
  loading: PageLoader,
  ssr: true,
});

const DistributerDashboardPage = dynamic(() => import("../app/distributor/distributer_dashboard"), {
  loading: PageLoader,
  ssr: true,
});

const AdminDistributorsPage = dynamic(() => import("../app/admin/distributors_page"), {
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

const OrderDetailPage = dynamic(() => import("../app/account/orders/orderdetailpage"), {
  loading: PageLoader,
  ssr: true,
});

const ShopPage = dynamic(() => import("../app/shop/shoppage"), {
  loading: PageLoader,
  ssr: true,
});

const ProductDetailPage = dynamic(() => import("../app/product/productpage"), {
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
  "/auth/distributor-signup": DistributorSignupPage,
  "/distributor/dashboard": DistributerDashboardPage,
  "/admin/distributors": AdminDistributorsPage,
  "/admin/dashboard": AdminDashboardPage,
  "/admin/products": AdminProductsPage,
  "/admin/orders": AdminOrdersPage,
  "/admin/service-requests": AdminServiceRequestsPage,
  "/admin/marketing": AdminMarketingPage,
  "/admin/settings": AdminSettingsPage,
  "/admin/manage-product": AdminManageProductPage,
  "/admin/manage": AdminManageProductPage,
  "/auth/forgot-password": ForgotPasswordPage,
  "/about": AboutPage,
  "/contact": ContactPage,
  "/cart": CartPage,
  "/wishlist": WishlistPage,
  "/account": AccountPage,
  "/checkout": CheckoutPage,
  "/shop": ShopPage,
  "/support": SupportPage,
  "/warranty-registration": WarrantyRegistrationPage,
  "/service-request": ServiceRequestPage,
  "/track-order": TrackOrderPage,
  "/return-policy": ReturnPolicyPage,
  "/faqs": FAQsPage,
};

export function getRouteComponent(path: string) {
  const cleanPath = path === "/" ? "/" : path.replace(/\/$/, "");
  if (cleanPath.startsWith("/product/")) {
    return ProductDetailPage;
  }
  if (cleanPath.startsWith("/account/orders/")) {
    return OrderDetailPage;
  }
  return routes[cleanPath] || null;
}
