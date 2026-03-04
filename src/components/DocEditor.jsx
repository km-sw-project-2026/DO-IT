import React, { useEffect, useMemo, useRef, useState } from "react";
import "../css/DocEditor.css";

const LS_KEY = "doit_doceditor_v1";

function exec(cmd, value = null) {
  // contentEditable 편집 명령
  document.execCommand(cmd, false, value);
}

export default function DocEditor() {
  const editorRef = useRef(null);

  const [title, setTitle] = useState("새 문서");
  const [savedAt, setSavedAt] = useState(null);
  const [status, setStatus] = useState("");

  const saved = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem(LS_KEY) || "null");
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    // 최초 로드 시 저장된 문서 불러오기
    if (saved?.html && editorRef.current) {
      editorRef.current.innerHTML = saved.html;
      setTitle(saved.title || "새 문서");
      setSavedAt(saved.savedAt || null);
    } else if (editorRef.current) {
      // 기본 템플릿
      editorRef.current.innerHTML = `
        <h2>문서 제목</h2>
        <p>여기에 글을 작성해보세요.</p>
      `;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = () => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    const now = new Date().toISOString();

    localStorage.setItem(
      LS_KEY,
      JSON.stringify({ title, html, savedAt: now })
    );

    setSavedAt(now);
    setStatus("저장됨!");
    setTimeout(() => setStatus(""), 1200);
  };

  const load = () => {
    try {
      const v = JSON.parse(localStorage.getItem(LS_KEY) || "null");
      if (!v?.html) return alert("저장된 문서가 없어요.");
      setTitle(v.title || "새 문서");
      editorRef.current.innerHTML = v.html;
      setSavedAt(v.savedAt || null);
      setStatus("불러옴!");
      setTimeout(() => setStatus(""), 1200);
    } catch {
      alert("불러오기 실패");
    }
  };

  const clearDoc = () => {
    const ok = confirm("새 문서로 초기화할까요? (저장 안 하면 내용이 사라져요)");
    if (!ok) return;
    setTitle("새 문서");
    if (editorRef.current) editorRef.current.innerHTML = "<p></p>";
  };

  const downloadHtml = () => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;

    const blob = new Blob(
      [
        `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title></head><body>${html}</body></html>`,
      ],
      { type: "text/html;charset=utf-8" }
    );

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title || "document"}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="doc-editor">
      <div className="doc-top">
        <input
          className="doc-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="문서 제목"
        />

        <div className="doc-actions">
          <button onClick={save}>저장</button>
          <button onClick={load}>불러오기</button>
          <button onClick={downloadHtml}>HTML로 저장</button>
          <button className="ghost" onClick={clearDoc}>새 문서</button>
        </div>
      </div>

      <div className="doc-toolbar">
        <button onClick={() => exec("bold")} title="굵게">
          B
        </button>
        <button onClick={() => exec("italic")} title="기울임">
          I
        </button>
        <button onClick={() => exec("underline")} title="밑줄">
          U
        </button>

        <span className="sep" />

        <button onClick={() => exec("formatBlock", "h1")}>H1</button>
        <button onClick={() => exec("formatBlock", "h2")}>H2</button>
        <button onClick={() => exec("formatBlock", "p")}>본문</button>

        <span className="sep" />

        <button onClick={() => exec("insertUnorderedList")}>• 목록</button>
        <button onClick={() => exec("insertOrderedList")}>1. 목록</button>

        <span className="sep" />

        <button onClick={() => exec("justifyLeft")}>왼쪽</button>
        <button onClick={() => exec("justifyCenter")}>가운데</button>
        <button onClick={() => exec("justifyRight")}>오른쪽</button>
      </div>

      <div
        ref={editorRef}
        className="doc-paper"
        contentEditable
        suppressContentEditableWarning
      />

      <div className="doc-footer">
        <span className="doc-status">{status}</span>
        <span className="doc-saved">
          {savedAt ? `마지막 저장: ${new Date(savedAt).toLocaleString()}` : "저장 기록 없음"}
        </span>
      </div>
    </div>
  );
}