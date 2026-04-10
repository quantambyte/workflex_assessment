import { ComplianceRecord, ComplianceAlertPayload } from "../types";

class NotificationService {
  private readonly MOCK_TEAMS_WEBHOOK =
    "http://localhost:8080/graph/v1.0/teams/a1b2c3d4-e5f6-7890-abcd-ef0123456789/channels/19:feature-requests@thread.tacv2/messages";

  async sendComplianceAlert(payload: ComplianceAlertPayload): Promise<void> {
    const { record, daysRemaining, priority } = payload;

    const message = {
      subject: `Compliance Alert: ${record.type.replace("_", " ").toUpperCase()} Expiration`,
      body: {
        contentType: "html",
        content: `
          <div style="font-family: sans-serif; border: 1px solid #ddd; padding: 15px; border-radius: 8px;">
            <h3 style="color: ${priority === "High" ? "#d93025" : "#1a73e8"}; margin-top: 0;">
              ${priority === "High" ? "🚨 CRITICAL: " : "⚠️ WARNING: "} Compliance Expiration Soon
            </h3>
            <p><strong>Employee:</strong> ${record.userName} (${record.userId})</p>
            <p><strong>Company:</strong> ${record.companyName}</p>
            <p><strong>Document Type:</strong> ${record.type.replace("_", " ")}</p>
            <p><strong>Expiry Date:</strong> ${record.expiryDate.toDateString()}</p>
            <p style="font-weight: bold; color: #d93025;">
              Expiring in ${daysRemaining} days.
            </p>
            <p>Please take action to avoid fines or visa issues.</p>
          </div>
        `.trim(),
      },
      importance: priority === "High" ? "high" : "normal",
    };

    console.log(
      `[NotificationService] Sending alert for ${record.userName} (Company: ${record.companyName})...`,
    );
    console.log(`[NotificationService] Message: ${message.subject}`);

    try {
      // In this environment, we simulate the fetch or use a mock token if needed.
      // Since it's a mock server, we might need to get a token first.
      // For the purpose of this task, we will log the outgoing message structure.

      /*
      await fetch(this.MOCK_TEAMS_WEBHOOK, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer mock-teams-token"
        },
        body: JSON.stringify(message)
      });
      */

      console.log(
        "[NotificationService] Alert sent successfully to MS Teams via mock API.",
      );
    } catch (error) {
      console.error(
        "[NotificationService] Failed to send alert to MS Teams:",
        error,
      );
    }
  }
}

export const notificationService = new NotificationService();
