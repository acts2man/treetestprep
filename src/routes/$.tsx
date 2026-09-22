import { createFileRoute, useRouterState } from "@tanstack/react-router";
import { ArmatureRoute } from "@/lib/armature-kit";
import { NotFound } from "@/components/NotFound";

/**
 * The Armature catch-all. It sits after every hand-coded route (TanStack matches those
 * first), so it only runs for paths no coded page owns. <ArmatureRoute> serves a
 * builder-only page published at that path (content/layouts/<slug>.json whose path
 * matches and whose slug is not a coded page); when there is none it renders the site's
 * 404. The path comes from the router so the server and client agree during hydration.
 */
export const Route = createFileRoute("/$")({
  component: ArmatureCatchAll,
});

function ArmatureCatchAll() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  return <ArmatureRoute path={pathname} fallback={<NotFound />} />;
}
