function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function getPostId(params) {
  const n = Number(params?.id);
  return Number.isFinite(n) && n > 0 ? n : null;
}

// GET /api/post/:id/comments
export async function onRequestGet({ env, params }) {
  const postId = getPostId(params);
  if (!postId) return json({ message: "invalid id" }, 400);

  try {
    const { results } = await env.D1_DB.prepare(
      `SELECT
         c.comment_id,
         c.post_id,
         c.user_id,
         c.content,
         c.created_at,
         u.nickname AS commenter_nickname
       FROM community_comment c
       LEFT JOIN "user" u ON u.user_id = c.user_id
       WHERE c.post_id = ? AND c.deleted_at IS NULL
       ORDER BY c.created_at ASC`
    )
      .bind(postId)
      .all();

    return json({ comments: results || [] }, 200);
  } catch (e) {
    return json({ message: e?.message || "server error" }, 500);
  }
}

// POST /api/post/:id/comments
export async function onRequestPost({ env, params, request }) {
  const postId = getPostId(params);
  if (!postId) return json({ message: "invalid id" }, 400);

  const body = await request.json().catch(() => ({}));
  const content = String(body?.content ?? "").trim();
  const userId = Number(body?.user_id);

  if (!content) return json({ message: "content required" }, 400);
  if (!Number.isFinite(userId) || userId <= 0)
    return json({ message: "invalid user_id" }, 400);

  try {
    const result = await env.D1_DB.prepare(
      "INSERT INTO community_comment (post_id, user_id, content) VALUES (?, ?, ?)"
    )
      .bind(postId, userId, content)
      .run();

    return json({ ok: true, result }, 201);
  } catch (e) {
    return json({ message: e?.message || "server error" }, 500);
  }
}
