function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

async function requireAdmin(env, userId) {
  const u = await env.D1_DB.prepare(
    `SELECT role FROM "user" WHERE user_id = ? LIMIT 1`
  ).bind(userId).first();
  return u?.role === "ADMIN";
}

// POST /api/admin/ban  body: { user_id, target_user_id, days }
export async function onRequestPost({ env, request }) {
  const body = await request.json().catch(() => ({}));

  const adminId = Number(body?.user_id);
  const targetId = Number(body?.target_user_id);
  const days = Math.max(1, Number(body?.days || 7));

  if (!Number.isFinite(adminId) || adminId <= 0) return json({ message: "invalid user_id" }, 400);
  if (!Number.isFinite(targetId) || targetId <= 0) return json({ message: "invalid target_user_id" }, 400);
  if (!(await requireAdmin(env, adminId))) return json({ message: "forbidden" }, 403);

  await env.D1_DB.prepare(
    `UPDATE "user"
     SET banned_until = datetime('now', ?)
     WHERE user_id = ?`
  ).bind(`+${days} days`, targetId).run();

  return json({ ok: true }, 200);
}

// PUT /api/admin/ban  body: { user_id, target_user_id }
export async function onRequestPut({ env, request }) {
  const body = await request.json().catch(() => ({}));

  const adminId = Number(body?.user_id);
  const targetId = Number(body?.target_user_id);

  if (!Number.isFinite(adminId) || adminId <= 0) return json({ message: "invalid user_id" }, 400);
  if (!Number.isFinite(targetId) || targetId <= 0) return json({ message: "invalid target_user_id" }, 400);
  if (!(await requireAdmin(env, adminId))) return json({ message: "forbidden" }, 403);

  await env.D1_DB.prepare(
    `UPDATE "user" SET banned_until = NULL WHERE user_id = ?`
  ).bind(targetId).run();

  return json({ ok: true }, 200);
}
