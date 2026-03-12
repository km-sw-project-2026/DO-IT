import "../css/Bookmark.css";
import { data } from "../js/mypageRepositoryData.js";
import { Link, useNavigate } from "react-router-dom";
import React, { useEffect, useMemo, useState } from "react";
import { getCurrentUser } from "../utils/auth";
import { setRecentOpenedDoc } from "../utils/repositoryRecentOpened";
import { formatRepositoryDate } from "../utils/repositoryDate";
import { sortRepositoryItems } from "../utils/repositorySort";
import { apiDeleteFile, apiDeleteNote, apiGetFiles, apiGetNotes, apiSetFileFavorite, apiSetNoteFavorite } from "../api/repository";

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

function Bookmark() {
  const navigate = useNavigate();
  const me = getCurrentUser();
  const userId = me?.user_id;
  const [keyword, setKeyword] = useState("");
  const [menuDocId, setMenuDocId] = useState(null);
  const [docs, setDocs] = useState([]);
  const [sortKey, setSortKey] = useState("latest");

  useEffect(() => {
    if (!userId) {
      navigate("/login");
      return;
    }

    async function loadData() {
      try {
        const [filesRes, notesRes] = await Promise.all([
          apiGetFiles(userId, null),
          apiGetNotes(userId, null),
        ]);

        const fileDocs = (filesRes.files || []).map((file) => ({
          id: `file-${file.my_file_id}`,
          resourceId: file.my_file_id,
          docType: "file",
          title: file.display_name || file.origin_name,
          html: "",
          createdAt: file.added_at || file.uploaded_at,
          updatedAt: file.added_at || file.uploaded_at,
          isDeleted: false,
          isFavorite: Boolean(file.is_favorite),
          filePath: file.file_path || "",
        }));

        const noteDocs = (notesRes || []).map((note) => ({
          id: String(note.note_id),
          resourceId: note.note_id,
          docType: "note",
          title: note.title || "제목 없음",
          html: note.content || "",
          createdAt: note.created_at,
          updatedAt: note.updated_at || note.created_at,
          isDeleted: false,
          isFavorite: Boolean(note.is_favorite),
        }));

        setDocs([...noteDocs, ...fileDocs]);
      } catch (e) {
        console.warn("Failed to load favorites:", e);
      }
    }

    loadData();
  }, [navigate, userId]);

  useEffect(() => {
    const handleClickOutside = () => {
      setMenuDocId(null);
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const favoriteDocs = useMemo(() => {
    let result = docs
      .map((doc) => ({
        ...doc,
        isDeleted: doc.isDeleted ?? false,
        isFavorite: doc.isFavorite ?? false,
      }))
      .filter((doc) => !doc.isDeleted && doc.isFavorite);

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
  }, [docs, keyword, sortKey]);

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
      console.warn("Failed to toggle bookmark favorite:", e);
      alert("즐겨찾기 변경에 실패했습니다.");
    }
  };

  const moveDocToTrash = async (id) => {
    const ok = window.confirm("이 파일을 휴지통으로 이동할까요?");
    if (!ok) return;

    const targetDoc = docs.find((doc) => doc.id === id);
    if (!targetDoc) return;

    try {
      if (targetDoc.docType === "note") {
        await apiDeleteNote(userId, targetDoc.resourceId);
      } else {
        await apiDeleteFile(userId, targetDoc.resourceId);
      }

      setDocs((prev) => prev.filter((doc) => doc.id !== id));
      setMenuDocId(null);
    } catch (e) {
      console.warn("Failed to move bookmark doc to trash:", e);
      alert("휴지통 이동에 실패했습니다.");
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
      <div className="Bookmark">
        <div className="Bookmark-inner">
          <div className="Bookmark-header">
            <div className="Bookmark-title">
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
                className="Bookmark-sort-select"
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

          <div className="Bookmark-contents">
            <div className="Bookmark-inventory">
              {data.map((item, index) => (
                <MypageRepositoryBtn key={index} btn={item} />
              ))}
            </div>

            <div className="Bookmark-collection">
              <div className="Bookmark-main">
                <div className="Bookmark-file-bottom">
                  <div className="Bookmark-bottom">
                    <img src="/images/icon/aroow.png" alt="" />
                    <p>즐겨찾기</p>
                  </div>

                  <div className="Bookmark-file-list">
                    <div className="Bookmark-file-name">
                      <p>이름</p>
                      <p className="Bookmark-col-date">날짜</p>
                      <span className="Bookmark-col-actions" />
                    </div>

                    {favoriteDocs.length === 0 ? (
                      <div className="Bookmark-file-empty">
                        <p>즐겨찾기한 파일이 없습니다.</p>
                      </div>
                    ) : (
                      favoriteDocs.map((doc) => (
                        <div key={doc.id} className="Bookmark-file-suggestion">
                          <div className="Bookmark-file-gather">
                            {doc.docType === "note" ? (
                              <Link
                                to={`/doc-view/${doc.id}`}
                                className="Bookmark-file-link"
                              >
                                <button type="button">
                                  <img src="/images/icon/img.png" alt="" />
                                </button>
                                <p>{doc.title || "제목 없음"}</p>
                              </Link>
                            ) : (
                              <button
                                type="button"
                                className="Bookmark-file-link"
                                onClick={() => downloadDoc(doc)}
                              >
                                <img src="/images/icon/img.png" alt="" />
                                <p>{doc.title || "제목 없음"}</p>
                              </button>
                            )}
                          </div>

                          <p className="Bookmark-date">
                            {formatRepositoryDate(doc.updatedAt || doc.createdAt)}
                          </p>

                          <div className="Bookmark-file-actions">
                            <button
                              className="Bookmark-download"
                              type="button"
                              onClick={() => downloadDoc(doc)}
                            >
                              <img src="/images/icon/download.png" alt="" />
                            </button>

                            {doc.docType === "note" ? (
                              <Link to={`/doc-edit/${doc.id}`}>
                                <button className="Bookmark-pan" type="button">
                                  <img src="/images/icon/pan.png" alt="" />
                                </button>
                              </Link>
                            ) : (
                              <button
                                className="Bookmark-pan"
                                type="button"
                                disabled
                                title="업로드 파일은 편집할 수 없어요."
                              >
                                <img src="/images/icon/pan.png" alt="" />
                              </button>
                            )}

                            <button
                              className="Bookmark-star"
                              type="button"
                              onClick={() => toggleFavorite(doc.id)}
                            >
                              <img src="/images/icon/star2.png" alt="" />
                            </button>

                            <div
                              className="Bookmark-file-more-wrap"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                className="Bookmark-ooo-button"
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setMenuDocId(menuDocId === doc.id ? null : doc.id);
                                }}
                              >
                                <div className="Bookmark-ooo">
                                  <span>•</span>
                                  <span>•</span>
                                  <span>•</span>
                                </div>
                              </button>

                              {menuDocId === doc.id && (
                                <div className="Bookmark-menu">
                                  <button
                                    type="button"
                                    onClick={() => toggleFavorite(doc.id)}
                                  >
                                    즐겨찾기 해제
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => moveDocToTrash(doc.id)}
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Bookmark;
