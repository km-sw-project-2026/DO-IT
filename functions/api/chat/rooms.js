const CORS = (req) => ({
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": req?.headers?.get("Origin") || "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
});
const json = (data, status = 200, req) =>
  new Response(JSON.stringify(data), { status, headers: CORS(req) });

export async function onRequestOptions({ request }) {
  return new Response(null, { status: 204, headers: CORS(request) });
}

/**
 * GET /api/chat/rooms?user_id=xxx
 * 내가 참여 중인 채팅방 목록
 */
export async function onRequestGet({ env, url, request }) {
  try {
    const user_id = Number(url.searchParams.get("user_id"));
    if (!user_id) return json({ message: "user_id 필요" }, 400, request);

    const rows = await env.D1_DB
      .prepare(`
        SELECT
          cr.room_id,
          cr.mentoring_id,
          cr.created_at,
          u_mentor.user_id  AS mentor_user_id,
          u_mentor.nickname AS mentor_nickname,
          u_mentor.profile_image AS mentor_image,
          u_mentee.user_id  AS mentee_user_id,
          u_mentee.nickname AS mentee_nickname,
          u_mentee.profile_image AS mentee_image
        FROM chat_room cr
        JOIN mentoring mt ON mt.mentoring_id = cr.mentoring_id
        JOIN mentor men ON men.mentor_id = mt.mentor_id
        JOIN "user" u_mentor ON u_mentor.user_id = men.user_id
        JOIN mentee me ON me.mentee_id = mt.mentee_id
        JOIN "user" u_mentee ON u_mentee.user_id = me.user_id
        WHERE (men.user_id = ? OR me.user_id = ?)
          AND mt.status = 'ACCEPTED'
          AND cr.room_id NOT IN (
            SELECT room_id FROM chat_room_hide WHERE user_id = ?
          )
        ORDER BY cr.created_at DESC
      `)
      .bind(user_id, user_id, user_id)
      .all();

    const rooms = (rows.results ?? []).map((r) => ({
      room_id: r.room_id,
      mentoring_id: r.mentoring_id,
      // 상대방 정보 (내가 멘토면 멘티를, 멘티면 멘토를)
      other_user_id:
        r.mentor_user_id === user_id ? r.mentee_user_id : r.mentor_user_id,
      other_nickname:
        r.mentor_user_id === user_id ? r.mentee_nickname : r.mentor_nickname,
      other_image:
        r.mentor_user_id === user_id
          ? r.mentee_image || "/images/profile.jpg"
          : r.mentor_image || "/images/profile.jpg",
      is_mentor: r.mentor_user_id === user_id,
    }));

    return json({ rooms }, 200, request);
  } catch (e) {
    return json({ message: e?.message || "서버 오류" }, 500, request);
  }
}

/**
 * POST /api/chat/rooms
 * body: { mentoring_id }
 * - 이미 있으면 기존 room_id 반환, 없으면 생성
 */
export async function onRequestPost({ env, request }) {
  try {
    const { mentoring_id } = await request.json().catch(() => ({}));
    if (!mentoring_id) return json({ message: "mentoring_id 필요" }, 400, request);

    // 이미 있으면 반환
    const existing = await env.D1_DB
      .prepare(`SELECT room_id FROM chat_room WHERE mentoring_id = ? LIMIT 1`)
      .bind(Number(mentoring_id))
      .first();

    if (existing) return json({ room_id: existing.room_id }, 200, request);

    // 없으면 생성
    const result = await env.D1_DB
      .prepare(`INSERT INTO chat_room (mentoring_id) VALUES (?)`)
      .bind(Number(mentoring_id))
      .run();

    return json({ room_id: result.meta?.last_row_id }, 201, request);
  } catch (e) {
    return json({ message: e?.message || "서버 오류" }, 500, request);
  }
}

/**
 * DELETE /api/chat/rooms
 * body: { user_id, room_id } → 이 유저에게 채팅방 기록 숨김
 */
export async function onRequestDelete({ env, request }) {
  try {
    const body = await request.json().catch(() => ({}));
    const { user_id, room_id } = body;
    if (!user_id || !room_id) return json({ message: "user_id, room_id 필요" }, 400, request);

    await env.D1_DB
      .prepare(`INSERT OR IGNORE INTO chat_room_hide (user_id, room_id) VALUES (?, ?)`)
      .bind(Number(user_id), Number(room_id))
      .run();

    return json({ message: "기록이 삭제되었습니다." }, 200, request);
  } catch (e) {
    return json({ message: e?.message || "서버 오류" }, 500, request);
  }
}
