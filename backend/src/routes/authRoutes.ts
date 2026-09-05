import { Router } from "express";
import { login,signup,googleAuth } from "../controllers/authController";

const authRouter = Router();

authRouter.post("/signup",signup);
authRouter.post("/login",login);
authRouter.post("/google",googleAuth);

export default authRouter;