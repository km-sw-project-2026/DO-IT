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

async function hasMyFileDisplayNameColumn(env) {
  const { results } = await env.D1_DB.prepare("PRAGMA table_info(my_file)").all();
  return (results || []).some((column) => column.name === "display_name");
}

export async function onRequestPatch({ env, request, params }) {
  const userId = getUserId(request);
  if (!userId) return json({ message: "로그인 필요(x-user-id)" }, 401);

  const myFileId = Number(params.id);
  const body = await request.json().catch(() => ({}));
  const display_name = (body.display_name ?? "").trim();
  if (!display_name) return json({ message: "display_name이 필요해요" }, 400);

  const exist = await env.D1_DB.prepare(`
    SELECT my_file_id FROM my_file
    WHERE my_file_id = ? AND user_id = ?
      AND (is_deleted IS NULL OR is_deleted <> 'Y')
  `).bind(myFileId, userId).first();
  if (!exist) return json({ message: "파일이 없어요" }, 404);

  if (!(await hasMyFileDisplayNameColumn(env))) {
    return json({ message: "display_name 컬럼이 없어 파일명을 변경할 수 없어요. 스키마 적용이 필요합니다." }, 409);
  }

  await env.D1_DB.prepare(`
    UPDATE my_file
    SET display_name = ?
    WHERE my_file_id = ? AND user_id = ?
  `).bind(display_name, myFileId, userId).run();

  return json({ my_file_id: myFileId, display_name });
}

/** DELETE = 휴지통 이동 */
export async function onRequestDelete({ env, request, params }) {
  const userId = getUserId(request);
  if (!userId) return json({ message: "로그인 필요(x-user-id)" }, 401);

  const myFileId = Number(params.id);

  const exist = await env.D1_DB.prepare(`
    SELECT my_file_id FROM my_file
    WHERE my_file_id = ? AND user_id = ?
      AND (is_deleted IS NULL OR is_deleted <> 'Y')
  `).bind(myFileId, userId).first();
  if (!exist) return json({ message: "파일이 없어요" }, 404);

  await env.D1_DB.prepare(`
    UPDATE my_file
    SET is_deleted = 'Y', deleted_at = datetime('now')
    WHERE my_file_id = ? AND user_id = ?
  `).bind(myFileId, userId).run();

  return json({ ok: true, moved_to_trash: true, my_file_id: myFileId });
}
