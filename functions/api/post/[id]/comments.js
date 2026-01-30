function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export async function onRequestGet({ env, params }) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) return json({ message: "invalid id" }, 400);

  const { results } = await env.D1_DB.prepare(
    `SELECT comment_id, content, created_at, user_id
     FROM community_comment
     WHERE post_id = ? AND deleted_at IS NULL
     ORDER BY comment_id DESC`
  ).bind(id).all();

  return json(results);
}

export async function onRequestPost({ env, params, request }) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) return json({ message: "invalid id" }, 400);

  const body = await request.json();
  const content = body?.content?.trim();
  const user_id = Number(body?.user_id || 1);

  if (!content) return json({ message: "content required" }, 400);

  const result = await env.D1_DB.prepare(
    "INSERT INTO community_comment(content, post_id, user_id) VALUES(?, ?, ?)"
  ).bind(content, id, user_id).run();

  return json({ ok: true, result });
}
