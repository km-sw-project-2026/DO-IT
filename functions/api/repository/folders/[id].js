import { ensureFolderSchema } from "./schema.js";

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

async function getMyFileColumns(env) {
  const { results } = await env.D1_DB.prepare("PRAGMA table_info(my_file)").all();
  return new Set((results || []).map((column) => column.name));
}

async function getMyNoteColumns(env) {
  const { results } = await env.D1_DB.prepare("PRAGMA table_info(my_note)").all();
  return new Set((results || []).map((column) => column.name));
}

async function getDescendantFolderIds(env, userId, rootFolderId) {
  const visited = new Set();
  const queue = [rootFolderId];

  while (queue.length > 0) {
    const currentId = queue.shift();
    if (!currentId || visited.has(currentId)) continue;
    visited.add(currentId);

    const { results } = await env.D1_DB.prepare(`
      SELECT folder_id
      FROM my_folder
      WHERE user_id = ? AND parent_id = ?
    `).bind(userId, currentId).all();

    for (const row of results || []) {
      if (!visited.has(row.folder_id)) {
        queue.push(row.folder_id);
      }
    }
  }

  return Array.from(visited);
}

export async function onRequestPatch({ env, request, params }) {
  const userId = getUserId(request);
  if (!userId) return json({ message: "로그인 필요(x-user-id)" }, 401);
  await ensureFolderSchema(env);
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
  await ensureFolderSchema(env);
  await env.D1_DB.prepare(`
    CREATE TABLE IF NOT EXISTS my_note (
      note_id INTEGER PRIMARY KEY AUTOINCREMENT,
      folder_id INTEGER,
      user_id INTEGER NOT NULL,
      title TEXT,
      content TEXT,
      content_type TEXT DEFAULT 'html',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_deleted TEXT DEFAULT 'N'
    )
  `).run();
  const columns = await getMyFolderColumns(env);
  const myFileColumns = await getMyFileColumns(env);
  const myNoteColumns = await getMyNoteColumns(env);
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

  const folderDeleteSet = columns.has("deleted_at")
    ? "is_deleted = 'Y', deleted_at = datetime('now')"
    : "is_deleted = 'Y'";
  const fileDeleteSet = myFileColumns.has("deleted_at")
    ? "is_deleted = 'Y', deleted_at = datetime('now')"
    : "is_deleted = 'Y'";
  const folderIds = await getDescendantFolderIds(env, userId, folderId);
  const placeholders = folderIds.map(() => "?").join(", ");
  const folderBindings = [...folderIds];

  // 1) 폴더(하위 포함) 휴지통 이동
  await env.D1_DB.prepare(`
    UPDATE my_folder
    SET ${folderDeleteSet}
    WHERE user_id = ? AND folder_id IN (${placeholders})
  `).bind(userId, ...folderBindings).run();

  // 2) 그 폴더들 안의 파일도 휴지통 이동
  await env.D1_DB.prepare(`
    UPDATE my_file
    SET ${fileDeleteSet}
    WHERE user_id = ? AND folder_id IN (${placeholders})
  `).bind(userId, ...folderBindings).run();

  if (myNoteColumns.has("is_deleted")) {
    await env.D1_DB.prepare(`
      UPDATE my_note
      SET is_deleted = 'Y', updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ? AND folder_id IN (${placeholders})
    `).bind(userId, ...folderBindings).run();
  }

  return json({ ok: true, moved_to_trash: true, folder_id: folderId });
}
