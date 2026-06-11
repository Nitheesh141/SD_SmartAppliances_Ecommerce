import { getRouteComponent } from "../../router/routers";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ slug?: string[] }>;
}

export default async function CatchAllPage({ params }: PageProps) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug || [];
  const path = "/" + slug.join("/");

  const PageComponent = getRouteComponent(path);

  if (!PageComponent) {
    notFound();
  }

  return <PageComponent />;
}
