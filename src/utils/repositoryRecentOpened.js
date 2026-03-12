const LS_RECENT_OPENED_DOC = "doit_recent_opened_doc_v1";

export function getRecentOpenedDoc() {
  try {
    const value = JSON.parse(localStorage.getItem(LS_RECENT_OPENED_DOC) || "null");
    return value || null;
  } catch {
    return null;
  }
}

export function setRecentOpenedDoc(doc) {
  if (!doc) return null;

  const nextDoc = {
    id: doc.id != null ? String(doc.id) : "",
    title: doc.title || "제목 없음",
    docType: doc.docType || "note",
    filePath: doc.filePath || "",
    openedAt: doc.openedAt || new Date().toISOString(),
  };

  localStorage.setItem(LS_RECENT_OPENED_DOC, JSON.stringify(nextDoc));
  return nextDoc;
}

export function clearRecentOpenedDoc() {
  localStorage.removeItem(LS_RECENT_OPENED_DOC);
}
