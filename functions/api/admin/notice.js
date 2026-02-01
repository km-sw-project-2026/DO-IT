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

// POST /api/admin/notice  body: { user_id, post_id, is_notice }
export async function onRequestPost({ env, request }) {
  const body = await request.json().catch(() => ({}));
  const adminId = Number(body?.user_id);
  const postId = Number(body?.post_id);
  const isNotice = Number(body?.is_notice) ? 1 : 0;

  if (!Number.isFinite(adminId) || adminId <= 0) return json({ message: "invalid user_id" }, 400);
  if (!Number.isFinite(postId) || postId <= 0) return json({ message: "invalid post_id" }, 400);
  if (!(await requireAdmin(env, adminId))) return json({ message: "forbidden" }, 403);

  await env.D1_DB.prepare(
    `UPDATE community_post
     SET is_notice = ?,
         pinned_at = CASE WHEN ? = 1 THEN CURRENT_TIMESTAMP ELSE NULL END
     WHERE post_id = ?`
  ).bind(isNotice, isNotice, postId).run();

  return json({ ok: true }, 200);
}
