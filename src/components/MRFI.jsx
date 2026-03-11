import "../css/MRFI.css";
import { data } from "../js/mypageRepositoryData.js";
import { Link, useParams } from "react-router-dom";
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

function MRFI() {
  const { folderId } = useParams();
  const folderIdNumber = Number(folderId);

  const [keyword, setKeyword] = useState("");
  const [isAddingFile, setIsAddingFile] = useState(false);
  const [newFileTitle, setNewFileTitle] = useState("");

  const [folders, setFolders] = useState(() =>
    safeParse(localStorage.getItem(LS_FOLDERS), [])
  );

  const [docs, setDocs] = useState(() =>
    safeParse(localStorage.getItem(LS_DOCS), [])
  );

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

  const addFileToCurrentFolder = () => {
    const title = newFileTitle.trim();
    if (!title) return;

    const newDoc = {
      id: Date.now(),
      title,
      folderId: folderIdNumber,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isFavorite: false,
      html: "",
      fileType: ".html",
      fileSize: "-",
    };

    setDocs((prev) => [newDoc, ...prev]);
    setNewFileTitle("");
    setIsAddingFile(false);
  };

  const currentFolder = useMemo(() => {
    return folders.find((folder) => folder.id === folderIdNumber);
  }, [folders, folderIdNumber]);

  const folderDocs = useMemo(() => {
    let result = docs.filter((doc) => doc.folderId === folderIdNumber);

    const q = keyword.trim().toLowerCase();
    if (q) {
      result = result.filter((doc) =>
        (doc.title || "").toLowerCase().includes(q)
      );
    }

    return result;
  }, [docs, folderIdNumber, keyword]);

  const childFolders = useMemo(() => {
    return folders.filter((folder) => folder.parentId === folderIdNumber);
  }, [folders, folderIdNumber]);

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
              <div className="mrfi-main">
                <div className="mrfi-main-header">
                  <img src="/images/icon/aroow.png" alt="" />
                  <p>{currentFolder ? currentFolder.name : "폴더"}</p>
                  <button
                    className="mr-add"
                    type="button"
                    onClick={() => setIsAddingFile((prev) => !prev)}
                  >
                    <img src="/images/icon/Plus.png" alt="" />
                  </button>
                </div>
              </div>

              {isAddingFile && (
                <div className="mr-add-row">
                  <input
                    className="mr-add-input"
                    value={newFileTitle}
                    onChange={(e) => setNewFileTitle(e.target.value)}
                    placeholder="새 파일 이름"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") addFileToCurrentFolder();
                      if (e.key === "Escape") {
                        setNewFileTitle("");
                        setIsAddingFile(false);
                      }
                    }}
                    autoFocus
                  />
                  <button
                    type="button"
                    className="mr-add-save"
                    onClick={addFileToCurrentFolder}
                  >
                    추가
                  </button>
                  <button
                    type="button"
                    className="mr-add-cancel"
                    onClick={() => {
                      setNewFileTitle("");
                      setIsAddingFile(false);
                    }}
                  >
                    취소
                  </button>
                </div>
              )}

              <div className="mrfi-file-list">
                <div className="mrfi-file-name">
                  <p>이름</p>
                  <p>날짜</p>
                  <p>형식</p>
                  <p>크기</p>
                </div>

                {childFolders.map((folder) => (
                  <Link
                    to={`/repository/folder/${folder.id}`}
                    key={`folder-${folder.id}`}
                    className="mrfi-folder-link"
                  >
                    <div className="mrfi-file-suggestion">
                      <div className="mrfi-file-gather">
                        <button type="button">
                          <img src="/images/icon/folder.png" alt="" />
                        </button>
                        <p>{folder.name}</p>
                      </div>
                      <p>{formatDate(folder.createdAt)}</p>
                      <p>폴더</p>
                      <p>-</p>
                      <div className="mrfi-file-img-gather">
                        <button>
                          <div className="mrfi-ooo">
                            <span>•</span>
                            <span>•</span>
                            <span>•</span>
                          </div>
                        </button>
                      </div>
                    </div>
                  </Link>
                ))}

                {folderDocs.map((doc) => (
                  <div key={doc.id} className="mrfi-file-suggestion">
                    <div className="mrfi-file-gather">
                      <Link to={`/doc-view/${doc.id}`}>
                        <img src="/images/icon/img.png" alt="" />
                      </Link>
                      <p>{doc.title || "제목 없음"}</p>
                    </div>
                    <p>{formatDate(doc.updatedAt || doc.createdAt)}</p>
                    <p>{doc.fileType || ".html"}</p>
                    <p>{doc.fileSize || "-"}</p>
                    <div className="mrfi-file-img-gather">
                      <button>
                        <div className="mrfi-ooo">
                          <span>•</span>
                          <span>•</span>
                          <span>•</span>
                        </div>
                      </button>
                    </div>
                  </div>
                ))}

                {childFolders.length === 0 && folderDocs.length === 0 && (
                  <div className="mrfi-file-suggestion">
                    <div className="mrfi-file-gather">
                      <p>이 폴더에는 아직 자료가 없어요.</p>
                    </div>
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

export default MRFI;