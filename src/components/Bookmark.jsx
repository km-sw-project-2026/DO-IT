import "../css/Bookmark.css";
import { data } from "../js/mypageRepositoryData.js";
import { Link } from "react-router-dom";
import React, { useEffect, useMemo, useState } from "react";

const LS_DOCS = "doit_repository_docs_v1";

function safeParse(value, fallback) {
  try {
    const v = JSON.parse(value);
    return v ?? fallback;
  } catch {
    return fallback;
  }
}

function formatDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function MypageRepositoryBtn({ btn }) {
  return (
    <Link to={btn.to}>
      <button className={`mypagerepository-${btn.class}`}>
        <img src={btn.src} alt="" />
        <p>{btn.text}</p>
      </button>
    </Link>
  );
}

function Bookmark() {
  const [keyword, setKeyword] = useState("");
  const [menuDocId, setMenuDocId] = useState(null);
  const [docs, setDocs] = useState(() =>
    safeParse(localStorage.getItem(LS_DOCS), [])
  );

  useEffect(() => {
    const onStorage = () => {
      setDocs(safeParse(localStorage.getItem(LS_DOCS), []));
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    const handleClickOutside = () => {
      setMenuDocId(null);
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const favoriteDocs = useMemo(() => {
    let result = docs
      .map((doc) => ({
        ...doc,
        isDeleted: doc.isDeleted ?? false,
        isFavorite: doc.isFavorite ?? false,
      }))
      .filter((doc) => !doc.isDeleted && doc.isFavorite);

    const q = keyword.trim().toLowerCase();
    if (q) {
      result = result.filter((doc) =>
        (doc.title || "").toLowerCase().includes(q)
      );
    }

    return result;
  }, [docs, keyword]);

  const toggleFavorite = (id) => {
    const next = docs.map((doc) =>
      doc.id === id ? { ...doc, isFavorite: !doc.isFavorite } : doc
    );
    setDocs(next);
    localStorage.setItem(LS_DOCS, JSON.stringify(next));
  };

  const moveDocToTrash = (id) => {
    const ok = window.confirm("이 파일을 휴지통으로 이동할까요?");
    if (!ok) return;

    const now = new Date().toISOString();

    const next = docs.map((doc) =>
      doc.id === id
        ? {
            ...doc,
            isDeleted: true,
            deletedAt: now,
            updatedAt: now,
          }
        : doc
    );

    setDocs(next);
    localStorage.setItem(LS_DOCS, JSON.stringify(next));
    setMenuDocId(null);
  };

  const downloadDoc = (doc) => {
    const blob = new Blob(
      [
        `<!doctype html><html><head><meta charset="utf-8"><title>${doc.title || "document"}</title></head><body>${doc.html || ""}</body></html>`,
      ],
      { type: "text/html;charset=utf-8" }
    );

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${doc.title || "document"}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section>
      <div className="Bookmark">
        <div className="Bookmark-inner">
          <div className="Bookmark-header">
            <div className="Bookmark-title">
              <h2>내 자료함</h2>
              <img src="/images/mypagerepository.png" alt="" />
            </div>

            <div className="search">
              <input
                type="text"
                placeholder="검색어를 입력해주세요"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
              <button type="button">
                <img src="/images/icon/search1.png" alt="검색" />
              </button>
            </div>
          </div>

          <div className="Bookmark-contents">
            <div className="Bookmark-inventory">
              {data.map((item, index) => (
                <MypageRepositoryBtn key={index} btn={item} />
              ))}
            </div>

            <div className="Bookmark-collection">
              <div className="Bookmark-main">
                <div className="Bookmark-file-bottom">
                  <div className="Bookmark-bottom">
                    <img src="/images/icon/aroow.png" alt="" />
                    <p>즐겨찾기</p>
                  </div>

                  <div className="Bookmark-file-list">
                    <div className="Bookmark-file-name">
                      <p>이름</p>
                      <p className="Bookmark-col-date">날짜</p>
                      <span className="Bookmark-col-actions" />
                    </div>

                    {favoriteDocs.length === 0 ? (
                      <div className="Bookmark-file-empty">
                        <p>즐겨찾기한 파일이 없습니다.</p>
                      </div>
                    ) : (
                      favoriteDocs.map((doc) => (
                        <div key={doc.id} className="Bookmark-file-suggestion">
                          <div className="Bookmark-file-gather">
                            <Link
                              to={`/doc-view/${doc.id}`}
                              className="Bookmark-file-link"
                            >
                              <button type="button">
                                <img src="/images/icon/img.png" alt="" />
                              </button>
                              <p>{doc.title || "제목 없음"}</p>
                            </Link>
                          </div>

                          <p className="Bookmark-date">
                            {formatDate(doc.updatedAt || doc.createdAt)}
                          </p>

                          <div className="Bookmark-file-actions">
                            <button
                              className="Bookmark-download"
                              type="button"
                              onClick={() => downloadDoc(doc)}
                            >
                              <img src="/images/icon/download.png" alt="" />
                            </button>

                            <Link to={`/doc-edit/${doc.id}`}>
                              <button className="Bookmark-pan" type="button">
                                <img src="/images/icon/pan.png" alt="" />
                              </button>
                            </Link>

                            <button
                              className="Bookmark-star"
                              type="button"
                              onClick={() => toggleFavorite(doc.id)}
                            >
                              <img src="/images/icon/star2.png" alt="" />
                            </button>

                            <div
                              className="Bookmark-file-more-wrap"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                className="Bookmark-ooo-button"
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setMenuDocId(menuDocId === doc.id ? null : doc.id);
                                }}
                              >
                                <div className="Bookmark-ooo">
                                  <span>•</span>
                                  <span>•</span>
                                  <span>•</span>
                                </div>
                              </button>

                              {menuDocId === doc.id && (
                                <div className="Bookmark-menu">
                                  <button
                                    type="button"
                                    onClick={() => toggleFavorite(doc.id)}
                                  >
                                    즐겨찾기 해제
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => moveDocToTrash(doc.id)}
                                  >
                                    삭제
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Bookmark;