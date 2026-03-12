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

async function getTableColumns(env, tableName) {
  const { results } = await env.D1_DB.prepare(`PRAGMA table_info(${tableName})`).all();
  return new Set((results || []).map((column) => column.name));
}

async function hasMyFileDisplayNameColumn(env) {
  const { results } = await env.D1_DB.prepare("PRAGMA table_info(my_file)").all();
  return (results || []).some((column) => column.name === "display_name");
}

export async function onRequestGet({ env, request }) {
  const userId = getUserId(request);
  if (!userId) return json({ message: "로그인 필요(x-user-id)" }, 401);
  const myFolderColumns = await getTableColumns(env, "my_folder");
  const myFileColumns = await getTableColumns(env, "my_file");
  const displayNameSelect = (await hasMyFileDisplayNameColumn(env))
    ? "mf.display_name"
    : "f.origin_name AS display_name";
  const folderDeletedAtSelect = myFolderColumns.has("deleted_at")
    ? "deleted_at"
    : "NULL AS deleted_at";
  const folderTrashWhere = myFolderColumns.has("is_deleted")
    ? "user_id = ? AND is_deleted = 'Y'"
    : "1 = 0";
  const folderTrashOrderBy = myFolderColumns.has("deleted_at")
    ? "deleted_at DESC, folder_id DESC"
    : "folder_id DESC";
  const fileDeletedAtSelect = myFileColumns.has("deleted_at")
    ? "mf.deleted_at"
    : "NULL AS deleted_at";
  const fileTrashWhere = myFileColumns.has("is_deleted")
    ? "mf.user_id = ? AND mf.is_deleted = 'Y'"
    : "1 = 0";
  const fileTrashOrderBy = myFileColumns.has("deleted_at")
    ? "mf.deleted_at DESC, mf.my_file_id DESC"
    : "mf.my_file_id DESC";
  const folderStmt = env.D1_DB.prepare(`
    SELECT folder_id, parent_id, folder_name, ${folderDeletedAtSelect}
    FROM my_folder
    WHERE ${folderTrashWhere}
    ORDER BY ${folderTrashOrderBy}
  `);
  const fileStmt = env.D1_DB.prepare(`
    SELECT
      mf.my_file_id,
      mf.folder_id,
      ${displayNameSelect},
      ${fileDeletedAtSelect},
      f.file_id,
      f.origin_name,
      f.file_size,
      f.file_type,
      f.file_path
    FROM my_file mf
    LEFT JOIN file f ON f.my_file_id = mf.my_file_id
    WHERE ${fileTrashWhere}
    ORDER BY ${fileTrashOrderBy}
  `);

  const folders = myFolderColumns.has("is_deleted")
    ? await folderStmt.bind(userId).all()
    : await folderStmt.all();

  const files = myFileColumns.has("is_deleted")
    ? await fileStmt.bind(userId).all()
    : await fileStmt.all();

  return json({ trash: { folders: folders.results, files: files.results } });
}
