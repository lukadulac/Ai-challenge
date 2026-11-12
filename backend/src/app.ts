import express from "express";
import { authRoutes, requireStudent } from "./auth";
import type { Db } from "./db";
import { errorHandler, unknownRoute } from "./errors";
import { planRoutes } from "./plans/routes";

export interface AppDeps {
  db: Db;
  jwtSecret: string;
}

export function createApp({ db, jwtSecret }: AppDeps) {
  const app = express();
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });
  app.use("/auth", authRoutes(db, jwtSecret));
  app.use("/plans", requireStudent(jwtSecret), planRoutes(db));

  app.use(unknownRoute);
  app.use(errorHandler);
  return app;
}
