function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json" } });
}
function getUserId(request) {
  const v = request.headers.get("x-user-id");
  const id = Number(v);
  return id ? id : null;
}

export async function onRequestDelete({ env, request, params }) {
  const userId = getUserId(request);
  if (!userId) return json({ message: "로그인 필요(x-user-id)" }, 401);

  const noteId = Number(params.id);
  const exist = await env.D1_DB.prepare(`
    SELECT note_id FROM my_note
    WHERE note_id = ? AND user_id = ? AND is_deleted = 'Y'
  `).bind(noteId, userId).first();
  if (!exist) return json({ message: "휴지통에 없는 노트예요" }, 404);

  await env.D1_DB.prepare(`
    DELETE FROM my_note
    WHERE note_id = ? AND user_id = ?
  `).bind(noteId, userId).run();

  return json({ ok: true, purged: true, note_id: noteId });
}
