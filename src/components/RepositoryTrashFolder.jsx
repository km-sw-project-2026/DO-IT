import "../css/MRFI.css";
import { Link, useNavigate, useParams } from "react-router-dom";
import React, { useEffect, useMemo, useState } from "react";
import { data } from "../js/MypageRepository.js";
import { getCurrentUser } from "../utils/auth";
import { formatRepositoryDate } from "../utils/repositoryDate";
import { sortRepositoryItems } from "../utils/repositorySort";
import {
  apiGetTrashFolder,
  apiPurgeTrashFile,
  apiPurgeTrashNote,
  apiRestoreTrashFile,
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

export default function RepositoryTrashFolder() {
  const { folderId } = useParams();
  const folderIdNum = Number(folderId);
  const navigate = useNavigate();
  const me = getCurrentUser();
  const userId = me?.user_id;

  const [menuDocId, setMenuDocId] = useState(null);
  const [selectedDocs, setSelectedDocs] = useState(new Set());
  const [docs, setDocs] = useState([]);
  const [targetFolder, setTargetFolder] = useState(null);
  const [keyword, setKeyword] = useState("");
  const [sortKey, setSortKey] = useState("latest");

  useEffect(() => {
    if (!userId) {
      navigate("/login");
      return;
    }

    async function loadData() {
      try {
        const trashFolder = await apiGetTrashFolder(userId, folderIdNum);
        setTargetFolder(
          trashFolder.folder
            ? {
                id: trashFolder.folder.folder_id,
                name: trashFolder.folder.folder_name,
              }
            : { id: folderIdNum, name: "알 수 없는 폴더" }
        );

        const fileList = (trashFolder.files || []).map((file) => ({
          id: `file-${file.my_file_id}`,
          resourceId: file.my_file_id,
          title: file.display_name || file.origin_name,
          docType: "file",
          createdAt: file.deleted_at || file.added_at,
          updatedAt: file.deleted_at || file.added_at,
        }));

        const noteList = (trashFolder.notes || []).map((note) => ({
          id: `note-${note.note_id}`,
          resourceId: note.note_id,
          title: note.title || "제목 없음",
          docType: "note",
          createdAt: note.updated_at || note.created_at,
          updatedAt: note.updated_at || note.created_at,
        }));

        setDocs([...noteList, ...fileList]);
      } catch (e) {
        console.warn("Failed to load trash folder:", e);
      }
    }

    loadData();
  }, [folderIdNum, navigate, userId]);

  useEffect(() => {
    const handleClickOutside = () => {
      setMenuDocId(null);
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const filteredDocs = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    const result = docs.filter((doc) =>
      !q || (doc.title || "").toLowerCase().includes(q)
    );

    return sortRepositoryItems(result, sortKey, {
      nameField: "title",
      dateField: "updatedAt",
    });
  }, [docs, keyword, sortKey]);

  const isAllSelected =
    filteredDocs.length > 0 &&
    filteredDocs.every((doc) => selectedDocs.has(doc.id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedDocs((prev) => {
        const next = new Set(prev);
        filteredDocs.forEach((doc) => next.delete(doc.id));
        return next;
      });
      return;
    }
    setSelectedDocs((prev) => {
      const next = new Set(prev);
      filteredDocs.forEach((doc) => next.add(doc.id));
      return next;
    });
  };

  const toggleDocSelect = (docId) => {
    setSelectedDocs((prev) => {
      const next = new Set(prev);
      if (next.has(docId)) next.delete(docId);
      else next.add(docId);
      return next;
    });
  };

  const restoreDoc = async (doc) => {
    try {
      if (doc.docType === "note") {
        await apiRestoreTrashNote(userId, doc.resourceId, null);
      } else {
        await apiRestoreTrashFile(userId, doc.resourceId, null);
      }
      setDocs((prev) => prev.filter((item) => item.id !== doc.id));
      setSelectedDocs((prev) => {
        const next = new Set(prev);
        next.delete(doc.id);
        return next;
      });
    } catch (e) {
      console.warn("Failed to restore trash folder doc:", e);
      alert("복원에 실패했습니다.");
    }
    setMenuDocId(null);
  };

  const purgeDoc = async (doc) => {
    const ok = window.confirm("파일을 완전히 삭제할까요?");
    if (!ok) return;

    try {
      if (doc.docType === "note") {
        await apiPurgeTrashNote(userId, doc.resourceId);
      } else {
        await apiPurgeTrashFile(userId, doc.resourceId);
      }
      setDocs((prev) => prev.filter((item) => item.id !== doc.id));
      setSelectedDocs((prev) => {
        const next = new Set(prev);
        next.delete(doc.id);
        return next;
      });
    } catch (e) {
      console.warn("Failed to purge trash folder doc:", e);
      alert("영구 삭제에 실패했습니다.");
    }
    setMenuDocId(null);
  };

  const purgeSelected = async () => {
    const targetDocs = selectedDocs.size > 0
      ? docs.filter((doc) => selectedDocs.has(doc.id))
      : docs;

    if (targetDocs.length === 0) return;

    const ok = window.confirm(
      selectedDocs.size > 0
        ? `${selectedDocs.size}개 파일을 영구 삭제하시겠습니까?`
        : `폴더 안 파일 ${docs.length}개를 영구 삭제하시겠습니까?`
    );
    if (!ok) return;

    try {
      for (const doc of targetDocs) {
        if (doc.docType === "note") {
          await apiPurgeTrashNote(userId, doc.resourceId);
        } else {
          await apiPurgeTrashFile(userId, doc.resourceId);
        }
      }
      const removedIds = new Set(targetDocs.map((doc) => doc.id));
      setDocs((prev) => prev.filter((doc) => !removedIds.has(doc.id)));
      setSelectedDocs(new Set());
    } catch (e) {
      console.warn("Failed to purge selected trash folder docs:", e);
      alert("영구 삭제에 실패했습니다.");
    }
  };

  const selectedCount = selectedDocs.size;

  return (
    <section>
      <div className="mrfi">
        <div className="mrfi-inner">
          <div className="mrfi-header">
            <div className="mrfi-title">
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
                className="mrfi-sort-select"
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

          <div className="mrfi-contents">
            <div className="mrfi-inventory">
              {data.map((item, index) => (
                <MypageRepositoryBtn key={index} btn={item} />
              ))}
            </div>

            <div className="mrfi-contents-inner">
              <div className="mrfi-main-header">
                <img src="/images/icon/aroow.png" alt="" />
                <p>{targetFolder?.name || "휴지통 폴더"}</p>
                <span className="mrfi-trash-badge">휴지통</span>
                <Link to="/repository/trash" className="mrfi-trash-back">
                  휴지통으로
                </Link>
              </div>

              <div className="mrfi-trash-toolbar">
                <label className="mrfi-trash-select">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={toggleSelectAll}
                  />
                  <span>전체 선택</span>
                </label>
                {selectedCount > 0 && (
                  <span className="mrfi-trash-selected">{selectedCount}개 선택됨</span>
                )}
                <button
                  type="button"
                  className="mrfi-trash-danger"
                  onClick={purgeSelected}
                  disabled={filteredDocs.length === 0}
                >
                  {selectedCount > 0 ? "영구삭제" : "휴지통 비우기"}
                </button>
              </div>

              <div className="mrfi-file-list">
                <div className="mrfi-file-name">
                  <p>이름</p>
                  <p>날짜</p>
                  <span className="mrfi-actions-col" />
                </div>

                {filteredDocs.length === 0 ? (
                  <div className="mrfi-file-empty">
                    <p>이 폴더의 휴지통 항목이 없습니다.</p>
                  </div>
                ) : (
                  filteredDocs.map((doc) => (
                    <div key={doc.id} className="mrfi-file-suggestion mrfi-trash-row">
                      <div className="mrfi-file-gather">
                        <input
                          className="mrfi-trash-checkbox"
                          type="checkbox"
                          checked={selectedDocs.has(doc.id)}
                          onChange={() => toggleDocSelect(doc.id)}
                        />
                        <Link to={`/doc-view/${doc.id}`} className="mrfi-file-link">
                          <img src="/images/icon/img.png" alt="" />
                          <p>{doc.title || "제목 없음"}</p>
                        </Link>
                      </div>

                      <p className="mrfi-date">{formatRepositoryDate(doc.updatedAt || doc.createdAt)}</p>

                      <div className="mrfi-file-actions">
                        <button
                          className="mrfi-restore"
                          type="button"
                          onClick={() => restoreDoc(doc)}
                        >
                          <img src="/images/icon/reroll.png" alt="복원" />
                        </button>

                        <div
                          className="mrfi-file-more-wrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            className="mrfi-ooo-button"
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setMenuDocId(menuDocId === doc.id ? null : doc.id);
                            }}
                          >
                            <div className="mrfi-ooo">
                              <span>•</span>
                              <span>•</span>
                              <span>•</span>
                            </div>
                          </button>

                          {menuDocId === doc.id && (
                            <div className="mrfi-menu">
                              <button type="button" onClick={() => restoreDoc(doc)}>
                                파일만 복원
                              </button>
                              <button type="button" onClick={() => purgeDoc(doc)}>
                                영구 삭제
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
    </section>
  );
}
