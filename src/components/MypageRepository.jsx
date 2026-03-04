import "../css/MypageRepository.css";
import { data } from "../js/mypageRepositoryData.js";
import MypageRepositoryfile from "./MypageRepositoryfile.jsx";
import { Link } from "react-router-dom";
import React, { useEffect, useMemo, useState } from "react";
import { apiCreateFolder, apiGetFiles, apiGetFolders, apiGetNotes, apiCreateNote, apiUpdateNote, apiDeleteNote } from "../api/repository";
import DocEditor from "./DocEditor";

// 왼쪽 버튼 UI (그대로)
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

// 폴더 리스트 아이템(간단)
function FolderRow({ folder, isSelected, onClick }) {
  return (
    <li className="mypagerepository-main-body-inner">
      <button
        type="button"
        className="mypagerepository-bg"
        onClick={onClick}
        style={{ fontWeight: isSelected ? 700 : 400 }}
      >
        <img src="/images/icon/folder.png" alt="" />
        <p>{folder.folder_name}</p>
      </button>

      {/* (••• 메뉴는 다음 단계에서 rename/delete 붙이자) */}
      <button type="button" className="mypagerepository-ooo-button" onClick={(e) => e.stopPropagation()}>
        <div className="mypagerepository-ooo">
          <span>•</span><span>•</span><span>•</span>
        </div>
      </button>
    </li>
  );
}

