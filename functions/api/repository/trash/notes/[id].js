function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json" } });
}
function getUserId(request) {
  const v = request.headers.get("x-user-id");
  const id = Number(v);
  return id ? id : null;
}

export async function onRequestGet({ env, request, params }) {
  const userId = getUserId(request);
  if (!userId) return json({ message: "로그인 필요(x-user-id)" }, 401);

  const noteId = Number(params.id);
  const note = await env.D1_DB.prepare(`
    SELECT note_id, folder_id, user_id, title, content, content_type, created_at, updated_at, COALESCE(is_favorite, 0) AS is_favorite
    FROM my_note
    WHERE note_id = ? AND user_id = ? AND is_deleted = 'Y'
    LIMIT 1
  `).bind(noteId, userId).first();

  if (!note) return json({ message: "휴지통 노트를 찾을 수 없습니다" }, 404);
  return json({ note });
}
