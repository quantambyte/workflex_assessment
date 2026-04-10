import { Router } from "express";
import { authController } from "@/src/controllers/auth.controller";

const router = Router();

router.post("/saml/metadata", authController.uploadMetadata);
router.get("/saml/login", authController.initiateSSO);
router.post("/saml/callback", authController.handleCallback);

router.get("/2fa/setup", authController.setup2FA);
router.post("/2fa/verify", authController.verifyAndEnable2FA);

export default router;
