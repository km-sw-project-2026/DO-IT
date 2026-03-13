function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json" } });
}
function getUserId(request) {
  const v = request.headers.get("x-user-id");
  const id = Number(v);
  return id ? id : null;
}

export async function onRequestPost({ env, request, params }) {
  const userId = getUserId(request);
  if (!userId) return json({ message: "로그인 필요(x-user-id)" }, 401);

  const noteId = Number(params.id);
  const body = await request.json().catch(() => ({}));
  const hasFolderId = Object.prototype.hasOwnProperty.call(body, "folder_id");
  const folder_id =
    !hasFolderId || body.folder_id === null || body.folder_id === ""
      ? null
      : Number(body.folder_id);
  const exist = await env.D1_DB.prepare(`
    SELECT note_id, folder_id FROM my_note
    WHERE note_id = ? AND user_id = ? AND is_deleted = 'Y'
  `).bind(noteId, userId).first();
  if (!exist) return json({ message: "휴지통에 없는 노트예요" }, 404);

  await env.D1_DB.prepare(`
    UPDATE my_note
    SET is_deleted = 'N', folder_id = ?
    WHERE note_id = ? AND user_id = ?
  `).bind(hasFolderId ? folder_id : exist.folder_id ?? null, noteId, userId).run();

  return json({ ok: true, restored: true, note_id: noteId });
}
