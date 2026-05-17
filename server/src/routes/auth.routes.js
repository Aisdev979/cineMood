import { Router } from "express";
import { registerUser, signInUser, verifyOtp, me, refreshToken, logout } from "../controllers/auth.controllers.js";
import { protect } from "../middlewares/auth.middleware.js";

const authRouter = Router()

authRouter.post("/signup", registerUser);
authRouter.post("/signin", signInUser);
authRouter.post("/verify-otp", verifyOtp);
authRouter.get("/me", protect, me);
authRouter.post("/refresh", refreshToken);
authRouter.post("/logout", logout);

export default authRouter
