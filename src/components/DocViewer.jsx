import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiGetNote, apiGetTrashNote } from "../api/repository";
import "../css/DocViewer.css";
import { getCurrentUser } from "../utils/auth";
import { setRecentOpenedDoc } from "../utils/repositoryRecentOpened";
import { formatRepositoryDateTime } from "../utils/repositoryDate";

const LS_DOCS = "doit_repository_docs_v1";

function safeParse(value, fallback) {
  try {
    const v = JSON.parse(value);
    return v ?? fallback;
  } catch {
    return fallback;
  }
}

export default function DocViewer() {
  const navigate = useNavigate();
  const { id } = useParams();
  const me = getCurrentUser();
  const userId = me?.user_id;

  const [doc, setDoc] = useState(undefined);

  useEffect(() => {
    let cancelled = false;

    async function loadDoc() {
      const docs = safeParse(localStorage.getItem(LS_DOCS), []);
      const localDoc = docs.find((item) => String(item.id) === String(id)) || null;

      if (localDoc?.html) {
        if (!cancelled) {
          setDoc(localDoc);
          setRecentOpenedDoc({
            id: localDoc.id,
            title: localDoc.title,
            docType: "note",
          });
        }
        return;
      }

      if (!userId) {
        if (!cancelled) setDoc(localDoc);
        return;
      }

      const noteId = Number(id);
      if (!Number.isFinite(noteId)) {
        if (!cancelled) setDoc(localDoc);
        return;
      }

      const note = await apiGetNote(userId, noteId);
      const trashNote = note ? null : await apiGetTrashNote(userId, noteId);
      const resolvedNote = note || trashNote;
      if (!cancelled) {
        const nextDoc = resolvedNote
          ? {
              id: String(resolvedNote.note_id),
              title: resolvedNote.title,
              html: resolvedNote.content,
              createdAt: resolvedNote.created_at,
              updatedAt: resolvedNote.updated_at || resolvedNote.created_at,
            }
          : localDoc;

        setDoc(nextDoc);
        if (nextDoc) {
          setRecentOpenedDoc({
            id: nextDoc.id,
            title: nextDoc.title,
            docType: "note",
          });
        }
      }
    }

    loadDoc();
    return () => {
      cancelled = true;
    };
  }, [id, userId]);

  if (doc === undefined) {
    return null;
  }

  if (!doc) {
    return (
      <div className="doc-viewer-wrap">
        <div className="doc-viewer-empty">
          <h2>문서를 찾을 수 없어요.</h2>
          <button type="button" onClick={() => navigate("/mypagerepository")}>
            자료함으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  if (!doc.html) {
    return (
      <div className="doc-viewer-wrap">
        <div className="doc-viewer-empty">
          {doc.filePath ? (
            <>
              <h2>이 항목은 파일로 저장되어 있어요.</h2>
              <button
                type="button"
                onClick={() => {
                  const link = document.createElement("a");
                  link.href = doc.filePath;
                  link.target = "_blank";
                  link.rel = "noreferrer";
                  link.click();
                }}
              >
                파일 열기
              </button>
            </>
          ) : (
            <h2>이 항목은 문서 미리보기를 지원하지 않아요.</h2>
          )}
          <button type="button" onClick={() => navigate("/mypagerepository")}>
            자료함으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="doc-viewer-wrap">
      <div className="doc-viewer-top">
        <div>
          <h1 className="doc-viewer-title">{doc.title || "제목 없음"}</h1>
          <p className="doc-viewer-date">
            마지막 수정:{" "}
            {doc.updatedAt
              ? formatRepositoryDateTime(doc.updatedAt)
              : "기록 없음"}
          </p>
        </div>

        <div className="doc-viewer-actions">
          <button
            type="button"
            onClick={() => navigate(`/doc-edit/${doc.id}`)}
          >
            수정
          </button>
          <button
            type="button"
            className="ghost"
            onClick={() => navigate("/mypagerepository")}
          >
            자료함으로
          </button>
        </div>
      </div>

      <div className="doc-viewer-page">
        <div
          className="doc-viewer-paper"
          dangerouslySetInnerHTML={{ __html: doc.html || "<p></p>" }}
        />
      </div>
    </div>
  );
}
