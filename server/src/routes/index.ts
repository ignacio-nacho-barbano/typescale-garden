import express, { Router } from "express";
import { UsersRoutes } from "./users";
import { TypescalesRouter } from "./typescales";

const router = Router();

router.use("/users", UsersRoutes);
router.use("/typescales", TypescalesRouter);
// router.use('/tags', TagRoutes);

export const MainRouter: Router = router;
