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
 * GET /api/notifications?user_id=xxx
 * 내 알림 목록 (최근 30개)
 */
export async function onRequestGet({ env, url: _url, request }) {
  try {
    const url = _url ?? new URL(request.url);
    const user_id = Number(url.searchParams.get("user_id"));
    if (!user_id) return json({ message: "user_id 필요" }, 400, request);

    const rows = await env.D1_DB
      .prepare(`
        SELECT notification_id, message, is_read, mentoring_id, created_at
        FROM notification
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT 30
      `)
      .bind(user_id)
      .all();

    const notifications = rows.results ?? [];
    const unread = notifications.filter((n) => n.is_read === 0).length;

    return json({ notifications, unread }, 200, request);
  } catch (e) {
    return json({ message: e?.message || "서버 오류" }, 500, request);
  }
}

/**
 * POST /api/notifications/read
 * body: { notification_id } OR { user_id } (전체 읽음)
 */
export async function onRequestPost({ env, request }) {
  try {
    const body = await request.json().catch(() => ({}));
    const { notification_id, user_id } = body;

    if (notification_id) {
      // 단일 읽음 처리
      await env.D1_DB
        .prepare(`UPDATE notification SET is_read = 1 WHERE notification_id = ?`)
        .bind(Number(notification_id))
        .run();
    } else if (user_id) {
      // 전체 읽음 처리
      await env.D1_DB
        .prepare(`UPDATE notification SET is_read = 1 WHERE user_id = ?`)
        .bind(Number(user_id))
        .run();
    } else {
      return json({ message: "notification_id 또는 user_id 필요" }, 400, request);
    }

    return json({ message: "읽음 처리 완료" }, 200, request);
  } catch (e) {
    return json({ message: e?.message || "서버 오류" }, 500, request);
  }
}
