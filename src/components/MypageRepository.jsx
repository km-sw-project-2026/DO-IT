import "../css/MypageRepository.css";
import { data } from "../js/MypageRepository.js";
import { Link, useLocation, useNavigate } from "react-router-dom";
import React, { useEffect, useMemo, useState, useRef } from "react";
import { getCurrentUser } from "../utils/auth";
import { getMainFolderIds, setMainFolderIds, toggleMainFolderIds } from "../utils/repositoryMainFolders";
import { setRecentOpenedDoc } from "../utils/repositoryRecentOpened";
import { getRecentCreatedDoc } from "../utils/repositoryRecentCreated";
import { formatRepositoryDate } from "../utils/repositoryDate";
import { sortRepositoryItems } from "../utils/repositorySort";
import { apiGetFolders, apiGetFiles, apiGetNotes, apiCreateFolder, apiGetTrash, apiRenameFolder, apiDeleteFolder, apiDeleteFile, apiDeleteNote, apiMoveFile, apiMoveNote, apiSetFileFavorite, apiSetNoteFavorite } from "../api/repository";
const LS_FOLDERS = "doit_repository_folders_v1";
const LS_DOCS = "doit_repository_docs_v1";

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
  const navigate = useNavigate();
  const me = getCurrentUser();
  const userId = me?.user_id;

  useEffect(() => {
    if (!userId) {
      navigate("/login");
    }
  }, [userId, navigate]);

  const [isFolderOpen, setIsFolderOpen] = useState(true);
  const [isFileOpen, setIsFileOpen] = useState(true);

  const [menuFolderId, setMenuFolderId] = useState(null);
  const [menuDocId, setMenuDocId] = useState(null);

  const [movingDocId, setMovingDocId] = useState(null);
  const [moveTargetFolderId, setMoveTargetFolderId] = useState("");

  const [draggingDocId, setDraggingDocId] = useState(null);
  const [dragOverFolderId, setDragOverFolderId] = useState(null);
  const [selectedDocIds, setSelectedDocIds] = useState([]);
  const [mainFolderIds, setMainFolderIdsState] = useState(() => getMainFolderIds());
  const [recentCreatedDoc, setRecentCreatedDocState] = useState(() => getRecentCreatedDoc());

  const [folders, setFolders] = useState([]);
  const [docs, setDocs] = useState([]);

  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [keyword, setKeyword] = useState("");
  const [sortKey, setSortKey] = useState("latest");
  useEffect(() => {
    if (!userId) return;

    async function loadData() {
      try {
        const [foldersRes, trashRes, rootFiles, rootNotes] = await Promise.all([
          apiGetFolders(userId, null),
          apiGetTrash(userId),
          apiGetFiles(userId, null),
          apiGetNotes(userId, null),
        ]);

        const folderList = (foldersRes.folders || []).map((f) => ({
          id: f.folder_id,
          name: f.folder_name,
          parentId: f.parent_id,
          createdAt: f.created_at,
          isDeleted: false,
          deletedAt: null,
        }));

        const trashFolderIds = new Set((trashRes.trash?.folders || []).map((f) => f.folder_id));

        const fileList = (rootFiles.files || []).map((f) => ({
          id: `file-${f.my_file_id}`,
          resourceId: f.my_file_id,
          folderId: f.folder_id,
          title: f.display_name || f.origin_name,
          name: f.display_name || f.origin_name,
          createdAt: f.added_at || f.uploaded_at,
          updatedAt: f.added_at || f.uploaded_at,
          isDeleted: false,
          isFavorite: Boolean(f.is_favorite),
          deletedAt: null,
          docType: "file",
          fileType: f.file_type || ".file",
          fileSize: f.file_size || "-",
          filePath: f.file_path || "",
          html: "",
        }));

        const noteList = (rootNotes || []).map((note) => ({
          id: String(note.note_id),
          resourceId: note.note_id,
          folderId: note.folder_id,
          title: note.title || "제목 없음",
          name: note.title || "제목 없음",
          createdAt: note.created_at,
          updatedAt: note.updated_at || note.created_at,
          isDeleted: false,
          isFavorite: Boolean(note.is_favorite),
          deletedAt: null,
          docType: "note",
          fileType: ".html",
          fileSize: "-",
          html: note.content || "",
        }));

        setFolders(folderList.filter((f) => !trashFolderIds.has(f.id)));
        setDocs([...noteList, ...fileList]);
      } catch (e) {
        console.warn("Failed to load repository data:", e);
      }
    }

    loadData();
  }, [userId]);

  useEffect(() => {
    localStorage.setItem(LS_FOLDERS, JSON.stringify(folders));
  }, [folders]);

  useEffect(() => {
    localStorage.setItem(LS_DOCS, JSON.stringify(docs));
  }, [docs]);

  useEffect(() => {
    setMainFolderIds(mainFolderIds);
  }, [mainFolderIds]);

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

  useEffect(() => {
    const onStorage = () => {
      setRecentCreatedDocState(getRecentCreatedDoc());
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const isAddingRef = useRef(false);

  const addFolder = async () => {
    const name = newFolderName.trim();
    if (!name || !userId || isAddingRef.current) return;
    
    isAddingRef.current = true;

    try {
      const res = await apiCreateFolder(userId, name, null);
      setFolders((prev) => [
        {
          id: res.folder_id,
          name,
          parentId: null,
          createdAt: new Date().toISOString(),
          isDeleted: false,
          deletedAt: null,
        },
        ...prev,
      ]);
    } catch (e) {
      console.warn("Failed to create folder:", e);
      alert("폴더 생성에 실패했습니다.");
    } finally {
      isAddingRef.current = false;
    }

    setNewFolderName("");
    setIsAddingFolder(false);
    setIsFolderOpen(true);
  };

  const cancelAddFolder = () => {
    setNewFolderName("");
    setIsAddingFolder(false);
  };

  const renameFolder = async (id) => {
    const folder = folders.find((item) => item.id === id);
    const newName = window.prompt("새 폴더 이름을 입력하세요.", folder?.name || "");

    if (newName === null) return;

    const trimmed = newName.trim();
    if (!trimmed) return;

    try {
      await apiRenameFolder(userId, id, trimmed);
      setFolders((prev) =>
        prev.map((folder) =>
          folder.id === id ? { ...folder, name: trimmed } : folder
        )
      );
    } catch (e) {
      console.warn("Failed to rename folder:", e);
      alert("폴더 이름 변경에 실패했습니다.");
    }

    setMenuFolderId(null);
  };

  const moveFolderToTrash = async (id) => {
    const ok = window.confirm("폴더를 휴지통으로 이동할까요?");
    if (!ok) return;

    try {
      await apiDeleteFolder(userId, id);
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
      setMainFolderIdsState((prev) => prev.filter((folderId) => folderId !== id));

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
    } catch (e) {
      console.warn("Failed to move folder to trash:", e);
      alert("폴더 이동에 실패했습니다.");
    }

    setMenuFolderId(null);
  };

  const toggleFavorite = async (id) => {
    const targetDoc = docs.find((doc) => doc.id === id);
    if (!targetDoc) return;

    const nextFavorite = !targetDoc.isFavorite;

    try {
      if (targetDoc.docType === "note") {
        await apiSetNoteFavorite(userId, targetDoc.resourceId, nextFavorite);
      } else {
        await apiSetFileFavorite(userId, targetDoc.resourceId, nextFavorite);
      }

      setDocs((prev) =>
        prev.map((doc) =>
          doc.id === id ? { ...doc, isFavorite: nextFavorite } : doc
        )
      );
    } catch (e) {
      console.warn("Failed to toggle favorite:", e);
      alert("즐겨찾기 변경에 실패했습니다.");
    }
  };

  const toggleMainFolder = (folderId) => {
    const { nextIds, changed, limited } = toggleMainFolderIds(mainFolderIds, folderId);

    if (limited) {
      alert("메인 페이지 바로가기는 폴더 3개까지 선택할 수 있습니다.");
      return;
    }

    if (!changed) return;

    setMainFolderIdsState(nextIds);
    setMenuFolderId(null);
  };

  const moveDocToTrash = async (id) => {
    const ok = window.confirm("이 파일을 휴지통으로 이동할까요?");
    if (!ok) return;

    try {
      const targetDoc = docs.find((doc) => doc.id === id);
      if (!targetDoc) return;

      if (targetDoc.docType === "note") {
        await apiDeleteNote(userId, targetDoc.resourceId);
      } else {
        await apiDeleteFile(userId, targetDoc.resourceId);
      }

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
    } catch (e) {
      console.warn("Failed to move doc to trash:", e);
      alert("파일 이동에 실패했습니다.");
    }

    setMenuDocId(null);
  };

  const startMoveDoc = (doc) => {
    setMovingDocId(doc.id);
    setMoveTargetFolderId(doc.folderId ? String(doc.folderId) : "");
    setMenuDocId(null);
  };

  const moveDoc = async () => {
    if (!movingDocId) return;

    const targetDoc = docs.find((doc) => doc.id === movingDocId);
    if (!targetDoc) return;

    const targetId = Number(moveTargetFolderId);
    if (!targetId) return;

    try {
      if (targetDoc.docType === "note") {
        await apiMoveNote(userId, targetDoc.resourceId, targetId);
      } else {
        await apiMoveFile(userId, targetDoc.resourceId, targetId);
      }
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
    } catch (e) {
      console.warn("Failed to move doc:", e);
      alert("파일 이동에 실패했습니다.");
      return;
    }

    setMovingDocId(null);
    setMoveTargetFolderId("");
  };

  const moveDocToFolder = async (docId, folderId) => {
    const targetDoc = docs.find((doc) => doc.id === docId);
    if (!targetDoc) return;

    try {
      if (targetDoc.docType === "note") {
        await apiMoveNote(userId, targetDoc.resourceId, folderId);
      } else {
        await apiMoveFile(userId, targetDoc.resourceId, folderId);
      }
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
    } catch (e) {
      console.warn("Failed to move doc to folder:", e);
      alert("파일 이동에 실패했습니다.");
    }
  };

  const downloadDoc = (doc) => {
    if (doc.docType === "file") {
      if (!doc.filePath) {
        alert("이 업로드 파일은 지금 바로 다운로드할 수 없어요.");
        return;
      }

      const link = document.createElement("a");
      setRecentOpenedDoc({
        id: doc.id,
        title: doc.title,
        docType: "file",
        filePath: doc.filePath,
      });
      link.href = doc.filePath;
      link.download = doc.title || "file";
      link.target = "_blank";
      link.rel = "noreferrer";
      link.click();
      return;
    }

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
  };

  const isFavoritePage = location.pathname.includes("favorite");
  const isTrashPage = location.pathname.includes("trash");
  const isRepositoryHome = !isTrashPage && !isFavoritePage;

  const visibleFolders = useMemo(() => {
    const q = keyword.trim().toLowerCase();

    const result = folders
      .map((folder) => ({
        ...folder,
        isDeleted: folder.isDeleted ?? false,
      }))
      .filter((folder) => folder.parentId === null && !folder.isDeleted)
      .filter((folder) =>
        !q || (folder.name || "").toLowerCase().includes(q)
      );

    return sortRepositoryItems(result, sortKey, {
      nameField: "name",
      dateField: "createdAt",
    });
  }, [folders, keyword, sortKey]);

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

    return sortRepositoryItems(result, sortKey, {
      nameField: "title",
      dateField: "updatedAt",
    });
  }, [docs, keyword, isFavoritePage, isTrashPage, sortKey]);

  const selectableDocs = useMemo(() => {
    return filteredDocs;
  }, [filteredDocs]);

  const isAllSelected =
    selectableDocs.length > 0 &&
    selectableDocs.every((doc) => selectedDocIds.includes(doc.id));

  const toggleSelectDoc = (docId) => {
    setSelectedDocIds((prev) =>
      prev.includes(docId)
        ? prev.filter((id) => id !== docId)
        : [...prev, docId]
    );
  };

  const toggleSelectAllDocs = () => {
    if (isAllSelected) {
      setSelectedDocIds([]);
      return;
    }
    setSelectedDocIds(selectableDocs.map((doc) => doc.id));
  };

  const moveSelectedDocsToTrash = async () => {
    if (selectedDocIds.length === 0) return;
    const ok = window.confirm(`${selectedDocIds.length}개의 파일을 휴지통으로 이동할까요?`);
    if (!ok) return;

    try {
      const targets = docs.filter((doc) => selectedDocIds.includes(doc.id));
      await Promise.all(
        targets.map((doc) =>
          doc.docType === "note"
            ? apiDeleteNote(userId, doc.resourceId)
            : apiDeleteFile(userId, doc.resourceId)
        )
      );
      const now = new Date().toISOString();
      setDocs((prev) =>
        prev.map((doc) =>
          selectedDocIds.includes(doc.id)
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
      setSelectedDocIds([]);
    } catch (e) {
      console.warn("Failed to move selected docs to trash:", e);
      alert("파일 이동에 실패했습니다.");
    }
  };

  const moveSelectedDocs = async () => {
    if (selectedDocIds.length === 0) return;
    const targetFolderId = window.prompt(
      "이동할 폴더 ID를 입력하세요.\n" + visibleFolders.map((folder) => `${folder.name}: ${folder.id}`).join("\n")
    );
    if (!targetFolderId) return;

    const targetId = Number(targetFolderId);
    if (!targetId) {
      alert("유효한 폴더 ID를 입력하세요.");
      return;
    }

    if (!visibleFolders.some((folder) => folder.id === targetId)) {
      alert("해당 폴더가 없습니다.");
      return;
    }

    try {
      const targets = docs.filter((doc) => selectedDocIds.includes(doc.id));
      await Promise.all(
        targets.map((doc) =>
          doc.docType === "note"
            ? apiMoveNote(userId, doc.resourceId, targetId)
            : apiMoveFile(userId, doc.resourceId, targetId)
        )
      );
      setDocs((prev) =>
        prev.map((doc) =>
          selectedDocIds.includes(doc.id)
            ? {
                ...doc,
                folderId: targetId,
                updatedAt: new Date().toISOString(),
              }
            : doc
        )
      );
      setSelectedDocIds([]);
    } catch (e) {
      console.warn("Failed to move selected docs:", e);
      alert("파일 이동에 실패했습니다.");
    }
  };

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
              <select
                className="mr-sort-select"
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value)}
                aria-label="정렬"
              >
                <option value="latest">최신순</option>
                <option value="oldest">오래된순</option>
                <option value="name_asc">이름 오름차순</option>
                <option value="name_desc">이름 내림차순</option>
              </select>
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
                              const docId = e.dataTransfer.getData("docId");
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
                                {mainFolderIds.includes(f.id) && (
                                  <span className="mypagerepository-folder-badge">메인</span>
                                )}
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
                                    toggleMainFolder(f.id);
                                  }}
                                >
                                  {mainFolderIds.includes(f.id)
                                    ? "메인 바로가기 해제"
                                    : "메인 바로가기 추가"}
                                </button>

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

                  {selectedDocIds.length > 0 && (
                    <div className="mr-batch-actions">
                      <span>{selectedDocIds.length}개 선택됨</span>
                      <button type="button" onClick={moveSelectedDocs}>
                        이동
                      </button>
                      <button type="button" onClick={moveSelectedDocsToTrash}>
                        휴지통
                      </button>
                      <button type="button" onClick={() => setSelectedDocIds([])}>
                        선택 해제
                      </button>
                    </div>
                  )}

                  {isFileOpen && (
                    <div className="mr-slide open">
                      <div className="mypagerepository-file-list">
                        <div className="mypagerepository-file-name">
                          <label className="mr-checkbox-col">
                            <input
                              type="checkbox"
                              checked={isAllSelected}
                              onChange={toggleSelectAllDocs}
                            />
                            <span className="mr-select-all-label">전체 선택</span>
                          </label>
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
                              } ${
                                selectedDocIds.includes(doc.id) ? "selected" : ""
                              }`}
                              draggable
                              onDragStart={(e) => {
                                setDraggingDocId(doc.id);
                                e.dataTransfer.setData("docId", String(doc.id));
                                e.dataTransfer.setData("text/plain", String(doc.id));
                                e.dataTransfer.effectAllowed = "move";
                              }}
                              onDragEnd={() => {
                                setDraggingDocId(null);
                                setDragOverFolderId(null);
                              }}
                            >
                              <div className="mr-file-checkbox">
                                <input
                                  type="checkbox"
                                  checked={selectedDocIds.includes(doc.id)}
                                  onChange={() => toggleSelectDoc(doc.id)}
                                  onClick={(e) => e.stopPropagation()}
                                  onMouseDown={(e) => e.stopPropagation()}
                                />
                              </div>
                              <div className="mypagerepository-file-gather">
                                {doc.docType === "note" ? (
                                  <Link
                                    to={`/doc-view/${doc.id}`}
                                    draggable={false}
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "10px",
                                      textDecoration: "none",
                                      color: "inherit",
                                    }}
                                  >
                                    <button type="button" draggable={false}>
                                      <img src="/images/icon/img.png" alt="" draggable={false} />
                                    </button>
                                    <p>{doc.title || "제목 없음"}</p>
                                    {isRepositoryHome &&
                                    recentCreatedDoc?.id &&
                                    String(recentCreatedDoc.id) === String(doc.id) ? (
                                      <span className="mypagerepository-file-badge is-new">신규</span>
                                    ) : null}
                                  </Link>
                                ) : (
                                  <button
                                    type="button"
                                    draggable={false}
                                    onClick={() => downloadDoc(doc)}
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "10px",
                                      textDecoration: "none",
                                      color: "inherit",
                                      background: "transparent",
                                      border: "none",
                                      padding: 0,
                                      cursor: "pointer",
                                    }}
                                  >
                                    <img src="/images/icon/img.png" alt="" draggable={false} />
                                    <p>{doc.title || "제목 없음"}</p>
                                    {isRepositoryHome &&
                                    recentCreatedDoc?.id &&
                                    String(recentCreatedDoc.id) === String(doc.id) ? (
                                      <span className="mypagerepository-file-badge is-new">신규</span>
                                    ) : null}
                                  </button>
                                )}
                              </div>

                              <p className="mr-date">
                                {formatRepositoryDate(doc.updatedAt || doc.createdAt)}
                              </p>

                              <div className="mypagerepository-file-actions">
                                <button
                                  className="mypagerepository-download"
                                  type="button"
                                  onClick={() => downloadDoc(doc)}
                                >
                                  <img src="/images/icon/download.png" alt="" />
                                </button>

                                {doc.docType === "note" ? (
                                  <Link to={`/doc-edit/${doc.id}`} draggable={false}>
                                    <button
                                      className="mypagerepository-pan"
                                      type="button"
                                      draggable={false}
                                    >
                                      <img src="/images/icon/pan.png" alt="" draggable={false} />
                                    </button>
                                  </Link>
                                ) : (
                                  <button
                                    className="mypagerepository-pan"
                                    type="button"
                                    disabled
                                    title="업로드 파일은 편집할 수 없어요."
                                  >
                                    <img src="/images/icon/pan.png" alt="" draggable={false} />
                                  </button>
                                )}

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
                                    draggable={false}
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
