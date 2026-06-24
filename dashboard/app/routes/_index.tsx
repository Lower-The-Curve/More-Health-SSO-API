import type { MetaFunction } from "react-router";
import { useLoaderData } from "react-router";
import { Dashboard } from "@/components/pages/Dashboard";
import type { DashboardData } from "@/components/pages/Dashboard";
import dashboardData from "@/data/dashboard.json";

export const meta: MetaFunction = () => [
  { title: "More Health – Partner Dashboard" },
];

export async function loader() {
  return dashboardData as DashboardData;
}

export default function Index() {
  const data = useLoaderData<typeof loader>();
  return <Dashboard data={data} />;
}
