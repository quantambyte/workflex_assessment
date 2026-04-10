import { Router } from "express";
import { userController } from "@/src/controllers";
import { mockAuth, checkPermission, checkRegion } from "@/src/middleware";
import { Permission } from "@/src/types";

const router = Router();

// Apply mockAuth to all user routes for testing
router.use(mockAuth);

router.get(
  "/",
  checkPermission(Permission.VIEW_REGIONAL_USERS),
  checkRegion,
  userController.getAllUsers,
);
router.get("/:id", userController.getUserById);
router.post(
  "/",
  checkPermission(Permission.MANAGE_USERS),
  userController.createUser,
);
router.post(
  "/bulk",
  checkPermission(Permission.MANAGE_USERS),
  userController.bulkImport,
);
router.get("/debug/error", userController.testError);

export default router;
