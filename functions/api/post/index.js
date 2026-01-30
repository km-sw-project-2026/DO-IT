
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export async function onRequestGet({ env }) {
  const { results } = await env.D1_DB.prepare(`
    SELECT post_id, title, content, view_count, created_at, user_id
    FROM community_post
    WHERE deleted_at IS NULL
    ORDER BY post_id DESC
    LIMIT 50
  `).all();
  return json(results);
}
