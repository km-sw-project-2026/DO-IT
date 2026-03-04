function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}
function getUserId(request) {
  const v = request.headers.get("x-user-id");
  const id = Number(v);
  return id ? id : null;
}

export async function onRequestGet({ env, request, params }) {
  const userId = getUserId(request);
  if (!userId) return json({ message: "로그인 필요(x-user-id)" }, 401);

  const id = Number(params.id);
  const row = await env.D1_DB.prepare(`
    SELECT note_id, folder_id, user_id, title, content, content_type, created_at, updated_at
    FROM my_note
    WHERE note_id = ? AND user_id = ? AND (is_deleted IS NULL OR is_deleted <> 'Y')
    LIMIT 1
  `).bind(id, userId).first();

  if (!row) return json({ message: "노트를 찾을 수 없습니다" }, 404);
  return json({ note: row });
}

export async function onRequestPut({ env, request, params }) {
  const userId = getUserId(request);
  if (!userId) return json({ message: "로그인 필요(x-user-id)" }, 401);

  const id = Number(params.id);
  const body = await request.json().catch(() => ({}));
  const title = (body.title ?? "").trim();
  const content = body.content ?? "";

  const existing = await env.D1_DB.prepare(`SELECT note_id FROM my_note WHERE note_id = ? AND user_id = ?`).bind(id, userId).first();
  if (!existing) return json({ message: "노트를 찾을 수 없습니다" }, 404);

  await env.D1_DB.prepare(`
    UPDATE my_note SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP
    WHERE note_id = ? AND user_id = ?
  `).bind(title, content, id, userId).run();

  return json({ message: "updated" });
}

export async function onRequestDelete({ env, request, params }) {
  const userId = getUserId(request);
  if (!userId) return json({ message: "로그인 필요(x-user-id)" }, 401);

  const id = Number(params.id);
  const existing = await env.D1_DB.prepare(`SELECT note_id FROM my_note WHERE note_id = ? AND user_id = ?`).bind(id, userId).first();
  if (!existing) return json({ message: "노트를 찾을 수 없습니다" }, 404);

  await env.D1_DB.prepare(`UPDATE my_note SET is_deleted = 'Y' WHERE note_id = ? AND user_id = ?`).bind(id, userId).run();
  return json({ message: "deleted" });
}
