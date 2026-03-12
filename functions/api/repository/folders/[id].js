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

async function getMyFolderColumns(env) {
  const { results } = await env.D1_DB.prepare("PRAGMA table_info(my_folder)").all();
  return new Set((results || []).map((column) => column.name));
}

export async function onRequestPatch({ env, request, params }) {
  const userId = getUserId(request);
  if (!userId) return json({ message: "로그인 필요(x-user-id)" }, 401);
  const columns = await getMyFolderColumns(env);
  const notDeletedFilter = columns.has("is_deleted")
    ? "AND (is_deleted IS NULL OR is_deleted <> 'Y')"
    : "";

  const folderId = Number(params.id);
  const body = await request.json().catch(() => ({}));
  const folder_name = (body.folder_name ?? "").trim();
  if (!folder_name) return json({ message: "folder_name이 필요해요" }, 400);

  const exist = await env.D1_DB.prepare(`
    SELECT folder_id FROM my_folder
    WHERE folder_id = ? AND user_id = ?
      ${notDeletedFilter}
  `).bind(folderId, userId).first();
  if (!exist) return json({ message: "폴더가 없어요" }, 404);

  await env.D1_DB.prepare(`
    UPDATE my_folder SET folder_name = ?
    WHERE folder_id = ? AND user_id = ?
  `).bind(folder_name, folderId, userId).run();

  return json({ folder_id: folderId, folder_name });
}

/**
 * DELETE = 휴지통 이동 (하위 폴더 + 폴더 내 파일까지 soft delete)
 */
export async function onRequestDelete({ env, request, params }) {
  const userId = getUserId(request);
  if (!userId) return json({ message: "로그인 필요(x-user-id)" }, 401);
  const columns = await getMyFolderColumns(env);
  const notDeletedFilter = columns.has("is_deleted")
    ? "AND (is_deleted IS NULL OR is_deleted <> 'Y')"
    : "";

  const folderId = Number(params.id);

  const exist = await env.D1_DB.prepare(`
    SELECT folder_id FROM my_folder
    WHERE folder_id = ? AND user_id = ?
      ${notDeletedFilter}
  `).bind(folderId, userId).first();
  if (!exist) return json({ message: "폴더가 없어요" }, 404);

  if (!columns.has("is_deleted")) {
    return json({ message: "is_deleted 컬럼이 없어 폴더 휴지통 기능을 사용할 수 없어요. 스키마 적용이 필요합니다." }, 409);
  }

  const folderDeleteSet = columns.has("deleted_at")
    ? "is_deleted = 'Y', deleted_at = datetime('now')"
    : "is_deleted = 'Y'";

  // 1) 폴더(하위 포함) 휴지통 이동
  await env.D1_DB.prepare(`
    WITH RECURSIVE subfolders AS (
      SELECT folder_id FROM my_folder WHERE folder_id = ? AND user_id = ?
      UNION ALL
      SELECT f.folder_id
      FROM my_folder f
      JOIN subfolders s ON f.parent_id = s.folder_id
      WHERE f.user_id = ?
    )
    UPDATE my_folder
    SET ${folderDeleteSet}
    WHERE user_id = ? AND folder_id IN (SELECT folder_id FROM subfolders)
  `).bind(folderId, userId, userId, userId).run();

  // 2) 그 폴더들 안의 파일도 휴지통 이동
  await env.D1_DB.prepare(`
    WITH RECURSIVE subfolders AS (
      SELECT folder_id FROM my_folder WHERE folder_id = ? AND user_id = ?
      UNION ALL
      SELECT f.folder_id
      FROM my_folder f
      JOIN subfolders s ON f.parent_id = s.folder_id
      WHERE f.user_id = ?
    )
    UPDATE my_file
    SET is_deleted = 'Y', deleted_at = datetime('now')
    WHERE user_id = ? AND folder_id IN (SELECT folder_id FROM subfolders)
  `).bind(folderId, userId, userId, userId).run();

  return json({ ok: true, moved_to_trash: true, folder_id: folderId });
}
