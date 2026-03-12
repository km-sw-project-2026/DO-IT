import "../css/MypageRepositoryDelete.css";
import { data } from "../js/MypageRepository.js";
import { Link, useNavigate } from "react-router-dom";
import React, { useEffect, useMemo, useState } from "react";
import { getCurrentUser } from "../utils/auth";
import { apiGetTrash, apiDeleteFolder, apiDeleteFile } from "../api/repository";

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

  const [folders, setFolders] = useState(() =>
    safeParse(localStorage.getItem(LS_FOLDERS), [])
  );
  const [docs, setDocs] = useState(() =>
    safeParse(localStorage.getItem(LS_DOCS), [])
  );

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

    return result;
  }, [folders, keyword]);

  const trashRootDocs = useMemo(() => {
    const q = keyword.trim().toLowerCase();

    let result = docs
      .map((doc) => ({
        ...doc,
        isDeleted: doc.isDeleted ?? false,
        deletedByFolder: doc.deletedByFolder ?? false,
      }))
      .filter((doc) => doc.isDeleted && !doc.deletedByFolder);

    if (q) {
      result = result.filter((doc) =>
        (doc.title || "").toLowerCase().includes(q)
      );
    }

    return result;
  }, [docs, keyword]);

  const restoreFolder = (folderId) => {
    const now = new Date().toISOString();

    setFolders((prev) =>
      prev.map((folder) =>
        folder.id === folderId
          ? { ...folder, isDeleted: false, deletedAt: null }
          : folder
      )
    );

    setDocs((prev) =>
      prev.map((doc) =>
        doc.deletedByFolder && doc.originFolderId === folderId
          ? {
              ...doc,
              isDeleted: false,
              deletedAt: null,
              updatedAt: now,
              folderId: folderId,
              deletedByFolder: false,
            }
          : doc
      )
    );

    setMenuFolderId(null);
  };

  const deleteFolderForever = (folderId) => {
    const ok = window.confirm("폴더를 완전히 삭제할까요?");
    if (!ok) return;

    setFolders((prev) => prev.filter((folder) => folder.id !== folderId));

    setDocs((prev) =>
      prev.filter(
        (doc) =>
          !(
            doc.isDeleted &&
            doc.deletedByFolder &&
            doc.originFolderId === folderId
          )
      )
    );

    setMenuFolderId(null);
  };

  const restoreDoc = (docId) => {
    const now = new Date().toISOString();

    setDocs((prev) =>
      prev.map((doc) =>
        doc.id === docId
          ? {
              ...doc,
              isDeleted: false,
              deletedAt: null,
              updatedAt: now,
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
                      <button type="button" onClick={(e) => e.preventDefault()}>
                        <img src="/images/icon/folder.png" alt="폴더" />
                      </button>
                      <p>{folder.name}</p>
                    </div>

                    <p className="mr-date">
                      {formatDate(folder.deletedAt || folder.createdAt)}
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
                    <p className="mr-type">파일</p>

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
