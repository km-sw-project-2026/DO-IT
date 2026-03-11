import "../css/MypageRepositoryDelete.css";
import { Link, useParams } from "react-router-dom";
import React, { useEffect, useMemo, useState } from "react";
import { data } from "../js/MypageRepository.js";

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

function RepositoryTrashFolder() {
  const { folderId } = useParams();
  const folderIdNum = Number(folderId);

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

  const targetFolder = useMemo(() => {
    return folders.find((folder) => folder.id === folderIdNum) || null;
  }, [folders, folderIdNum]);

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
                  <p>이름</p>
                  <p className="mr-col-date">날짜</p>
                  <p className="mr-col-type">형식</p>
                  <span className="mr-col-actions" />
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
                      <div className="mypagerepositorydelete-file-gather">
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
                                완전 삭제
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
