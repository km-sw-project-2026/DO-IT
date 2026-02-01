function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...extraHeaders },
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
  )
    .bind(userId)
    .first();
  return u?.role === "ADMIN";
}

// ✅ target을 user_id(숫자) 또는 login_id(문자열)로 받아서 user_id로 변환
async function resolveTargetUserId(env, target) {
  const t = String(target ?? "").trim();
  if (!t) return null;

  // 1) 숫자면 user_id로
  const n = Number(t);
  if (Number.isFinite(n) && n > 0) return n;

  // 2) 문자면 login_id로 조회
  const u = await env.D1_DB.prepare(
    `SELECT user_id FROM "user" WHERE login_id = ? LIMIT 1`
  )
    .bind(t)
    .first();

  return u ? Number(u.user_id) : null;
}

// POST /api/admin/ban
// body: { user_id, target, days }  // days=0이면 해제
export async function onRequestPost({ request, env }) {
  const headers = corsHeaders(request);

  try {
    const body = await request.json().catch(() => ({}));

    const adminId = Number(body?.user_id);
    const days = Number(body?.days ?? 0);

    // ✅ 여기서 target 하나로 받기
    const target = body?.target;

    if (!Number.isFinite(adminId) || adminId <= 0) {
      return json({ message: "invalid user_id" }, 400, headers);
    }

    // ✅ 관리자 체크
    const okAdmin = await isAdmin(env, adminId);
    if (!okAdmin) return json({ message: "forbidden" }, 403, headers);

    // ✅ target -> user_id로 변환
    const targetId = await resolveTargetUserId(env, target);
    if (!Number.isFinite(targetId) || targetId <= 0) {
      return json({ message: "대상 유저를 찾을 수 없어요." }, 404, headers);
    }

    // (선택) 관리자 자기 자신 차단 방지
    if (targetId === adminId) {
      return json({ message: "관리자 본인은 차단할 수 없어요." }, 400, headers);
    }

    // ✅ 해제: days <= 0
    if (!Number.isFinite(days) || days <= 0) {
      await env.D1_DB.prepare(
        `UPDATE "user" SET banned_until = NULL WHERE user_id = ?`
      )
        .bind(targetId)
        .run();

      return json({ ok: true, message: "차단 해제 완료" }, 200, headers);
    }

    // ✅ 차단: now + days
    const d = Math.floor(days);

    await env.D1_DB.prepare(
      `UPDATE "user"
       SET banned_until = datetime('now', ?)
       WHERE user_id = ?`
    )
      .bind(`+${d} days`, targetId)
      .run();

    return json({ ok: true, message: `${d}일 차단 완료` }, 200, headers);
  } catch (e) {
    console.error(e);
    return json({ message: "server error" }, 500, headers);
  }
}
