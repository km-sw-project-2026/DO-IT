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

export async function onRequestGet({ env, request, url }) {
  const userId = getUserId(request);
  if (!userId) return json({ message: "로그인 필요(x-user-id)" }, 401);

  const u = new URL(url);
  const folderId = Number(u.searchParams.get("folderId"));
  if (!folderId) return json({ message: "folderId가 필요해요" }, 400);

  const { results } = await env.D1_DB.prepare(`
    SELECT
      mf.my_file_id,
      mf.folder_id,
      mf.created_at AS added_at,
      mf.display_name,
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
  `).bind(userId, folderId).all();

  return json({ files: results });
}