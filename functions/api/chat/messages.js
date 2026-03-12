const CORS = (req) => ({
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": req?.headers?.get("Origin") || "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
});
const json = (data, status = 200, req) =>
  new Response(JSON.stringify(data), { status, headers: CORS(req) });

export async function onRequestOptions({ request }) {
  return new Response(null, { status: 204, headers: CORS(request) });
}

/**
 * GET /api/chat/messages?room_id=xxx&after=0
 * 메시지 목록 조회 (after: 마지막으로 받은 message_id, 폴링용)
 */
export async function onRequestGet({ env, url: _url, request }) {
  try {
    const url = _url ?? new URL(request.url);
    const room_id = Number(url.searchParams.get("room_id"));
    const after = Number(url.searchParams.get("after") || 0);
    if (!room_id) return json({ message: "room_id 필요" }, 400, request);

    const rows = await env.D1_DB
      .prepare(`
        SELECT
          cm.message_id,
          cm.sender_id,
          cm.content,
          cm.created_at,
          u.nickname,
          u.profile_image
        FROM chat_message cm
        JOIN "user" u ON u.user_id = cm.sender_id
        WHERE cm.room_id = ?
          AND cm.message_id > ?
        ORDER BY cm.message_id ASC
        LIMIT 100
      `)
      .bind(room_id, after)
      .all();

    return json({ messages: rows.results ?? [] }, 200, request);
  } catch (e) {
    return json({ message: e?.message || "서버 오류" }, 500, request);
  }
}

/**
 * POST /api/chat/messages
 * body: { room_id, sender_id, content }
 */
export async function onRequestPost({ env, request }) {
  try {
    const body = await request.json().catch(() => ({}));
    const { room_id, sender_id, content } = body;

    if (!room_id || !sender_id || !content?.trim()) {
      return json({ message: "room_id, sender_id, content 필요" }, 400, request);
    }

    const result = await env.D1_DB
      .prepare(`INSERT INTO chat_message (room_id, sender_id, content) VALUES (?, ?, ?)`)
      .bind(Number(room_id), Number(sender_id), content.trim())
      .run();

    // 상대방에게 알림 발송
    try {
      // 채팅방 → mentoring → 상대방 user_id 조회
      const roomRow = await env.D1_DB
        .prepare(`SELECT mentoring_id FROM chat_room WHERE room_id = ? LIMIT 1`)
        .bind(Number(room_id))
        .first();

      if (roomRow?.mentoring_id) {
        const partiesRow = await env.D1_DB
          .prepare(`
            SELECT
              u_mentor.user_id AS mentor_user_id,
              u_mentee.user_id AS mentee_user_id,
              u_sender.nickname  AS sender_nickname
            FROM mentoring mt
            JOIN mentor men ON men.mentor_id = mt.mentor_id
            JOIN "user" u_mentor ON u_mentor.user_id = men.user_id
            JOIN mentee me ON me.mentee_id = mt.mentee_id
            JOIN "user" u_mentee ON u_mentee.user_id = me.user_id
            JOIN "user" u_sender ON u_sender.user_id = ?
            WHERE mt.mentoring_id = ?
            LIMIT 1
          `)
          .bind(Number(sender_id), roomRow.mentoring_id)
          .first();

        if (partiesRow) {
          const receiver_id =
            partiesRow.mentor_user_id === Number(sender_id)
              ? partiesRow.mentee_user_id
              : partiesRow.mentor_user_id;

          await env.D1_DB
            .prepare(`INSERT INTO notification (user_id, message, mentoring_id) VALUES (?, ?, ?)`)
            .bind(
              receiver_id,
              `${partiesRow.sender_nickname}님이 메시지를 보냈어요: "${content.trim().slice(0, 30)}${content.trim().length > 30 ? '...' : ''}"`,
              roomRow.mentoring_id
            )
            .run();
        }
      }
    } catch { /* 알림 실패해도 메시지 전송은 성공 */ }

    return json({ message_id: result.meta?.last_row_id }, 201, request);
  } catch (e) {
    return json({ message: e?.message || "서버 오류" }, 500, request);
  }
}

/**
 * PUT /api/chat/messages
 * body: { message_id, sender_id, content }
 */
export async function onRequestPut({ env, request }) {
  try {
    const body = await request.json().catch(() => ({}));
    const { message_id, sender_id, content } = body;
    if (!message_id || !sender_id || !content?.trim())
      return json({ message: "message_id, sender_id, content 필요" }, 400, request);

    const row = await env.D1_DB
      .prepare(`SELECT sender_id FROM chat_message WHERE message_id = ?`)
      .bind(Number(message_id))
      .first();
    if (!row) return json({ message: "메시지 없음" }, 404, request);
    if (row.sender_id !== Number(sender_id))
      return json({ message: "본인 메시지만 수정할 수 있어요" }, 403, request);

    await env.D1_DB
      .prepare(`UPDATE chat_message SET content = ? WHERE message_id = ?`)
      .bind(content.trim(), Number(message_id))
      .run();

    return json({ ok: true }, 200, request);
  } catch (e) {
    return json({ message: e?.message || "서버 오류" }, 500, request);
  }
}

/**
 * DELETE /api/chat/messages
 * body: { message_id, sender_id }
 */
export async function onRequestDelete({ env, request }) {
  try {
    const body = await request.json().catch(() => ({}));
    const { message_id, sender_id } = body;
    if (!message_id || !sender_id)
      return json({ message: "message_id, sender_id 필요" }, 400, request);

    const row = await env.D1_DB
      .prepare(`SELECT sender_id FROM chat_message WHERE message_id = ?`)
      .bind(Number(message_id))
      .first();
    if (!row) return json({ message: "메시지 없음" }, 404, request);
    if (row.sender_id !== Number(sender_id))
      return json({ message: "본인 메시지만 삭제할 수 있어요" }, 403, request);

    await env.D1_DB
      .prepare(`DELETE FROM chat_message WHERE message_id = ?`)
      .bind(Number(message_id))
      .run();

    return json({ ok: true }, 200, request);
  } catch (e) {
    return json({ message: e?.message || "서버 오류" }, 500, request);
  }
}
