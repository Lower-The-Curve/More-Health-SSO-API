import { Router, type IRouter } from "express";
import { db, addressTable } from "@workspace/db";
import { and, desc, eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

function toApi(a: typeof addressTable.$inferSelect) {
  return {
    id: a.id,
    label: a.label,
    recipient: a.recipient,
    line1: a.line1,
    line2: a.line2,
    city: a.city,
    region: a.region,
    postalCode: a.postalCode,
    country: a.country,
    isDefault: a.isDefault,
  };
}

router.get("/addresses", requireAuth, async (req, res) => {
  const rows = await db
    .select()
    .from(addressTable)
    .where(eq(addressTable.clerkUserId, req.userId!))
    .orderBy(desc(addressTable.isDefault), desc(addressTable.createdAt));
  res.json(rows.map(toApi));
});

router.post("/addresses", requireAuth, async (req, res) => {
  const {
    label,
    recipient,
    line1,
    line2,
    city,
    region,
    postalCode,
    country,
    isDefault,
  } = req.body ?? {};
  if (!label || !recipient || !line1 || !city || !region || !postalCode) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  // Enforce a single default per user: if this address is being created as
  // default, demote any prior default first.
  if (isDefault) {
    await db
      .update(addressTable)
      .set({ isDefault: false })
      .where(eq(addressTable.clerkUserId, req.userId!));
  }
  const [created] = await db
    .insert(addressTable)
    .values({
      clerkUserId: req.userId!,
      label,
      recipient,
      line1,
      line2: line2 ?? null,
      city,
      region,
      postalCode,
      country: country ?? "CN",
      isDefault: !!isDefault,
    })
    .returning();
  res.status(201).json(toApi(created!));
});

router.patch("/addresses/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: "Invalid address id" });
    return;
  }
  // Scope check: confirm the address belongs to the caller before any write.
  const [existing] = await db
    .select()
    .from(addressTable)
    .where(
      and(eq(addressTable.id, id), eq(addressTable.clerkUserId, req.userId!)),
    )
    .limit(1);
  if (!existing) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const {
    label,
    recipient,
    line1,
    line2,
    city,
    region,
    postalCode,
    country,
    isDefault,
  } = req.body ?? {};
  const patch: Partial<typeof addressTable.$inferInsert> = {};
  if (typeof label === "string") patch.label = label;
  if (typeof recipient === "string") patch.recipient = recipient;
  if (typeof line1 === "string") patch.line1 = line1;
  if (typeof line2 === "string" || line2 === null) patch.line2 = line2;
  if (typeof city === "string") patch.city = city;
  if (typeof region === "string") patch.region = region;
  if (typeof postalCode === "string") patch.postalCode = postalCode;
  if (typeof country === "string") patch.country = country;
  if (typeof isDefault === "boolean") patch.isDefault = isDefault;

  // Same single-default rule as POST.
  if (patch.isDefault === true) {
    await db
      .update(addressTable)
      .set({ isDefault: false })
      .where(eq(addressTable.clerkUserId, req.userId!));
  }
  const [updated] = await db
    .update(addressTable)
    .set(patch)
    .where(eq(addressTable.id, id))
    .returning();
  res.json(toApi(updated!));
});

router.delete("/addresses/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: "Invalid address id" });
    return;
  }
  const deleted = await db
    .delete(addressTable)
    .where(
      and(eq(addressTable.id, id), eq(addressTable.clerkUserId, req.userId!)),
    )
    .returning({ id: addressTable.id });
  if (deleted.length === 0) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.status(204).end();
});

export default router;
