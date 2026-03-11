const CORS = (request) => ({
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": request?.headers?.get("Origin") || "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
});

function json(data, status = 200, request) {
  return new Response(JSON.stringify(data), { status, headers: CORS(request) });
}

export async function onRequestOptions({ request }) {
  return new Response(null, { status: 204, headers: CORS(request) });
}

/**
 * GET /api/reviews?mentor_id=xxx&page=1&size=5
 * 특정 멘토의 리뷰 목록 + 평균 별점
 */
export async function onRequestGet({ env, url, request }) {
  try {
    let mentor_id = Number(url.searchParams.get("mentor_id"));
    const user_id = Number(url.searchParams.get("user_id"));
    const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
    const size = Math.min(20, Math.max(1, Number(url.searchParams.get("size")) || 5));

    // user_id로 mentor_id 조회 (멘토 본인이 자기 후기를 볼 때)
    if (!mentor_id && user_id) {
      const mentorRow = await env.D1_DB
        .prepare("SELECT mentor_id FROM mentor WHERE user_id = ? LIMIT 1")
        .bind(user_id)
        .first();
      if (mentorRow) mentor_id = mentorRow.mentor_id;
    }

    if (!mentor_id) return json({ message: "mentor_id 필요" }, 400, request);

    const offset = (page - 1) * size;

    const stats = await env.D1_DB
      .prepare(`SELECT COUNT(*) as cnt, AVG(rating) as avg FROM mentor_review WHERE mentor_id = ?`)
      .bind(mentor_id)
      .first();

    const { results } = await env.D1_DB
      .prepare(`
        SELECT mr.review_id, mr.rating, mr.review_content, mr.anonymous_yn,
               mr.created_at, mr.photo, mr.user_id,
               u.nickname
        FROM mentor_review mr
        JOIN "user" u ON u.user_id = mr.user_id
        WHERE mr.mentor_id = ?
        ORDER BY mr.created_at DESC
        LIMIT ? OFFSET ?
      `)
      .bind(mentor_id, size, offset)
      .all();

    const reviews = (results ?? []).map((r) => ({
      review_id: r.review_id,
      rating: r.rating,
      review_content: r.review_content,
      anonymous_yn: r.anonymous_yn,
      created_at: r.created_at,
      photo: r.photo || null,
      user_id: r.user_id,
      author: r.anonymous_yn === "Y" ? "익명" : (r.nickname || "사용자"),
    }));

    return json({
      reviews,
      total: stats?.cnt ?? 0,
      avg_rating: stats?.avg ? Math.round(stats.avg * 10) / 10 : 0,
      page,
      size,
    }, 200, request);
  } catch (e) {
    return json({ message: e?.message || "서버 오류" }, 500, request);
  }
}

/**
 * POST /api/reviews
 * body: { mentor_id, user_id, rating, review_content, anonymous_yn, photo }
 */
export async function onRequestPost({ env, request }) {
  try {
    const body = await request.json();
    const {
      mentor_id,
      user_id,
      rating,
      review_content,
      anonymous_yn = "N",
      photo = null,
    } = body;

    if (!mentor_id || !user_id || !rating || !review_content?.trim()) {
      return json({ message: "필수 항목 누락" }, 400, request);
    }
    if (rating < 1 || rating > 5) {
      return json({ message: "별점은 1~5여야 합니다" }, 400, request);
    }
    if (review_content.trim().length > 300) {
      return json({ message: "후기는 300자 이내로 작성해주세요" }, 400, request);
    }

    // mentee_id 조회 - 없으면 자동 생성
    let menteeRow = await env.D1_DB
      .prepare(`SELECT mentee_id FROM mentee WHERE user_id = ? LIMIT 1`)
      .bind(user_id)
      .first();

    if (!menteeRow) {
      await env.D1_DB
        .prepare(`INSERT INTO mentee (user_id) VALUES (?)`)
        .bind(user_id)
        .run();
      menteeRow = await env.D1_DB
        .prepare(`SELECT mentee_id FROM mentee WHERE user_id = ? LIMIT 1`)
        .bind(user_id)
        .first();
    }

    // 가장 최근 멘토링 세션 ID 조회
    const mentoringRow = await env.D1_DB
      .prepare(`
        SELECT mentoring_id FROM mentoring
        WHERE mentor_id = ? AND mentee_id = ?
        ORDER BY created_at DESC
        LIMIT 1
      `)
      .bind(mentor_id, menteeRow.mentee_id)
      .first();
    const mentoring_id = mentoringRow?.mentoring_id ?? null;

    if (!mentoring_id) {
      return json({ message: "해당 멘토와의 완료된 멘토링 세션이 없습니다. 멘토링을 먼저 진행해 주세요." }, 403, request);
    }

    const result = await env.D1_DB
      .prepare(`
        INSERT INTO mentor_review
          (rating, review_content, anonymous_yn, user_id, mentoring_id, mentor_id, mentee_id, photo)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        rating,
        review_content.trim(),
        anonymous_yn,
        user_id,
        mentoring_id,
        mentor_id,
        menteeRow.mentee_id,
        photo,
      )
      .run();

    return json({ message: "등록 완료", review_id: result.meta?.last_row_id }, 201, request);
  } catch (e) {
    return json({ message: e?.message || "서버 오류" }, 500, request);
  }
}
