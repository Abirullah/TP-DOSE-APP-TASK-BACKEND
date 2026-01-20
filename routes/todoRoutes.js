import express from "express";
const router = express.Router();
import * as controller from "../controllers/todoController.js";
import auth from "../middleware/authMiddleware.js";

// protect todo routes - only authenticated users may access
router.use(auth);

router.get("/stats", controller.getStats);

router.route("/").get(controller.getTodos).post(controller.createTodo);
router
  .route("/:id")
  .get(controller.getTodoById)
  .put(controller.updateTodo)
  .delete(controller.deleteTodo);

export default router;
