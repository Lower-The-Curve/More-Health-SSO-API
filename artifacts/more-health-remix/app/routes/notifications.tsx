import type { MetaFunction } from "react-router";
import { useTranslation } from "react-i18next";
import { AppLayout } from "~/components/shared/AppLayout";

export const meta: MetaFunction = () => [
  { title: "Notifications – More Health" },
];

export default function NotificationsPage() {
  const { t } = useTranslation("common");
  return (
    <AppLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("pages.notifications.title")}</h1>
          <p className="text-muted-foreground">{t("pages.notifications.subtitle")}</p>
        </div>
      </div>
    </AppLayout>
  );
}
