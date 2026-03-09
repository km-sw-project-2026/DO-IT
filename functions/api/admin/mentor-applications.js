function json(data, status = 200, request) {
  const origin = request?.headers?.get("Origin") || "*";
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
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
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
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

/**
 * GET /api/admin/mentor-applications?user_id=&status=PENDING
 * 멘토 지원서 목록 조회
 */
export async function onRequestGet({ env, request }) {
  try {
    const url = new URL(request.url);
    const adminId = Number(url.searchParams.get("user_id"));
    const status  = url.searchParams.get("status") || "PENDING";

    if (!adminId || !(await isAdmin(env, adminId))) {
      return json({ message: "관리자 권한이 필요합니다." }, 403, request);
    }

    const rows = await env.D1_DB
      .prepare(`
        SELECT
          ma.mentor_apply_id,
          ma.contact,
          ma.contractor_name,
          ma.affiliation,
          ma.introduction,
          ma.hope_field,
          ma.related_url,
          ma.status,
          ma.created_at,
          ma.user_id,
          u.nickname,
          u.login_id
        FROM mentor_application ma
        JOIN "user" u ON u.user_id = ma.user_id
        WHERE ma.status = ?
        ORDER BY ma.created_at DESC
      `)
      .bind(status)
      .all();

    return json({ applications: rows.results ?? [] }, 200, request);
  } catch (e) {
    return json({ message: e?.message || "서버 오류" }, 500, request);
  }
}

/**
 * POST /api/admin/mentor-applications
 * body: { user_id(admin), mentor_apply_id, action: "APPROVE" | "REJECT" }
 *
 * APPROVE → mentor_application.status = 'APPROVED' + mentor 테이블 INSERT
 * REJECT  → mentor_application.status = 'REJECTED'
 */
export async function onRequestPost({ env, request }) {
  try {
    const body = await request.json().catch(() => ({}));
    const adminId = Number(body?.user_id);
    const applyId = Number(body?.mentor_apply_id);
    const action  = body?.action; // "APPROVE" | "REJECT"

    if (!adminId || !(await isAdmin(env, adminId))) {
      return json({ message: "관리자 권한이 필요합니다." }, 403, request);
    }
    if (!applyId) return json({ message: "mentor_apply_id가 필요합니다." }, 400, request);
    if (!["APPROVE", "REJECT"].includes(action)) {
      return json({ message: "action은 APPROVE 또는 REJECT여야 합니다." }, 400, request);
    }

    // 지원서 조회
    const applyRow = await env.D1_DB
      .prepare("SELECT * FROM mentor_application WHERE mentor_apply_id = ?")
      .bind(applyId)
      .first();
    if (!applyRow) return json({ message: "지원서를 찾을 수 없습니다." }, 404, request);
    if (applyRow.status !== "PENDING") {
      return json({ message: `이미 처리된 지원서입니다. (${applyRow.status})` }, 409, request);
    }

    if (action === "APPROVE") {
      // mentor 테이블에 없는 경우만 추가
      const already = await env.D1_DB
        .prepare("SELECT mentor_id FROM mentor WHERE user_id = ?")
        .bind(applyRow.user_id)
        .first();

      if (!already) {
        await env.D1_DB
          .prepare("INSERT INTO mentor (user_id) VALUES (?)")
          .bind(applyRow.user_id)
          .run();

        // mentor_profile에도 소개글 저장
        await env.D1_DB
          .prepare(`
            INSERT INTO mentor_profile (introduction, user_id)
            VALUES (?, ?)
          `)
          .bind(applyRow.introduction, applyRow.user_id)
          .run();
      }

      // ✅ user.role을 MENTOR로 업데이트 (이미 멘토여도 반드시 갱신)
      await env.D1_DB
        .prepare("UPDATE \"user\" SET role = 'MENTOR' WHERE user_id = ?")
        .bind(applyRow.user_id)
        .run();

      await env.D1_DB
        .prepare("UPDATE mentor_application SET status = 'APPROVED' WHERE mentor_apply_id = ?")
        .bind(applyId)
        .run();

      return json({ message: "승인 완료! 멘토 권한이 부여되었습니다." }, 200, request);
    }

    // REJECT
    await env.D1_DB
      .prepare("UPDATE mentor_application SET status = 'REJECTED' WHERE mentor_apply_id = ?")
      .bind(applyId)
      .run();

    return json({ message: "거절 처리 완료." }, 200, request);
  } catch (e) {
    return json({ message: e?.message || "서버 오류" }, 500, request);
  }
}
