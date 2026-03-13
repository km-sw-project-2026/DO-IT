import {
  ensureTrashNoteTable,
  getDescendantFolderIds,
  getTableColumns,
  getUserId,
  json,
} from "../_shared.js";

export async function onRequestPost({ env, request, params }) {
  const userId = getUserId(request);
  if (!userId) return json({ message: "로그인 필요(x-user-id)" }, 401);
  await ensureTrashNoteTable(env);

  const folderId = Number(params.id);
  const myFileColumns = await getTableColumns(env, "my_file");
  const myNoteColumns = await getTableColumns(env, "my_note");
  const folderIds = await getDescendantFolderIds(env, userId, folderId);
  const placeholders = folderIds.map(() => "?").join(", ");

  await env.D1_DB.prepare(`
    UPDATE my_folder
    SET is_deleted = 'N', deleted_at = NULL
    WHERE user_id = ? AND folder_id IN (${placeholders})
  `).bind(userId, ...folderIds).run();

  if (myFileColumns.has("is_deleted")) {
    const fileSet = myFileColumns.has("deleted_at")
      ? "is_deleted = 'N', deleted_at = NULL"
      : "is_deleted = 'N'";
    await env.D1_DB.prepare(`
      UPDATE my_file
      SET ${fileSet}
      WHERE user_id = ? AND folder_id IN (${placeholders})
    `).bind(userId, ...folderIds).run();
  }

  if (myNoteColumns.has("is_deleted")) {
    await env.D1_DB.prepare(`
      UPDATE my_note
      SET is_deleted = 'N'
      WHERE user_id = ? AND folder_id IN (${placeholders})
    `).bind(userId, ...folderIds).run();
  }

  return json({ ok: true, restored: true, folder_id: folderId });
}
