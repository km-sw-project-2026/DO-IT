function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export async function onRequestGet({ env }) {
  const { results } = await env.D1_DB.prepare(`
    SELECT
      p.post_id,
      p.title,
      p.content,
      p.view_count,
      p.created_at,
      p.user_id,
      (
        SELECT COUNT(*)
        FROM community_comment c
        WHERE c.post_id = p.post_id
          AND c.deleted_at IS NULL
      ) AS comment_count
    FROM community_post p
    WHERE p.deleted_at IS NULL
    ORDER BY p.post_id DESC
    LIMIT 50
  `).all();

  return json(results);
}


export async function onRequestPost({ request, env }) {
  const { title, content, user_id } = await request.json();

  const result = await env.D1_DB.prepare(`
    INSERT INTO community_post(title, content, user_id)
    VALUES (?, ?, ?)
  `).bind(title, content, user_id).run();

  return json({ ok: true, result });
}
