import type { Request, Response, NextFunction } from "express";
import { getOrCreateProfile } from "../lib/getOrCreateProfile";

declare global {
  namespace Express {
    interface Request {
      isAdmin?: boolean;
    }
  }
}

export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (!req.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const profile = await getOrCreateProfile(req.userId);
    if (!profile.isAdmin) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    req.isAdmin = true;
    next();
  } catch (err) {
    req.log?.error({ err }, "requireAdmin failed");
    res.status(500).json({ error: "Internal error" });
  }
}
