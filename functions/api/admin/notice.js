function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function corsHeaders(request) {
  const origin = request.headers.get("Origin") || "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export async function onRequestOptions({ request }) {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}

async function isAdmin(env, userId) {
  const u = await env.D1_DB.prepare(
    `SELECT role FROM "user" WHERE user_id = ? LIMIT 1`
  ).bind(userId).first();
  return u?.role === "ADMIN";
}

// POST /api/admin/notice
// body: { user_id, post_id, on: true|false }
export async function onRequestPost({ request, env }) {
  const headers = corsHeaders(request);

  try {
    const body = await request.json().catch(() => ({}));
    const adminId = Number(body?.user_id);
    const postId = Number(body?.post_id);
    const on = Boolean(body?.on);

    if (!Number.isFinite(adminId) || adminId <= 0)
      return json({ message: "invalid user_id" }, 400, headers);
    if (!Number.isFinite(postId) || postId <= 0)
      return json({ message: "invalid post_id" }, 400, headers);

    const okAdmin = await isAdmin(env, adminId);
    if (!okAdmin) return json({ message: "forbidden" }, 403, headers);

    // 존재 확인
    const exists = await env.D1_DB.prepare(
      `SELECT post_id FROM community_post WHERE post_id = ? AND deleted_at IS NULL LIMIT 1`
    ).bind(postId).first();
    if (!exists) return json({ message: "not found" }, 404, headers);

    if (on) {
      await env.D1_DB.prepare(
        `UPDATE community_post
         SET is_notice = 1, pinned_at = CURRENT_TIMESTAMP
         WHERE post_id = ?`
      ).bind(postId).run();
      return json({ ok: true, message: "공지로 설정 완료" }, 200, headers);
    } else {
      await env.D1_DB.prepare(
        `UPDATE community_post
         SET is_notice = 0, pinned_at = NULL
         WHERE post_id = ?`
      ).bind(postId).run();
      return json({ ok: true, message: "공지 해제 완료" }, 200, headers);
    }
  } catch (e) {
    console.error(e);
    return json({ message: "server error" }, 500, headers);
  }
}
