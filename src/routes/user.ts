import { Router } from "express";
import {
  create,
  getAll,
  getById,
  update,
  softDelete,
} from "../controllers/user";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";

const router = Router();
router.use(authenticate); // 🔐 Enable globally if needed

router.post("/", authorize(["manage_users"]), create);
router.get("/", authorize(["manage_users"]), getAll);
router.get("/:id", authorize(["manage_users"]), getById);
router.put("/:id", authorize(["manage_users"]), update);
router.delete("/:id", authorize(["manage_users"]), softDelete);

export default router;
