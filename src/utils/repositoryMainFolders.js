const LS_MAIN_FOLDER_IDS = "doit_repository_main_folder_ids_v1";
const MAIN_FOLDERS_CHANGED_EVENT = "repository-main-folders-changed";

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
  window.dispatchEvent(new CustomEvent(MAIN_FOLDERS_CHANGED_EVENT, { detail: nextIds }));
  return nextIds;
}

export function subscribeMainFolderIds(callback) {
  if (typeof callback !== "function") {
    return () => {};
  }

  const handleChange = () => {
    callback(getMainFolderIds());
  };

  window.addEventListener("storage", handleChange);
  window.addEventListener(MAIN_FOLDERS_CHANGED_EVENT, handleChange);

  return () => {
    window.removeEventListener("storage", handleChange);
    window.removeEventListener(MAIN_FOLDERS_CHANGED_EVENT, handleChange);
  };
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
