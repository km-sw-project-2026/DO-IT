import { ensureMyNoteTable } from "./schema.js";

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
  await ensureMyNoteTable(env);

  const u = new URL(url);
  const folderIdRaw = u.searchParams.get("folderId");
  const folderId = folderIdRaw === null || folderIdRaw === "" ? null : Number(folderIdRaw);

  const stmt = folderId === null
    ? env.D1_DB.prepare(`
        SELECT note_id, folder_id, user_id, title, content, content_type, created_at, updated_at, COALESCE(is_favorite, 0) AS is_favorite
        FROM my_note
        WHERE user_id = ?
          AND (is_deleted IS NULL OR is_deleted <> 'Y')
        ORDER BY note_id DESC
      `).bind(userId)
    : env.D1_DB.prepare(`
        SELECT note_id, folder_id, user_id, title, content, content_type, created_at, updated_at, COALESCE(is_favorite, 0) AS is_favorite
        FROM my_note
        WHERE user_id = ?
          AND (is_deleted IS NULL OR is_deleted <> 'Y')
          AND folder_id = ?
        ORDER BY note_id DESC
      `).bind(userId, folderId);

  const { results } = await stmt.all();
  return json({ notes: results });
}

export async function onRequestPost({ env, request }) {
  const userId = getUserId(request);
  if (!userId) return json({ message: "로그인 필요(x-user-id)" }, 401);
  await ensureMyNoteTable(env);

  const body = await request.json().catch(() => ({}));
  const folder_id = body.folder_id === undefined || body.folder_id === null || body.folder_id === "" ? null : Number(body.folder_id);
  const title = (body.title ?? "").trim();
  const content = body.content ?? "";
  const content_type = body.content_type ?? "html";

  if (!title && !content) return json({ message: "title이나 content가 필요합니다" }, 400);

  const ins = await env.D1_DB.prepare(`
    INSERT INTO my_note (folder_id, user_id, title, content, content_type)
    VALUES (?, ?, ?, ?, ?)
  `).bind(folder_id, userId, title, content, content_type).run();

  return json({ note_id: ins.meta.last_row_id, folder_id, title, content, content_type }, 201);
}
