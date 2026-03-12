async function getColumns(env, tableName) {
  const { results } = await env.D1_DB.prepare(`PRAGMA table_info(${tableName})`).all();
  return new Set((results || []).map((column) => column.name));
}

export async function ensureMyNoteTable(env) {
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

  await env.D1_DB.prepare(`
    CREATE INDEX IF NOT EXISTS idx_my_note_user_folder
    ON my_note(user_id, folder_id)
  `).run();

  const columns = await getColumns(env, "my_note");
  if (!columns.has("is_favorite")) {
    await env.D1_DB.prepare(`
      ALTER TABLE my_note ADD COLUMN is_favorite INTEGER DEFAULT 0
    `).run();
  }
}
