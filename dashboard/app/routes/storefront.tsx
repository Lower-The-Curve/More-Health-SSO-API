import type { MetaFunction } from "react-router";
import { useTranslation } from "react-i18next";
import { AppLayout } from "@/components/layout/AppLayout";

export const meta: MetaFunction = () => [
  { title: "My Storefront – More Health" },
];

export default function StorefrontPage() {
  const { t } = useTranslation("common");
  return (
    <AppLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("pages.storefront.title")}</h1>
          <p className="text-muted-foreground">{t("pages.storefront.subtitle")}</p>
        </div>
      </div>
    </AppLayout>
  );
}
