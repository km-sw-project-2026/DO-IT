import { json, getUserId } from "../../_utils/calendar";

export async function onRequestDelete({ request, env, params }) {
  const userId = getUserId(request);
  if (!userId) return json({ error: "user_id가 없습니다." }, 401);

  const eventId = Number(params.id);
  if (!eventId) return json({ error: "잘못된 event_id 입니다." }, 400);

  const target = await env.D1_DB
    .prepare(`
      SELECT event_id
      FROM calendar_event
      WHERE event_id = ?
        AND user_id = ?
        AND deleted_at IS NULL
      LIMIT 1
    `)
    .bind(eventId, userId)
    .first();

  if (!target) return json({ error: "일정을 찾을 수 없습니다." }, 404);

  await env.D1_DB
    .prepare(`
      UPDATE calendar_event
      SET deleted_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE event_id = ?
        AND user_id = ?
        AND deleted_at IS NULL
    `)
    .bind(eventId, userId)
    .run();

  await env.D1_DB
    .prepare(`
      DELETE FROM calendar_event_category
      WHERE event_id = ?
    `)
    .bind(eventId)
    .run();

  return json({ message: "일정 삭제 완료" });
}