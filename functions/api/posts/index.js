function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export async function onRequestGet({ env, url }) {
  url = new URL(url);

  const page = Math.max(1, Number(url.searchParams.get("page") || 1));
  const limit = 10;
  const offset = (page - 1) * limit;

  const totalRow = await env.D1_DB.prepare(`
    SELECT COUNT(*) AS total
    FROM community_post
    WHERE deleted_at IS NULL
  `).first();

  const total = Number(totalRow?.total || 0);
  const total_pages = Math.max(1, Math.ceil(total / limit));

  const { results } = await env.D1_DB.prepare(`
    SELECT
      p.post_id,
      p.title,
      p.content,
      p.view_count,
      p.created_at,
      p.user_id,
      p.is_notice,

      -- ✅ 작성자 정보
      u.nickname AS author_nickname,
      u.profile_image AS author_profile_image,

      -- ✅ 댓글 수
      (
        SELECT COUNT(*)
        FROM community_comment c
        WHERE c.post_id = p.post_id
          AND c.deleted_at IS NULL
      ) AS comment_count

    FROM community_post p
    JOIN "user" u ON u.user_id = p.user_id   -- 🔥 여기 중요!

    WHERE p.deleted_at IS NULL
    ORDER BY p.is_notice DESC,
         p.pinned_at DESC,
         p.post_id DESC
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

export async function onRequestPost({ request, env }) {
  const { title, content, user_id } = await request.json();

  const result = await env.D1_DB.prepare(`
    INSERT INTO community_post(title, content, user_id)
    VALUES (?, ?, ?)
  `).bind(title, content, user_id).run();

  return json({ ok: true, result });
}
