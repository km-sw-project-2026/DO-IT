import "../css/MypageRepository.css";
import { data } from "../js/MypageRepository.js";
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

  const [menuFolderId, setMenuFolderId] = useState(null);
  const [menuDocId, setMenuDocId] = useState(null);

  const [movingDocId, setMovingDocId] = useState(null);
  const [moveTargetFolderId, setMoveTargetFolderId] = useState("");

  const [draggingDocId, setDraggingDocId] = useState(null);
  const [dragOverFolderId, setDragOverFolderId] = useState(null);

  const [folders, setFolders] = useState(() =>
    safeParse(localStorage.getItem(LS_FOLDERS), [])
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

  useEffect(() => {
    const handleClickOutside = () => {
      setMenuFolderId(null);
      setMenuDocId(null);
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        setMenuFolderId(null);
        setMenuDocId(null);
        setMovingDocId(null);
        setMoveTargetFolderId("");
        setDraggingDocId(null);
        setDragOverFolderId(null);
      }
    };

    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("keydown", handleEsc);
    };
  }, []);

  const addFolder = () => {
    const name = newFolderName.trim();
    if (!name) return;

    setFolders((prev) => [
      {
        id: Date.now(),
        name,
        parentId: null,
        createdAt: new Date().toISOString(),
        isDeleted: false,
        deletedAt: null,
      },
      ...prev,
    ]);

    setNewFolderName("");
    setIsAddingFolder(false);
    setIsFolderOpen(true);
  };

  const cancelAddFolder = () => {
    setNewFolderName("");
    setIsAddingFolder(false);
  };

  const renameFolder = (id) => {
    const folder = folders.find((item) => item.id === id);
    const newName = window.prompt("새 폴더 이름을 입력하세요.", folder?.name || "");

    if (newName === null) return;

    const trimmed = newName.trim();
    if (!trimmed) return;

    setFolders((prev) =>
      prev.map((folder) =>
        folder.id === id ? { ...folder, name: trimmed } : folder
      )
    );

    setMenuFolderId(null);
  };

  const moveFolderToTrash = (id) => {
    const ok = window.confirm("폴더를 휴지통으로 이동할까요?");
    if (!ok) return;

    const now = new Date().toISOString();

    setFolders((prev) =>
      prev.map((folder) =>
        folder.id === id
          ? {
              ...folder,
              isDeleted: true,
              deletedAt: now,
            }
          : folder
      )
    );

    setDocs((prev) =>
      prev.map((doc) =>
        doc.folderId === id && !doc.isDeleted
          ? {
              ...doc,
              isDeleted: true,
              deletedAt: now,
              updatedAt: now,
              deletedByFolder: true,
              originFolderId: id,
            }
          : doc
      )
    );

    setMenuFolderId(null);
  };

  const toggleFavorite = (id) => {
    setDocs((prev) =>
      prev.map((doc) =>
        doc.id === id ? { ...doc, isFavorite: !doc.isFavorite } : doc
      )
    );
  };

  const moveDocToTrash = (id) => {
    const ok = window.confirm("이 파일을 휴지통으로 이동할까요?");
    if (!ok) return;

    const now = new Date().toISOString();

    setDocs((prev) =>
      prev.map((doc) =>
        doc.id === id
          ? {
              ...doc,
              isDeleted: true,
              deletedAt: now,
              updatedAt: now,
              deletedByFolder: false,
              originFolderId: doc.folderId ?? null,
            }
          : doc
      )
    );

    setMenuDocId(null);
  };

  const startMoveDoc = (doc) => {
    setMovingDocId(doc.id);
    setMoveTargetFolderId(doc.folderId ? String(doc.folderId) : "");
    setMenuDocId(null);
  };

  const moveDoc = () => {
    if (!movingDocId) return;

    const targetId = Number(moveTargetFolderId);
    if (!targetId) return;

    setDocs((prev) =>
      prev.map((doc) =>
        doc.id === movingDocId
          ? {
              ...doc,
              folderId: targetId,
              updatedAt: new Date().toISOString(),
            }
          : doc
      )
    );

    setMovingDocId(null);
    setMoveTargetFolderId("");
  };

  const moveDocToFolder = (docId, folderId) => {
    setDocs((prev) =>
      prev.map((doc) =>
        doc.id === docId
          ? {
              ...doc,
              folderId,
              updatedAt: new Date().toISOString(),
            }
          : doc
      )
    );
  };

  const isFavoritePage = location.pathname.includes("favorite");
  const isTrashPage = location.pathname.includes("trash");

  const visibleFolders = useMemo(() => {
    return folders
      .map((folder) => ({
        ...folder,
        isDeleted: folder.isDeleted ?? false,
      }))
      .filter((folder) => folder.parentId === null && !folder.isDeleted);
  }, [folders]);

  const filteredDocs = useMemo(() => {
    let result = docs.map((doc) => ({
      ...doc,
      isDeleted: doc.isDeleted ?? false,
      deletedAt: doc.deletedAt ?? null,
      folderId: doc.folderId ?? null,
      isFavorite: doc.isFavorite ?? false,
      deletedByFolder: doc.deletedByFolder ?? false,
      originFolderId: doc.originFolderId ?? null,
    }));

    if (isTrashPage) {
      result = result.filter((doc) => doc.isDeleted);
    } else {
      result = result.filter((doc) => !doc.isDeleted);
    }

    if (isFavoritePage) {
      result = result.filter((doc) => doc.isFavorite);
    }

    if (!isTrashPage && !isFavoritePage) {
      result = result.filter((doc) => doc.folderId === null);
    }

    const q = keyword.trim().toLowerCase();
    if (q) {
      result = result.filter((doc) =>
        (doc.title || "").toLowerCase().includes(q)
      );
    }

    return result;
  }, [docs, keyword, isFavoritePage, isTrashPage]);

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
            <div className="mypagerepository-inventory">
              {data.map((item, index) => (
                <MypageRepositoryBtn key={index} btn={item} />
              ))}
            </div>

            <div className="mypagerepository-collection">
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
                    <button
                      className="mr-add-save"
                      type="button"
                      onClick={addFolder}
                    >
                      추가
                    </button>
                    <button
                      className="mr-add-cancel"
                      type="button"
                      onClick={cancelAddFolder}
                    >
                      취소
                    </button>
                  </div>
                )}

                {isFolderOpen && (
                  <div className="mr-slide open">
                    {visibleFolders.length === 0 ? (
                      <div className="mypagerepository-empty-folder">
                        <p>폴더가 없습니다.</p>
                      </div>
                    ) : (
                      <ul className="mypagerepository-main-body">
                        {visibleFolders.map((f) => (
                          <li
                            key={f.id}
                            className={`mypagerepository-main-body-inner ${
                              dragOverFolderId === f.id ? "drag-over-folder" : ""
                            }`}
                            onDragOver={(e) => {
                              e.preventDefault();
                              setDragOverFolderId(f.id);
                            }}
                            onDragLeave={() => {
                              setDragOverFolderId((prev) =>
                                prev === f.id ? null : prev
                              );
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              const docId = Number(e.dataTransfer.getData("docId"));
                              if (!docId) return;
                              moveDocToFolder(docId, f.id);
                              setDraggingDocId(null);
                              setDragOverFolderId(null);
                            }}
                          >
                            <Link
                              to={`/repository/folder/${f.id}`}
                              className="mr-folder-card-link"
                            >
                              <div className="mypagerepository-bg">
                                <img src="/images/icon/folder.png" alt="" />
                                <p>{f.name}</p>
                              </div>
                            </Link>

                            <button
                              type="button"
                              className="mypagerepository-folder-more"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setMenuFolderId(menuFolderId === f.id ? null : f.id);
                              }}
                              aria-label={`${f.name} 더보기`}
                            >
                              <span>•</span>
                              <span>•</span>
                              <span>•</span>
                            </button>

                            {menuFolderId === f.id && (
                              <div
                                className="folder-menu"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    renameFolder(f.id);
                                  }}
                                >
                                  이름 변경
                                </button>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    moveFolderToTrash(f.id);
                                  }}
                                >
                                  삭제
                                </button>
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>

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

                  {movingDocId !== null && (
                    <div className="mr-move-box">
                      <p>이동할 폴더 선택</p>

                      <select
                        value={moveTargetFolderId}
                        onChange={(e) => setMoveTargetFolderId(e.target.value)}
                      >
                        <option value="">폴더 선택</option>
                        {visibleFolders.map((folder) => (
                          <option key={folder.id} value={folder.id}>
                            {folder.name}
                          </option>
                        ))}
                      </select>

                      <button type="button" onClick={moveDoc}>
                        이동
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setMovingDocId(null);
                          setMoveTargetFolderId("");
                        }}
                      >
                        취소
                      </button>
                    </div>
                  )}

                  {isFileOpen && (
                    <div className="mr-slide open">
                      <div className="mypagerepository-file-list">
                        <div className="mypagerepository-file-name">
                          <p>이름</p>
                          <p className="mr-col-date">날짜</p>
                          <span className="mr-col-actions" />
                        </div>

                        {filteredDocs.length === 0 ? (
                          <div className="mypagerepository-file-empty">
                            <p>
                              {isFavoritePage
                                ? "즐겨찾기한 파일이 없습니다."
                                : "파일이 없습니다."}
                            </p>
                          </div>
                        ) : (
                          filteredDocs.map((doc) => (
                            <div
                              key={doc.id}
                              className={`mypagerepository-file-suggestion ${
                                draggingDocId === doc.id ? "dragging-doc" : ""
                              }`}
                              draggable
                              onDragStart={(e) => {
                                setDraggingDocId(doc.id);
                                e.dataTransfer.setData("docId", String(doc.id));
                                e.dataTransfer.effectAllowed = "move";
                              }}
                              onDragEnd={() => {
                                setDraggingDocId(null);
                                setDragOverFolderId(null);
                              }}
                            >
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
                                  <button
                                    className="mypagerepository-pan"
                                    type="button"
                                  >
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

                                <div
                                  className="mypagerepository-file-more-wrap"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    className="mypagerepository-ooo-button"
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setMenuDocId(menuDocId === doc.id ? null : doc.id);
                                    }}
                                    aria-label="파일 메뉴"
                                  >
                                    <div className="mypagerepository-ooo">
                                      <span>•</span>
                                      <span>•</span>
                                      <span>•</span>
                                    </div>
                                  </button>

                                  {menuDocId === doc.id && (
                                    <div
                                      className="folder-menu file-menu-like-folder"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          startMoveDoc(doc);
                                        }}
                                      >
                                        이동
                                      </button>

                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          moveDocToTrash(doc.id);
                                        }}
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
                  )}
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