function MypageRepository() {
  // ✅ 로그인 user_id 가져오기 (로그인 상태가 바뀌면 즉시 반영되도록 매 렌더마다 storage를 읽습니다)
  const userRaw = localStorage.getItem("user") || sessionStorage.getItem("user");
  const currentUserId = useMemo(() => {
    try {
      const u = userRaw ? JSON.parse(userRaw) : null;
      return u?.user_id ?? u?.user?.user_id ?? null;
    } catch {
      return null;
    }
  }, [userRaw]);

  // ✅ 접기/펼치기
  const [isFolderOpen, setIsFolderOpen] = useState(true);

  // ✅ 데이터 state
  const [folders, setFolders] = useState([]);
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [files, setFiles] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [editingNote, setEditingNote] = useState(null);

  // ✅ 로딩/에러
  const [loadingFolders, setLoadingFolders] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // ✅ 폴더 추가 UI
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  const loadFolders = async () => {
    if (!currentUserId) return;
    setLoadingFolders(true);
    setErrorMsg("");
    try {
      const list = await apiGetFolders(currentUserId, null);
      setFolders(list);

      // 처음 들어왔을 때 첫 폴더 자동 선택
      if (!selectedFolderId && list.length > 0) {
        setSelectedFolderId(list[0].folder_id);
      }
    } catch (e) {
      setErrorMsg(e?.message || "폴더를 불러오지 못했어요");
    } finally {
      setLoadingFolders(false);
    }
  };

  const loadFiles = async (folderId) => {
    if (!currentUserId || !folderId) return;
    setLoadingFiles(true);
    setErrorMsg("");
    try {
      const list = await apiGetFiles(currentUserId, folderId);
      setFiles(list);
    } catch (e) {
      setErrorMsg(e?.message || "파일을 불러오지 못했어요");
    } finally {
      setLoadingFiles(false);
    }
  };

  // ✅ 최초 폴더 로딩
  useEffect(() => {
    loadFolders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId]);

  // ✅ 선택 폴더 바뀌면 파일 로딩
  useEffect(() => {
    if (selectedFolderId) loadFiles(selectedFolderId);
    if (selectedFolderId) loadNotes(selectedFolderId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFolderId]);

  const loadNotes = async (folderId) => {
    if (!currentUserId) return;
    setLoadingNotes(true);
    try {
      const list = await apiGetNotes(currentUserId, folderId);
      setNotes(list);
    } catch (e) {
      setErrorMsg(e?.message || "노트를 불러오지 못했어요");
    } finally {
      setLoadingNotes(false);
    }
  };

  const addFolder = async () => {
    const name = newFolderName.trim();
    if (!name) return;

    try {
      await apiCreateFolder(currentUserId, name, null);
      setNewFolderName("");
      setIsAddingFolder(false);
      setIsFolderOpen(true);
      await loadFolders();
    } catch (e) {
      setErrorMsg(e?.message || "폴더 추가 실패");
    }
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

          {!!errorMsg && <p style={{ margin: "10px 0", color: "crimson" }}>{errorMsg}</p>}

          <div className="mypagerepository-contents">
            {/* 왼쪽 퀵 버튼 */}
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

            {/* 오른쪽: 폴더 + 파일 */}
            <div className="mypagerepository-collection">
              <div className="mypagerepository-main">
                <div className="mypagerepository-main-header">
                  {/* 접기/펼치기 */}
                  <button
                    type="button"
                    className="mr-toggle"
                    onClick={() => setIsFolderOpen((v) => !v)}
                  >
                    <img
                      className={`mr-arrow ${isFolderOpen ? "open" : ""}`}
                      src="/images/icon/aroow.png"
                      alt=""
                    />
                    <p>내 폴더</p>
                  </button>

                  {/* 폴더 추가 */}
                  <button
                    type="button"
                    className="mr-add"
                    onClick={() => {
                      setIsAddingFolder(true);
                      setIsFolderOpen(true);
                    }}
                  >
                    <img src="/images/icon/Plus.png" alt="" />
                  </button>
                  {/* 노트(문서) 추가 - DocEditor 모달 오픈 */}
                  <button
                    type="button"
                    className="mr-add"
                    onClick={() => {
                      setEditingNote({ folder_id: selectedFolderId });
                      setIsFolderOpen(true);
                    }}
                    style={{ marginLeft: 8 }}
                  >
                    <img src="/images/icon/Plus.png" alt="doc add" />
                  </button>
                </div>

                {isAddingFolder && (
                  <div className="mr-add-row">
                    <input
                      className="mr-add-input"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      placeholder="새 폴더 이름"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") addFolder();
                        if (e.key === "Escape") {
                          setNewFolderName("");
                          setIsAddingFolder(false);
                        }
                      }}
                      autoFocus
                    />
                    <button className="mr-add-save" type="button" onClick={addFolder}>
                      추가
                    </button>
                    <button
                      className="mr-add-cancel"
                      type="button"
                      onClick={() => {
                        setNewFolderName("");
                        setIsAddingFolder(false);
                      }}
                    >
                      취소
                    </button>
                  </div>
                )}

                {isFolderOpen && (
                  <ul className="mypagerepository-main-body">
                    {loadingFolders ? (
                      <li style={{ padding: 12 }}>폴더 불러오는 중...</li>
                    ) : folders.length === 0 ? (
                      <li style={{ padding: 12 }}>폴더가 없어요.</li>
                    ) : (
                      folders.map((f) => (
                        <FolderRow
                          key={f.folder_id}
                          folder={f}
                          isSelected={selectedFolderId === f.folder_id}
                          onClick={() => setSelectedFolderId(f.folder_id)}
                        />
                      ))
                    )}
                  </ul>
                )}
              </div>

              {/* 아래 영역: 선택된 폴더의 파일 목록(일단 홈에서는 여기에 보여주자) */}
              <div className="mypagerepository-file-bottom">
                <div className="mypagerepository-bottom">
                  <p>파일</p>
                </div>

                <div className="mypagerepository-file-list">
                  <div className="mypagerepository-file-name">
                    <p>이름</p>
                    <p>형식</p>
                    <p>크기</p>
                    <p>업로드</p>
                    <div style={{ float: "right" }}>
                      <button onClick={() => setShowNotes((v) => !v)} style={{ marginRight: 8 }}>
                        {showNotes ? "파일 보기" : "노트 보기"}
                      </button>
                      <button onClick={() => setEditingNote({ folder_id: selectedFolderId })}>새 노트</button>
                    </div>
                  </div>
                  {showNotes ? (
                    loadingNotes ? (
                      <div style={{ padding: 12 }}>노트 불러오는 중...</div>
                    ) : notes.length === 0 ? (
                      <div style={{ padding: 12 }}>노트가 없어요.</div>
                    ) : (
                      notes.map((n) => <NoteItem key={n.note_id} note={n} onEdit={(note) => setEditingNote(note)} onDelete={async (id) => { await apiDeleteNote(currentUserId, id); await loadNotes(selectedFolderId); }} />)
                    )
                  ) : (
                    loadingFiles ? (
                      <div style={{ padding: 12 }}>파일 불러오는 중...</div>
                    ) : files.length === 0 ? (
                      <div style={{ padding: 12 }}>파일이 없어요.</div>
                    ) : (
                      files.map((x) => (
                        <div key={x.my_file_id} className="mypagerepository-file-suggestion">
                          <div className="mypagerepository-file-gather">
                            <button type="button">
                              <img src="/images/icon/img.png" alt="" />
                            </button>
                            <p>{x.display_name || x.origin_name || "이름없음"}</p>
                          </div>
                          <p>{x.file_type || "-"}</p>
                          <p>{typeof x.file_size === "number" ? `${x.file_size}B` : "-"}</p>
                          <p>{x.uploaded_at?.slice?.(0, 16) || "-"}</p>
                        </div>
                      ))
                    )
                  )}
                  {/* DocEditor 모달 렌더링 (편집 또는 생성) */}
                  {editingNote && (
                    <DocEditor
                      initialTitle={editingNote.title || ""}
                      initialContent={editingNote.content || ""}
                      onCancel={() => setEditingNote(null)}
                      onSave={async ({ title, content }) => {
                        try {
                          if (editingNote.note_id) {
                            await apiUpdateNote(currentUserId, editingNote.note_id, title, content);
                          } else {
                            const created = await apiCreateNote(currentUserId, selectedFolderId, title, content, "html");
                            // 홈에서 바로 보이게 최근 노트 메타 저장
                            try {
                              const meta = {
                                note_id: created.note_id,
                                title: created.title,
                                folder_id: created.folder_id,
                                created_at: created.created_at || new Date().toISOString(),
                              };
                              localStorage.setItem("doit_latest_note", JSON.stringify(meta));
                            } catch {}
                          }
                          setEditingNote(null);
                          await loadNotes(selectedFolderId);
                        } catch (e) {
                          setErrorMsg(e?.message || "노트 저장 실패");
                        }
                      }}
                    />
                  )}
                </div>
              </div>
              {/* /파일 목록 */}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default MypageRepository;