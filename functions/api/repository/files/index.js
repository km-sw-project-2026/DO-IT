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

async function hasMyFileDisplayNameColumn(env) {
  const { results } = await env.D1_DB.prepare("PRAGMA table_info(my_file)").all();
  return (results || []).some((column) => column.name === "display_name");
}

export async function onRequestGet({ env, request, url }) {
  const userId = getUserId(request);
  if (!userId) return json({ message: "로그인 필요(x-user-id)" }, 401);

  const u = new URL(url);
  const folderIdStr = u.searchParams.get("folderId");
  const folderId = folderIdStr ? Number(folderIdStr) : null;
  const displayNameSelect = (await hasMyFileDisplayNameColumn(env))
    ? "mf.display_name"
    : "f.origin_name AS display_name";

  let query = "";
  let params = [userId];

  if (folderId !== null && folderId !== undefined) {
    query = `
      SELECT
        mf.my_file_id,
        mf.folder_id,
        mf.created_at AS added_at,
        ${displayNameSelect},
        f.file_id,
        f.origin_name,
        f.file_size,
        f.file_type,
        f.file_path,
        f.created_at AS uploaded_at
      FROM my_file mf
      LEFT JOIN file f ON f.my_file_id = mf.my_file_id
      WHERE mf.user_id = ?
        AND mf.folder_id = ?
        AND (mf.is_deleted IS NULL OR mf.is_deleted <> 'Y')
      ORDER BY mf.my_file_id DESC
    `;
    params.push(folderId);
  } else {
    query = `
      SELECT
        mf.my_file_id,
        mf.folder_id,
        mf.created_at AS added_at,
        ${displayNameSelect},
        f.file_id,
        f.origin_name,
        f.file_size,
        f.file_type,
        f.file_path,
        f.created_at AS uploaded_at
      FROM my_file mf
      LEFT JOIN file f ON f.my_file_id = mf.my_file_id
      WHERE mf.user_id = ?
        AND (mf.is_deleted IS NULL OR mf.is_deleted <> 'Y')
      ORDER BY mf.my_file_id DESC
    `;
  }

  const { results } = await env.D1_DB.prepare(query).bind(...params).all();

  return json({ files: results });
}
