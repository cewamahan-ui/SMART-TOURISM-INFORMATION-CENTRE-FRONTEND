import { createFileRoute } from "@tanstack/react-router";
import BusinessDashboard from "@/components/business_feature/dashboard/BusinessDashboard";

export const Route = createFileRoute("/business-dashboard")({
  head: () => ({ meta: [{ title: "Business Dashboard — SafariSmart" }] }),
  component: BusinessDashboard,
});
