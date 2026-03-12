import "../css/MRFI.css";
import { data } from "../js/mypageRepositoryData.js";
import { Link, useNavigate, useParams } from "react-router-dom";
import React, { useEffect, useMemo, useState } from "react";
import { getCurrentUser } from "../utils/auth";
import { setRecentOpenedDoc } from "../utils/repositoryRecentOpened";
import { formatRepositoryDate } from "../utils/repositoryDate";
import { sortRepositoryItems } from "../utils/repositorySort";
import {
  apiDeleteFile,
  apiDeleteNote,
  apiGetFiles,
  apiGetFolders,
  apiGetNotes,
  apiMoveFile,
  apiMoveNote,
  apiSetFileFavorite,
  apiSetNoteFavorite,
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

function MRFI() {
  const navigate = useNavigate();
  const { folderId } = useParams();
  const folderIdNumber = Number(folderId);
  const me = getCurrentUser();
  const userId = me?.user_id;

  const [keyword, setKeyword] = useState("");
  const [folders, setFolders] = useState([]);
  const [docs, setDocs] = useState([]);
  const [folderOptions, setFolderOptions] = useState([]);
  const [menuDocId, setMenuDocId] = useState(null);
  const [movingDocId, setMovingDocId] = useState(null);
  const [moveTargetFolderId, setMoveTargetFolderId] = useState("");
  const [currentFolder, setCurrentFolder] = useState(null);
  const [sortKey, setSortKey] = useState("latest");

  useEffect(() => {
    if (!userId) {
      navigate("/login");
      return;
    }

    async function loadData() {
      try {
        const [rootFoldersRes, childFoldersRes, folderFilesRes, folderNotes] = await Promise.all([
          apiGetFolders(userId, null),
          apiGetFolders(userId, folderIdNumber),
          apiGetFiles(userId, folderIdNumber),
          apiGetNotes(userId, folderIdNumber),
        ]);

        const rootFolders = rootFoldersRes.folders || [];
        const childFolders = (childFoldersRes.folders || []).map((folder) => ({
          id: folder.folder_id,
          name: folder.folder_name,
          createdAt: folder.created_at,
        }));

        const folderMeta = rootFolders.find((folder) => folder.folder_id === folderIdNumber)
          || childFoldersRes.folders?.find((folder) => folder.folder_id === folderIdNumber);

        const fileDocs = (folderFilesRes.files || []).map((file) => ({
          id: `file-${file.my_file_id}`,
          resourceId: file.my_file_id,
          docType: "file",
          title: file.display_name || file.origin_name,
          html: "",
          createdAt: file.added_at || file.uploaded_at,
          updatedAt: file.added_at || file.uploaded_at,
          isFavorite: Boolean(file.is_favorite),
          filePath: file.file_path || "",
        }));

        const noteDocs = (folderNotes || []).map((note) => ({
          id: String(note.note_id),
          resourceId: note.note_id,
          docType: "note",
          title: note.title || "제목 없음",
          html: note.content || "",
          createdAt: note.created_at,
          updatedAt: note.updated_at || note.created_at,
          isFavorite: Boolean(note.is_favorite),
        }));

        setCurrentFolder(
          folderMeta
            ? {
                id: folderMeta.folder_id,
                name: folderMeta.folder_name,
              }
            : {
                id: folderIdNumber,
                name: "폴더",
              }
        );
        setFolders(childFolders);
        setFolderOptions(
          rootFolders
            .map((folder) => ({
              id: folder.folder_id,
              name: folder.folder_name,
            }))
            .filter((folder) => folder.id !== folderIdNumber)
        );
        setDocs([...noteDocs, ...fileDocs]);
      } catch (e) {
        console.warn("Failed to load folder repository data:", e);
      }
    }

    loadData();
  }, [folderIdNumber, navigate, userId]);

  useEffect(() => {
    const handleClickOutside = () => {
      setMenuDocId(null);
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const filteredFolders = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    const result = folders.filter((folder) =>
      !q || (folder.name || "").toLowerCase().includes(q)
    );

    return sortRepositoryItems(result, sortKey, {
      nameField: "name",
      dateField: "createdAt",
    });
  }, [folders, keyword, sortKey]);

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

  const moveDocToTrash = async (doc) => {
    const ok = window.confirm("이 파일을 휴지통으로 이동할까요?");
    if (!ok) return;

    try {
      if (doc.docType === "note") {
        await apiDeleteNote(userId, doc.resourceId);
      } else {
        await apiDeleteFile(userId, doc.resourceId);
      }
      setDocs((prev) => prev.filter((item) => item.id !== doc.id));
      setMenuDocId(null);
    } catch (e) {
      console.warn("Failed to move folder doc to trash:", e);
      alert("파일 이동에 실패했습니다.");
    }
  };

  const startMoveDoc = (doc) => {
    setMovingDocId(doc.id);
    setMoveTargetFolderId("");
    setMenuDocId(null);
  };

  const moveDoc = async () => {
    if (!movingDocId) return;

    const targetDoc = docs.find((doc) => doc.id === movingDocId);
    const targetFolderId =
      moveTargetFolderId === "" ? null : Number(moveTargetFolderId);
    if (!targetDoc) return;
    if (moveTargetFolderId !== "" && !targetFolderId) return;

    try {
      if (targetDoc.docType === "note") {
        await apiMoveNote(userId, targetDoc.resourceId, targetFolderId);
      } else {
        await apiMoveFile(userId, targetDoc.resourceId, targetFolderId);
      }

      setDocs((prev) => prev.filter((doc) => doc.id !== movingDocId));
      setMovingDocId(null);
      setMoveTargetFolderId("");
    } catch (e) {
      console.warn("Failed to move folder doc:", e);
      alert("파일 이동에 실패했습니다.");
    }
  };

  const toggleFavorite = async (docId) => {
    const targetDoc = docs.find((doc) => doc.id === docId);
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
          doc.id === docId ? { ...doc, isFavorite: nextFavorite } : doc
        )
      );
    } catch (e) {
      console.warn("Failed to toggle folder favorite:", e);
      alert("즐겨찾기 변경에 실패했습니다.");
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
                <p>{currentFolder?.name || "폴더"}</p>
                <Link to={`/doc-editor?folderId=${folderIdNumber}`}>
                  <button className="mr-add" type="button" aria-label="파일 추가">
                    <img src="/images/icon/Plus.png" alt="" />
                  </button>
                </Link>
              </div>

              <div className="mrfi-file-list">
                {movingDocId !== null && (
                  <div className="mrfi-move-box">
                    <p>이동할 폴더 선택</p>
                    <select
                      value={moveTargetFolderId}
                      onChange={(e) => setMoveTargetFolderId(e.target.value)}
                    >
                      <option value="">내 자료함 홈</option>
                      {folderOptions.map((folder) => (
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

                <div className="mrfi-file-name">
                  <p>이름</p>
                  <p>날짜</p>
                  <span className="mrfi-actions-col" />
                </div>

                {filteredFolders.map((folder) => (
                  <Link
                    to={`/repository/folder/${folder.id}`}
                    key={`folder-${folder.id}`}
                    className="mrfi-file-suggestion mrfi-folder-link"
                  >
                    <div className="mrfi-file-gather">
                      <img src="/images/icon/folder.png" alt="" />
                      <p>{folder.name}</p>
                    </div>
                    <p className="mrfi-date">{formatRepositoryDate(folder.createdAt)}</p>
                    <span className="mrfi-file-actions-placeholder" />
                  </Link>
                ))}

                {filteredDocs.map((doc) => (
                  <div key={doc.id} className="mrfi-file-suggestion">
                    <div className="mrfi-file-gather">
                      {doc.docType === "note" ? (
                        <Link to={`/doc-view/${doc.id}`} className="mrfi-file-link">
                          <img src="/images/icon/img.png" alt="" />
                          <p>{doc.title || "제목 없음"}</p>
                        </Link>
                      ) : (
                        <button
                          type="button"
                          className="mrfi-file-link"
                          onClick={() => downloadDoc(doc)}
                        >
                          <img src="/images/icon/img.png" alt="" />
                          <p>{doc.title || "제목 없음"}</p>
                        </button>
                      )}
                    </div>

                    <p className="mrfi-date">{formatRepositoryDate(doc.updatedAt || doc.createdAt)}</p>

                    <div className="mrfi-file-actions">
                      <button
                        className="mrfi-download"
                        type="button"
                        onClick={() => downloadDoc(doc)}
                      >
                        <img src="/images/icon/download.png" alt="" />
                      </button>

                      {doc.docType === "note" ? (
                        <Link to={`/doc-edit/${doc.id}`} className="mrfi-edit-link">
                          <button className="mrfi-pan" type="button">
                            <img src="/images/icon/pan.png" alt="" />
                          </button>
                        </Link>
                      ) : (
                        <button
                          className="mrfi-pan"
                          type="button"
                          disabled
                          title="업로드 파일은 편집할 수 없어요."
                        >
                          <img src="/images/icon/pan.png" alt="" />
                        </button>
                      )}

                      <button
                        className="mrfi-star"
                        type="button"
                        onClick={() => toggleFavorite(doc.id)}
                      >
                        <img
                          src={doc.isFavorite ? "/images/icon/star2.png" : "/images/icon/star.png"}
                          alt="즐겨찾기"
                        />
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
                            <button type="button" onClick={() => startMoveDoc(doc)}>
                              이동
                            </button>
                            <button type="button" onClick={() => moveDocToTrash(doc)}>
                              삭제
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {filteredFolders.length === 0 && filteredDocs.length === 0 && (
                  <div className="mrfi-file-empty">
                    <p>이 폴더에는 아직 자료가 없어요.</p>
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
