import type { MetaFunction } from "react-router";
import { AppLayout } from "~/components/shared/AppLayout";

export const meta: MetaFunction = () => [
  { title: "Orders – More Health" },
];

export default function OrdersPage() {
  return (
    <AppLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground">订单</p>
        </div>
      </div>
    </AppLayout>
  );
}
