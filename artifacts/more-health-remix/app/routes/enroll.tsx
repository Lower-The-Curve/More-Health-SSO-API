import type { MetaFunction } from "react-router";
import { AppLayout } from "~/components/shared/AppLayout";

export const meta: MetaFunction = () => [
  { title: "Enroll Partner – More Health" },
];

export default function EnrollPage() {
  return (
    <AppLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Enroll Partner</h1>
          <p className="text-muted-foreground">邀请伙伴</p>
        </div>
      </div>
    </AppLayout>
  );
}
