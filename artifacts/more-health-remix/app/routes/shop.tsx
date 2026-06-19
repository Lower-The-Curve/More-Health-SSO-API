import type { MetaFunction } from "react-router";
import { AppLayout } from "~/components/shared/AppLayout";

export const meta: MetaFunction = () => [
  { title: "Shop Products – More Health" },
];

export default function ShopPage() {
  return (
    <AppLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Shop Products</h1>
          <p className="text-muted-foreground">商城</p>
        </div>
      </div>
    </AppLayout>
  );
}
