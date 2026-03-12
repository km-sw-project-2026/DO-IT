export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export function getUserId(request) {
  const v = request.headers.get("x-user-id");
  const id = Number(v);
  return id ? id : null;
}

export async function getTableColumns(env, tableName) {
  const { results } = await env.D1_DB.prepare(`PRAGMA table_info(${tableName})`).all();
  return new Set((results || []).map((column) => column.name));
}

export async function hasMyFileDisplayNameColumn(env) {
  const { results } = await env.D1_DB.prepare("PRAGMA table_info(my_file)").all();
  return (results || []).some((column) => column.name === "display_name");
}

export async function ensureTrashNoteTable(env) {
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
}

export async function getDescendantFolderIds(env, userId, rootFolderId) {
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
