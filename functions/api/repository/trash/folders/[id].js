import {
  ensureTrashNoteTable,
  getTableColumns,
  getUserId,
  hasMyFileDisplayNameColumn,
  json,
} from "./_shared.js";

export async function onRequestGet({ env, request, params }) {
  const userId = getUserId(request);
  if (!userId) return json({ message: "로그인 필요(x-user-id)" }, 401);
  await ensureTrashNoteTable(env);

  const folderId = Number(params.id);
  const myFolderColumns = await getTableColumns(env, "my_folder");
  const myFileColumns = await getTableColumns(env, "my_file");
  const myNoteColumns = await getTableColumns(env, "my_note");
  const displayNameSelect = (await hasMyFileDisplayNameColumn(env))
    ? "mf.display_name"
    : "f.origin_name AS display_name";

  const folderDeletedFilter = myFolderColumns.has("is_deleted")
    ? "AND is_deleted = 'Y'"
    : "";
  const deletedAtSelect = myFolderColumns.has("deleted_at")
    ? "deleted_at"
    : "NULL AS deleted_at";

  const folder = await env.D1_DB.prepare(`
    SELECT folder_id, parent_id, folder_name, created_at, ${deletedAtSelect}
    FROM my_folder
    WHERE folder_id = ? AND user_id = ?
      ${folderDeletedFilter}
    LIMIT 1
  `).bind(folderId, userId).first();

  if (!folder) return json({ message: "휴지통 폴더를 찾을 수 없습니다" }, 404);

  const files = myFileColumns.has("is_deleted")
    ? await env.D1_DB.prepare(`
        SELECT
          mf.my_file_id,
          mf.folder_id,
          mf.created_at AS added_at,
          mf.deleted_at,
          ${displayNameSelect},
          f.file_id,
          f.origin_name,
          f.file_size,
          f.file_type
        FROM my_file mf
        LEFT JOIN file f ON f.my_file_id = mf.my_file_id
        WHERE mf.user_id = ? AND mf.folder_id = ? AND mf.is_deleted = 'Y'
        ORDER BY mf.deleted_at DESC, mf.my_file_id DESC
      `).bind(userId, folderId).all()
    : { results: [] };

  const notes = myNoteColumns.has("is_deleted")
    ? await env.D1_DB.prepare(`
        SELECT
          note_id,
          folder_id,
          title,
          content,
          created_at,
          updated_at
        FROM my_note
        WHERE user_id = ? AND folder_id = ? AND is_deleted = 'Y'
        ORDER BY updated_at DESC, note_id DESC
      `).bind(userId, folderId).all()
    : { results: [] };

  return json({
    folder,
    files: files.results || [],
    notes: notes.results || [],
  });
}
