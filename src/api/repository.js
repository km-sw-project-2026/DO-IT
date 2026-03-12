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

export async function apiGetFiles(userId, folderId = null) {
  if (!userId) return { files: [] };
  try {
    const qs = folderId === null ? "" : `?folderId=${encodeURIComponent(folderId)}`;
    const res = await fetch(`/api/repository/files${qs}`, {
      headers: { "x-user-id": String(userId) },
    });
    if (!res.ok) throw new Error(await res.text());
    return await safeJsonResponse(res);
  } catch (e) {
    console.warn("apiGetFiles failed:", e);
    return { files: [] };
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

export async function apiGetNote(userId, noteId) {
  if (!userId || !noteId) throw new Error("invalid args");
  try {
    const res = await fetch(`/api/repository/notes/${encodeURIComponent(noteId)}`, {
      headers: { "x-user-id": String(userId) },
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await safeJsonResponse(res);
    return data.note || null;
  } catch (e) {
    console.warn("apiGetNote failed:", e);
    return null;
  }
}

export async function apiGetTrashNote(userId, noteId) {
  if (!userId || !noteId) throw new Error("invalid args");
  try {
    const res = await fetch(`/api/repository/trash/notes/${encodeURIComponent(noteId)}`, {
      headers: { "x-user-id": String(userId) },
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await safeJsonResponse(res);
    return data.note || null;
  } catch (e) {
    console.warn("apiGetTrashNote failed:", e);
    return null;
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

export async function apiMoveNote(userId, noteId, folderId) {
  if (!userId || !noteId) throw new Error("invalid args");
  try {
    const res = await fetch(`/api/repository/notes/${encodeURIComponent(noteId)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "x-user-id": String(userId) },
      body: JSON.stringify({ folder_id: folderId }),
    });
    if (!res.ok) throw new Error(await res.text());
    return await safeJsonResponse(res);
  } catch (e) {
    console.warn("apiMoveNote failed:", e);
    throw e;
  }
}

export async function apiSetNoteFavorite(userId, noteId, isFavorite) {
  if (!userId || !noteId) throw new Error("invalid args");
  try {
    const res = await fetch(`/api/repository/notes/${encodeURIComponent(noteId)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "x-user-id": String(userId) },
      body: JSON.stringify({ is_favorite: isFavorite }),
    });
    if (!res.ok) throw new Error(await res.text());
    return await safeJsonResponse(res);
  } catch (e) {
    console.warn("apiSetNoteFavorite failed:", e);
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

export async function apiGetTrash(userId) {
  if (!userId) return { trash: { folders: [], files: [] } };
  try {
    const res = await fetch(`/api/repository/trash`, {
      headers: { "x-user-id": String(userId) },
    });
    if (!res.ok) throw new Error(await res.text());
    return await safeJsonResponse(res);
  } catch (e) {
    console.warn("apiGetTrash failed:", e);
    return { trash: { folders: [], files: [] } };
  }
}

export async function apiGetTrashFolder(userId, folderId) {
  if (!userId || !folderId) throw new Error("invalid args");
  try {
    const res = await fetch(`/api/repository/trash/folders/${encodeURIComponent(folderId)}`, {
      headers: { "x-user-id": String(userId) },
    });
    if (!res.ok) throw new Error(await res.text());
    return await safeJsonResponse(res);
  } catch (e) {
    console.warn("apiGetTrashFolder failed:", e);
    throw e;
  }
}

export async function apiRestoreTrashFolder(userId, folderId) {
  if (!userId || !folderId) throw new Error("invalid args");
  try {
    const res = await fetch(`/api/repository/trash/folders/${encodeURIComponent(folderId)}/restore`, {
      method: "POST",
      headers: { "x-user-id": String(userId) },
    });
    if (!res.ok) throw new Error(await res.text());
    return await safeJsonResponse(res);
  } catch (e) {
    console.warn("apiRestoreTrashFolder failed:", e);
    throw e;
  }
}

export async function apiPurgeTrashFolder(userId, folderId) {
  if (!userId || !folderId) throw new Error("invalid args");
  try {
    const res = await fetch(`/api/repository/trash/folders/${encodeURIComponent(folderId)}/purge`, {
      method: "DELETE",
      headers: { "x-user-id": String(userId) },
    });
    if (!res.ok) throw new Error(await res.text());
    return await safeJsonResponse(res);
  } catch (e) {
    console.warn("apiPurgeTrashFolder failed:", e);
    throw e;
  }
}

export async function apiRestoreTrashFile(userId, fileId, folderId) {
  if (!userId || !fileId) throw new Error("invalid args");
  try {
    const res = await fetch(`/api/repository/trash/files/${encodeURIComponent(fileId)}/restore`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-id": String(userId) },
      body: JSON.stringify({ folder_id: folderId }),
    });
    if (!res.ok) throw new Error(await res.text());
    return await safeJsonResponse(res);
  } catch (e) {
    console.warn("apiRestoreTrashFile failed:", e);
    throw e;
  }
}

export async function apiPurgeTrashFile(userId, fileId) {
  if (!userId || !fileId) throw new Error("invalid args");
  try {
    const res = await fetch(`/api/repository/trash/files/${encodeURIComponent(fileId)}/purge`, {
      method: "DELETE",
      headers: { "x-user-id": String(userId) },
    });
    if (!res.ok) throw new Error(await res.text());
    return await safeJsonResponse(res);
  } catch (e) {
    console.warn("apiPurgeTrashFile failed:", e);
    throw e;
  }
}

export async function apiRestoreTrashNote(userId, noteId, folderId) {
  if (!userId || !noteId) throw new Error("invalid args");
  try {
    const res = await fetch(`/api/repository/trash/notes/${encodeURIComponent(noteId)}/restore`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-id": String(userId) },
      body: JSON.stringify({ folder_id: folderId }),
    });
    if (!res.ok) throw new Error(await res.text());
    return await safeJsonResponse(res);
  } catch (e) {
    console.warn("apiRestoreTrashNote failed:", e);
    throw e;
  }
}

export async function apiPurgeTrashNote(userId, noteId) {
  if (!userId || !noteId) throw new Error("invalid args");
  try {
    const res = await fetch(`/api/repository/trash/notes/${encodeURIComponent(noteId)}/purge`, {
      method: "DELETE",
      headers: { "x-user-id": String(userId) },
    });
    if (!res.ok) throw new Error(await res.text());
    return await safeJsonResponse(res);
  } catch (e) {
    console.warn("apiPurgeTrashNote failed:", e);
    throw e;
  }
}

export async function apiRenameFolder(userId, folderId, folderName) {
  if (!userId || !folderId || !folderName) throw new Error("invalid args");
  try {
    const res = await fetch(`/api/repository/folders/${encodeURIComponent(folderId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-user-id": String(userId) },
      body: JSON.stringify({ folder_name: folderName }),
    });
    if (!res.ok) throw new Error(await res.text());
    return await safeJsonResponse(res);
  } catch (e) {
    console.warn("apiRenameFolder failed:", e);
    throw e;
  }
}

export async function apiDeleteFolder(userId, folderId) {
  if (!userId || !folderId) throw new Error("invalid args");
  try {
    const res = await fetch(`/api/repository/folders/${encodeURIComponent(folderId)}`, {
      method: "DELETE",
      headers: { "x-user-id": String(userId) },
    });
    if (!res.ok) throw new Error(await res.text());
    return await safeJsonResponse(res);
  } catch (e) {
    console.warn("apiDeleteFolder failed:", e);
    throw e;
  }
}

export async function apiRenameFile(userId, fileId, displayName) {
  if (!userId || !fileId || !displayName) throw new Error("invalid args");
  try {
    const res = await fetch(`/api/repository/files/${encodeURIComponent(fileId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-user-id": String(userId) },
      body: JSON.stringify({ display_name: displayName }),
    });
    if (!res.ok) throw new Error(await res.text());
    return await safeJsonResponse(res);
  } catch (e) {
    console.warn("apiRenameFile failed:", e);
    throw e;
  }
}

export async function apiMoveFile(userId, fileId, folderId) {
  if (!userId || !fileId) throw new Error("invalid args");
  try {
    const res = await fetch(`/api/repository/files/${encodeURIComponent(fileId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-user-id": String(userId) },
      body: JSON.stringify({ folder_id: folderId }),
    });
    if (!res.ok) throw new Error(await res.text());
    return await safeJsonResponse(res);
  } catch (e) {
    console.warn("apiMoveFile failed:", e);
    throw e;
  }
}

export async function apiSetFileFavorite(userId, fileId, isFavorite) {
  if (!userId || !fileId) throw new Error("invalid args");
  try {
    const res = await fetch(`/api/repository/files/${encodeURIComponent(fileId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-user-id": String(userId) },
      body: JSON.stringify({ is_favorite: isFavorite }),
    });
    if (!res.ok) throw new Error(await res.text());
    return await safeJsonResponse(res);
  } catch (e) {
    console.warn("apiSetFileFavorite failed:", e);
    throw e;
  }
}

export async function apiDeleteFile(userId, fileId) {
  if (!userId || !fileId) throw new Error("invalid args");
  try {
    const res = await fetch(`/api/repository/files/${encodeURIComponent(fileId)}`, {
      method: "DELETE",
      headers: { "x-user-id": String(userId) },
    });
    if (!res.ok) throw new Error(await res.text());
    return await safeJsonResponse(res);
  } catch (e) {
    console.warn("apiDeleteFile failed:", e);
    throw e;
  }
}

export default null;
