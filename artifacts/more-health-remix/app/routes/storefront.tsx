import type { MetaFunction } from "react-router";
import { AppLayout } from "~/components/shared/AppLayout";

export const meta: MetaFunction = () => [
  { title: "My Storefront – More Health" },
];

export default function StorefrontPage() {
  return (
    <AppLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Storefront</h1>
          <p className="text-muted-foreground">我的店铺</p>
        </div>
      </div>
    </AppLayout>
  );
}
