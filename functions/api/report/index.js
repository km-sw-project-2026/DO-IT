function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

// POST /api/report
export async function onRequestPost({ env, request }) {
  const body = await request.json().catch(() => ({}));

  const reporter_id = Number(body?.reporter_id);
  const reported_id = Number(body?.reported_id);
  const report_type = String(body?.report_type ?? "").trim();
  const report_content = String(body?.report_content ?? "").trim();

  if (!Number.isFinite(reporter_id) || reporter_id <= 0) return json({ message: "invalid reporter_id" }, 400);
  if (!Number.isFinite(reported_id) || reported_id <= 0) return json({ message: "invalid reported_id" }, 400);
  if (!report_type) return json({ message: "report_type required" }, 400);
  if (!report_content) return json({ message: "report_content required" }, 400);

  const result = await env.D1_DB.prepare(
    `INSERT INTO report (reporter_id, reported_id, report_type, report_content)
     VALUES (?, ?, ?, ?)`
  ).bind(reporter_id, reported_id, report_type, report_content).run();

  return json({ ok: true, result }, 201);
}
