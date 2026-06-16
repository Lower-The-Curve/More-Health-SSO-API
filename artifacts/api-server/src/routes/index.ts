import { Router, type IRouter } from "express";
import healthRouter from "./health";
import profileRouter from "./profile";
import dashboardRouter from "./dashboard";
import storefrontRouter from "./storefront";
import ordersRouter from "./orders";
import addressesRouter from "./addresses";
import adminRouter from "./admin";
import onboardingRouter from "./onboarding";
import smsRouter from "./sms";
import appSettingsRouter from "./appSettings";
import signupRouter from "./signup";
import referredOrdersRouter from "./referredOrders";
import sponsorsRouter from "./sponsors";
import downlineRouter from "./downline";
import translationsRouter from "./translations";

const router: IRouter = Router();

router.use(healthRouter);
router.use(profileRouter);
router.use(dashboardRouter);
router.use(storefrontRouter);
router.use(ordersRouter);
router.use(addressesRouter);
router.use(adminRouter);
router.use(onboardingRouter);
router.use(smsRouter);
router.use(appSettingsRouter);
router.use(signupRouter);
router.use(referredOrdersRouter);
router.use(sponsorsRouter);
router.use(downlineRouter);
router.use(translationsRouter);

export default router;
