import express, { Router } from "express";
import { UsersRoutes } from "./users";
import { TypescalesRouter } from "./typescales";
import { PluginRouter } from "./plugin";
import { FavoritesRouter } from "./favorites";
import { getDefaultTypescales } from "../controllers/typescales";

const router = Router();

router.get("/status", getDefaultTypescales);
router.use("/users", UsersRoutes);
router.use("/typescales", TypescalesRouter);
router.use("/favorites", FavoritesRouter);
// Figma plugin pairing and reads. Carries its own credential type — see ./plugin.
router.use("/plugin", PluginRouter);

export const MainRouter: Router = router;
