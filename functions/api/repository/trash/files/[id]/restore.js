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

  const myFileId = Number(params.id);

  const exist = await env.D1_DB.prepare(`
    SELECT my_file_id FROM my_file
    WHERE my_file_id = ? AND user_id = ? AND is_deleted = 'Y'
  `).bind(myFileId, userId).first();
  if (!exist) return json({ message: "휴지통에 없는 파일이에요" }, 404);

  await env.D1_DB.prepare(`
    UPDATE my_file
    SET is_deleted = 'N', deleted_at = NULL
    WHERE my_file_id = ? AND user_id = ?
  `).bind(myFileId, userId).run();

  return json({ ok: true, restored: true, my_file_id: myFileId });
}