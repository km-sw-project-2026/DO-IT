import { ensureMyFileSchema, hasMyFileDisplayNameColumn } from "./schema.js";

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

export async function onRequestPatch({ env, request, params }) {
  const userId = getUserId(request);
  if (!userId) return json({ message: "로그인 필요(x-user-id)" }, 401);
  await ensureMyFileSchema(env);

  const myFileId = Number(params.id);
  const body = await request.json().catch(() => ({}));
  const hasDisplayName = Object.prototype.hasOwnProperty.call(body, "display_name");
  const display_name = (body.display_name ?? "").trim();
  const folderIdRaw = body.folder_id;
  const hasFolderId = Object.prototype.hasOwnProperty.call(body, "folder_id");
  const hasFavorite = Object.prototype.hasOwnProperty.call(body, "is_favorite");
  const is_favorite = hasFavorite ? (body.is_favorite ? 1 : 0) : 0;
  const folder_id =
    !hasFolderId || folderIdRaw === null || folderIdRaw === ""
      ? null
      : Number(folderIdRaw);

  const exist = await env.D1_DB.prepare(`
    SELECT my_file_id FROM my_file
    WHERE my_file_id = ? AND user_id = ?
      AND (is_deleted IS NULL OR is_deleted <> 'Y')
  `).bind(myFileId, userId).first();
  if (!exist) return json({ message: "파일이 없어요" }, 404);

  if (hasDisplayName && display_name) {
    if (!(await hasMyFileDisplayNameColumn(env))) {
      return json({ message: "display_name 컬럼이 없어 파일명을 변경할 수 없어요. 스키마 적용이 필요합니다." }, 409);
    }

    await env.D1_DB.prepare(`
      UPDATE my_file
      SET display_name = ?, is_favorite = COALESCE(?, is_favorite)
      WHERE my_file_id = ? AND user_id = ?
    `).bind(display_name, hasFavorite ? is_favorite : null, myFileId, userId).run();

    return json({ my_file_id: myFileId, display_name, is_favorite: hasFavorite ? is_favorite : undefined });
  }

  if (hasFolderId) {
    if (folder_id !== null) {
      const targetFolder = await env.D1_DB.prepare(`
        SELECT folder_id FROM my_folder
        WHERE folder_id = ? AND user_id = ?
          AND (is_deleted IS NULL OR is_deleted <> 'Y')
      `).bind(folder_id, userId).first();

      if (!targetFolder) {
        return json({ message: "이동할 폴더가 없어요" }, 404);
      }
    }

    await env.D1_DB.prepare(`
      UPDATE my_file
      SET folder_id = ?, is_favorite = COALESCE(?, is_favorite)
      WHERE my_file_id = ? AND user_id = ?
    `).bind(folder_id, hasFavorite ? is_favorite : null, myFileId, userId).run();

    return json({ my_file_id: myFileId, folder_id, is_favorite: hasFavorite ? is_favorite : undefined });
  }

  if (hasFavorite) {
    await env.D1_DB.prepare(`
      UPDATE my_file
      SET is_favorite = ?
      WHERE my_file_id = ? AND user_id = ?
    `).bind(is_favorite, myFileId, userId).run();

    return json({ my_file_id: myFileId, is_favorite });
  }

  return json({ message: "display_name, folder_id 또는 is_favorite가 필요해요" }, 400);
}

/** DELETE = 휴지통 이동 */
export async function onRequestDelete({ env, request, params }) {
  const userId = getUserId(request);
  if (!userId) return json({ message: "로그인 필요(x-user-id)" }, 401);

  const myFileId = Number(params.id);

  const exist = await env.D1_DB.prepare(`
    SELECT my_file_id FROM my_file
    WHERE my_file_id = ? AND user_id = ?
      AND (is_deleted IS NULL OR is_deleted <> 'Y')
  `).bind(myFileId, userId).first();
  if (!exist) return json({ message: "파일이 없어요" }, 404);

  await env.D1_DB.prepare(`
    UPDATE my_file
    SET is_deleted = 'Y', deleted_at = datetime('now')
    WHERE my_file_id = ? AND user_id = ?
  `).bind(myFileId, userId).run();

  return json({ ok: true, moved_to_trash: true, my_file_id: myFileId });
}
