import express, { Router } from "express";
import { UsersRoutes } from "./users";
import { TypescalesRouter } from "./typescales";
import { PluginRouter } from "./plugin";
import { getDefaultTypescales } from "../controllers/typescales";

const router = Router();

router.get("/status", getDefaultTypescales);
router.use("/users", UsersRoutes);
router.use("/typescales", TypescalesRouter);
// Figma plugin pairing and reads. Carries its own credential type — see ./plugin.
router.use("/plugin", PluginRouter);

export const MainRouter: Router = router;
