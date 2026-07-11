import { getRouteComponent } from "../router/routers";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";

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

  return <PageComponent />;
}
