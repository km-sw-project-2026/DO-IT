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
 * - 댓글/대댓글 목록
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
         c.parent_id,
         c.content,
         c.created_at,
         u.nickname AS commenter_nickname
         u.role AS commenter_role  
       FROM community_comment c
       LEFT JOIN "user" u ON u.user_id = c.user_id
       WHERE c.post_id = ?
         AND c.deleted_at IS NULL
       ORDER BY
          COALESCE(c.parent_id, c.comment_id) ASC,
          CASE WHEN c.parent_id IS NULL THEN 0 ELSE 1 END ASC,
          c.created_at ASC`
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
 * body: { content, user_id, parent_id? }
 * - parent_id 없으면 일반 댓글
 * - parent_id 있으면 대댓글
 */
export async function onRequestPost({ env, params, request }) {
  const postId = getPostId(params);
  if (!postId) return json({ message: "invalid id" }, 400);

  const body = await request.json().catch(() => ({}));
  const content = String(body?.content ?? "").trim();
  const userId = Number(body?.user_id);

  // ✅ parent_id는 선택
  const parentIdRaw = body?.parent_id;
  const parentId =
    parentIdRaw === null || parentIdRaw === undefined || parentIdRaw === ""
      ? null
      : Number(parentIdRaw);

  if (!content || content.length > 200) {
    return json({ message: "댓글은 200자 이내로 입력해주세요." }, 400);
  }
  if (!Number.isFinite(userId) || userId <= 0) {
    return json({ message: "invalid user_id" }, 400);
  }
  if (parentId !== null && (!Number.isFinite(parentId) || parentId <= 0)) {
    return json({ message: "invalid parent_id" }, 400);
  }

  try {
    // ✅ parentId가 있으면: "해당 부모댓글이 같은 post에 존재하는지" 확인
    if (parentId !== null) {
      const parent = await env.D1_DB.prepare(
        `SELECT comment_id
         FROM community_comment
         WHERE comment_id = ?
           AND post_id = ?
           AND deleted_at IS NULL
         LIMIT 1`
      )
        .bind(parentId, postId)
        .first();

      if (!parent) {
        return json({ message: "parent comment not found" }, 404);
      }
    }

    const result = await env.D1_DB.prepare(
      `INSERT INTO community_comment (post_id, user_id, content, parent_id)
       VALUES (?, ?, ?, ?)`
    )
      .bind(postId, userId, content, parentId)
      .run();

    return json({ ok: true, result }, 201);
  } catch (e) {
    return json({ message: e?.message || "server error" }, 500);
  }
}

/**
 * DELETE /api/post/:id/comments
 * body: { comment_id, user_id }
 * - 내 댓글만 삭제 가능(작성자 체크) + ADMIN 가능
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

    if (!isOwner && !isAdmin) {
      return json({ message: "forbidden" }, 403);
    }

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
