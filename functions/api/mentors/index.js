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
 * GET /api/mentors?page=1&size=6
 * mentor 테이블 기반 목록 + 리뷰 평균 조회
 */
export async function onRequestGet({ env, url, request }) {
  try {
    const page = Math.max(1, Number(url.searchParams.get("page") || "1"));
    const size = Math.min(50, Math.max(1, Number(url.searchParams.get("size") || "6")));
    const sort = url.searchParams.get("sort") || "recent"; // "rating" | "review" | "recent"
    const offset = (page - 1) * size;

    const orderBy = sort === "rating"
      ? "avg_rating DESC NULLS LAST, m.created_at DESC"
      : sort === "review"
      ? "review_count DESC, m.created_at DESC"
      : "m.created_at DESC";

    // 전체 멘토 수
    const countRow = await env.D1_DB
      .prepare(`SELECT COUNT(*) as cnt FROM mentor`)
      .first();
    const total = countRow?.cnt ?? 0;

    // 멘토 목록 (유저 정보 + 리뷰 평균)
    const rows = await env.D1_DB
      .prepare(`
        SELECT
          m.mentor_id,
          u.user_id,
          u.nickname,
          u.profile_image,
          mp.subject        AS job,
          mp.career         AS company,
          mp.introduction   AS introduction,
          ROUND(AVG(mr.rating), 1)  AS avg_rating,
          COUNT(mr.review_id)       AS review_count
        FROM mentor m
        JOIN "user" u ON u.user_id = m.user_id
        LEFT JOIN mentor_profile mp ON mp.user_id = m.user_id
        LEFT JOIN mentor_review mr  ON mr.mentor_id = m.mentor_id
        GROUP BY m.mentor_id
        ORDER BY ${orderBy}
        LIMIT ? OFFSET ?
      `)
      .bind(size, offset)
      .all();

    const mentors = (rows.results ?? []).map((r) => ({
      id: r.mentor_id,
      user_id: r.user_id,
      name: r.nickname || "멘토",
      profile_image: r.profile_image || "/images/profile.jpg",
      job: r.job || "",
      company: r.company || "",
      introduction: r.introduction || "",
      rating: r.avg_rating ?? 0,
      reviewCount: r.review_count ?? 0,
    }));

    return json({ mentors, total, page, size, totalPages: Math.max(1, Math.ceil(total / size)) }, 200, request);
  } catch (e) {
    return json({ message: e?.message || "서버 오류" }, 500, request);
  }
}
