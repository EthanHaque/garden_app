import { Router, type Request, type Response } from "express";
import { authRouter } from "./auth";

export const apiRouter: Router = Router();

apiRouter.get("/healthz", (_req: Request, res: Response) => {
    res.status(200).json({ status: "OK" });
});

// Authentication routes
apiRouter.use("/auth", authRouter);
