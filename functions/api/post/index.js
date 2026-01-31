function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export async function onRequestGet({ env, request }) {
  const url = new URL(request.url);

  const page = Math.max(1, Number(url.searchParams.get("page") || 1));
  const limitRaw = Number(url.searchParams.get("limit") || 10);
  const limit = Math.min(50, Math.max(1, limitRaw)); // 1~50 안전장치
  const offset = (page - 1) * limit;

  // 전체 개수
  const totalRow = await env.D1_DB.prepare(`
    SELECT COUNT(*) AS total
    FROM community_post
    WHERE deleted_at IS NULL
  `).first();

  const total = Number(totalRow?.total || 0);
  const total_pages = Math.max(1, Math.ceil(total / limit));

  // ✅ 여기서 LIMIT / OFFSET 적용됨 (중요)
  const { results } = await env.D1_DB.prepare(`
    SELECT
      p.post_id,
      p.title,
      p.content,
      p.view_count,
      p.created_at,
      p.user_id,
      u.nickname AS author_nickname,
      (
        SELECT COUNT(*)
        FROM community_comment c
        WHERE c.post_id = p.post_id
          AND c.deleted_at IS NULL
      ) AS comment_count
    FROM community_post p
    JOIN user u ON u.user_id = p.user_id
    WHERE p.deleted_at IS NULL
    ORDER BY p.post_id DESC
    LIMIT ? OFFSET ?
  `).bind(limit, offset).all();

  return json({
    page,
    limit,
    total,
    total_pages,
    posts: results,
  });
}
