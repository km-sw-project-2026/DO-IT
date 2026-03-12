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

export async function onRequestGet({ env, request, params }) {
  const userId = getUserId(request);
  if (!userId) return json({ message: "로그인 필요(x-user-id)" }, 401);
  await ensureMyNoteTable(env);

  const id = Number(params.id);
  const row = await env.D1_DB.prepare(`
    SELECT note_id, folder_id, user_id, title, content, content_type, created_at, updated_at, COALESCE(is_favorite, 0) AS is_favorite
    FROM my_note
    WHERE note_id = ? AND user_id = ? AND (is_deleted IS NULL OR is_deleted <> 'Y')
    LIMIT 1
  `).bind(id, userId).first();

  if (!row) return json({ message: "노트를 찾을 수 없습니다" }, 404);
  return json({ note: row });
}

export async function onRequestPut({ env, request, params }) {
  const userId = getUserId(request);
  if (!userId) return json({ message: "로그인 필요(x-user-id)" }, 401);
  await ensureMyNoteTable(env);

  const id = Number(params.id);
  const body = await request.json().catch(() => ({}));
  const hasTitle = Object.prototype.hasOwnProperty.call(body, "title");
  const hasContent = Object.prototype.hasOwnProperty.call(body, "content");
  const hasFolderId = Object.prototype.hasOwnProperty.call(body, "folder_id");
  const hasFavorite = Object.prototype.hasOwnProperty.call(body, "is_favorite");
  const title = hasTitle ? (body.title ?? "").trim() : undefined;
  const content = hasContent ? body.content ?? "" : undefined;
  const is_favorite = hasFavorite ? (body.is_favorite ? 1 : 0) : 0;
  const folder_id =
    !hasFolderId || body.folder_id === null || body.folder_id === ""
      ? null
      : Number(body.folder_id);

  const existing = await env.D1_DB.prepare(`SELECT note_id FROM my_note WHERE note_id = ? AND user_id = ?`).bind(id, userId).first();
  if (!existing) return json({ message: "노트를 찾을 수 없습니다" }, 404);

  const sets = [];
  const binds = [];

  if (hasTitle) {
    sets.push("title = ?");
    binds.push(title ?? "");
  }

  if (hasContent) {
    sets.push("content = ?");
    binds.push(content ?? "");
  }

  if (hasFolderId) {
    sets.push("folder_id = ?");
    binds.push(folder_id);
  }

  if (hasFavorite) {
    sets.push("is_favorite = ?");
    binds.push(is_favorite);
  }

  if (sets.length === 0) {
    return json({ message: "title, content, folder_id 또는 is_favorite가 필요합니다" }, 400);
  }

  sets.push("updated_at = CURRENT_TIMESTAMP");

  await env.D1_DB.prepare(`
    UPDATE my_note
    SET ${sets.join(", ")}
    WHERE note_id = ? AND user_id = ?
  `).bind(...binds, id, userId).run();

  return json({
    message: "updated",
    folder_id: hasFolderId ? folder_id : undefined,
    is_favorite: hasFavorite ? is_favorite : undefined,
  });
}

export async function onRequestDelete({ env, request, params }) {
  const userId = getUserId(request);
  if (!userId) return json({ message: "로그인 필요(x-user-id)" }, 401);
  await ensureMyNoteTable(env);

  const id = Number(params.id);
  const existing = await env.D1_DB.prepare(`SELECT note_id FROM my_note WHERE note_id = ? AND user_id = ?`).bind(id, userId).first();
  if (!existing) return json({ message: "노트를 찾을 수 없습니다" }, 404);

  await env.D1_DB.prepare(`UPDATE my_note SET is_deleted = 'Y' WHERE note_id = ? AND user_id = ?`).bind(id, userId).run();
  return json({ message: "deleted" });
}
