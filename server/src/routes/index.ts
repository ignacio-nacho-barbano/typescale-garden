import express, { Router } from "express";
import { UsersRoutes } from "./users";

const router = Router();

router.use("/users", UsersRoutes);
// router.use('/tags', TagRoutes);

export const MainRouter: Router = router;
