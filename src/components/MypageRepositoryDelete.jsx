import "../css/MypageRepositoryDelete.css";
import { data } from "../js/MypageRepository.js";
import { Link, useNavigate } from "react-router-dom";
import React, { useEffect, useMemo, useState } from "react";
import { getCurrentUser } from "../utils/auth";
import { formatRepositoryDate } from "../utils/repositoryDate";
import { sortRepositoryItems } from "../utils/repositorySort";
import {
  apiGetTrash,
  apiPurgeTrashFile,
  apiPurgeTrashFolder,
  apiPurgeTrashNote,
  apiRestoreTrashFile,
  apiRestoreTrashFolder,
  apiRestoreTrashNote,
} from "../api/repository";

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

function MypageRepositoryDelete() {
  const navigate = useNavigate();
  const me = getCurrentUser();
  const userId = me?.user_id;

  useEffect(() => {
    if (!userId) {
      navigate("/login");
    }
  }, [userId, navigate]);

  const [keyword, setKeyword] = useState("");
  const [menuFolderId, setMenuFolderId] = useState(null);
  const [menuDocId, setMenuDocId] = useState(null);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [sortKey, setSortKey] = useState("latest");

  const [folders, setFolders] = useState([]);
  const [docs, setDocs] = useState([]);

  useEffect(() => {
    if (!userId) return;

    async function loadTrash() {
      try {
        const res = await apiGetTrash(userId);
        const trashFolders = (res.trash?.folders || []).map((folder) => ({
          id: folder.folder_id,
          name: folder.folder_name,
          parentId: folder.parent_id,
          createdAt: folder.created_at,
          deletedAt: folder.deleted_at,
          isDeleted: true,
        }));
        const trashFiles = (res.trash?.files || []).map((file) => ({
          id: `file-${file.my_file_id}`,
          resourceId: file.my_file_id,
          folderId: file.folder_id,
          title: file.display_name || file.origin_name,
          createdAt: file.deleted_at,
          updatedAt: file.deleted_at,
          deletedAt: file.deleted_at,
          docType: "file",
          isDeleted: true,
        }));
        const trashNotes = (res.trash?.notes || []).map((note) => ({
          id: `note-${note.note_id}`,
          resourceId: note.note_id,
          folderId: note.folder_id,
          title: note.title || "제목 없음",
          createdAt: note.updated_at || note.created_at,
          updatedAt: note.updated_at || note.created_at,
          deletedAt: note.updated_at || note.created_at,
          docType: "note",
          isDeleted: true,
        }));

        setFolders(trashFolders);
        setDocs([...trashNotes, ...trashFiles]);
      } catch (e) {
        console.warn("Failed to load trash data:", e);
      }
    }

    loadTrash();
  }, [userId]);

  useEffect(() => {
    const handleClickOutside = () => {
      setMenuFolderId(null);
      setMenuDocId(null);
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const trashFolders = useMemo(() => {
    const q = keyword.trim().toLowerCase();

    let result = folders
      .map((folder) => ({
        ...folder,
        isDeleted: folder.isDeleted ?? false,
      }))
      .filter((folder) => folder.isDeleted);

    if (q) {
      result = result.filter((folder) =>
        (folder.name || "").toLowerCase().includes(q)
      );
    }

    return sortRepositoryItems(result, sortKey, {
      nameField: "name",
      dateField: "deletedAt",
    });
  }, [folders, keyword, sortKey]);

  const trashRootDocs = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    const trashFolderIds = new Set(trashFolders.map((folder) => folder.id));

    let result = docs
      .map((doc) => ({
        ...doc,
        isDeleted: doc.isDeleted ?? false,
      }))
      .filter((doc) => doc.isDeleted && !trashFolderIds.has(doc.folderId));

    if (q) {
      result = result.filter((doc) =>
        (doc.title || "").toLowerCase().includes(q)
      );
    }

    return sortRepositoryItems(result, sortKey, {
      nameField: "title",
      dateField: "deletedAt",
    });
  }, [docs, keyword, trashFolders, sortKey]);

  const collectFolderTreeIds = (rootFolderId) => {
    const collected = new Set();
    const queue = [rootFolderId];

    while (queue.length > 0) {
      const currentId = queue.shift();
      if (!currentId || collected.has(currentId)) continue;
      collected.add(currentId);

      folders
        .filter((folder) => folder.parentId === currentId)
        .forEach((folder) => queue.push(folder.id));
    }

    return collected;
  };

  const restoreFolder = async (folderId) => {
    try {
      await apiRestoreTrashFolder(userId, folderId);
      const subtreeIds = collectFolderTreeIds(folderId);
      setFolders((prev) => prev.filter((folder) => !subtreeIds.has(folder.id)));
      setDocs((prev) => prev.filter((doc) => !subtreeIds.has(doc.folderId)));
    } catch (e) {
      console.warn("Failed to restore folder:", e);
      alert("폴더 복원에 실패했습니다.");
      return;
    }
    setSelectedItems((prev) => {
      const next = new Set(prev);
      next.delete(`folder-${folderId}`);
      return next;
    });
    setMenuFolderId(null);
  };

  const deleteFolderForever = async (folderId) => {
    const ok = window.confirm("폴더를 완전히 삭제할까요?");
    if (!ok) return;

    try {
      await apiPurgeTrashFolder(userId, folderId);
      const subtreeIds = collectFolderTreeIds(folderId);
      setFolders((prev) => prev.filter((folder) => !subtreeIds.has(folder.id)));
      setDocs((prev) => prev.filter((doc) => !subtreeIds.has(doc.folderId)));
    } catch (e) {
      console.warn("Failed to purge folder:", e);
      alert("폴더 삭제에 실패했습니다.");
      return;
    }

    setSelectedItems((prev) => {
      const next = new Set(prev);
      next.delete(`folder-${folderId}`);
      return next;
    });
    setMenuFolderId(null);
  };

  const restoreDoc = async (docId) => {
    const targetDoc = docs.find((doc) => doc.id === docId);
    if (!targetDoc) return;

    try {
      if (targetDoc.docType === "note") {
        await apiRestoreTrashNote(userId, targetDoc.resourceId);
      } else {
        await apiRestoreTrashFile(userId, targetDoc.resourceId);
      }
      setDocs((prev) => prev.filter((doc) => doc.id !== docId));
    } catch (e) {
      console.warn("Failed to restore doc:", e);
      alert("파일 복원에 실패했습니다.");
      return;
    }

    setSelectedItems((prev) => {
      const next = new Set(prev);
      next.delete(`doc-${docId}`);
      return next;
    });
    setMenuDocId(null);
  };

  const deleteDocForever = async (docId) => {
    const ok = window.confirm("파일을 완전히 삭제할까요?");
    if (!ok) return;

    const targetDoc = docs.find((doc) => doc.id === docId);
    if (!targetDoc) return;

    try {
      if (targetDoc.docType === "note") {
        await apiPurgeTrashNote(userId, targetDoc.resourceId);
      } else {
        await apiPurgeTrashFile(userId, targetDoc.resourceId);
      }
      setDocs((prev) => prev.filter((doc) => doc.id !== docId));
    } catch (e) {
      console.warn("Failed to purge doc:", e);
      alert("파일 삭제에 실패했습니다.");
      return;
    }
    setSelectedItems((prev) => {
      const next = new Set(prev);
      next.delete(`doc-${docId}`);
      return next;
    });
    setMenuDocId(null);
  };

  const trashItems = useMemo(
    () => [
      ...trashFolders.map((folder) => ({ key: `folder-${folder.id}`, type: "folder", id: folder.id })),
      ...trashRootDocs.map((doc) => ({ key: `doc-${doc.id}`, type: "doc", id: doc.id })),
    ],
    [trashFolders, trashRootDocs]
  );

  const isAllSelected = trashItems.length > 0 && trashItems.every((item) => selectedItems.has(item.key));

  const toggleSelectItem = (key) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedItems(new Set());
      return;
    }
    setSelectedItems(new Set(trashItems.map((item) => item.key)));
  };

  const emptyTrash = async () => {
    const selectedCount = selectedItems.size;
    const targetItems = selectedCount > 0 ? trashItems.filter((item) => selectedItems.has(item.key)) : trashItems;

    if (targetItems.length === 0) return;

    const ok = window.confirm(
      selectedCount > 0
        ? `${selectedCount}개 항목을 완전히 삭제할까요?`
        : `휴지통 항목 ${trashItems.length}개를 모두 완전히 삭제할까요?`
    );
    if (!ok) return;

    const folderIds = new Set(targetItems.filter((item) => item.type === "folder").map((item) => item.id));
    const docIds = new Set(targetItems.filter((item) => item.type === "doc").map((item) => item.id));
    const allFolderIds = new Set();
    folderIds.forEach((folderId) => {
      collectFolderTreeIds(folderId).forEach((id) => allFolderIds.add(id));
    });

    try {
      await Promise.all([
        ...Array.from(folderIds).map((folderId) => apiPurgeTrashFolder(userId, folderId)),
        ...Array.from(docIds).map((docId) => {
          const targetDoc = docs.find((doc) => doc.id === docId);
          if (!targetDoc) return Promise.resolve();
          return targetDoc.docType === "note"
            ? apiPurgeTrashNote(userId, targetDoc.resourceId)
            : apiPurgeTrashFile(userId, targetDoc.resourceId);
        }),
      ]);
      setFolders((prev) => prev.filter((folder) => !allFolderIds.has(folder.id)));
      setDocs((prev) => prev.filter((doc) => !docIds.has(doc.id) && !allFolderIds.has(doc.folderId)));
    } catch (e) {
      console.warn("Failed to empty trash:", e);
      alert("휴지통 비우기에 실패했습니다.");
      return;
    }
    setSelectedItems(new Set());
    setMenuFolderId(null);
    setMenuDocId(null);
  };

  return (
    <section>
      <div className="mypagerepositorydelete">
        <div className="mypagerepositorydelete-inner">
          <div className="mypagerepositorydelete-header">
            <div className="mypagerepositorydelete-title">
              <h2>휴지통</h2>
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
                className="mypagerepositorydelete-sort-select"
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

          <div className="mypagerepositorydelete-contents">
            <div className="mypagerepositorydelete-inventory">
              {data.map((item, index) => (
                <MypageRepositoryBtn key={index} btn={item} />
              ))}
            </div>

            <div className="mypagerepositorydelete-collection">
              <div className="mypagerepositorydelete-file-list">
                <div className="mypagerepositorydelete-file-topbar">
                  <div className="trash-select-all">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={toggleSelectAll}
                    />
                    <span>전체 선택</span>
                  </div>
                  {selectedItems.size > 0 && (
                    <span className="trash-selected-count">{selectedItems.size}개 선택됨</span>
                  )}
                  <button
                    type="button"
                    className="trash-empty-btn"
                    onClick={emptyTrash}
                    disabled={trashItems.length === 0}
                  >
                    {selectedItems.size > 0 ? "영구삭제" : "휴지통 비우기"}
                  </button>
                </div>

                <div className="mypagerepositorydelete-file-name">
                  <p>이름</p>
                  <p className="mr-col-date">날짜</p>
                  <p className="mr-col-type">형식</p>
                  <span className="mr-col-actions" />
                </div>

                {trashFolders.map((folder) => (
                  <div
                    key={`folder-${folder.id}`}
                    className="mypagerepositorydelete-file-suggestion folder-row"
                    onClick={() => navigate(`/repository/trash/folder/${folder.id}`)}
                  >
                    <div className="mypagerepositorydelete-file-gather">
                      <input
                        type="checkbox"
                        checked={selectedItems.has(`folder-${folder.id}`)}
                        onChange={() => toggleSelectItem(`folder-${folder.id}`)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <button type="button" onClick={(e) => e.preventDefault()}>
                        <img src="/images/icon/folder.png" alt="폴더" />
                      </button>
                      <p>{folder.name}</p>
                    </div>

                    <p className="mr-date">
                      {formatRepositoryDate(folder.deletedAt || folder.createdAt)}
                    </p>
                    <p className="mr-type">폴더</p>

                    <div
                      className="mypagerepositorydelete-file-img-gather"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        className="mypagerepositorydelete-restore"
                        type="button"
                        onClick={() => restoreFolder(folder.id)}
                        title="복원"
                      >
                        <img src="/images/icon/reroll.png" alt="복원" />
                      </button>

                      <div className="mypagerepository-file-more-wrap">
                        <button
                          className="mypagerepositorydelete-ooo-button"
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setMenuFolderId(menuFolderId === folder.id ? null : folder.id);
                          }}
                        >
                          <div className="mypagerepositorydelete-ooo">
                            <span>•</span>
                            <span>•</span>
                            <span>•</span>
                          </div>
                        </button>

                        {menuFolderId === folder.id && (
                          <div className="folder-menu file-menu-like-folder">
                            <button type="button" onClick={() => restoreFolder(folder.id)}>
                              복원
                            </button>
                            <button type="button" onClick={() => deleteFolderForever(folder.id)}>
                              완전 삭제
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {trashRootDocs.map((doc) => (
                  <div
                    key={`doc-${doc.id}`}
                    className="mypagerepositorydelete-file-suggestion"
                  >
                    <div className="mypagerepositorydelete-file-gather">
                      <input
                        type="checkbox"
                        checked={selectedItems.has(`doc-${doc.id}`)}
                        onChange={() => toggleSelectItem(`doc-${doc.id}`)}
                      />
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
                      {formatRepositoryDate(doc.updatedAt || doc.createdAt)}
                    </p>
                    <p className="mr-type">{doc.docType === "note" ? "문서" : "파일"}</p>

                    <div
                      className="mypagerepositorydelete-file-img-gather"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        className="mypagerepositorydelete-restore"
                        type="button"
                        onClick={() => restoreDoc(doc.id)}
                      >
                        <img src="/images/icon/reroll.png" alt="복원" />
                      </button>

                      <div className="mypagerepository-file-more-wrap">
                        <button
                          className="mypagerepositorydelete-ooo-button"
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setMenuDocId(menuDocId === doc.id ? null : doc.id);
                          }}
                        >
                          <div className="mypagerepositorydelete-ooo">
                            <span>•</span>
                            <span>•</span>
                            <span>•</span>
                          </div>
                        </button>

                        {menuDocId === doc.id && (
                          <div className="folder-menu file-menu-like-folder">
                            <button type="button" onClick={() => restoreDoc(doc.id)}>
                              복원
                            </button>
                            <button type="button" onClick={() => deleteDocForever(doc.id)}>
                              완전 삭제
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {trashFolders.length === 0 && trashRootDocs.length === 0 && (
                  <div className="mypagerepositorydelete-file-empty">
                    <p>휴지통이 비어 있습니다.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default MypageRepositoryDelete;
