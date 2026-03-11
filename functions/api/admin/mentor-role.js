function json(data, status = 200, request) {
  const origin = request?.headers?.get("Origin") || "*";
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function onRequestOptions({ request }) {
  const origin = request?.headers?.get("Origin") || "*";
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

async function isAdmin(env, userId) {
  const u = await env.D1_DB
    .prepare(`SELECT role FROM "user" WHERE user_id = ? LIMIT 1`)
    .bind(userId)
    .first();
  return u?.role === "ADMIN";
}

async function resolveTargetUserId(env, target) {
  const t = String(target ?? "").trim();
  if (!t) return null;
  const n = Number(t);
  if (Number.isFinite(n) && n > 0) return n;
  const u = await env.D1_DB
    .prepare(`SELECT user_id FROM "user" WHERE login_id = ? LIMIT 1`)
    .bind(t)
    .first();
  return u ? Number(u.user_id) : null;
}

/**
 * POST /api/admin/mentor-role
 * body: { user_id(admin), target(user_id or login_id), action: "GRANT" | "REVOKE" }
 *
 * GRANT  → mentor 테이블 INSERT
 * REVOKE → mentor 테이블 DELETE
 */
export async function onRequestPost({ env, request }) {
  try {
    const body = await request.json().catch(() => ({}));
    const adminId = Number(body?.user_id);
    const action  = body?.action;  // "GRANT" | "REVOKE"
    const target  = body?.target;

    if (!adminId || !(await isAdmin(env, adminId))) {
      return json({ message: "관리자 권한이 필요합니다." }, 403, request);
    }
    if (!["GRANT", "REVOKE"].includes(action)) {
      return json({ message: "action은 GRANT 또는 REVOKE여야 합니다." }, 400, request);
    }
    if (!target) return json({ message: "target(user_id 또는 login_id)이 필요합니다." }, 400, request);

    const targetUserId = await resolveTargetUserId(env, target);
    if (!targetUserId) return json({ message: "해당 유저를 찾을 수 없습니다." }, 404, request);

    const existingMentor = await env.D1_DB
      .prepare("SELECT mentor_id FROM mentor WHERE user_id = ?")
      .bind(targetUserId)
      .first();

    if (action === "GRANT") {
      if (existingMentor) return json({ message: "이미 멘토 권한이 있습니다." }, 409, request);
      await env.D1_DB
        .prepare("INSERT INTO mentor (user_id) VALUES (?)")
        .bind(targetUserId)
        .run();
      // mentor_profile이 없으면 빈 프로필 생성
      const existingProfile = await env.D1_DB
        .prepare("SELECT user_id FROM mentor_profile WHERE user_id = ? LIMIT 1")
        .bind(targetUserId)
        .first();
      if (!existingProfile) {
        await env.D1_DB
          .prepare("INSERT INTO mentor_profile (introduction, user_id) VALUES ('', ?)")
          .bind(targetUserId)
          .run();
      }
      // ✅ user.role도 MENTOR로 업데이트
      await env.D1_DB
        .prepare("UPDATE \"user\" SET role = 'MENTOR' WHERE user_id = ?")
        .bind(targetUserId)
        .run();
      return json({ message: "멘토 권한 부여 완료." }, 200, request);
    }

    // REVOKE
    if (!existingMentor) return json({ message: "멘토 권한이 없는 유저입니다." }, 409, request);
    await env.D1_DB
      .prepare("DELETE FROM mentor WHERE user_id = ?")
      .bind(targetUserId)
      .run();
    // ✅ user.role을 USER로 복원 (ADMIN은 유지)
    const userRow = await env.D1_DB
      .prepare("SELECT role FROM \"user\" WHERE user_id = ?")
      .bind(targetUserId)
      .first();
    if (userRow?.role === 'MENTOR') {
      await env.D1_DB
        .prepare("UPDATE \"user\" SET role = 'USER' WHERE user_id = ?")
        .bind(targetUserId)
        .run();
    }
    return json({ message: "멘토 권한 박탈 완료." }, 200, request);

  } catch (e) {
    return json({ message: e?.message || "서버 오류" }, 500, request);
  }
}
