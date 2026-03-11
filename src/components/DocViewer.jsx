import React, { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../css/DocViewer.css";

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

  const doc = useMemo(() => {
    const docs = safeParse(localStorage.getItem(LS_DOCS), []);
    return docs.find((item) => String(item.id) === String(id)) || null;
  }, [id]);

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

  return (
    <div className="doc-viewer-wrap">
      <div className="doc-viewer-top">
        <div>
          <h1 className="doc-viewer-title">{doc.title || "제목 없음"}</h1>
          <p className="doc-viewer-date">
            마지막 수정:{" "}
            {doc.updatedAt
              ? new Date(doc.updatedAt).toLocaleString()
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