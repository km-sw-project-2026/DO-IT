function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

// ✅ 관리자 체크(이 파일 안에서 씀)
async function requireAdmin(env, userId) {
  const u = await env.D1_DB.prepare(
    `SELECT role FROM "user" WHERE user_id = ? LIMIT 1`
  ).bind(userId).first();
  return u?.role === "ADMIN";
}

// GET /api/admin/reports?status=OPEN&user_id=1
export async function onRequestGet({ env, request }) {
  const url = new URL(request.url);

  const adminId = Number(url.searchParams.get("user_id"));
  const status = String(url.searchParams.get("status") || "OPEN").trim();

  if (!Number.isFinite(adminId) || adminId <= 0) return json({ message: "invalid user_id" }, 400);
  if (!(await requireAdmin(env, adminId))) return json({ message: "forbidden" }, 403);

  const { results } = await env.D1_DB.prepare(
    `SELECT
      r.report_id, r.reporter_id, r.reported_id, r.report_type, r.report_content,
      r.status, r.created_at,
      ur.nickname AS reporter_nick,
      uu.nickname AS reported_nick
     FROM report r
     LEFT JOIN "user" ur ON ur.user_id = r.reporter_id
     LEFT JOIN "user" uu ON uu.user_id = r.reported_id
     WHERE r.status = ?
     ORDER BY r.report_id DESC`
  ).bind(status).all();

  return json({ reports: results || [] }, 200);
}

// POST /api/admin/reports  body: { user_id, report_id }
export async function onRequestPost({ env, request }) {
  const body = await request.json().catch(() => ({}));
  const adminId = Number(body?.user_id);
  const reportId = Number(body?.report_id);

  if (!Number.isFinite(adminId) || adminId <= 0) return json({ message: "invalid user_id" }, 400);
  if (!Number.isFinite(reportId) || reportId <= 0) return json({ message: "invalid report_id" }, 400);
  if (!(await requireAdmin(env, adminId))) return json({ message: "forbidden" }, 403);

  await env.D1_DB.prepare(
    `UPDATE report
     SET status = 'DONE', updated_at = CURRENT_TIMESTAMP
     WHERE report_id = ?`
  ).bind(reportId).run();

  return json({ ok: true }, 200);
}
