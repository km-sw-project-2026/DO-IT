const CORS = (request) => ({
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": request?.headers?.get("Origin") || "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
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
 * POST /api/mentoring/apply
 * body: { mentor_id, user_id, message }
 *
 * Flow:
 *  1. mentor 존재 확인
 *  2. user 존재 확인
 *  3. mentee 레코드 없으면 자동 생성
 *  4. 이미 PENDING 신청이 있는지 중복 확인
 *  5. mentoring 레코드 INSERT (status = 'PENDING')
 */
export async function onRequestPost({ env, request }) {
  try {
    const body = await request.json();
    const { mentor_id, user_id, message } = body;

    if (!mentor_id || !user_id) {
      return json({ message: "mentor_id, user_id는 필수입니다." }, 400, request);
    }

    // 1. mentor 존재 확인
    const mentorRow = await env.D1_DB
      .prepare("SELECT mentor_id FROM mentor WHERE mentor_id = ?")
      .bind(Number(mentor_id))
      .first();

    if (!mentorRow) {
      return json({ message: "존재하지 않는 멘토입니다." }, 404, request);
    }

    // 2. user 존재 확인
    const userRow = await env.D1_DB
      .prepare("SELECT user_id FROM user WHERE user_id = ?")
      .bind(Number(user_id))
      .first();

    if (!userRow) {
      return json({ message: "존재하지 않는 유저입니다." }, 404, request);
    }

    // 자기 자신에게 신청 불가
    const mentorUserRow = await env.D1_DB
      .prepare("SELECT user_id FROM mentor WHERE mentor_id = ?")
      .bind(Number(mentor_id))
      .first();

    if (mentorUserRow?.user_id === Number(user_id)) {
      return json({ message: "자기 자신에게 멘토링을 신청할 수 없습니다." }, 400, request);
    }

    // 3. mentee 레코드 없으면 자동 생성
    let menteeRow = await env.D1_DB
      .prepare("SELECT mentee_id FROM mentee WHERE user_id = ?")
      .bind(Number(user_id))
      .first();

    if (!menteeRow) {
      await env.D1_DB
        .prepare("INSERT INTO mentee (user_id) VALUES (?)")
        .bind(Number(user_id))
        .run();

      menteeRow = await env.D1_DB
        .prepare("SELECT mentee_id FROM mentee WHERE user_id = ?")
        .bind(Number(user_id))
        .first();
    }

    const menteeId = menteeRow.mentee_id;

    // 4. 중복 PENDING 신청 확인
    const existing = await env.D1_DB
      .prepare(`
        SELECT mentoring_id FROM mentoring
        WHERE mentor_id = ? AND mentee_id = ? AND status = 'PENDING'
      `)
      .bind(Number(mentor_id), menteeId)
      .first();

    if (existing) {
      return json({ message: "이미 신청한 멘토링입니다. 승인을 기다려주세요." }, 409, request);
    }

    // 5. mentoring 레코드 INSERT
    const result = await env.D1_DB
      .prepare(`
        INSERT INTO mentoring (status, mentoring_at, mentor_id, mentee_id)
        VALUES ('PENDING', CURRENT_TIMESTAMP, ?, ?)
      `)
      .bind(Number(mentor_id), menteeId)
      .run();

    return json({
      message: "멘토링 신청이 완료되었습니다.",
      mentoring_id: result.meta?.last_row_id ?? null,
      mentor_id: Number(mentor_id),
      mentee_id: menteeId,
      status: "PENDING",
    }, 201, request);

  } catch (e) {
    return json({ message: e?.message || "서버 오류" }, 500, request);
  }
}
