import { Router } from "express"; // ✅ CORRECT
import { loginHandler, signupHandler } from "../controllers/auth";

const router = Router();
/**
 * @route POST /api/auth/login
 * @desc Authenticates Firebase user and issues JWT
 */
router.post("/login", loginHandler);
router.post("/signup", signupHandler);

export default router;
