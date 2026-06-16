import { Router, type IRouter } from "express";
import { db, orderTable } from "@workspace/db";
import { and, desc, eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.get("/orders", requireAuth, async (req, res) => {
  const rows = await db
    .select()
    .from(orderTable)
    .where(eq(orderTable.clerkUserId, req.userId!))
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
      status: o.status,
      occurredAt: o.occurredAt.toISOString(),
      lineItems: o.lineItems,
    })),
  );
});

/**
 * GET /orders/:id
 *
 * Full detail for one of the caller's own orders. Scoped on clerkUserId so
 * users can't fetch other users' orders by guessing serial IDs.
 */
router.get("/orders/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: "Invalid order id" });
    return;
  }
  const [o] = await db
    .select()
    .from(orderTable)
    .where(and(eq(orderTable.id, id), eq(orderTable.clerkUserId, req.userId!)))
    .limit(1);
  if (!o) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json({
    id: o.id,
    orderName: o.orderName,
    customerName: o.customerName,
    customerEmail: o.customerEmail,
    customerPhone: o.customerPhone,
    productName: o.productName,
    amountCents: o.amountCents,
    commissionCents: o.commissionCents,
    currency: o.currency,
    status: o.status,
    source: o.source,
    occurredAt: o.occurredAt.toISOString(),
    lineItems: o.lineItems,
    discountCodes: o.discountCodes,
    shippingAddress: o.shippingAddress,
    note: o.note,
  });
});

export default router;
