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

export async function onRequestGet({ env, request }) {
  const userId = getUserId(request);
  if (!userId) return json({ message: "로그인 필요(x-user-id)" }, 401);

  const folders = await env.D1_DB.prepare(`
    SELECT folder_id, parent_id, folder_name, deleted_at
    FROM my_folder
    WHERE user_id = ? AND is_deleted = 'Y'
    ORDER BY deleted_at DESC, folder_id DESC
  `).bind(userId).all();

  const files = await env.D1_DB.prepare(`
    SELECT
      mf.my_file_id,
      mf.folder_id,
      mf.display_name,
      mf.deleted_at,
      f.file_id,
      f.origin_name,
      f.file_size,
      f.file_type,
      f.file_path
    FROM my_file mf
    LEFT JOIN file f ON f.my_file_id = mf.my_file_id
    WHERE mf.user_id = ? AND mf.is_deleted = 'Y'
    ORDER BY mf.deleted_at DESC, mf.my_file_id DESC
  `).bind(userId).all();

  return json({ trash: { folders: folders.results, files: files.results } });
}