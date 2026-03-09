const CORS = (request) => ({
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": request?.headers?.get("Origin") || "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
});

function json(data, status = 200, request) {
  return new Response(JSON.stringify(data), {
    status,
    headers: CORS(request),
  });
}

export async function onRequestOptions({ request }) {
  return new Response(null, { status: 204, headers: CORS(request) });
}

/**
 * GET /api/mentor/:id
 * mentor.mentor_id 기준으로 멘토 프로필 조회
 */
export async function onRequestGet({ env, params, request }) {
  try {
    const mentorId = Number(params?.id);
    if (!mentorId) return json({ message: "mentor_id가 필요합니다." }, 400, request);

    // mentor + user 정보
    const mentorRow = await env.D1_DB
      .prepare(`
        SELECT m.mentor_id, u.user_id, u.nickname, u.profile_image
        FROM mentor m
        JOIN user u ON u.user_id = m.user_id
        WHERE m.mentor_id = ?
      `)
      .bind(mentorId)
      .first();

    if (!mentorRow) return json({ message: "멘토를 찾을 수 없습니다." }, 404, request);

    // mentor_profile 정보 (없으면 빈 값)
    const profileRow = await env.D1_DB
      .prepare(`
        SELECT introduction, career, subject, certificate, mentor_desc
        FROM mentor_profile
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT 1
      `)
      .bind(mentorRow.user_id)
      .first();

    // 리뷰 평균 + 건수
    const reviewStats = await env.D1_DB
      .prepare(`
        SELECT
          ROUND(AVG(rating), 1) AS avg_rating,
          COUNT(*) AS review_count
        FROM mentor_review
        WHERE mentor_id = ?
      `)
      .bind(mentorId)
      .first();

    return json({
      mentor_id: mentorRow.mentor_id,
      user_id: mentorRow.user_id,
      nickname: mentorRow.nickname,
      profile_image: mentorRow.profile_image || "/images/profile.jpg",
      introduction: profileRow?.introduction || "",
      career: profileRow?.career || "",
      subject: profileRow?.subject || "",
      certificate: profileRow?.certificate || "",
      mentor_desc: profileRow?.mentor_desc || "",
      avg_rating: reviewStats?.avg_rating ?? 0,
      review_count: reviewStats?.review_count ?? 0,
    }, 200, request);
  } catch (e) {
    return json({ message: e?.message || "서버 오류" }, 500, request);
  }
}
