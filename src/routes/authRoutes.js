import express from "express";
const router = express.Router();
import { signup, verifyEmail, login, logout } from "../controller/authController.js";

router.post("/signup",  signup);
router.post("/verify", verifyEmail);
router.post("/login", login);
router.post("/logout", logout);

export default router;
