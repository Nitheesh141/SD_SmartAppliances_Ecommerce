import { getRouteComponent } from "../router/routers";
import { notFound } from "next/navigation";

export default function HomePage() {
  const PageComponent = getRouteComponent("/");

  if (!PageComponent) {
    notFound();
  }

  return <PageComponent />;
}
