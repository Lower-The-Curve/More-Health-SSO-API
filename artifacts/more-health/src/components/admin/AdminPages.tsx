import { AdminLayout } from "./AdminLayout";
import {
  UsersPanel,
  OrdersPanel,
  IntegrationsPanel,
  SettingsPanel,
} from "@/components/mockups/growth-hub/Admin";
import { TranslationsPanel } from "./TranslationsPanel";

export function AdminUsersPage() {
  return (
    <AdminLayout active="users">
      <UsersPanel />
    </AdminLayout>
  );
}

export function AdminOrdersPage() {
  return (
    <AdminLayout active="orders">
      <OrdersPanel />
    </AdminLayout>
  );
}

export function AdminIntegrationsPage() {
  return (
    <AdminLayout active="integrations">
      <IntegrationsPanel />
    </AdminLayout>
  );
}

export function AdminSettingsPage() {
  return (
    <AdminLayout active="settings">
      <SettingsPanel />
    </AdminLayout>
  );
}

export function AdminTranslationsPage() {
  return (
    <AdminLayout active="translations">
      <TranslationsPanel />
    </AdminLayout>
  );
}
