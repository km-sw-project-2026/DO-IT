import "../css/MypageRepository.css";
import { data } from "../js/MypageRepository.js";
import MypageRepositoryfile from "./MypageRepositoryfile.jsx";
import { Link, useLocation } from "react-router-dom";
import React, { useEffect, useMemo, useState } from "react";

const LS_FOLDERS = "doit_repository_folders_v1";
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

function MypageRepository() {
  const location = useLocation();

  const [isFolderOpen, setIsFolderOpen] = useState(true);
  const [isFileOpen, setIsFileOpen] = useState(true);

  const [folders, setFolders] = useState(() =>
    safeParse(localStorage.getItem(LS_FOLDERS), [
      { id: 1, name: "폴더 1" },
      { id: 2, name: "폴더 2" },
      { id: 3, name: "폴더 3" },
    ])
  );

  const [docs, setDocs] = useState(() =>
    safeParse(localStorage.getItem(LS_DOCS), [])
  );

  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [keyword, setKeyword] = useState("");

  useEffect(() => {
    localStorage.setItem(LS_FOLDERS, JSON.stringify(folders));
  }, [folders]);

  useEffect(() => {
    localStorage.setItem(LS_DOCS, JSON.stringify(docs));
  }, [docs]);

  useEffect(() => {
    const onStorage = () => {
      setFolders(safeParse(localStorage.getItem(LS_FOLDERS), []));
      setDocs(safeParse(localStorage.getItem(LS_DOCS), []));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const addFolder = () => {
    const name = newFolderName.trim();
    if (!name) return;

    setFolders((prev) => [{ id: Date.now(), name }, ...prev]);
    setNewFolderName("");
    setIsAddingFolder(false);
    setIsFolderOpen(true);
  };

  const cancelAddFolder = () => {
    setNewFolderName("");
    setIsAddingFolder(false);
  };

  const toggleFavorite = (id) => {
    setDocs((prev) =>
      prev.map((doc) =>
        doc.id === id
          ? { ...doc, isFavorite: !doc.isFavorite }
          : doc
      )
    );
  };

  const removeDoc = (id) => {
    const ok = window.confirm("이 파일을 삭제할까요?");
    if (!ok) return;
    setDocs((prev) => prev.filter((doc) => doc.id !== id));
  };

  const isFavoritePage = location.pathname.includes("favorite");
  const isTrashPage = location.pathname.includes("trash");

  const filteredDocs = useMemo(() => {
    let result = docs;

    if (isFavoritePage) {
      result = result.filter((doc) => doc.isFavorite);
    }

    const q = keyword.trim().toLowerCase();
    if (q) {
      result = result.filter((doc) =>
        (doc.title || "").toLowerCase().includes(q)
      );
    }

    return result;
  }, [docs, keyword, isFavoritePage]);

  return (
    <section>
      <div className="mypagerepository">
        <div className="mypagerepository-inner">
          <div className="mypagerepository-header">
            <div className="mypagerepository-title">
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

          <div className="mypagerepository-contents">
            {/* 왼쪽 메뉴 복구 */}
            <div className="mypagerepository-inventory">
              {data.map((item, index) => (
                <MypageRepositoryBtn key={index} btn={item} />
              ))}

            </div>

            <div className="mypagerepository-collection">
              {/* 내 폴더 */}
              <div className="mypagerepository-main">
                <div className="mypagerepository-main-header">
                  <button
                    type="button"
                    className="mr-header-toggle"
                    onClick={() => setIsFolderOpen((v) => !v)}
                    aria-expanded={isFolderOpen}
                    aria-label="내 폴더 접기/펼치기"
                  >
                    <img
                      className={`mr-arrow ${isFolderOpen ? "open" : ""}`}
                      src="/images/icon/aroow.png"
                      alt=""
                    />
                    <p>내 폴더</p>
                  </button>

                  <button
                    type="button"
                    className="mr-add"
                    onClick={() => {
                      setIsAddingFolder(true);
                      setIsFolderOpen(true);
                    }}
                    aria-label="폴더 추가"
                  >
                    <img src="/images/icon/Plus.png" alt="" />
                  </button>
                </div>

                {isAddingFolder && (
                  <div className="mr-add-row">
                    <input
                      className="mr-add-input"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      placeholder="새 폴더 이름"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") addFolder();
                        if (e.key === "Escape") cancelAddFolder();
                      }}
                      autoFocus
                    />
                    <button className="mr-add-save" type="button" onClick={addFolder}>
                      추가
                    </button>
                    <button className="mr-add-cancel" type="button" onClick={cancelAddFolder}>
                      취소
                    </button>
                  </div>
                )}

                <div className={`mr-slide ${isFolderOpen ? "open" : ""}`}>
                  <ul className="mypagerepository-main-body">
                    {folders.map((f) => (
                      <MypageRepositoryfile key={f.id} name={f.name} />
                    ))}
                  </ul>
                </div>
              </div>

              {/* 내 파일 */}
              {!isTrashPage && (
                <div className="mypagerepository-file-bottom">
                  <div className="mypagerepository-bottom">
                    <button
                      type="button"
                      className="mr-header-toggle"
                      onClick={() => setIsFileOpen((v) => !v)}
                      aria-expanded={isFileOpen}
                      aria-label="내 파일 접기/펼치기"
                    >
                      <img
                        className={`mr-arrow ${isFileOpen ? "open" : ""}`}
                        src="/images/icon/aroow.png"
                        alt=""
                      />
                      <p>{isFavoritePage ? "즐겨찾기 파일" : "내 파일"}</p>
                    </button>

                    <Link to="/doc-editor">
                      <button
                        type="button"
                        className="mr-add"
                        aria-label="파일 추가"
                      >
                        <img src="/images/icon/Plus.png" alt="" />
                      </button>
                    </Link>
                  </div>

                  <div className={`mr-slide ${isFileOpen ? "open" : ""}`}>
                    <div className="mypagerepository-file-list">
                      <div className="mypagerepository-file-name">
                        <p>이름</p>
                        <p className="mr-col-date">날짜</p>
                        <span className="mr-col-actions" />
                      </div>

                      {filteredDocs.length === 0 ? (
                        <div className="mypagerepository-file-suggestion">
                          <div className="mypagerepository-file-gather">
                            <p>
                              {isFavoritePage
                                ? "즐겨찾기한 파일이 없어요."
                                : "저장된 문서가 없어요."}
                            </p>
                          </div>
                        </div>
                      ) : (
                        filteredDocs.map((doc) => (
                          <div key={doc.id} className="mypagerepository-file-suggestion">
                            <div className="mypagerepository-file-gather">
                              <Link
                                to={`/doc-view/${doc.id}`}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "10px",
                                  textDecoration: "none",
                                  color: "inherit",
                                }}
                              >
                                <button type="button">
                                  <img src="/images/icon/img.png" alt="" />
                                </button>
                                <p>{doc.title || "제목 없음"}</p>
                              </Link>
                            </div>

                            <p className="mr-date">
                              {formatDate(doc.updatedAt || doc.createdAt)}
                            </p>

                            <div className="mypagerepository-file-actions">
                              <button
                                className="mypagerepository-download"
                                type="button"
                                onClick={() => {
                                  const blob = new Blob(
                                    [
                                      `<!doctype html><html><head><meta charset="utf-8"><title>${doc.title}</title></head><body>${doc.html || ""}</body></html>`,
                                    ],
                                    { type: "text/html;charset=utf-8" }
                                  );
                                  const url = URL.createObjectURL(blob);
                                  const a = document.createElement("a");
                                  a.href = url;
                                  a.download = `${doc.title || "document"}.html`;
                                  a.click();
                                  URL.revokeObjectURL(url);
                                }}
                              >
                                <img src="/images/icon/download.png" alt="" />
                              </button>

                              <Link to={`/doc-edit/${doc.id}`}>
                                <button className="mypagerepository-pan" type="button">
                                  <img src="/images/icon/pan.png" alt="" />
                                </button>
                              </Link>

                              <button
                                className="mypagerepository-star"
                                type="button"
                                onClick={() => toggleFavorite(doc.id)}
                                aria-label="즐겨찾기"
                              >
                                <img
                                  src={
                                    doc.isFavorite
                                      ? "/images/icon/star2.png"
                                      : "/images/icon/star.png"
                                  }
                                  alt="즐겨찾기"
                                />
                              </button>

                              <button
                                className="mypagerepository-ooo-button"
                                type="button"
                                onClick={() => removeDoc(doc.id)}
                                aria-label="삭제"
                              >
                                <div className="mypagerepository-ooo">
                                  <span>•</span>
                                  <span>•</span>
                                  <span>•</span>
                                </div>
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default MypageRepository;