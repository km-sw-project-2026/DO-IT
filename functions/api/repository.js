const headers = (userId, isJson = false) => {
  const h = {};
  if (isJson) h["content-type"] = "application/json";
  if (userId) h["x-user-id"] = String(userId);
  return h;
};

// ✅ 폴더 목록 (홈: 삭제 안 된 것만 내려오게 API에서 처리했지)
export async function apiGetFolders(userId, parentId = null) {
  const qs = parentId === null ? "" : `?parentId=${parentId}`;
  const res = await fetch(`/api/repository/folders${qs}`, {
    headers: headers(userId),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || "폴더 목록 실패");
  return data.folders || [];
}

// ✅ 폴더 생성
export async function apiCreateFolder(userId, folder_name, parent_id = null) {
  const res = await fetch(`/api/repository/folders`, {
    method: "POST",
    headers: headers(userId, true),
    body: JSON.stringify({ folder_name, parent_id }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || "폴더 생성 실패");
  return data;
}

// ✅ 폴더 안 파일 목록
export async function apiGetFiles(userId, folderId) {
  const res = await fetch(`/api/repository/files?folderId=${folderId}`, {
    headers: headers(userId),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || "파일 목록 실패");
  return data.files || [];
}