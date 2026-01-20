import express from "express";
const router = express.Router();
import * as controller from "../controllers/authController.js";
import auth from "../middleware/authMiddleware.js";

router.post("/signup", controller.signup);
router.post("/signin", controller.signin);
router.put("/update/:id", auth, controller.updateUser);
router.post("/start", auth, controller.startWorking);

export default router;
