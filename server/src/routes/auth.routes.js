import { Router } from "express";
import { registerUser, signInUser } from "../controllers/auth.controllers.js";

const authRouter = Router()

authRouter.post("/signup", registerUser);
authRouter.post("/signin", signInUser);

export default authRouter