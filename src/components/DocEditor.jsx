import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../css/DocEditor.css";

const LS_DOCS = "doit_repository_docs_v1";

function safeParse(value, fallback) {
  try {
    const v = JSON.parse(value);
    return v ?? fallback;
  } catch {
    return fallback;
  }
}

export default function DocEditor() {
  const editorRef = useRef(null);
  const savedRangeRef = useRef(null);

  const navigate = useNavigate();
  const { id } = useParams();

  const [title, setTitle] = useState("새 문서");
  const [savedAt, setSavedAt] = useState(null);
  const [status, setStatus] = useState("");
  const [isTemplate, setIsTemplate] = useState(true);

  const [fontSize, setFontSize] = useState("16");
  const [textColor, setTextColor] = useState("#111111");

  const [formatState, setFormatState] = useState({
    bold: false,
    italic: false,
    underline: false,
    ul: false,
    ol: false,
  });

  useEffect(() => {
    const docs = safeParse(localStorage.getItem(LS_DOCS), []);

    if (id) {
      const found = docs.find((doc) => String(doc.id) === String(id));
      if (found && editorRef.current) {
        setTitle(found.title || "제목 없음");
        editorRef.current.innerHTML = found.html || "<p></p>";
        setSavedAt(found.updatedAt || found.createdAt || null);
        setIsTemplate(false);
        return;
      }
    }

    if (editorRef.current) {
      editorRef.current.innerHTML = `
        <h1>문서 제목</h1>
        <p>여기에 글을 작성해보세요.</p>
      `;
      setIsTemplate(true);
    }
  }, [id]);

  const showStatus = (msg) => {
    setStatus(msg);
    setTimeout(() => setStatus(""), 1200);
  };

  const saveSelection = () => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    const range = sel.getRangeAt(0);
    if (!editorRef.current?.contains(range.commonAncestorContainer)) return;

    savedRangeRef.current = range.cloneRange();
  };

  const getEditorRange = () => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return null;

    const range = sel.getRangeAt(0);
    if (!editorRef.current?.contains(range.commonAncestorContainer)) return null;

    return range;
  };

  const restoreSelection = () => {
    const sel = window.getSelection();
    if (!sel || !savedRangeRef.current) return false;

    sel.removeAllRanges();
    sel.addRange(savedRangeRef.current);
    return true;
  };

  const focusEditor = () => {
    editorRef.current?.focus();
  };

  const placeCaretAtEnd = (node) => {
    const sel = window.getSelection();
    if (!sel) return;

    const range = document.createRange();
    range.selectNodeContents(node);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
    savedRangeRef.current = range.cloneRange();
  };

  const placeCaretInTextNode = (node, offset) => {
    const sel = window.getSelection();
    if (!sel) return;

    const range = document.createRange();
    range.setStart(node, offset);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
    savedRangeRef.current = range.cloneRange();
  };

  const findClosestBlock = (node) => {
    let current = node?.nodeType === 3 ? node.parentNode : node;

    while (current && current !== editorRef.current) {
      const tag = current.nodeName?.toLowerCase();
      if (["p", "div", "h1", "h2", "h3", "blockquote", "li"].includes(tag)) {
        return current;
      }
      current = current.parentNode;
    }

    return null;
  };

  const getRangeBlock = (range) => {
    const directBlock = findClosestBlock(range.startContainer);
    if (directBlock) return directBlock;

    if (!editorRef.current) return null;

    const { startContainer, startOffset } = range;

    if (startContainer === editorRef.current) {
      const child =
        editorRef.current.childNodes[startOffset] ||
        editorRef.current.childNodes[startOffset - 1] ||
        editorRef.current.firstChild;

      return findClosestBlock(child) || child || null;
    }

    return null;
  };

  const findClosestTag = (node, tagName) => {
    let current = node?.nodeType === 3 ? node.parentNode : node;

    while (current && current !== editorRef.current) {
      if (current.nodeName?.toLowerCase() === tagName) {
        return current;
      }
      current = current.parentNode;
    }

    return null;
  };

  const updateFormatState = () => {
    try {
      setFormatState({
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic"),
        underline: document.queryCommandState("underline"),
        ul: document.queryCommandState("insertUnorderedList"),
        ol: document.queryCommandState("insertOrderedList"),
      });
    } catch {
      // ignore
    }
  };

  const getFontSizeNodes = () => {
    if (!editorRef.current) return [];

    return Array.from(
      editorRef.current.querySelectorAll('font[size], span[style*="font-size"]')
    );
  };

  const normalizeFontSizeNodes = (nodes = null, forcedSizePx = null) => {
    if (!editorRef.current) return [];

    const targets = nodes ? Array.from(nodes) : getFontSizeNodes();
    const sizeMap = {
      "1": "10px",
      "2": "12px",
      "3": "14px",
      "4": "16px",
      "5": "18px",
      "6": "24px",
      "7": "32px",
    };

    return targets.map((node) => {
      if (node.tagName.toLowerCase() === "font") {
        const span = document.createElement("span");
        const size = node.getAttribute("size");
        span.style.fontSize = forcedSizePx || sizeMap[size] || "16px";
        span.innerHTML = node.innerHTML;
        node.replaceWith(span);
        return span;
      }

      node.style.fontSize = forcedSizePx || node.style.fontSize || "16px";
      return node;
    });
  };

  const cleanupEditorMarkup = () => {
    if (!editorRef.current) return;

    const walker = document.createTreeWalker(
      editorRef.current,
      NodeFilter.SHOW_TEXT
    );

    const textNodes = [];
    while (walker.nextNode()) {
      textNodes.push(walker.currentNode);
    }

    textNodes.forEach((node) => {
      if (node.textContent?.includes("\u200b")) {
        node.textContent = node.textContent.replace(/\u200b/g, "");
      }
    });
  };

  const runInlineCommand = (command) => {
    focusEditor();
    restoreSelection();
    document.execCommand("styleWithCSS", false, true);
    document.execCommand(command, false, null);
    normalizeFontSizeNodes();
    saveSelection();
    updateFormatState();
  };

  const toggleList = (listTag) => {
    focusEditor();
    if (!restoreSelection()) return;

    const range = getEditorRange();
    if (!range) return;

    const currentListItem = findClosestTag(range.startContainer, "li");
    const currentList = findClosestTag(range.startContainer, listTag);

    if (currentListItem && currentList) {
      const paragraph = document.createElement("p");
      paragraph.innerHTML = currentListItem.innerHTML || "<br>";
      currentListItem.replaceWith(paragraph);

      if (!currentList.querySelector("li")) {
        currentList.replaceWith(...Array.from(currentList.childNodes));
      }

      placeCaretAtEnd(paragraph);
      setFormatState((prev) => ({
        ...prev,
        ul: false,
        ol: false,
      }));
      return;
    }

    const block = getRangeBlock(range);
    if (!block) return;

    const list = document.createElement(listTag);
    const listItem = document.createElement("li");
    listItem.innerHTML = block.innerHTML || "<br>";
    list.appendChild(listItem);

    if (block === editorRef.current) {
      editorRef.current.appendChild(list);
    } else {
      block.replaceWith(list);
    }

    placeCaretAtEnd(listItem);
    setFormatState((prev) => ({
      ...prev,
      ul: listTag === "ul",
      ol: listTag === "ol",
    }));
  };

  const applyTextColor = (color) => {
    setTextColor(color);
    focusEditor();
    restoreSelection();
    document.execCommand("styleWithCSS", false, true);
    document.execCommand("foreColor", false, color);
    saveSelection();
    updateFormatState();
  };

  const applyFontSize = (sizePx) => {
    setFontSize(sizePx);
    focusEditor();
    if (!restoreSelection()) return;

    const range = getEditorRange();
    if (!range) return;

    const sizeValue = `${sizePx}px`;

    if (range.collapsed) {
      const span = document.createElement("span");
      const marker = document.createTextNode("\u200b");

      span.style.fontSize = sizeValue;
      span.appendChild(marker);
      range.insertNode(span);
      placeCaretInTextNode(marker, 1);
      updateFormatState();
      return;
    }

    const existingFontSizeNodes = new Set(getFontSizeNodes());

    document.execCommand("styleWithCSS", false, true);
    document.execCommand("fontSize", false, "7");

    const newFontSizeNodes = getFontSizeNodes().filter(
      (node) => !existingFontSizeNodes.has(node)
    );

    const normalizedSpans = normalizeFontSizeNodes(
      newFontSizeNodes,
      sizeValue
    );

    if (normalizedSpans.length > 0) {
      const lastSpan = normalizedSpans[normalizedSpans.length - 1];
      placeCaretAtEnd(lastSpan);
    }

    updateFormatState();
    saveSelection();
  };

  const applyBlockTag = (tagName) => {
    focusEditor();
    restoreSelection();

    const range = getEditorRange();
    if (!range) return;

    const block = findClosestBlock(range.startContainer);

    if (block && block.nodeName.toLowerCase() !== tagName) {
      const nextBlock = document.createElement(tagName);

      while (block.firstChild) {
        nextBlock.appendChild(block.firstChild);
      }

      block.replaceWith(nextBlock);
      placeCaretAtEnd(nextBlock);
      updateFormatState();
      return;
    }

    document.execCommand("formatBlock", false, tagName.toUpperCase());
    saveSelection();
    updateFormatState();
  };

  const handleEditorFocus = () => {
    if (isTemplate && editorRef.current) {
      editorRef.current.innerHTML = "<p><br></p>";
      setIsTemplate(false);
    }
    saveSelection();
    updateFormatState();
  };

  const handleEditorMouseUp = () => {
    saveSelection();
    updateFormatState();
  };

  const handleEditorKeyUp = () => {
    saveSelection();
    updateFormatState();
  };

  const keepSelection = (e) => {
    e.preventDefault();
  };

  const save = () => {
    if (!editorRef.current) return;

    const docs = safeParse(localStorage.getItem(LS_DOCS), []);
    const now = new Date().toISOString();
    cleanupEditorMarkup();
    const html = editorRef.current.innerHTML;

    if (id) {
      const next = docs.map((doc) =>
        String(doc.id) === String(id)
          ? {
              ...doc,
              title,
              html,
              updatedAt: now,
            }
          : doc
      );
      localStorage.setItem(LS_DOCS, JSON.stringify(next));
    } else {
      const newDoc = {
        id: Date.now(),
        title,
        html,
        folderId: null,
        isFavorite: false,
        createdAt: now,
        updatedAt: now,
      };
      localStorage.setItem(LS_DOCS, JSON.stringify([newDoc, ...docs]));
    }

    setSavedAt(now);
    showStatus("저장됨!");
  };

  const clearDoc = () => {
    const ok = window.confirm("새 문서로 초기화할까요?");
    if (!ok) return;

    setTitle("새 문서");
    if (editorRef.current) {
      editorRef.current.innerHTML = `
        <h1>문서 제목</h1>
        <p>여기에 글을 작성해보세요.</p>
      `;
    }

    setIsTemplate(true);
    setFormatState({
      bold: false,
      italic: false,
      underline: false,
      ul: false,
      ol: false,
    });
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
          <button type="button" onClick={save} title="문서를 저장합니다">
            저장
          </button>
          <button
            type="button"
            onClick={() => navigate("/mypagerepository")}
            title="자료함으로 이동합니다"
          >
            자료함으로
          </button>
          <button
            type="button"
            className="ghost"
            onClick={clearDoc}
            title="새 문서 상태로 초기화합니다"
          >
            새 문서
          </button>
        </div>
      </div>

      <div className="doc-toolbar">
        <button
          type="button"
          className={formatState.bold ? "active" : ""}
          onMouseDown={keepSelection}
          onClick={() => runInlineCommand("bold")}
          title="굵게"
        >
          B
        </button>

        <button
          type="button"
          className={formatState.italic ? "active" : ""}
          onMouseDown={keepSelection}
          onClick={() => runInlineCommand("italic")}
          title="기울임"
        >
          I
        </button>

        <button
          type="button"
          className={formatState.underline ? "active" : ""}
          onMouseDown={keepSelection}
          onClick={() => runInlineCommand("underline")}
          title="밑줄"
        >
          U
        </button>

        <span className="sep" />

        <button
          type="button"
          onMouseDown={keepSelection}
          onClick={() => applyBlockTag("h1")}
          title="제목 1"
        >
          제목1
        </button>

        <button
          type="button"
          onMouseDown={keepSelection}
          onClick={() => applyBlockTag("h2")}
          title="제목 2"
        >
          제목2
        </button>

        <button
          type="button"
          onMouseDown={keepSelection}
          onClick={() => applyBlockTag("p")}
          title="본문"
        >
          본문
        </button>

        <span className="sep" />

        <label className="toolbar-inline" title="글자 크기">
          크기
          <select
            value={fontSize}
            onMouseDown={saveSelection}
            onChange={(e) => applyFontSize(e.target.value)}
          >
            <option value="12">12px</option>
            <option value="14">14px</option>
            <option value="16">16px</option>
            <option value="18">18px</option>
            <option value="20">20px</option>
            <option value="24">24px</option>
            <option value="28">28px</option>
            <option value="32">32px</option>
          </select>
        </label>

        <label className="toolbar-inline" title="글자 색">
          색상
          <input
            type="color"
            onMouseDown={saveSelection}
            value={textColor}
            onChange={(e) => applyTextColor(e.target.value)}
          />
        </label>

        <span className="sep" />

        <button
          type="button"
          className={formatState.ul ? "active" : ""}
          onMouseDown={keepSelection}
          onClick={() => toggleList("ul")}
          title="글머리 기호 목록"
        >
          • 목록
        </button>

        <button
          type="button"
          className={formatState.ol ? "active" : ""}
          onMouseDown={keepSelection}
          onClick={() => toggleList("ol")}
          title="번호 목록"
        >
          1. 목록
        </button>

        <span className="sep" />

        <button
          type="button"
          onMouseDown={keepSelection}
          onClick={() => runInlineCommand("justifyLeft")}
          title="왼쪽 정렬"
        >
          왼쪽
        </button>

        <button
          type="button"
          onMouseDown={keepSelection}
          onClick={() => runInlineCommand("justifyCenter")}
          title="가운데 정렬"
        >
          가운데
        </button>

        <button
          type="button"
          onMouseDown={keepSelection}
          onClick={() => runInlineCommand("justifyRight")}
          title="오른쪽 정렬"
        >
          오른쪽
        </button>
      </div>

      <div
        ref={editorRef}
        className={`doc-paper ${isTemplate ? "is-template" : ""}`}
        contentEditable
        suppressContentEditableWarning
        onFocus={handleEditorFocus}
        onMouseUp={handleEditorMouseUp}
        onKeyUp={handleEditorKeyUp}
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
