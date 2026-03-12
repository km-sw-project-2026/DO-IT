import {
  ensureTrashNoteTable,
  getDescendantFolderIds,
  getUserId,
  json,
} from "../_shared.js";

export async function onRequestDelete({ env, request, params }) {
  const userId = getUserId(request);
  if (!userId) return json({ message: "로그인 필요(x-user-id)" }, 401);
  await ensureTrashNoteTable(env);

  const folderId = Number(params.id);
  const folderIds = await getDescendantFolderIds(env, userId, folderId);
  const placeholders = folderIds.map(() => "?").join(", ");

  await env.D1_DB.prepare(`
    DELETE FROM file_access_log
    WHERE user_id = ? AND my_file_id IN (
      SELECT my_file_id FROM my_file WHERE user_id = ? AND folder_id IN (${placeholders})
    )
  `).bind(userId, userId, ...folderIds).run();

  await env.D1_DB.prepare(`
    DELETE FROM file_share
    WHERE my_file_id IN (
      SELECT my_file_id FROM my_file WHERE user_id = ? AND folder_id IN (${placeholders})
    )
  `).bind(userId, ...folderIds).run();

  await env.D1_DB.prepare(`
    DELETE FROM file
    WHERE my_file_id IN (
      SELECT my_file_id FROM my_file WHERE user_id = ? AND folder_id IN (${placeholders})
    )
  `).bind(userId, ...folderIds).run();

  await env.D1_DB.prepare(`
    DELETE FROM my_note
    WHERE user_id = ? AND folder_id IN (${placeholders})
  `).bind(userId, ...folderIds).run();

  await env.D1_DB.prepare(`
    DELETE FROM my_file
    WHERE user_id = ? AND folder_id IN (${placeholders})
  `).bind(userId, ...folderIds).run();

  await env.D1_DB.prepare(`
    DELETE FROM my_folder
    WHERE user_id = ? AND folder_id IN (${placeholders})
  `).bind(userId, ...folderIds).run();

  return json({ ok: true, purged: true, folder_id: folderId });
}
