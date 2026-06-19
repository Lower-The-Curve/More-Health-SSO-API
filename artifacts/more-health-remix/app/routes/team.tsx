import type { MetaFunction } from "react-router";
import { AppLayout } from "~/components/shared/AppLayout";

export const meta: MetaFunction = () => [
  { title: "Team Builder – More Health" },
];

export default function TeamPage() {
  return (
    <AppLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Team Builder</h1>
          <p className="text-muted-foreground">团队队列</p>
        </div>
      </div>
    </AppLayout>
  );
}
