import type { MetaFunction } from "react-router";
import { Dashboard } from "~/components/mockups/Dashboard";

export const meta: MetaFunction = () => [
  { title: "More Health – Partner Dashboard" },
];

export default function Index() {
  return <Dashboard />;
}
