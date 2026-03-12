const LS_MAIN_FOLDER_IDS = "doit_repository_main_folder_ids_v1";

function normalizeIds(ids) {
  return Array.from(
    new Set(
      (Array.isArray(ids) ? ids : [])
        .map((id) => Number(id))
        .filter((id) => Number.isInteger(id) && id > 0)
    )
  ).slice(0, 3);
}

export function getMainFolderIds() {
  try {
    return normalizeIds(JSON.parse(localStorage.getItem(LS_MAIN_FOLDER_IDS) || "[]"));
  } catch {
    return [];
  }
}

export function setMainFolderIds(ids) {
  const nextIds = normalizeIds(ids);
  localStorage.setItem(LS_MAIN_FOLDER_IDS, JSON.stringify(nextIds));
  return nextIds;
}

export function toggleMainFolderIds(ids, folderId) {
  const normalizedIds = normalizeIds(ids);
  const targetId = Number(folderId);

  if (!Number.isInteger(targetId) || targetId <= 0) {
    return { nextIds: normalizedIds, changed: false, limited: false };
  }

  if (normalizedIds.includes(targetId)) {
    return {
      nextIds: normalizedIds.filter((id) => id !== targetId),
      changed: true,
      limited: false,
    };
  }

  if (normalizedIds.length >= 3) {
    return {
      nextIds: normalizedIds,
      changed: false,
      limited: true,
    };
  }

  return {
    nextIds: [...normalizedIds, targetId],
    changed: true,
    limited: false,
  };
}
