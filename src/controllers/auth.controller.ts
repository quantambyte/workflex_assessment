import { Request, Response, NextFunction } from "express";
import { samlService, mfaService, userService } from "@/src/services";

class AuthController {
  /**
   * @openapi
   * /auth/saml/metadata:
   *   post:
   *     summary: Configure SAML IdP Metadata
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               metadata: { type: string }
   *     responses:
   *       200:
   *         description: Metadata uploaded.
   */
  async uploadMetadata(req: Request, res: Response, next: NextFunction) {
    try {
      const { metadata } = req.body;
      if (!metadata) {
        return res.error("Metadata XML is required", 400);
      }

      const config = await samlService.configure(metadata);
      res.success({ message: "SAML Metadata uploaded successfully", config });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @openapi
   * /auth/saml/login:
   *   get:
   *     summary: Initiate SAML SSO login redirect
   *     responses:
   *       200:
   *         description: Returns redirect URL for IdP.
   */
  async initiateSSO(req: Request, res: Response, next: NextFunction) {
    try {
      const { ssoUrl, encoded } = await samlService.generateAuthnRequest();

      // In a real scenario, this would be a 302 redirect
      // res.redirect(`${ssoUrl}?SAMLRequest=${encodeURIComponent(encoded)}`);

      // For the assessment, we'll return the URL to simulate the flow
      res.success({
        message: "Redirecting to IdP",
        redirectUrl: `${ssoUrl}?SAMLRequest=${encodeURIComponent(encoded)}`,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @openapi
   * /auth/saml/callback:
   *   post:
   *     summary: Handle SAML IdP callback
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               SAMLResponse: { type: string }
   *     responses:
   *       200:
   *         description: Login successful.
   *       401:
   *         description: Invalid SAML response.
   */
  async handleCallback(req: Request, res: Response, next: NextFunction) {
    try {
      const { SAMLResponse } = req.body;
      if (!SAMLResponse) {
        return res.error("SAMLResponse is required", 400);
      }

      const result = await samlService.validateResponse(SAMLResponse);
      res.success(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @openapi
   * /auth/2fa/setup:
   *   get:
   *     summary: Generate MFA secret and QR code
   *     parameters:
   *       - in: query
   *         name: email
   *         required: true
   *         schema: { type: string }
   *     responses:
   *       200:
   *         description: MFA setup data.
   */
  async setup2FA(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.query;
      if (!email) return res.error("errors.email_required", 400);

      const user = await userService.findUserByEmail(email as string);
      if (!user) return res.error("errors.user_not_found", 404);

      const { secret, qrCodeDataUrl } = await mfaService.generateMFASecret(
        user.email,
      );

      // Store secret temporarily
      await userService.updateUser(user.id, { mfaSecret: secret });

      res.success({ secret, qrCodeDataUrl });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @openapi
   * /auth/2fa/verify:
   *   post:
   *     summary: Verify and enable MFA for a user
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               email: { type: string }
   *               token: { type: string }
   *     responses:
   *       200:
   *         description: MFA enabled successfully.
   */
  async verifyAndEnable2FA(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, token } = req.body;
      if (!email || !token)
        return res.error("errors.email_token_required", 400);

      const user = await userService.findUserByEmail(email);
      if (!user || !user.mfaSecret)
        return res.error("errors.mfa_not_enabled", 400);

      const isValid = await mfaService.verifyMFAToken(user.mfaSecret, token);
      if (!isValid) return res.error("errors.invalid_token", 400);

      await userService.updateUser(user.id, { isMfaEnabled: true });
      res.success({ message: "success.mfa_enabled" });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
