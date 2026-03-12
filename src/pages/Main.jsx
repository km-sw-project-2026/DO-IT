import { Link } from "react-router-dom";
import React, { useEffect, useState } from "react";

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
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

function Main() {
  const [latestNote, setLatestNote] = useState(null);
  const [folders, setFolders] = useState(() =>
    safeParse(localStorage.getItem(LS_FOLDERS), [])
  );
  const [docs, setDocs] = useState(() =>
    safeParse(localStorage.getItem(LS_DOCS), [])
  );
  const [checkedDocs, setCheckedDocs] = useState([]);
  const [isAllChecked, setIsAllChecked] = useState(false);

  useEffect(() => {
    try {
      const v = JSON.parse(localStorage.getItem("doit_latest_note") || "null");
      if (v) setLatestNote(v);
    } catch {
      setLatestNote(null);
    }
  }, []);

  useEffect(() => {
    const onStorage = () => {
      setFolders(safeParse(localStorage.getItem(LS_FOLDERS), []));
      setDocs(safeParse(localStorage.getItem(LS_DOCS), []));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const visibleFolders = folders
    .map((folder) => ({
      ...folder,
      isDeleted: folder.isDeleted ?? false,
    }))
    .filter((folder) => folder.parentId === null && !folder.isDeleted);

  const visibleDocs = docs
    .map((doc) => ({
      ...doc,
      isDeleted: doc.isDeleted ?? false,
    }))
    .filter((doc) => !doc.isDeleted && doc.folderId === null);

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

  const moveDocsToTrash = () => {
    const ok = window.confirm(`${checkedDocs.length}개의 파일을 휴지통으로 이동할까요?`);
    if (!ok) return;

    const now = new Date().toISOString();

    setDocs((prev) =>
      prev.map((doc) =>
        checkedDocs.includes(doc.id)
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

    setCheckedDocs([]);
  };

  const startMoveDocs = () => {
    const targetFolderId = window.prompt("이동할 폴더 ID를 입력하세요:\n" + 
      visibleFolders.map(f => `${f.name}: ${f.id}`).join("\n"));
    
    if (!targetFolderId) return;
    
    const targetId = Number(targetFolderId);
    if (!targetId) {
      alert("유효하지 않은 폴더 ID입니다.");
      return;
    }

    const hasFolder = visibleFolders.some(f => f.id === targetId);
    if (!hasFolder) {
      alert("해당 폴더가 없습니다.");
      return;
    }

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
    alert(`${checkedDocs.length}개 파일이 이동되었습니다.`);
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
      <section className='main-page'>

        <div className='main-page-contents'>
          <img src='/images/logo.png' alt='' />
          <h1>캘린더에서 친구들과 함께 디데이정리부터 <br></br>
            필기정리 / 정보공유 / 1:1 멘토멘티 서비스까지
          </h1>
          <p>DO:IT은  사용자를 탐색해 멘토멘티 기능을 구현하고<br></br>
            캘린더 기능으로 시험준비 및 공유까지 가능한 <br></br>
            공부 서비스입니다.</p>
        </div>
      </section>
      <section className='main-page-mypage'>
        <div className='main-page-mypage-header'>
          <div className="mypage-title">
            <h2>나만의 <span>자료함</span></h2>
            <img
              src="/images/mypage_icon.png"
              alt="자료함 아이콘"
              className="mypage-emoji"
            />
          </div>
          <Link to="/mypage"><button>자료함 바로가기</button></Link>
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
              <>
                <button className="folder-card">
                  <img src="/images/folder.png" alt="수학" />
                  <p>수학</p>
                </button>
                <button className="folder-card">
                  <img src="/images/folder.png" alt="영어" />
                  <p>영어</p>
                </button>
                <button className="folder-card">
                  <img src="/images/folder.png" alt="국어" />
                  <p>국어</p>
                </button>
              </>
            )}
          </div>
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

        <div className="main-page-file-list">
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

          {visibleDocs.length === 0 ? (
            <div className="main-page-file-empty">
              <p>파일이 없습니다.</p>
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
                <Link to={`/doc-view/${doc.id}`} className="main-page-file-name-col">
                  <img src="/images/icon/img.png" alt="" />
                  <span>{doc.title || "제목 없음"}</span>
                </Link>
                <p className="main-page-file-date-col">
                  {formatDate(doc.updatedAt || doc.createdAt)}
                </p>
              </div>
            ))
          )}
        </div>

        {latestNote && (
          <div style={{ marginTop: 18 }}>
            <h4>최근 작성한 노트</h4>
            <div style={{ padding: 12, border: "1px solid #eee", borderRadius: 6 }}>
              <strong>{latestNote.title || "(제목없음)"}</strong>
              <div style={{ color: "#999", fontSize: 13 }}>{new Date(latestNote.created_at).toLocaleString()}</div>
            </div>
          </div>
        )}
      </section>
      <section className="main-page-community">
        <div className="recent-wrap">
          <h3>최근 커뮤니티 글</h3>

          <Link to="/post">
            <div className="recent-card">
              <div className="recent-header">
                <span className="recent-title">커뮤니티</span>

                <button className="recent-action">
                  <span className="recent-more">더보기</span>
                  <img src="/images/icon/Plus.png" alt="" />
                </button>
              </div>


              <ul className="recent-list">
                <li>
                  <span>커뮤니티 최신 글 1</span>
                  <span className="recent-date">2025.04.23</span>
                </li>
                <li>
                  <span>커뮤니티 최신 글 2</span>
                  <span className="recent-date">2025.04.22</span>
                </li>
                <li>
                  <span>커뮤니티 최신 글 3</span>
                  <span className="recent-date">2025.04.21</span>
                </li>
                <li>
                  <span>커뮤니티 최신 글 4</span>
                  <span className="recent-date">2025.04.20</span>
                </li>
              </ul>
            </div>
          </Link>
        </div>
</section>

      {/* =======================
    1:1 멘토멘티 섹션
======================= */}

      <section className="mm-hero">
        <div className="mm-inner">
          {/* 왼쪽 텍스트 */}
          <div className="mm-left">
            <p className="mm-kicker">DO:IT만의 특별한 서비스</p>
            <h2 className="mm-title">1:1 멘토멘티</h2>
            <p className="mm-desc">
              1:1 멘토멘티 서비스는 맞춤형 학습으로<br />
              사용자의 수준에 맞도록 멘토와 멘티를 찾아<br />
              자동으로 연결시켜 배울 수 있도록 돕습니다.
            </p>

            <div className="mm-actions">
              <button className="mm-btn mm-btn--primary">멘토 서비스</button>
              <button className="mm-btn mm-btn--ghost">멘티 서비스</button>
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
            <span className="brand">DO:IT</span> 와 함께<br />
            <span className="highlight">편리</span>하고{" "}
            <span className="highlight2">효율적인</span> 공부
          </p>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="main-footer">
        <div className="footer-inner">
          <p>© 2026 DO:IT. All rights reserved.</p>
        </div>
      </footer>



    </main>
  );
}
export default Main;
