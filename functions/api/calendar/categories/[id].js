import {
  json,
  readJson,
  getUserId,
  getDefaultExamCategoryId,
  isLockedCategory,
} from "../../_utils/calendar";

export async function onRequestPut({ request, env, params }) {
  const userId = getUserId(request);
  if (!userId) return json({ error: "user_id가 없습니다." }, 401);

  const categoryId = Number(params.id);
  if (!categoryId) return json({ error: "잘못된 category_id 입니다." }, 400);

  const body = await readJson(request);
  const name = body?.name?.trim();
  const colorCode = body?.color_code;

  const target = await env.D1_DB
    .prepare(`
      SELECT category_id, name
      FROM calendar_category
      WHERE category_id = ?
        AND user_id = ?
        AND deleted_at IS NULL
      LIMIT 1
    `)
    .bind(categoryId, userId)
    .first();

  if (!target) return json({ error: "카테고리를 찾을 수 없습니다." }, 404);
  if (isLockedCategory(target.name)) {
    return json({ error: "기본 카테고리는 수정할 수 없습니다." }, 400);
  }

  if (!name) return json({ error: "카테고리 이름이 필요합니다." }, 400);

  await env.D1_DB
    .prepare(`
      UPDATE calendar_category
      SET name = ?, color_code = ?, updated_at = CURRENT_TIMESTAMP
      WHERE category_id = ?
        AND user_id = ?
        AND deleted_at IS NULL
    `)
    .bind(name, colorCode || "#9CA3AF", categoryId, userId)
    .run();

  return json({ message: "카테고리 수정 완료" });
}

export async function onRequestDelete({ request, env, params }) {
  const userId = getUserId(request);
  if (!userId) return json({ error: "user_id가 없습니다." }, 401);

  const categoryId = Number(params.id);
  if (!categoryId) return json({ error: "잘못된 category_id 입니다." }, 400);

  const target = await env.D1_DB
    .prepare(`
      SELECT category_id, name
      FROM calendar_category
      WHERE category_id = ?
        AND user_id = ?
        AND deleted_at IS NULL
      LIMIT 1
    `)
    .bind(categoryId, userId)
    .first();

  if (!target) return json({ error: "카테고리를 찾을 수 없습니다." }, 404);
  if (isLockedCategory(target.name)) {
    return json({ error: "기본 카테고리는 삭제할 수 없습니다." }, 400);
  }

  const examCategoryId = await getDefaultExamCategoryId(env.D1_DB, userId);
  if (!examCategoryId) {
    return json({ error: "기본 카테고리(시험)를 찾을 수 없습니다." }, 500);
  }

  // 이 카테고리를 쓰던 일정들을 시험 카테고리로 이동
  const linkedEvents = await env.D1_DB
    .prepare(`
      SELECT ec.event_id
      FROM calendar_event_category ec
      JOIN calendar_event e
        ON e.event_id = ec.event_id
      WHERE ec.category_id = ?
        AND e.user_id = ?
        AND e.deleted_at IS NULL
    `)
    .bind(categoryId, userId)
    .all();

  const eventIds = (linkedEvents.results || []).map((r) => r.event_id);

  for (const eventId of eventIds) {
    await env.D1_DB
      .prepare(`
        DELETE FROM calendar_event_category
        WHERE event_id = ?
      `)
      .bind(eventId)
      .run();

    await env.D1_DB
      .prepare(`
        INSERT INTO calendar_event_category (event_id, category_id)
        VALUES (?, ?)
      `)
      .bind(eventId, examCategoryId)
      .run();
  }

  await env.D1_DB
    .prepare(`
      UPDATE calendar_category
      SET deleted_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE category_id = ?
        AND user_id = ?
        AND deleted_at IS NULL
    `)
    .bind(categoryId, userId)
    .run();

  return json({ message: "카테고리 삭제 완료" });
}