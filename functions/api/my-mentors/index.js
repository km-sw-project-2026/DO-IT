const CORS = (request) => ({
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": request?.headers?.get("Origin") || "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
});

function json(data, status = 200, request) {
  return new Response(JSON.stringify(data), { status, headers: CORS(request) });
}

export async function onRequestOptions({ request }) {
  return new Response(null, { status: 204, headers: CORS(request) });
}

/**
 * GET /api/my-mentors?user_id=xxx
 * 내가 멘토링을 받은 멘토 목록 조회 (중복 제거)
 */
export async function onRequestGet({ env, url: _url, request }) {
  try {
    const url = _url ?? new URL(request.url);
    const user_id = Number(url.searchParams.get("user_id"));
    if (!user_id) return json({ message: "user_id 필요" }, 400, request);

    // 내 mentee_id 조회
    const menteeRow = await env.D1_DB
      .prepare(`SELECT mentee_id FROM mentee WHERE user_id = ? LIMIT 1`)
      .bind(user_id)
      .first();

    if (!menteeRow) return json({ mentors: [] }, 200, request);

    // 내가 멘토링 받은 멘토 목록 (중복 제거)
    const rows = await env.D1_DB
      .prepare(`
        SELECT DISTINCT
          m.mentor_id,
          u.user_id,
          u.nickname,
          u.profile_image
        FROM mentoring mt
        JOIN mentor m ON m.mentor_id = mt.mentor_id
        JOIN "user" u ON u.user_id = m.user_id
        WHERE mt.mentee_id = ? AND mt.status IN ('ACCEPTED', 'ENDED')
        ORDER BY mt.mentoring_at DESC
      `)
      .bind(menteeRow.mentee_id)
      .all();

    const mentors = (rows.results ?? []).map((r) => ({
      mentor_id: r.mentor_id,
      user_id: r.user_id,
      name: r.nickname || "멘토",
      img: r.profile_image || "/images/profile.jpg",
    }));

    return json({ mentors }, 200, request);
  } catch (e) {
    return json({ message: e?.message || "서버 오류" }, 500, request);
  }
}
