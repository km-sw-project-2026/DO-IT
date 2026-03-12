const LS_RECENT_CREATED_DOC = "doit_recent_created_doc_v1";

export function getRecentCreatedDoc() {
  try {
    const value = JSON.parse(localStorage.getItem(LS_RECENT_CREATED_DOC) || "null");
    return value || null;
  } catch {
    return null;
  }
}

export function setRecentCreatedDoc(doc) {
  if (!doc) return null;

  const nextDoc = {
    id: doc.id != null ? String(doc.id) : "",
    title: doc.title || "제목 없음",
    docType: doc.docType || "note",
    createdAt: doc.createdAt || new Date().toISOString(),
  };

  localStorage.setItem(LS_RECENT_CREATED_DOC, JSON.stringify(nextDoc));
  return nextDoc;
}

export function clearRecentCreatedDoc() {
  localStorage.removeItem(LS_RECENT_CREATED_DOC);
}
