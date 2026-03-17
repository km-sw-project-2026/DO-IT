import { Link, useNavigate } from "react-router-dom";
import React, { useEffect, useMemo, useState } from "react";
import { getCurrentUser } from "../utils/auth";
import {
  apiDeleteFile,
  apiDeleteNote,
  apiGetFiles,
  apiGetFolders,
  apiGetNotes,
  apiMoveFile,
  apiMoveNote,
} from "../api/repository";
import { getMainFolderIds, subscribeMainFolderIds } from "../utils/repositoryMainFolders";
import { clearRecentOpenedDoc, getRecentOpenedDoc, setRecentOpenedDoc } from "../utils/repositoryRecentOpened";
import { formatRepositoryDateShort } from "../utils/repositoryDate";
import RecentCommunity from "../components/recentcommunity";
import MainCalenderPreview from "../components/MainCalenderPreview";

function Main() {
  const navigate = useNavigate();
  const me = getCurrentUser();
  const userId = me?.user_id;
  const [showMentorModal, setShowMentorModal] = useState(false);

  const openMentorModal = () => setShowMentorModal(true);
  const closeMentorModal = () => setShowMentorModal(false);
  const goMentorApply = () => {
    setShowMentorModal(false);
    navigate("/mentologin");
  };

  const [recentOpenedDoc, setRecentOpenedDocState] = useState(() => getRecentOpenedDoc());
  const [folders, setFolders] = useState([]);
  const [docs, setDocs] = useState([]);
  const [checkedDocs, setCheckedDocs] = useState([]);
  const [isAllChecked, setIsAllChecked] = useState(false);
  const [mainFolderIds, setMainFolderIds] = useState(() => getMainFolderIds());

  useEffect(() => {
    if (!userId) {
      setFolders([]);
      setDocs([]);
      setRecentOpenedDocState(getRecentOpenedDoc());
      return;
    }

    async function loadData() {
      try {
        const [foldersRes, filesRes, notesRes] = await Promise.all([
          apiGetFolders(userId, null),
          apiGetFiles(userId, null),
          apiGetNotes(userId, null),
        ]);

        const folderList = (foldersRes.folders || []).map((folder) => ({
          id: folder.folder_id,
          name: folder.folder_name,
          parentId: folder.parent_id,
          createdAt: folder.created_at,
          isDeleted: false,
        }));

        const fileList = (filesRes.files || []).map((file) => ({
          id: `file-${file.my_file_id}`,
          resourceId: file.my_file_id,
          docType: "file",
          folderId: file.folder_id,
          title: file.display_name || file.origin_name,
          filePath: file.file_path || "",
          createdAt: file.added_at || file.uploaded_at,
          updatedAt: file.added_at || file.uploaded_at,
          isDeleted: false,
        }));

        const noteList = (notesRes || []).map((note) => ({
          id: String(note.note_id),
          resourceId: note.note_id,
          docType: "note",
          folderId: note.folder_id,
          title: note.title || "제목 없음",
          createdAt: note.created_at,
          updatedAt: note.updated_at || note.created_at,
          isDeleted: false,
        }));

        setFolders(folderList);
        setDocs([...noteList, ...fileList]);
        setRecentOpenedDocState(getRecentOpenedDoc());
      } catch (e) {
        console.warn("Failed to load main repository data:", e);
      }
    }

    loadData();
  }, [userId]);

  useEffect(() => {
    const unsubscribe = subscribeMainFolderIds(() => {
      setMainFolderIds(getMainFolderIds());
    });

    const onStorage = () => {
      setRecentOpenedDocState(getRecentOpenedDoc());
    };

    window.addEventListener("storage", onStorage);
    return () => {
      unsubscribe();
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const rootFolders = useMemo(
    () =>
      folders
        .map((folder) => ({
          ...folder,
          isDeleted: folder.isDeleted ?? false,
        }))
        .filter((folder) => folder.parentId === null && !folder.isDeleted),
    [folders]
  );

  const visibleFolders = useMemo(() => {
    return mainFolderIds
      .map((folderId) => rootFolders.find((folder) => folder.id === folderId))
      .filter(Boolean);
  }, [mainFolderIds, rootFolders]);

  const visibleDocs = useMemo(
    () =>
      docs
        .map((doc) => ({
          ...doc,
          isDeleted: doc.isDeleted ?? false,
        }))
        .filter((doc) => !doc.isDeleted && doc.folderId === null),
    [docs]
  );

  useEffect(() => {
    if (!recentOpenedDoc?.id) return;

    const exists = docs.some((doc) => String(doc.id) === String(recentOpenedDoc.id));
    if (!exists) {
      clearRecentOpenedDoc();
      setRecentOpenedDocState(null);
    }
  }, [docs, recentOpenedDoc]);

  const handleCheckDoc = (docId) => {
    setCheckedDocs((prev) =>
      prev.includes(docId)
        ? prev.filter((id) => id !== docId)
        : [...prev, docId]
    );
  };

  const handleCheckAll = () => {
    if (isAllChecked) {
      setCheckedDocs([]);
    } else {
      setCheckedDocs(visibleDocs.map((doc) => doc.id));
    }
    setIsAllChecked(!isAllChecked);
  };

  const moveDocsToTrash = async () => {
    const ok = window.confirm(`${checkedDocs.length}개의 파일을 휴지통으로 이동할까요?`);
    if (!ok || !userId) return;

    try {
      const targets = docs.filter((doc) => checkedDocs.includes(doc.id));
      await Promise.all(
        targets.map((doc) =>
          doc.docType === "note"
            ? apiDeleteNote(userId, doc.resourceId)
            : apiDeleteFile(userId, doc.resourceId)
        )
      );

      setDocs((prev) => prev.filter((doc) => !checkedDocs.includes(doc.id)));
      setCheckedDocs([]);
    } catch (e) {
      console.warn("Failed to move main docs to trash:", e);
      alert("휴지통 이동에 실패했습니다.");
    }
  };

  const startMoveDocs = async () => {
    if (!userId) return;

    const targetFolderId = window.prompt(
      "이동할 폴더 ID를 입력하세요:\n" +
        rootFolders.map((folder) => `${folder.name}: ${folder.id}`).join("\n")
    );

    if (!targetFolderId) return;

    const targetId = Number(targetFolderId);
    if (!targetId) {
      alert("유효하지 않은 폴더 ID입니다.");
      return;
    }

    const hasFolder = rootFolders.some((folder) => folder.id === targetId);
    if (!hasFolder) {
      alert("해당 폴더가 없습니다.");
      return;
    }

    try {
      const targets = docs.filter((doc) => checkedDocs.includes(doc.id));
      await Promise.all(
        targets.map((doc) =>
          doc.docType === "note"
            ? apiMoveNote(userId, doc.resourceId, targetId)
            : apiMoveFile(userId, doc.resourceId, targetId)
        )
      );

      setDocs((prev) =>
        prev.map((doc) =>
          checkedDocs.includes(doc.id)
            ? {
                ...doc,
                folderId: targetId,
                updatedAt: new Date().toISOString(),
              }
            : doc
        )
      );

      setCheckedDocs([]);
      alert(`${targets.length}개 파일이 이동되었습니다.`);
    } catch (e) {
      console.warn("Failed to move main docs:", e);
      alert("파일 이동에 실패했습니다.");
    }
  };

  const openFile = (doc) => {
    if (!doc.filePath) {
      alert("이 업로드 파일은 지금 바로 열 수 없어요.");
      return;
    }

    setRecentOpenedDocState(
      setRecentOpenedDoc({
        id: doc.id,
        title: doc.title,
        docType: "file",
        filePath: doc.filePath,
      })
    );

    const link = document.createElement("a");
    link.href = doc.filePath;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.click();
  };

  useEffect(() => {
    if (visibleDocs.length > 0 && checkedDocs.length === visibleDocs.length) {
      setIsAllChecked(true);
    } else {
      setIsAllChecked(false);
    }
  }, [checkedDocs, visibleDocs.length]);

  return (
    <main>
      <section className="main-page">
        <div className="main-page-contents">
          <img src="/images/logo.png" alt="" />
          <h1>캘린더에서 친구들과 함께 디데이정리부터 <br></br>
            필기정리 / 정보공유 / 1:1 멘토멘티 서비스까지
          </h1>
          <p>
            DO:IT은 사용자를 탐색해 멘토멘티 기능을 구현하고
            <br />
            캘린더 기능으로 시험준비 및 공유까지 가능한 <br />
            공부 서비스입니다.
          </p>
        </div>
      </section>
      <section className="main-page-mypage">
        <div className="main-page-mypage-header">
          <div className="mypage-title">
            <h2>
              나만의 <span>자료함</span>
            </h2>
            <img
              src="/images/mypage_icon.png"
              alt="자료함 아이콘"
              className="mypage-emoji"
            />
          </div>
          <Link to="/mypagerepository"><button>자료함 바로가기</button></Link>
        </div>

        <div className="folder-area">
          <div className="folder-grid">
            {visibleFolders.length > 0 ? (
              visibleFolders.map((folder) => (
                <Link to={`/repository/folder/${folder.id}`} key={folder.id}>
                  <button className="folder-card">
                    <img src="/images/folder.png" alt={folder.name} />
                    <p>{folder.name}</p>
                  </button>
                </Link>
              ))
            ) : (
              <div className="folder-grid-empty">
                <img src="/images/folder.png" alt="" />
                <p>메인에 보여줄 폴더를 아직 고르지 않았어요.</p>
                <span>자료함에서 폴더 메뉴의 `메인 바로가기 추가`로 최대 3개까지 선택할 수 있습니다.</span>
              </div>
            )}
          </div>
        </div>

        <div className="main-page-file-list">
          <div className="main-page-preview-header">
            <h4>자료함 미리보기</h4>
            <span>최근 열람한 자료와 내 파일을 한 번에 볼 수 있습니다.</span>
          </div>

          {checkedDocs.length > 0 && (
            <div className="main-page-file-actions">
              <span>{checkedDocs.length}개 선택됨</span>
              <div className="main-page-file-actions-buttons">
                <button onClick={startMoveDocs}>이동</button>
                <button onClick={moveDocsToTrash}>휴지통</button>
                <button onClick={() => { setCheckedDocs([]); setIsAllChecked(false); }}>취소</button>
              </div>
            </div>
          )}

          <div className="main-page-file-header">
            <div className="main-page-file-select">
              <input
                type="checkbox"
                checked={isAllChecked}
                onChange={handleCheckAll}
              />
            </div>
            <p className="main-page-file-name-col">이름</p>
            <p className="main-page-file-date-col">날짜</p>
          </div>

          {recentOpenedDoc && (
            <div className="main-page-file-item main-page-file-item-featured">
              <div className="main-page-file-select">
                <span className="main-page-file-featured-badge">최근</span>
              </div>
              <div className="main-page-file-name-col main-page-file-featured-name">
                <img src="/images/icon/img.png" alt="" />
                <span>{recentOpenedDoc.title || "(제목없음)"}</span>
              </div>
              <p className="main-page-file-date-col">
                {recentOpenedDoc.openedAt
                  ? formatRepositoryDateShort(recentOpenedDoc.openedAt)
                  : "-"}
              </p>
            </div>
          )}

          {visibleDocs.length === 0 ? (
            <div className="main-page-file-empty">
              <p>
                {recentOpenedDoc
                  ? "내 파일은 아직 없습니다."
                  : "파일이 없습니다."}
              </p>
            </div>
          ) : (
            visibleDocs.map((doc) => (
              <div
                key={doc.id}
                className={`main-page-file-item ${checkedDocs.includes(doc.id) ? "checked" : ""}`}
              >
                <div className="main-page-file-select">
                  <input
                    type="checkbox"
                    checked={checkedDocs.includes(doc.id)}
                    onChange={() => handleCheckDoc(doc.id)}
                  />
                </div>
                {doc.docType === "note" ? (
                  <Link to={`/doc-view/${doc.id}`} className="main-page-file-name-col">
                    <img src="/images/icon/img.png" alt="" />
                    <span>{doc.title || "제목 없음"}</span>
                  </Link>
                ) : (
                  <button
                    type="button"
                    className="main-page-file-name-col main-page-file-open"
                    onClick={() => openFile(doc)}
                  >
                    <img src="/images/icon/img.png" alt="" />
                    <span>{doc.title || "제목 없음"}</span>
                  </button>
                )}
                <p className="main-page-file-date-col">
                  {formatRepositoryDateShort(doc.updatedAt || doc.createdAt)}
                </p>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="main-page-community">
        <div className="recent-wrap">
          <h3>최근 커뮤니티 글</h3>

          <div className="recent-card">
            <div className="recent-header">
              <span className="recent-title">커뮤니티</span>

              <Link
                to="/post"
                className="recent-action"
                style={{ textDecoration: "none" }}
              >
                <span className="recent-more">더보기</span>
                <img src="/images/icon/Plus.png" alt="" />
              </Link>
            </div>
            <RecentCommunity />
          </div>
        </div>
      </section>

      <MainCalenderPreview />

      <section className="mm-hero">
        <div className="mm-inner">
          <div className="mm-left">
            <p className="mm-kicker">DO:IT만의 특별한 서비스</p>
            <h2 className="mm-title">1:1 멘토멘티</h2>
            <p className="mm-desc">
              1:1 멘토멘티 서비스는 맞춤형 학습으로
              <br />
              사용자의 수준에 맞도록 멘토와 멘티를 찾아
              <br />
              자동으로 연결시켜 배울 수 있도록 돕습니다.
            </p>

            <div className="mm-actions">
              <button
                className="mm-btn mm-btn--primary"
                onClick={openMentorModal}
              >
                멘토 서비스
              </button>
              <button
                className="mm-btn mm-btn--ghost"
                onClick={() => navigate("/mentypage")}
              >
                멘티 서비스
              </button>
            </div>
          </div>

          <div className="mm-right">
            <img
              className="mm-illust"
              src="/images/mentor_illust.png"
              alt="멘토멘티 일러스트"
            />
          </div>
        </div>
      </section>

      <section className="mm-stars">
        <div className="mm-stars-inner">
          <p className="mm-slogan">
            <span className="brand">DO:IT</span> 와 함께
            <br />
            <span className="highlight">편리</span>하고{" "}
            <span className="highlight2">효율적인</span> 공부
          </p>
        </div>
      </section>

      <footer className="main-footer">
        <div className="footer-inner">
          <p>© 2026 DO:IT. All rights reserved.</p>
        </div>
      </footer>

      {showMentorModal && (
        <div className="mentor-modal-overlay" onClick={closeMentorModal}>
          <div
            className="mentor-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <p>회원님은 현재 멘토가 아닙니다.</p>
            <h2>멘토를 지원하시겠습니까?</h2>

            <div className="mentor-modal-buttons">
              <button className="yes" onClick={goMentorApply}>
                예
              </button>
              <button className="no" onClick={closeMentorModal}>
                아니요
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default Main;
