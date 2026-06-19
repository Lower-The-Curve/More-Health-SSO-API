import type { MetaFunction } from "react-router";
import { AppLayout } from "~/components/shared/AppLayout";

export const meta: MetaFunction = () => [
  { title: "Wallet – More Health" },
];

export default function WalletPage() {
  return (
    <AppLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Wallet</h1>
          <p className="text-muted-foreground">钱包</p>
        </div>
      </div>
    </AppLayout>
  );
}
