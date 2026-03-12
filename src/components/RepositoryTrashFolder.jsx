import "../css/MypageRepositoryDelete.css";
import { Link, useParams, useNavigate } from "react-router-dom";
import React, { useEffect, useMemo, useState } from "react";
import { data } from "../js/MypageRepository.js";
import { getCurrentUser } from "../utils/auth";
import { apiGetFolders, apiGetFiles, apiDeleteFile } from "../api/repository";

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

function RepositoryTrashFolder() {
  const { folderId } = useParams();
  const folderIdNum = Number(folderId);
  const navigate = useNavigate();
  const me = getCurrentUser();
  const userId = me?.user_id;

  const [menuDocId, setMenuDocId] = useState(null);
  const [selectedDocs, setSelectedDocs] = useState(new Set());

  const [, setFolders] = useState([]);
  const [docs, setDocs] = useState([]);
  const [_loading, setLoading] = useState(true);

  const [targetFolder, setTargetFolder] = useState(null);

  useEffect(() => {
    if (!userId) {
      navigate("/login");
      return;
    }

    async function loadData() {
      setLoading(true);
      try {
        const [foldersRes, filesRes] = await Promise.all([
          apiGetFolders(userId, null),
          apiGetFiles(userId, folderIdNum),
        ]);

        const folderList = (foldersRes.folders || []).map((f) => ({
          id: f.folder_id,
          name: f.folder_name,
          parentId: f.parent_id,
          createdAt: f.created_at,
          isDeleted: false,
        }));

        const currentFolder = folderList.find((f) => f.id === folderIdNum);
        setTargetFolder(currentFolder || { id: folderIdNum, name: "알 수 없는 폴더" });

        const fileList = (filesRes.files || []).map((f) => ({
          id: f.my_file_id,
          folderId: f.folder_id,
          name: f.display_name || f.origin_name,
          title: f.display_name || f.origin_name,
          createdAt: f.added_at,
          isDeleted: true,
          deletedByFolder: true,
          originFolderId: folderIdNum,
        }));

        setFolders(folderList);
        setDocs(fileList);
      } catch (e) {
        console.warn("Failed to load folder data:", e);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [userId, folderIdNum, navigate]);

  const trashedFolderDocs = useMemo(() => {
    return docs.filter(
      (doc) =>
        doc.isDeleted &&
        doc.deletedByFolder &&
        doc.originFolderId === folderIdNum
    );
  }, [docs, folderIdNum]);

  const restoreDocFromTrashFolder = (docId) => {
    const now = new Date().toISOString();

    setDocs((prev) =>
      prev.map((doc) =>
        doc.id === docId
          ? {
              ...doc,
              isDeleted: false,
              deletedAt: null,
              updatedAt: now,
              folderId: null,
              deletedByFolder: false,
            }
          : doc
      )
    );

    setMenuDocId(null);
  };

  const deleteDocForever = (docId) => {
    const ok = window.confirm("파일을 완전히 삭제할까요?");
    if (!ok) return;

    setDocs((prev) => prev.filter((doc) => doc.id !== docId));
    setMenuDocId(null);
  };

  const toggleDocSelect = (docId) => {
    setSelectedDocs((prev) => {
      const next = new Set(prev);
      if (next.has(docId)) {
        next.delete(docId);
      } else {
        next.add(docId);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedDocs.size === trashedFolderDocs.length) {
      setSelectedDocs(new Set());
    } else {
      setSelectedDocs(new Set(trashedFolderDocs.map((d) => d.id)));
    }
  };

  const deleteSelectedForever = async () => {
    const docCount = selectedDocs.size;

    if (docCount === 0) {
      const ok = window.confirm(`폴더 안의 모든 파일(${trashedFolderDocs.length}개)을 영구 삭제하시겠습니까?`);
      if (!ok) return;

      try {
        for (const doc of trashedFolderDocs) {
          await apiDeleteFile(userId, doc.id);
        }
        setDocs((prev) => prev.filter((doc) => doc.folderId !== Number(folderId)));
      } catch (e) {
        console.warn("Failed to delete all files:", e);
        alert("파일 삭제에 실패했습니다.");
      }
    } else {
      const ok = window.confirm(`${docCount}개 파일을 영구 삭제하시겠습니까?`);
      if (!ok) return;

      try {
        for (const docId of selectedDocs) {
          await apiDeleteFile(userId, docId);
        }
        setDocs((prev) => prev.filter((doc) => !selectedDocs.has(doc.id)));
      } catch (e) {
        console.warn("Failed to delete selected files:", e);
        alert("파일 삭제에 실패했습니다.");
      }
    }

    setSelectedDocs(new Set());
    setMenuDocId(null);
  };

  const isAllSelected = trashedFolderDocs.length > 0
    ? selectedDocs.size === trashedFolderDocs.length
    : false;
  const selectedCount = selectedDocs.size;

  return (
    <section>
      <div className="mypagerepositorydelete">
        <div className="mypagerepositorydelete-inner">
          <div className="mypagerepositorydelete-header">
            <div className="mypagerepositorydelete-title">
              <h2>{targetFolder?.name || "휴지통 폴더"}</h2>
              <img src="/images/mypagerepository.png" alt="" />
            </div>
          </div>

          <div className="mypagerepositorydelete-contents">
            {/* 왼쪽 메뉴 */}
            <div className="mypagerepositorydelete-inventory">
              {data.map((item, index) => (
                <MypageRepositoryBtn key={index} btn={item} />
              ))}
            </div>

            {/* 오른쪽 내용 */}
            <div
              className="mypagerepositorydelete-collection"
              style={{ width: "100%" }}
            >
              <div className="mypagerepositorydelete-file-list">
                <div className="mypagerepositorydelete-file-topbar">
                  <Link to="/repository/trash" className="trash-back-link">
                    ← 휴지통으로 돌아가기
                  </Link>
                </div>

                <div className="mypagerepositorydelete-file-name">
                  <div className="trash-select-all">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={toggleSelectAll}
                    />
                    <span>전체 선택</span>
                  </div>
                  {selectedCount > 0 && (
                    <span className="trash-selected-count">
                      {selectedCount}개 선택됨
                    </span>
                  )}
                  <button
                    type="button"
                    className="trash-empty-btn"
                    onClick={deleteSelectedForever}
                    disabled={trashedFolderDocs.length === 0}
                  >
                    {selectedCount > 0 ? "영구삭제" : "휴지통 비우기"}
                  </button>
                </div>

                {trashedFolderDocs.length === 0 ? (
                  <div className="mypagerepositorydelete-file-empty">
                    <p>폴더 안 파일이 없습니다.</p>
                  </div>
                ) : (
                  trashedFolderDocs.map((doc) => (
                    <div
                      key={doc.id}
                      className="mypagerepositorydelete-file-suggestion"
                    >
                      <div className="mypagerepositorydelete-file-gather" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedDocs.has(doc.id)}
                          onChange={() => toggleDocSelect(doc.id)}
                        />
                        <button type="button">
                          <img src="/images/icon/img.png" alt="" />
                        </button>
                        <p>{doc.title || "제목 없음"}</p>
                      </div>

                      <p className="mr-date">
                        {formatDate(doc.updatedAt || doc.createdAt)}
                      </p>
                      <p className="mr-type">파일</p>

                      <div
                        className="mypagerepositorydelete-file-img-gather"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          className="mypagerepositorydelete-restore"
                          type="button"
                          onClick={() => restoreDocFromTrashFolder(doc.id)}
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
                              <button
                                type="button"
                                onClick={() => restoreDocFromTrashFolder(doc.id)}
                              >
                                파일만 복원
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteDocForever(doc.id)}
                              >
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

export default RepositoryTrashFolder;
