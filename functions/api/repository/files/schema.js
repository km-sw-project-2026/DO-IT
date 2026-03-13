async function getColumns(env, tableName) {
  const { results } = await env.D1_DB.prepare(`PRAGMA table_info(${tableName})`).all();
  return new Set((results || []).map((column) => column.name));
}

export async function ensureMyFileSchema(env) {
  const columns = await getColumns(env, "my_file");

  if (!columns.has("is_favorite")) {
    await env.D1_DB.prepare(`
      ALTER TABLE my_file ADD COLUMN is_favorite INTEGER DEFAULT 0
    `).run();
  }
}

export async function hasMyFileDisplayNameColumn(env) {
  const columns = await getColumns(env, "my_file");
  return columns.has("display_name");
}
