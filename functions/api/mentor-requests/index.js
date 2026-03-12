const CORS = (request) => ({
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": request?.headers?.get("Origin") || "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
});

function json(data, status = 200, request) {
  return new Response(JSON.stringify(data), { status, headers: CORS(request) });
}

export async function onRequestOptions({ request }) {
  return new Response(null, { status: 204, headers: CORS(request) });
}

/**
 * GET /api/mentor-requests?user_id=xxx
 * 내 멘토에 온 신청 목록 (PENDING + ACCEPTED)
 */
export async function onRequestGet({ env, url: _url, request }) {
  try {
    const url = _url ?? new URL(request.url);
    const user_id = Number(url.searchParams.get("user_id"));
    if (!user_id) return json({ message: "user_id 필요" }, 400, request);

    // 내 mentor_id 조회
    const mentorRow = await env.D1_DB
      .prepare(`SELECT mentor_id FROM mentor WHERE user_id = ? LIMIT 1`)
      .bind(user_id)
      .first();

    if (!mentorRow) return json({ requests: [] }, 200, request);

    const rows = await env.D1_DB
      .prepare(`
        SELECT
          mt.mentoring_id,
          mt.status,
          mt.mentoring_at,
          u.user_id,
          u.nickname,
          u.profile_image
        FROM mentoring mt
        JOIN mentee me ON me.mentee_id = mt.mentee_id
        JOIN "user" u ON u.user_id = me.user_id
        WHERE mt.mentor_id = ?
          AND mt.status IN ('PENDING', 'ACCEPTED')
        ORDER BY mt.mentoring_at DESC
      `)
      .bind(mentorRow.mentor_id)
      .all();

    const requests = (rows.results ?? []).map((r) => ({
      mentoring_id: r.mentoring_id,
      status: r.status,
      mentoring_at: r.mentoring_at,
      user_id: r.user_id,
      nickname: r.nickname || "멘티",
      profile_image: r.profile_image || "/images/profile.jpg",
    }));

    return json({ requests }, 200, request);
  } catch (e) {
    return json({ message: e?.message || "서버 오류" }, 500, request);
  }
}

/**
 * POST /api/mentor-requests/respond
 * body: { user_id, mentoring_id, action: "ACCEPT" | "REJECT" }
 */
export async function onRequestPost({ env, request }) {
  try {
    const body = await request.json().catch(() => ({}));
    const { user_id, mentoring_id, action } = body;

    if (!user_id || !mentoring_id) return json({ message: "user_id, mentoring_id 필요" }, 400, request);
    if (!["ACCEPT", "REJECT"].includes(action)) return json({ message: "action은 ACCEPT 또는 REJECT" }, 400, request);

    // 내 mentor_id 확인
    const mentorRow = await env.D1_DB
      .prepare(`SELECT mentor_id FROM mentor WHERE user_id = ? LIMIT 1`)
      .bind(Number(user_id))
      .first();

    if (!mentorRow) return json({ message: "멘토 권한이 없습니다." }, 403, request);

    // 해당 신청이 내 것인지 확인
    const req = await env.D1_DB
      .prepare(`SELECT mentoring_id, status FROM mentoring WHERE mentoring_id = ? AND mentor_id = ?`)
      .bind(Number(mentoring_id), mentorRow.mentor_id)
      .first();

    if (!req) return json({ message: "신청을 찾을 수 없습니다." }, 404, request);
    if (req.status !== "PENDING") return json({ message: "이미 처리된 신청입니다." }, 409, request);

    const newStatus = action === "ACCEPT" ? "ACCEPTED" : "REJECTED";

    await env.D1_DB
      .prepare(`UPDATE mentoring SET status = ? WHERE mentoring_id = ?`)
      .bind(newStatus, Number(mentoring_id))
      .run();

    // ACCEPT 시 멘티에게 알림 INSERT
    if (action === "ACCEPT") {
      // mentoring → mentee → user_id 조회
      const menteeRow = await env.D1_DB
        .prepare(`
          SELECT me.user_id
          FROM mentoring mt
          JOIN mentee me ON me.mentee_id = mt.mentee_id
          WHERE mt.mentoring_id = ?
          LIMIT 1
        `)
        .bind(Number(mentoring_id))
        .first();

      if (menteeRow?.user_id) {
        // 멘토 닉네임 조회
        const mentorUserRow = await env.D1_DB
          .prepare(`
            SELECT u.nickname
            FROM mentor m
            JOIN "user" u ON u.user_id = m.user_id
            WHERE m.mentor_id = ?
            LIMIT 1
          `)
          .bind(mentorRow.mentor_id)
          .first();

        const mentorNickname = mentorUserRow?.nickname || "멘토";

        try {
          await env.D1_DB
            .prepare(`
              INSERT INTO notification (user_id, message, mentoring_id, link_url)
              VALUES (?, ?, ?, ?)
            `)
            .bind(
              menteeRow.user_id,
              `${mentorNickname} 멘토가 멘토링 신청을 수락했어요! 🎉`,
              Number(mentoring_id),
              `/chat?mentoring_id=${mentoring_id}`
            )
            .run();
        } catch { /* 알림 실패여도 수락 성공 */ }
      }
    }

    return json({ message: action === "ACCEPT" ? "수락 완료" : "거절 완료" }, 200, request);
  } catch (e) {
    return json({ message: e?.message || "서버 오류" }, 500, request);
  }
}
/**
 * DELETE /api/mentor-requests
 * body: { user_id (mentor), mentoring_id }
 * 멘토링 종료: status = ENDED, 멘튰에게 알림, 채팅에 시스템 메시지
 */
