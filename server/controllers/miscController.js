const database = require("../database");
async function health(req, res) {
  res.json({
    status: "ok",
    service: "signfix-api",
    database: await database.health(),
  });
}
async function report(req, res) {
  res.json(
    await require("../services/reportService").generate(
      req.params.type,
      req.query,
    ),
  );
}
async function exportReport(req, res) {
  const report = await require("../services/reportService").generate(
      req.params.type,
      req.query,
    ),
    format = req.query.format || "csv",
    exporters = require("../services/reportExportService");
  if (!exporters[format])
    throw Object.assign(new Error("Unsupported export format"), {
      status: 422,
    });
  const buffer = await exporters[format](report),
    mime = {
      csv: "text/csv; charset=utf-8",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      pdf: "application/pdf",
    }[format];
  res
    .set({
      "Content-Type": mime,
      "Content-Disposition": `attachment; filename="signfix-${report.type}-${new Date().toISOString().slice(0, 10)}.${format}"`,
    })
    .send(buffer);
}
async function aiChat(req, res) {
  if (!process.env.OPENAI_API_KEY)
    throw Object.assign(new Error("AI provider is not configured"), {
      status: 503,
      errorCode: "AI_PROVIDER_UNAVAILABLE",
    });
  const settings =
      (
        await database
          .getPool()
          .query("SELECT value FROM ai_settings WHERE key='assistant_config'")
      ).rows[0]?.value || {},
    answer = await require("../services/aiPlatform").answer(
      String(req.body.message || ""),
      settings,
    ),
    saved = (
      await database
        .getPool()
        .query(
          'INSERT INTO ai_conversations(user_id,question,response,metadata) VALUES($1,$2,$3,$4::jsonb) RETURNING id,created_at AS "createdAt"',
          [
            req.user.id,
            req.body.message,
            answer.reply,
            JSON.stringify({ sources: answer.sources }),
          ],
        )
    ).rows[0];
  res.json({
    ...saved,
    reply: answer.reply,
    sources: answer.sources,
    disclaimer:
      "AI guidance is informational. Final feasibility, price and delivery require Admin approval.",
  });
}
module.exports = { health, report, exportReport, aiChat };
