import {
  json,
  readJson,
  getUserId,
  ensureDefaultCategories,
} from "../_utils/calendar";

export async function onRequestGet({ request, env }) {
  const userId = getUserId(request);
  if (!userId) return json({ error: "user_id가 없습니다." }, 401);

  await ensureDefaultCategories(env.D1_DB, userId);

  const { results } = await env.D1_DB
    .prepare(`
      SELECT
        category_id,
        name,
        color_code,
        created_at,
        updated_at,
        CASE
          WHEN name IN ('시험', '수행', '숙제') THEN 1
          ELSE 0
        END AS locked
      FROM calendar_category
      WHERE user_id = ?
        AND deleted_at IS NULL
      ORDER BY
        CASE
          WHEN name = '시험' THEN 1
          WHEN name = '수행' THEN 2
          WHEN name = '숙제' THEN 3
          ELSE 4
        END,
        category_id ASC
    `)
    .bind(userId)
    .all();

  return json({ categories: results || [] });
}

export async function onRequestPost({ request, env }) {
  const userId = getUserId(request);
  if (!userId) return json({ error: "user_id가 없습니다." }, 401);

  const body = await readJson(request);
  const name = body?.name?.trim();
  const colorCode = body?.color_code || "#9CA3AF";

  if (!name) return json({ error: "카테고리 이름이 필요합니다." }, 400);

  const dup = await env.D1_DB
    .prepare(`
      SELECT category_id
      FROM calendar_category
      WHERE user_id = ?
        AND name = ?
        AND deleted_at IS NULL
      LIMIT 1
    `)
    .bind(userId, name)
    .first();

  if (dup) return json({ error: "같은 이름의 카테고리가 이미 있습니다." }, 409);

  const result = await env.D1_DB
    .prepare(`
      INSERT INTO calendar_category (name, color_code, user_id)
      VALUES (?, ?, ?)
    `)
    .bind(name, colorCode, userId)
    .run();

  return json({
    message: "카테고리 추가 완료",
    category_id: result.meta.last_row_id,
  }, 201);
}