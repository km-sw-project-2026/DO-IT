function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

/**
 * POST /api/report
 * body: { reporter_id, reported_id, report_type, report_content }
 */
export async function onRequestPost({ env, request }) {
  const body = await request.json();

  const reporter_id = Number(body?.reporter_id);
  const reported_id = Number(body?.reported_id);
  const report_type = (body?.report_type ?? "").trim(); // 예: "COMMENT"
  const report_content = (body?.report_content ?? "").trim(); // 예: "comment_id=3 reason=스팸"

  if (!reporter_id || !reported_id) return json({ message: "reporter_id/reported_id required" }, 400);
  if (!report_type) return json({ message: "report_type required" }, 400);
  if (!report_content) return json({ message: "report_content required" }, 400);

  const result = await env.D1_DB.prepare(
    `INSERT INTO report (reporter_role, report_type, report_content, reporter_id, reported_id)
     VALUES ('USER', ?, ?, ?, ?)`
  )
    .bind(report_type, report_content, reporter_id, reported_id)
    .run();

  return json({ ok: true, result });
}
