import express, { Router } from "express";
import { UsersRoutes } from "./users";
import { TypescalesRouter } from "./typescales";
import { getDefaultTypescales } from "../controllers/typescales";

const router = Router();

router.get("/status", getDefaultTypescales);
router.use("/users", UsersRoutes);
router.use("/typescales", TypescalesRouter);

export const MainRouter: Router = router;
