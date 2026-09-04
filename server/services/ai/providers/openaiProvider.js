const OpenAI = require("openai");
let client;

function getClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw Object.assign(new Error("OPENAI_API_KEY is not configured"), {
      status: 503,
      errorCode: "AI_PROVIDER_UNAVAILABLE",
    });
  }
  return client || (client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY }));
}

async function respond({ instructions, messages, safetyIdentifier }) {
  const openai = getClient();
  const model = process.env.OPENAI_TEXT_MODEL || "gpt-4o-mini";

  if (openai.responses && typeof openai.responses.create === "function") {
    try {
      const response = await openai.responses.create({
        model,
        instructions,
        input: messages,
        store: false,
        safety_identifier: safetyIdentifier,
        text: {
          format: {
            type: "json_schema",
            name: "signfix_assistant_response",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                reply: { type: "string" },
                requiresHuman: { type: "boolean" },
                lead: {
                  anyOf: [
                    {
                      type: "object",
                      additionalProperties: false,
                      properties: {
                        requirement: { type: "string" },
                        product: { type: ["string", "null"] },
                        estimatedBudget: { type: ["number", "null"] },
                        contact: { type: ["string", "null"] },
                      },
                      required: ["requirement", "product", "estimatedBudget", "contact"],
                    },
                    { type: "null" },
                  ],
                },
              },
              required: ["reply", "requiresHuman", "lead"],
            },
          },
        },
      });
      return {
        ...JSON.parse(response.output_text),
        provider: "openai",
        providerResponseId: response.id,
        usage: response.usage,
      };
    } catch (e) {
      // Fallback to chat completions if responses.create fails
    }
  }

  const completion = await openai.chat.completions.create({
    model,
    messages: [
      { role: "system", content: `${instructions}\nRespond with JSON: {"reply": string, "requiresHuman": boolean, "lead": null | {"requirement": string, "product": string | null, "estimatedBudget": number | null, "contact": string | null}}` },
      ...messages.map((m) => ({
        role: m.role === "developer" ? "system" : m.role,
        content: m.content,
      })),
    ],
    response_format: { type: "json_object" },
  });

  const parsed = JSON.parse(completion.choices[0].message.content || "{}");
  return {
    reply: parsed.reply || "Thank you for reaching out to SignFix.",
    requiresHuman: Boolean(parsed.requiresHuman),
    lead: parsed.lead || null,
    provider: "openai",
    providerResponseId: completion.id,
    usage: completion.usage,
  };
}

module.exports = { respond };
