import type { MetaFunction } from "react-router";
import { AppLayout } from "~/components/shared/AppLayout";

export const meta: MetaFunction = () => [
  { title: "Notifications – More Health" },
];

export default function NotificationsPage() {
  return (
    <AppLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">通知</p>
        </div>
      </div>
    </AppLayout>
  );
}
