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

/**
 * GET /api/post/:id/comments
 * - 댓글 목록
 */
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

/**
 * POST /api/post/:id/comments
 * body: { content, user_id }
 * - 댓글 작성
 */
export async function onRequestPost({ env, params, request }) {
  const postId = getPostId(params);
  if (!postId) return json({ message: "invalid id" }, 400);

  const body = await request.json().catch(() => ({}));
  const content = String(body?.content ?? "").trim();
  const userId = Number(body?.user_id);

  if (!content) return json({ message: "content required" }, 400);
  if (!Number.isFinite(userId) || userId <= 0) {
    return json({ message: "invalid user_id" }, 400);
  }

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

/**
 * DELETE /api/post/:id/comments
 * body: { comment_id, user_id }
 * - 내 댓글만 삭제 가능(작성자 체크)
 */
export async function onRequestDelete({ env, params, request }) {
  const postId = getPostId(params);
  if (!postId) return json({ message: "invalid id" }, 400);

  const body = await request.json().catch(() => ({}));
  const commentId = Number(body?.comment_id);
  const userId = Number(body?.user_id);

  if (!Number.isFinite(commentId) || commentId <= 0) {
    return json({ message: "invalid comment_id" }, 400);
  }
  if (!Number.isFinite(userId) || userId <= 0) {
    return json({ message: "invalid user_id" }, 400);
  }

  try {
    // ✅ 댓글 존재 + 같은 post인지 + 삭제 안 됨 + 작성자 확인을 위한 row
    const row = await env.D1_DB.prepare(
      `SELECT user_id
       FROM community_comment
       WHERE comment_id = ?
         AND post_id = ?
         AND deleted_at IS NULL
       LIMIT 1`
    )
      .bind(commentId, postId)
      .first();

    if (!row) return json({ message: "not found" }, 404);

    // ✅ 요청자(userId)가 ADMIN인지 확인
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

    // ✅ 작성자도 아니고 관리자도 아니면 금지
    if (!isOwner && !isAdmin) {
      return json({ message: "forbidden" }, 403);
    }

    // ✅ 소프트 삭제
    await env.D1_DB.prepare(
      `UPDATE community_comment
       SET deleted_at = CURRENT_TIMESTAMP
       WHERE comment_id = ?`
    )
      .bind(commentId)
      .run();

    return json({ ok: true }, 200);
  } catch (e) {
    return json({ message: e?.message || "server error" }, 500);
  }
}
