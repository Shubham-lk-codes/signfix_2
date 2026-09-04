import { describe, it, expect } from "vitest";
import mockProvider from "./ai/providers/mockProvider.js";
import { interpolate, providerStatus } from "./notificationService.js";

describe("Phase 8 - AI Assistant Provider Abstraction", () => {
  it("generates context-aware response and extracts leads on buying intent", async () => {
    const result = await mockProvider.respond({
      messages: [{ role: "user", content: "I want a quote for an Acrylic Letter Sign board for my shop with budget 15000" }],
    });

    expect(result).toHaveProperty("reply");
    expect(result).toHaveProperty("requiresHuman");
    expect(result.lead).not.toBeNull();
    expect(result.lead.product).toBe("Acrylic Letter Sign");
    expect(result.lead.estimatedBudget).toBe(15000);
  });

  it("handles general support question without lead", async () => {
    const result = await mockProvider.respond({
      messages: [{ role: "user", content: "How do I track my order status?" }],
    });

    expect(result.reply).toContain("Customer Portal dashboard");
    expect(result.lead).toBeNull();
  });
});

describe("Phase 8 - Notifications Helper Services", () => {
  it("interpolates template variables correctly", () => {
    const output = interpolate("Order {{orderNo}} is {{status}}", { orderNo: "SB-101", status: "Ready" });
    expect(output).toBe("Order SB-101 is Ready");
  });

  it("returns configured notification provider status", () => {
    const status = providerStatus();
    expect(status).toHaveProperty("push");
    expect(status).toHaveProperty("email");
    expect(status).toHaveProperty("sms");
    expect(status).toHaveProperty("whatsapp");
  });
});
