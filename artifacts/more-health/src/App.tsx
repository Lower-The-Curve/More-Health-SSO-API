import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/lib/i18n";
import { queryClient } from "@/lib/queryClient";
import { AuthProvider, useAuth, startLogin } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import NotFound from "@/pages/not-found";

import { Dashboard } from "@/components/mockups/growth-hub/Dashboard";
import { Orders } from "@/components/mockups/growth-hub/Orders";
import { Earnings } from "@/components/mockups/growth-hub/Earnings";
import { Storefront } from "@/components/mockups/growth-hub/Storefront";
import { OrderOnBehalf } from "@/components/mockups/growth-hub/OrderOnBehalf";
import { EnrollOnBehalf } from "@/components/mockups/growth-hub/EnrollOnBehalf";
import { Settings } from "@/components/mockups/growth-hub/Settings";
import { Notifications } from "@/components/mockups/growth-hub/Notifications";
import { ActivateAccount } from "@/components/mockups/growth-hub/ActivateAccount";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import {
  AdminUsersPage,
  AdminOrdersPage,
  AdminIntegrationsPage,
  AdminSettingsPage,
  AdminTranslationsPage,
} from "@/components/admin/AdminPages";
import { AdminSignIn } from "@/components/admin/AdminSignIn";
import { AdminUserDetail } from "@/components/admin/AdminUserDetail";
import { AdminOrderDetail } from "@/components/admin/AdminOrderDetail";
import { VerifyPhone } from "@/components/mockups/growth-hub/VerifyPhone";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function FullScreenLoader() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}

function SignInPage() {
  const params = new URLSearchParams(window.location.search);
  const errorCode = params.get("error");
  const errorMessage =
    errorCode === "account_exists"
      ? "An account already exists for that email. Please sign in to continue."
      : errorCode
        ? "We couldn't complete sign-in. Please try again."
        : null;

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 px-4 py-10 gap-6">
      {errorMessage && (
        <div className="w-full max-w-sm rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {errorMessage}
        </div>
      )}
      <div className="w-full max-w-sm rounded-2xl border border-border/40 bg-white p-8 shadow-lg flex flex-col items-center gap-6">
        <img
          src={`${basePath}/logo.svg`}
          alt="More Health"
          className="h-10 w-auto"
        />
        <div className="text-center">
          <h1 className="font-display text-xl text-foreground">
            Welcome to More Health
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to your influencer dashboard
          </p>
        </div>
        <Button className="w-full" onClick={() => startLogin("/dashboard")}>
          Sign in
        </Button>
      </div>
    </div>
  );
}

function HomeRedirect() {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return <FullScreenLoader />;
  return <Redirect to={isSignedIn ? "/dashboard" : "/sign-in"} />;
}

function Protected({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return <FullScreenLoader />;
  if (!isSignedIn) return <Redirect to="/sign-in" />;
  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomeRedirect} />
      <Route path="/login" component={() => <Redirect to="/sign-in" />} />
      <Route path="/sign-in/*?" component={SignInPage} />
      <Route path="/sign-up/*?" component={() => <Redirect to="/activate" />} />
      <Route path="/activate" component={ActivateAccount} />
      <Route path="/dashboard" component={() => <Protected><Dashboard /></Protected>} />
      <Route path="/orders" component={() => <Protected><Orders /></Protected>} />
      <Route path="/earnings" component={() => <Protected><Earnings /></Protected>} />
      <Route path="/storefront" component={() => <Protected><Storefront /></Protected>} />
      <Route path="/order-behalf" component={() => <Protected><OrderOnBehalf /></Protected>} />
      <Route path="/enroll-behalf" component={() => <Protected><EnrollOnBehalf /></Protected>} />
      <Route path="/subscriptions" component={() => <Redirect to="/dashboard" />} />
      <Route path="/settings" component={() => <Protected><Settings /></Protected>} />
      <Route path="/notifications" component={() => <Protected><Notifications /></Protected>} />
      <Route path="/admin/sign-in/*?" component={AdminSignIn} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/users" component={AdminUsersPage} />
      <Route path="/admin/users/:clerkUserId" component={AdminUserDetail} />
      <Route path="/admin/orders" component={AdminOrdersPage} />
      <Route path="/admin/orders/:id" component={AdminOrderDetail} />
      <Route path="/admin/integrations" component={AdminIntegrationsPage} />
      <Route path="/admin/translations" component={AdminTranslationsPage} />
      <Route path="/admin/settings" component={AdminSettingsPage} />
      <Route path="/verify-phone" component={() => <Protected><VerifyPhone /></Protected>} />
      <Route path="/shop" component={() => <Redirect to="/dashboard" />} />
      <Route path="/enroll" component={() => <Redirect to="/dashboard" />} />
      <Route path="/analytics" component={() => <Redirect to="/dashboard" />} />
      <Route path="/team" component={() => <Redirect to="/dashboard" />} />
      <Route path="/support" component={() => <Redirect to="/settings" />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <LanguageProvider>
            <TooltipProvider>
              <Router />
              <Toaster />
            </TooltipProvider>
          </LanguageProvider>
        </AuthProvider>
      </QueryClientProvider>
    </WouterRouter>
  );
}

export default App;
