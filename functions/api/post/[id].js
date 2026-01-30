function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

/**
 * GET /api/post/:id
 * - 게시글 상세 조회 (+ 조회수 1 증가)
 */
export async function onRequestGet({ env, params }) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) return json({ message: "invalid id" }, 400);

  // 조회수 +1
  await env.D1_DB.prepare(
    "UPDATE community_post SET view_count = view_count + 1 WHERE post_id = ?"
  ).bind(id).run();

  const post = await env.D1_DB.prepare(
    `SELECT post_id, title, content, view_count, created_at, updated_at, user_id
     FROM community_post
     WHERE post_id = ? AND deleted_at IS NULL`
  ).bind(id).first();

  if (!post) return json({ message: "not found" }, 404);
  return json(post);
}

/**
 * PUT /api/post/:id
 * - 내 글만 수정
 * body: { title, content, user_id }
 */
export async function onRequestPut({ env, params, request }) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) return json({ message: "invalid id" }, 400);

  const body = await request.json();
  const title = (body?.title ?? "").trim();
  const content = (body?.content ?? "").trim();
  const userId = Number(body?.user_id);

  if (!userId) return json({ message: "user_id required" }, 400);
  if (!title || !content) return json({ message: "title/content required" }, 400);

  const row = await env.D1_DB.prepare(
    "SELECT user_id FROM community_post WHERE post_id = ? AND deleted_at IS NULL"
  ).bind(id).first();

  if (!row) return json({ message: "not found" }, 404);
  if (Number(row.user_id) !== userId) return json({ message: "forbidden" }, 403);

  await env.D1_DB.prepare(
    "UPDATE community_post SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP WHERE post_id = ?"
  ).bind(title, content, id).run();

  return json({ ok: true });
}

/**
 * DELETE /api/post/:id
 * - 내 글만 삭제(소프트 삭제)
 * body: { user_id }
 */
export async function onRequestDelete({ env, params, request }) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) return json({ message: "invalid id" }, 400);

  let body = {};
  try { body = await request.json(); } catch {}
  const userId = Number(body?.user_id);

  if (!userId) return json({ message: "user_id required" }, 400);

  const row = await env.D1_DB.prepare(
    "SELECT user_id FROM community_post WHERE post_id = ? AND deleted_at IS NULL"
  ).bind(id).first();

  if (!row) return json({ message: "not found" }, 404);
  if (Number(row.user_id) !== userId) return json({ message: "forbidden" }, 403);

  await env.D1_DB.prepare(
    "UPDATE community_post SET deleted_at = CURRENT_TIMESTAMP WHERE post_id = ?"
  ).bind(id).run();

  return json({ ok: true });
}
