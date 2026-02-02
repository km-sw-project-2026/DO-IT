function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function getId(params) {
  const id = Number(params?.id);
  return Number.isFinite(id) && id > 0 ? id : null;
}

/**
 * GET /api/post/:id
 * - 게시글 상세 조회 (+ 조회수 1 증가)
 */
export async function onRequestGet({ env, params }) {
  const id = getId(params);
  if (!id) return json({ message: "invalid id" }, 400);

  // 조회수 +1 (글이 없으면 업데이트는 그냥 0 rows)
  await env.D1_DB.prepare(
    "UPDATE community_post SET view_count = view_count + 1 WHERE post_id = ?"
  )
    .bind(id)
    .run();

  // ✅ user 테이블은 예약어 충돌 날 수 있어서 "user"로 감싸는 게 안전함
  const post = await env.D1_DB.prepare(
    `SELECT
       p.post_id,
       p.title,
       p.content,
       p.view_count,
       p.created_at,
       p.updated_at,
       p.user_id,
       u.nickname AS author_nickname,
       u.role AS author_role   
     FROM community_post p
     LEFT JOIN "user" u ON u.user_id = p.user_id
     WHERE p.post_id = ? AND p.deleted_at IS NULL`
  )
    .bind(id)
    .first();

  if (!post) return json({ message: "not found" }, 404);
  return json(post, 200);
}

/**
 * PUT /api/post/:id
 * body: { title, content, user_id }
 */
export async function onRequestPut({ env, params, request }) {
  const id = getId(params);
  if (!id) return json({ message: "invalid id" }, 400);

  const body = await request.json().catch(() => ({}));
  const title = String(body?.title ?? "").trim();
  const content = String(body?.content ?? "").trim();
  const userId = Number(body?.user_id);

  if (!Number.isFinite(userId) || userId <= 0)
    return json({ message: "invalid user_id" }, 400);
  if (!title || !content) return json({ message: "title/content required" }, 400);

  const row = await env.D1_DB.prepare(
    "SELECT user_id FROM community_post WHERE post_id = ? AND deleted_at IS NULL"
  )
    .bind(id)
    .first();

  if (!row) return json({ message: "not found" }, 404);
  if (Number(row.user_id) !== userId) return json({ message: "forbidden" }, 403);

  await env.D1_DB.prepare(
    "UPDATE community_post SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP WHERE post_id = ?"
  )
    .bind(title, content, id)
    .run();

  return json({ ok: true }, 200);
}

/**
 * DELETE /api/post/:id
 * body: { user_id }
 */
export async function onRequestDelete({ env, params, request }) {
  const id = getId(params);
  if (!id) return json({ message: "invalid id" }, 400);

  const body = await request.json().catch(() => ({}));
  const userId = Number(body?.user_id);

  if (!Number.isFinite(userId) || userId <= 0) {
    return json({ message: "invalid user_id" }, 400);
  }

  // ✅ 1) 게시글 존재 + 작성자 조회 (row 없으면 not found)
  const row = await env.D1_DB.prepare(
    `SELECT user_id
     FROM community_post
     WHERE post_id = ?
       AND deleted_at IS NULL
     LIMIT 1`
  )
    .bind(id)
    .first();

  if (!row) return json({ message: "not found" }, 404);

  // ✅ 2) 요청자 role 조회
  const requester = await env.D1_DB.prepare(
    `SELECT role
     FROM "user"
     WHERE user_id = ?
     LIMIT 1`
  )
    .bind(userId)
    .first();

  const isAdmin = requester?.role === "ADMIN";
  const isOwner = Number(row.user_id) === userId;

  // ✅ 3) 작성자도 아니고 관리자도 아니면 금지
  if (!isOwner && !isAdmin) return json({ message: "forbidden" }, 403);

  // ✅ 4) 소프트 삭제
  await env.D1_DB.prepare(
    `UPDATE community_post
     SET deleted_at = CURRENT_TIMESTAMP
     WHERE post_id = ?`
  )
    .bind(id)
    .run();

  return json({ ok: true }, 200);
}

