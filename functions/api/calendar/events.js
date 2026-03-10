import {
  json,
  readJson,
  getUserId,
  ensureCalendarSchema,
  ensureDefaultCategories,
  getDefaultExamCategoryId,
} from "../_utils/calendar";

export async function onRequestGet({ request, env }) {
  const userId = getUserId(request);
  if (!userId) return json({ error: "user_id가 없습니다." }, 401);
  await ensureCalendarSchema(env.D1_DB);

  const url = new URL(request.url);
  const month = url.searchParams.get("month"); // YYYY-MM
  const date = url.searchParams.get("date");   // YYYY-MM-DD

  let sql = `
    SELECT
      e.event_id,
      e.event_date,
      e.title,
      e.description,
      e.is_done,
      e.created_at,
      e.updated_at,
      c.category_id,
      c.name AS category_name,
      c.color_code
    FROM calendar_event e
    LEFT JOIN calendar_event_category ec
      ON ec.event_id = e.event_id
    LEFT JOIN calendar_category c
      ON c.category_id = ec.category_id
    WHERE e.user_id = ?
      AND e.deleted_at IS NULL
  `;

  const binds = [userId];

  if (month) {
    sql += ` AND substr(e.event_date, 1, 7) = ? `;
    binds.push(month);
  }

  if (date) {
    sql += ` AND e.event_date = ? `;
    binds.push(date);
  }

  sql += ` ORDER BY e.event_date ASC, e.created_at DESC, e.event_id DESC `;

  const { results } = await env.D1_DB.prepare(sql).bind(...binds).all();

  return json({ events: results || [] });
}

export async function onRequestPost({ request, env }) {
  const userId = getUserId(request);
  if (!userId) return json({ error: "user_id가 없습니다." }, 401);

  await ensureCalendarSchema(env.D1_DB);
  await ensureDefaultCategories(env.D1_DB, userId);

  const body = await readJson(request);
  const eventDate = body?.event_date;
  const title = body?.title?.trim();
  const description = body?.description?.trim() || "";
  const categoryIdFromBody = Number(body?.category_id || 0);

  if (!eventDate) return json({ error: "event_date가 필요합니다." }, 400);
  if (!title) return json({ error: "title이 필요합니다." }, 400);

  let categoryId = categoryIdFromBody;

  if (!categoryId) {
    categoryId = await getDefaultExamCategoryId(env.D1_DB, userId);
  } else {
    const cat = await env.D1_DB
      .prepare(`
        SELECT category_id
        FROM calendar_category
        WHERE category_id = ?
          AND user_id = ?
          AND deleted_at IS NULL
        LIMIT 1
      `)
      .bind(categoryId, userId)
      .first();

    if (!cat) {
      return json({ error: "선택한 카테고리를 찾을 수 없습니다." }, 404);
    }
  }

  const eventRes = await env.D1_DB
    .prepare(`
      INSERT INTO calendar_event (event_date, title, description, user_id)
      VALUES (?, ?, ?, ?)
    `)
    .bind(eventDate, title, description, userId)
    .run();

  const eventId = eventRes.meta.last_row_id;

  await env.D1_DB
    .prepare(`
      INSERT INTO calendar_event_category (event_id, category_id)
      VALUES (?, ?)
    `)
    .bind(eventId, categoryId)
    .run();

  return json({
    message: "일정 추가 완료",
    event_id: eventId,
  }, 201);
}
