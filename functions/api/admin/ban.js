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

// POST /api/admin/ban
// body: { user_id, target_user_id, days }  // days=0이면 해제
export async function onRequestPost({ request, env }) {
  const headers = corsHeaders(request);

  try {
    const body = await request.json().catch(() => ({}));
    const adminId = Number(body?.user_id);
    const targetId = Number(body?.target_user_id);
    const days = Number(body?.days ?? 0);

    if (!Number.isFinite(adminId) || adminId <= 0)
      return json({ message: "invalid user_id" }, 400, headers);
    if (!Number.isFinite(targetId) || targetId <= 0)
      return json({ message: "invalid target_user_id" }, 400, headers);

    const okAdmin = await isAdmin(env, adminId);
    if (!okAdmin) return json({ message: "forbidden" }, 403, headers);

    // target 존재 확인
    const target = await env.D1_DB.prepare(
      `SELECT user_id FROM "user" WHERE user_id = ? LIMIT 1`
    ).bind(targetId).first();
    if (!target) return json({ message: "target not found" }, 404, headers);

    // 해제
    if (!Number.isFinite(days) || days <= 0) {
      await env.D1_DB.prepare(
        `UPDATE "user" SET banned_until = NULL WHERE user_id = ?`
      ).bind(targetId).run();
      return json({ ok: true, message: "차단 해제 완료" }, 200, headers);
    }

    // 차단: now + days
    await env.D1_DB.prepare(
      `UPDATE "user"
       SET banned_until = datetime('now', ?)
       WHERE user_id = ?`
    ).bind(`+${Math.floor(days)} days`, targetId).run();

    return json({ ok: true, message: `${Math.floor(days)}일 차단 완료` }, 200, headers);
  } catch (e) {
    console.error(e);
    return json({ message: "server error" }, 500, headers);
  }
}
