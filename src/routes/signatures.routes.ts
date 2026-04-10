import { Router } from "express";
import { signatureService } from "../services/signature.service";
import { mockAuth } from "../middleware/auth.middleware";

const router = Router();
router.use(mockAuth);

/**
 * @swagger
 * /signatures/sign:
 *   post:
 *     summary: Capture an electronic signature for a document
 *     tags: [Signatures]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               documentId:
 *                 type: string
 *               consent:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Signature captured successfully
 */
router.post("/sign", async (req, res) => {
  const { documentId, consent } = req.body;
  const user = (req as any).user;

  if (!consent) {
    return res.error(
      "Consent is required to capture an electronic signature",
      400,
    );
  }

  const metadata = {
    ipAddress:
      (req.headers["x-forwarded-for"] as string) ||
      req.socket.remoteAddress ||
      "0.0.0.0",
    userAgent: req.headers["user-agent"] || "unknown",
  };

  try {
    const signature = await signatureService.captureSignature(
      user,
      documentId,
      metadata,
    );
    res.success(signature, 201);
  } catch (error: any) {
    res.error(error.message, 400);
  }
});

/**
 * @swagger
 * /signatures/verify/{id}:
 *   get:
 *     summary: Verify an electronic signature
 *     tags: [Signatures]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Signature verification details
 */
router.get("/verify/:id", async (req, res) => {
  const { id } = req.params;
  const signature = await signatureService.getSignatureById(id);

  if (!signature) {
    return res.error("Signature not found", 404);
  }

  res.success(signature);
});

export default router;
