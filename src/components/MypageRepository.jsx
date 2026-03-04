import "../css/MypageRepository.css";
import { data } from "../js/MypageRepository.js";
import MypageRepositoryfile from "./MypageRepositoryfile.jsx";
import { Link } from "react-router-dom";
import React, { useState } from "react";

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

function MypageRepository() {
  // ✅ 접기/펼치기 상태
  const [isFolderOpen, setIsFolderOpen] = useState(true);
  const [isSuggestOpen, setIsSuggestOpen] = useState(true);

  // ✅ 폴더 목록(일단 프론트에서만 관리)
  const [folders, setFolders] = useState(() => [
    { id: 1, name: "폴더 1" },
    { id: 2, name: "폴더 2" },
    { id: 3, name: "폴더 3" },
  ]);

  // ✅ 폴더 추가 UI 상태
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  const addFolder = () => {
    const name = newFolderName.trim();
    if (!name) return;

    setFolders((prev) => [{ id: Date.now(), name }, ...prev]);
    setNewFolderName("");
    setIsAddingFolder(false);
    setIsFolderOpen(true); // 추가하면 펼쳐지게
  };

  const cancelAddFolder = () => {
    setNewFolderName("");
    setIsAddingFolder(false);
  };

  return (
    <section>
      <div className="mypagerepository">
        <div className="mypagerepository-inner">
          <div className="mypagerepository-header">
            <div className="mypagerepository-title">
              <h2>내 자료함</h2>
              <img src="/images/mypagerepository.png" alt="" />
            </div>

            <div className="search">
              <input type="text" placeholder="검색어를 입력해주세요" />
              <button type="button">
                <img src="/images/icon/search1.png" alt="검색" />
              </button>
            </div>
          </div>

          <div className="mypagerepository-contents">
            <div className="mypagerepository-inventory">
              {data.map((item, index) => (
                <MypageRepositoryBtn key={index} btn={item} />
              ))}

              <div className="mypagerepository-button">
                <div className="mypagerepository-button-span">
                  <div className="Storage-bar">
                    <div className="Storage-ber-used"></div>
                  </div>
                </div>
                <p className="Storage-capacity">43.2GB/100GB</p>
                <button>추가 저장공간 구매</button>
              </div>
            </div>

            <div className="mypagerepository-collection">
              {/* =======================
                  ✅ 내 폴더
                  ======================= */}
              <div className="mypagerepository-main">
                <div className="mypagerepository-main-header">
                  {/* ✅ 아이콘 + 이름 전체가 토글 버튼 */}
                  <button
                    type="button"
                    className="mr-header-toggle"
                    onClick={() => setIsFolderOpen((v) => !v)}
                    aria-expanded={isFolderOpen}
                    aria-label="내 폴더 접기/펼치기"
                  >
                    <img
                      className={`mr-arrow ${isFolderOpen ? "open" : ""}`}
                      src="/images/icon/aroow.png"
                      alt=""
                    />
                    <p>내 폴더</p>
                  </button>

                  <button
                    type="button"
                    className="mr-add"
                    onClick={() => {
                      setIsAddingFolder(true);
                      setIsFolderOpen(true);
                    }}
                    aria-label="폴더 추가"
                  >
                    <img src="/images/icon/Plus.png" alt="" />
                  </button>
                </div>

                {/* ✅ 폴더 추가 입력창 */}
                {isAddingFolder && (
                  <div className="mr-add-row">
                    <input
                      className="mr-add-input"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      placeholder="새 폴더 이름"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") addFolder();
                        if (e.key === "Escape") cancelAddFolder();
                      }}
                      autoFocus
                    />
                    <button className="mr-add-save" type="button" onClick={addFolder}>
                      추가
                    </button>
                    <button className="mr-add-cancel" type="button" onClick={cancelAddFolder}>
                      취소
                    </button>
                  </div>
                )}

                {/* ✅ 슬라이드 영역 (부드럽게 접힘/펼침) */}
                <div className={`mr-slide ${isFolderOpen ? "open" : ""}`}>
                  <ul className="mypagerepository-main-body">
                    {folders.map((f) => (
                      <MypageRepositoryfile key={f.id} name={f.name} />
                    ))}
                  </ul>
                </div>
              </div>

              {/* =======================
                  ✅ 추천 파일
                  ======================= */}
              <div className="mypagerepository-file-bottom">
                <div className="mypagerepository-bottom">
                  {/* ✅ 아이콘 + 이름 전체가 토글 버튼 */}
                  <button
                    type="button"
                    className="mr-header-toggle"
                    onClick={() => setIsSuggestOpen((v) => !v)}
                    aria-expanded={isSuggestOpen}
                    aria-label="추천 파일 접기/펼치기"
                  >
                    <img
                      className={`mr-arrow ${isSuggestOpen ? "open" : ""}`}
                      src="/images/icon/aroow.png"
                      alt=""
                    />
                    <p>추천 파일</p>
                  </button>
                </div>

                {/* ✅ 슬라이드 영역 (부드럽게 접힘/펼침) */}
                <div className={`mr-slide ${isSuggestOpen ? "open" : ""}`}>
                  <div className="mypagerepository-file-list">
                    <div className="mypagerepository-file-name">
                      <p>이름</p>
                      <p>날짜</p>
                      <p>형식</p>
                      <p>크기</p>
                    </div>

                    <div className="mypagerepository-file-suggestion">
                      <div className="mypagerepository-file-gather">
                        <button>
                          <img src="/images/icon/img.png" alt="" />
                        </button>
                        <p>자료구조 노트필기</p>
                      </div>
                      <p>12월 1일 12:10</p>
                      <p>.jpg</p>
                      <p>20GB</p>

                      <div className="mypagerepository-file-img-gather">
                        <button className="mypagerepository-download">
                          <img src="/images/icon/download.png" alt="" />
                        </button>
                        <button className="mypagerepository-pan">
                          <img src="/images/icon/pan.png" alt="" />
                        </button>
                        <button className="mypagerepository-star">
                          <img src="/images/icon/star.png" alt="" />
                        </button>
                      </div>

                      <button className="mypagerepository-ooo-button">
                        <div className="mypagerepository-ooo">
                          <span>•</span>
                          <span>•</span>
                          <span>•</span>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              {/* /추천 파일 */}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default MypageRepository;