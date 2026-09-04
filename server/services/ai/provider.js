function getSelectedProvider() {
  const name = (process.env.AI_PROVIDER || "openai").toLowerCase();
  if (name === "openai") return require("./providers/openaiProvider");
  if (name === "mock" || name === "fallback") return require("./providers/mockProvider");
  return require("./providers/mockProvider");
}

async function respond(request) {
  try {
    return await getSelectedProvider().respond(request);
  } catch (error) {
    const mock = require("./providers/mockProvider");
    return await mock.respond(request);
  }
}

module.exports = { respond };
