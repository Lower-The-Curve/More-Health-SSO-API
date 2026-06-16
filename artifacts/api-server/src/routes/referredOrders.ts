import { Router, type IRouter } from "express";
import { db, orderTable } from "@workspace/db";
import { desc, eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.get("/referred-orders", requireAuth, async (req, res) => {
  const rows = await db
    .select()
    .from(orderTable)
    .where(eq(orderTable.referrerClerkUserId, req.userId!))
    .orderBy(desc(orderTable.occurredAt));
  res.json(
    rows.map((o) => ({
      id: o.id,
      orderName: o.orderName,
      customerName: o.customerName,
      productName: o.productName,
      amountCents: o.amountCents,
      cvCents: o.cvCents,
      qvCents: o.qvCents,
      currency: o.currency,
      status: o.status,
      sponsorId: o.sponsorId,
      occurredAt: o.occurredAt.toISOString(),
      lineItems: o.lineItems,
    })),
  );
});

export default router;
