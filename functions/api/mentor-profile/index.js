const CORS = (request) => ({
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": request?.headers?.get("Origin") || "*",
  "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
});

function json(data, status = 200, request) {
  return new Response(JSON.stringify(data), { status, headers: CORS(request) });
}

export async function onRequestOptions({ request }) {
  return new Response(null, { status: 204, headers: CORS(request) });
}

/**
 * GET /api/mentor-profile?user_id=xxx
 * 내 멘토 프로필 조회
 */
export async function onRequestGet({ env, url, request }) {
  try {
    const user_id = url.searchParams.get("user_id");
    if (!user_id) return json({ message: "user_id 필요" }, 400, request);

    const row = await env.D1_DB
      .prepare(`SELECT * FROM mentor_profile WHERE user_id = ? LIMIT 1`)
      .bind(Number(user_id))
      .first();

    return json({ profile: row || null }, 200, request);
  } catch (e) {
    return json({ message: e?.message || "서버 오류" }, 500, request);
  }
}

/**
 * PUT /api/mentor-profile
 * 멘토 프로필 저장/수정
 * body: { user_id, introduction, career, subject, certificate }
 */
export async function onRequestPut({ env, request }) {
  try {
    const body = await request.json();
    const { user_id, introduction, career, subject, certificate } = body;

    if (!user_id) return json({ message: "user_id 필요" }, 400, request);

    const existing = await env.D1_DB
      .prepare(`SELECT mentor_profile_id FROM mentor_profile WHERE user_id = ? LIMIT 1`)
      .bind(Number(user_id))
      .first();

    if (existing) {
      await env.D1_DB
        .prepare(`
          UPDATE mentor_profile
          SET introduction = ?, career = ?, subject = ?, certificate = ?, updated_at = CURRENT_TIMESTAMP
          WHERE user_id = ?
        `)
        .bind(
          introduction || "",
          career || "",
          subject || "",
          certificate || "",
          Number(user_id)
        )
        .run();
    } else {
      await env.D1_DB
        .prepare(`
          INSERT INTO mentor_profile (introduction, career, subject, certificate, user_id)
          VALUES (?, ?, ?, ?, ?)
        `)
        .bind(
          introduction || "",
          career || "",
          subject || "",
          certificate || "",
          Number(user_id)
        )
        .run();
    }

    return json({ message: "저장 완료" }, 200, request);
  } catch (e) {
    return json({ message: e?.message || "서버 오류" }, 500, request);
  }
}