export async function onRequestDelete({ env, request }) {
  try {
    const body = await request.json().catch(() => ({}));
    const { user_id, mentoring_id } = body;
    if (!user_id || !mentoring_id) return json({ message: "user_id, mentoring_id 필요" }, 400, request);

    // 멘토 확인
    const mentorRow = await env.D1_DB
      .prepare(`SELECT mentor_id FROM mentor WHERE user_id = ? LIMIT 1`)
      .bind(Number(user_id))
      .first();
    if (!mentorRow) return json({ message: "멘토 권한이 없습니다." }, 403, request);

    const row = await env.D1_DB
      .prepare(`SELECT mentoring_id, status FROM mentoring WHERE mentoring_id = ? AND mentor_id = ?`)
      .bind(Number(mentoring_id), mentorRow.mentor_id)
      .first();
    if (!row) return json({ message: "멘토링을 일을 수 없습니다." }, 404, request);

    // 1. status ENDED
    await env.D1_DB
      .prepare(`UPDATE mentoring SET status = 'ENDED' WHERE mentoring_id = ?`)
      .bind(Number(mentoring_id))
      .run();

    // 2. 멘톰 닉네임 조회
    const mentorUserRow = await env.D1_DB
      .prepare(`SELECT u.nickname FROM mentor m JOIN "user" u ON u.user_id = m.user_id WHERE m.mentor_id = ? LIMIT 1`)
      .bind(mentorRow.mentor_id)
      .first();
    const mentorNickname = mentorUserRow?.nickname || "멘토";

    // 3. 멘티 user_id 조회
    const menteeUserRow = await env.D1_DB
      .prepare(`
        SELECT me.user_id
        FROM mentoring mt
        JOIN mentee me ON me.mentee_id = mt.mentee_id
        WHERE mt.mentoring_id = ? LIMIT 1
      `)
      .bind(Number(mentoring_id))
      .first();

    if (menteeUserRow?.user_id) {
      // 4. 멘티에게 알림
      try {
        await env.D1_DB
          .prepare(`INSERT INTO notification (user_id, message, mentoring_id, link_url) VALUES (?, ?, ?, ?)`)
          .bind(
            menteeUserRow.user_id,
            `${mentorNickname} 멘토님이 멘토링을 종료했어요.`,
            Number(mentoring_id),
            `/chat?mentoring_id=${mentoring_id}`
          )
          .run();
      } catch { /* 알림 실패여도 종료 성공 */ }
    }

    // 5. 해당 채팅방에 시스템 메시지 삽입
    const roomRow = await env.D1_DB
      .prepare(`SELECT room_id FROM chat_room WHERE mentoring_id = ? LIMIT 1`)
      .bind(Number(mentoring_id))
      .first();
    if (roomRow?.room_id) {
      await env.D1_DB
        .prepare(`INSERT INTO chat_message (room_id, sender_id, content) VALUES (?, 0, ?)`)
        .bind(roomRow.room_id, `[system]채팅이 종료되었습니다.[/system]`)
        .run();
    }

    return json({ ok: true }, 200, request);
  } catch (e) {
    return json({ message: e?.message || "서버 오류" }, 500, request);
  }
}