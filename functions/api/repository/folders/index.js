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
  const parentIdRaw = u.searchParams.get("parentId");
  const parentId =
    parentIdRaw === null || parentIdRaw === "" ? null : Number(parentIdRaw);

  const stmt =
    parentId === null
      ? env.D1_DB.prepare(`
          SELECT folder_id, parent_id, folder_name, created_at
          FROM my_folder
          WHERE user_id = ?
            AND (is_deleted IS NULL OR is_deleted <> 'Y')
            AND parent_id IS NULL
          ORDER BY folder_id DESC
        `).bind(userId)
      : env.D1_DB.prepare(`
          SELECT folder_id, parent_id, folder_name, created_at
          FROM my_folder
          WHERE user_id = ?
            AND (is_deleted IS NULL OR is_deleted <> 'Y')
            AND parent_id = ?
          ORDER BY folder_id DESC
        `).bind(userId, parentId);

  const { results } = await stmt.all();
  return json({ folders: results });
}

export async function onRequestPost({ env, request }) {
  const userId = getUserId(request);
  if (!userId) return json({ message: "로그인 필요(x-user-id)" }, 401);

  const body = await request.json().catch(() => ({}));
  const folder_name = (body.folder_name ?? "").trim();
  const parent_id =
    body.parent_id === undefined || body.parent_id === null || body.parent_id === ""
      ? null
      : Number(body.parent_id);

  if (!folder_name) return json({ message: "folder_name이 필요해요" }, 400);

  if (parent_id !== null) {
    const p = await env.D1_DB.prepare(`
      SELECT folder_id FROM my_folder
      WHERE folder_id = ? AND user_id = ?
        AND (is_deleted IS NULL OR is_deleted <> 'Y')
    `).bind(parent_id, userId).first();
    if (!p) return json({ message: "parent_id 폴더가 없어요" }, 404);
  }

  const ins = await env.D1_DB.prepare(`
    INSERT INTO my_folder (parent_id, folder_name, user_id, is_deleted)
    VALUES (?, ?, ?, 'N')
  `).bind(parent_id, folder_name, userId).run();

  return json({ folder_id: ins.meta.last_row_id, parent_id, folder_name }, 201);
}