// 간단한 API 래퍼: 개발 환경에서 모듈이 없어서 발생하는 500을 방지합니다.
// 실제 백엔드 경로에 맞게 URL을 조정해 주세요.
async function safeJsonResponse(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function apiGetFolders(userId, parentId = null) {
  if (!userId) return [];
  try {
    const qs = parentId === null ? "" : `?parentId=${encodeURIComponent(parentId)}`;
    const res = await fetch(`/api/repository/folders${qs}`, {
      headers: { "x-user-id": String(userId) },
    });
    if (!res.ok) throw new Error(await res.text());
    return await safeJsonResponse(res);
  } catch (e) {
    console.warn("apiGetFolders failed:", e);
    return [];
  }
}

export async function apiGetFiles(userId, folderId) {
  if (!userId || !folderId) return [];
  try {
    const res = await fetch(`/api/repository/files?folderId=${encodeURIComponent(folderId)}`, {
      headers: { "x-user-id": String(userId) },
    });
    if (!res.ok) throw new Error(await res.text());
    return await safeJsonResponse(res);
  } catch (e) {
    console.warn("apiGetFiles failed:", e);
    return [];
  }
}

// ------------------ notes API ------------------
export async function apiGetNotes(userId, folderId = null) {
  if (!userId) return [];
  try {
    const qs = folderId === null ? "" : `?folderId=${encodeURIComponent(folderId)}`;
    const res = await fetch(`/api/repository/notes${qs}`, {
      headers: { "x-user-id": String(userId) },
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await safeJsonResponse(res);
    return data.notes || [];
  } catch (e) {
    console.warn("apiGetNotes failed:", e);
    return [];
  }
}

export async function apiCreateNote(userId, folderId, title, content, contentType = "html") {
  if (!userId) throw new Error("invalid args");
  try {
    const res = await fetch(`/api/repository/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-id": String(userId) },
      body: JSON.stringify({ folder_id: folderId, title, content, content_type: contentType }),
    });
    if (!res.ok) throw new Error(await res.text());
    return await safeJsonResponse(res);
  } catch (e) {
    console.warn("apiCreateNote failed:", e);
    throw e;
  }
}

export async function apiUpdateNote(userId, noteId, title, content) {
  if (!userId || !noteId) throw new Error("invalid args");
  try {
    const res = await fetch(`/api/repository/notes/${encodeURIComponent(noteId)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "x-user-id": String(userId) },
      body: JSON.stringify({ title, content }),
    });
    if (!res.ok) throw new Error(await res.text());
    return await safeJsonResponse(res);
  } catch (e) {
    console.warn("apiUpdateNote failed:", e);
    throw e;
  }
}

export async function apiDeleteNote(userId, noteId) {
  if (!userId || !noteId) throw new Error("invalid args");
  try {
    const res = await fetch(`/api/repository/notes/${encodeURIComponent(noteId)}`, {
      method: "DELETE",
      headers: { "x-user-id": String(userId) },
    });
    if (!res.ok) throw new Error(await res.text());
    return await safeJsonResponse(res);
  } catch (e) {
    console.warn("apiDeleteNote failed:", e);
    throw e;
  }
}

export async function apiCreateFolder(userId, folderName, parentId = null) {
  if (!userId || !folderName) throw new Error("invalid args");
  try {
    const res = await fetch(`/api/repository/folders`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-id": String(userId) },
      body: JSON.stringify({ folder_name: folderName, parent_id: parentId }),
    });
    if (!res.ok) throw new Error(await res.text());
    return await safeJsonResponse(res);
  } catch (e) {
    console.warn("apiCreateFolder failed:", e);
    throw e;
  }
}

export default null;
