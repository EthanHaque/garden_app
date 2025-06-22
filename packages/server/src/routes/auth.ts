import { Router } from "express";
import { authController } from "../controllers/auth";
import { validateSignup, validateLogin } from "../middleware/validators";
import { protect } from "../middleware/auth";

export const authRouter: Router = Router();

authRouter.post("/signup", validateSignup, authController.signup);
authRouter.post("/login", validateLogin, authController.login);
authRouter.post("/logout", authController.logout);
authRouter.post("/refresh", authController.refreshToken);
authRouter.get("/check", protect, authController.checkAuth);
