async function getColumns(env, tableName) {
  const { results } = await env.D1_DB.prepare(`PRAGMA table_info(${tableName})`).all();
  return new Set((results || []).map((column) => column.name));
}

export async function ensureFolderSchema(env) {
  const folderColumns = await getColumns(env, "my_folder");
  const fileColumns = await getColumns(env, "my_file");

  if (!folderColumns.has("is_deleted")) {
    await env.D1_DB.prepare(`
      ALTER TABLE my_folder ADD COLUMN is_deleted TEXT DEFAULT 'N'
    `).run();
  }

  if (!folderColumns.has("deleted_at")) {
    await env.D1_DB.prepare(`
      ALTER TABLE my_folder ADD COLUMN deleted_at DATETIME
    `).run();
  }

  if (!fileColumns.has("deleted_at")) {
    await env.D1_DB.prepare(`
      ALTER TABLE my_file ADD COLUMN deleted_at DATETIME
    `).run();
  }
}
