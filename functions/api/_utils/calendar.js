function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

// 프론트에서 헤더 x-user-id 로 보낸다고 가정
function getUserId(request) {
  const userId = request.headers.get("x-user-id");
  return Number(userId || 0);
}

const DEFAULT_CATEGORIES = [
  { name: "시험", color_code: "#FFD047" },
  { name: "수행", color_code: "#72CAB5" },
  { name: "숙제", color_code: "#C799FF" },
];

async function ensureDefaultCategories(db, userId) {
  for (const cat of DEFAULT_CATEGORIES) {
    await db
      .prepare(`
        INSERT INTO calendar_category (name, color_code, user_id)
        SELECT ?, ?, ?
        WHERE NOT EXISTS (
          SELECT 1
          FROM calendar_category
          WHERE user_id = ?
            AND name = ?
            AND deleted_at IS NULL
        )
      `)
      .bind(cat.name, cat.color_code, userId, userId, cat.name)
      .run();
  }
}

async function getDefaultExamCategoryId(db, userId) {
  const row = await db
    .prepare(`
      SELECT category_id
      FROM calendar_category
      WHERE user_id = ?
        AND name = '시험'
        AND deleted_at IS NULL
      LIMIT 1
    `)
    .bind(userId)
    .first();

  return row?.category_id ?? null;
}

function isLockedCategory(name) {
  return ["시험", "수행", "숙제"].includes(name);
}

export {
  json,
  readJson,
  getUserId,
  ensureDefaultCategories,
  getDefaultExamCategoryId,
  isLockedCategory,
};