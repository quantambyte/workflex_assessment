import { userService } from "./user.service";
import { SAMLConfig } from "@/src/types";

class SAMLService {
  private config: SAMLConfig | null = null;

  async configure(metadataXml: string) {
    // Mock parsing logic
    // In a real app, use a lib like 'xml-crypto' or 'saml2-js'
    console.log("Configuring SAML with metadata...");

    // Simulate extraction
    this.config = {
      ssoUrl: "https://idp.example.com/saml/sso",
      certificate: "MII...",
      issuer: "workflex-assessment-app",
    };

    return this.config;
  }

  async generateAuthnRequest() {
    if (!this.config) {
      throw new Error(
        "SAML is not configured. Please upload IdP metadata first.",
      );
    }

    const id = `_${Math.random().toString(36).substring(2, 11)}`;
    const issueInstant = new Date().toISOString();

    // Simple AuthnRequest XML string (Mock)
    const xml = `
      <samlp:AuthnRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" 
        ID="${id}" Version="2.0" IssueInstant="${issueInstant}"
        Destination="${this.config.ssoUrl}">
        <saml:Issuer xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion">${this.config.issuer}</saml:Issuer>
      </samlp:AuthnRequest>
    `.trim();

    return {
      xml,
      encoded: Buffer.from(xml).toString("base64"),
      ssoUrl: this.config.ssoUrl,
    };
  }

  async validateResponse(samlResponse: string) {
    if (!this.config) {
      throw new Error("SAML is not configured.");
    }

    // Mock validation logic
    console.log("Validating SAML Response...");

    if (samlResponse === "invalid_token") {
      throw new Error("Invalid SAML Response signature.");
    }

    // Mock extraction of attributes
    // In reality, this would involve base64 decoding, XML parsing, and signature verification
    const email = "sso-user@hooli.com";
    const name = "SAML User";

    const user = await userService.findOrCreateUser({ email, name });

    return {
      user,
      message: "SSO Login Successful",
    };
  }
}

export const samlService = new SAMLService();
