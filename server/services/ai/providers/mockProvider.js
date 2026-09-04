function extractLeadInfo(userMessage) {
  const text = String(userMessage || "").toLowerCase();
  const isSupportOrTracking = /order status|track|where is my|repair|fix|service ticket/i.test(text);
  if (isSupportOrTracking) return null;

  const buyingIntent = /quote|quotation|price|cost|buy|purchase|new sign|need a sign|want a sign|looking for|estimate|how much/i.test(text);
  if (!buyingIntent) return null;

  let product = null;
  if (/acrylic/i.test(text)) product = "Acrylic Letter Sign";
  else if (/led|glow/i.test(text)) product = "LED Board";
  else if (/neon/i.test(text)) product = "Neon Sign";
  else if (/flex/i.test(text)) product = "Flex Board";
  else if (/hoarding/i.test(text)) product = "Hoarding Signage";
  else product = "Custom Signage";

  const budgetMatch = text.match(/(?:budget|price|cost|around|approx|rs\.?|inr)\s*:?\s*(\d+[\d,]*)/i);
  const estimatedBudget = budgetMatch ? parseFloat(budgetMatch[1].replace(/,/g, "")) : null;

  return {
    requirement: userMessage,
    product,
    estimatedBudget,
    contact: null,
  };
}

async function respond({ messages }) {
  const userMessage = [...(messages || [])].reverse().find((m) => m.role === "user")?.content || "";
  const lead = extractLeadInfo(userMessage);
  const text = userMessage.toLowerCase();

  let reply = "Hello! I am the SignFix Assistant. I can help you with sign board selection, materials, pricing estimates, order tracking, and service support. How can I assist your business today?";

  if (/human|support|agent|person|representative|helpdesk|contact|phone|call/i.test(text)) {
    reply = "I understand you would like human support. I have logged an escalation request, and a SignFix team member will reach out to you shortly.";
  } else if (/price|cost|calculator|rate|estimate|quote|how much/i.test(text)) {
    reply = "SignFix calculator estimates are for preliminary planning. Official commercial prices require an Admin-approved quotation. Please share your sign dimensions (width x height) and preferred material (LED, Acrylic, Neon, Flex) so we can prepare an estimate for you.";
  } else if (/order|status|tracking|deliver|production/i.test(text)) {
    reply = "You can track your orders and quotation approvals directly in your Customer Portal dashboard. If you need details on a specific order number, please let me know!";
  } else if (/service|repair|maintenance|warranty|fix|damaged|broken/i.test(text)) {
    reply = "SignFix provides full sign board repair, LED replacement, and scheduled maintenance services. You can scan your sign board's QR token or submit a service ticket from your portal.";
  } else if (/product|catalog|material|lighting/i.test(text)) {
    reply = "We manufacture high-grade Acrylic 3D Letters, LED Glow Signs, Neon Flex Signs, Front-lit & Back-lit Flex Boards, Pylon Signs, and Stainless Steel Lettering. All products feature optional weather-resistant warranties.";
  } else if (lead) {
    reply = `Thank you for your interest in ${lead.product || "SignFix signage"}! I have noted your requirement: "${lead.requirement}". Our team can prepare an official commercial quotation after confirming your specifications.`;
  }

  const requiresHuman = /human|support|agent|person|representative|dispute|emergency/i.test(text);

  return {
    reply,
    requiresHuman,
    lead,
    provider: "fallback-mock",
    providerResponseId: `mock-${Date.now()}`,
    usage: { total_tokens: 50 },
  };
}

module.exports = { respond };
