import { getRouteComponent } from "../../router/routers";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";

interface PageProps {
  params: Promise<{ slug?: string[] }>;
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

  if (!PageComponent) {
    notFound();
  }

  return <PageComponent />;
}
