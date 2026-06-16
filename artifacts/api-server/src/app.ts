import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import authRouter from "./routes/auth";
import webhooksRouter from "./routes/webhooks";
import { buildSessionMiddleware } from "./lib/session";
import { logger } from "./lib/logger";

const app: Express = express();

// Behind the shared reverse proxy: trust the first hop so secure cookies and
// req.protocol/req.ip reflect the original client.
app.set("trust proxy", 1);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(cors({ credentials: true, origin: true }));

// Webhooks must be mounted BEFORE express.json so handlers can read the
// raw body for HMAC verification.
app.use("/api", webhooksRouter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Server-side session (BFF auth). Mounted before auth + API routes so they can
// read/establish the session.
app.use(buildSessionMiddleware());

// Auth routes (OIDC login/callback/logout/me) live under /api/auth.
app.use("/api", authRouter);

app.use("/api", router);

export default app;
