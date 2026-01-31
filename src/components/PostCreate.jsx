import "../css/CommunityInput.css";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function CommunityInput() {
  const navigate = useNavigate();

  // ✅ 글 작성 state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  // ✅ 파일 업로드 state
  const [files, setFiles] = useState([]);
  const [uploadMsg, setUploadMsg] = useState("");

  // ✅ 파일 선택창 열기 (사진/파일 분리)
  const openFilePicker = (mode = "all") => {
    const el = document.getElementById("community-file-input");
    if (!el) return;

    if (mode === "image") el.setAttribute("accept", "image/*");
    else el.removeAttribute("accept");

    el.click();
  };

  // ✅ 파일 삭제
  const removeFile = (key) => {
    setFiles((prev) => prev.filter((f) => `${f.name}-${f.size}` !== key));
  };

  // ✅ 파일 선택 시: 기존 + 추가, 중복 제거, 최대 10개 제한
  const onChangeFiles = (e) => {
    const list = Array.from(e.target.files || []);
    const merged = [...files, ...list];

    const uniq = [];
    const seen = new Set();
    for (const f of merged) {
      const k = `${f.name}-${f.size}`;
      if (seen.has(k)) continue;
      seen.add(k);
      uniq.push(f);
    }

    if (uniq.length > 10) {
      setUploadMsg("파일은 최대 10개까지만 선택할 수 있어요.");
      setFiles(uniq.slice(0, 10));
      return;
    }

    setFiles(uniq);
    setUploadMsg("");
  };

  const uploadFiles = async () => {
    if (files.length === 0) {
      setUploadMsg("선택된 파일이 없어요.");
      return;
    }

    // 2GB 미만 체크
    const MAX = 2 * 1024 * 1024 * 1024;
    const tooBig = files.find((f) => f.size >= MAX);
    if (tooBig) {
      setUploadMsg(`"${tooBig.name}" 파일이 2GB 이상이라 업로드 불가`);
      return;
    }

    try {
      setUploadMsg("업로드 중...");

      for (const f of files) {
        const fd = new FormData();
        fd.append("file", f);
        fd.append("user_id", "1");

        const resp = await fetch("/api/upload", {
          method: "POST",
          body: fd,
        });

        const data = await resp.json();
        if (!resp.ok) {
          setUploadMsg(data?.message || "업로드 실패");
          return;
        }
      }

      setUploadMsg("업로드 요청 성공! (다음 단계에서 실제 저장 연결)");
    } catch (e) {
      console.error(e);
      setUploadMsg("업로드 중 오류 발생");
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    const resp = await fetch("/api/posts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title, content, user_id: 1 }),
    });

    const data = await resp.json();
    if (!resp.ok) {
      alert(data?.message || "작성 실패");
      return;
    }

    const newId = data?.result?.meta?.last_row_id;
    if (newId) navigate(`/post/${newId}`);
    else navigate("/community");
  };

  const msgClass =
    uploadMsg.includes("성공") ? "ok" : uploadMsg.includes("중...") ? "loading" : "err";

  return (
    <div className="Community-input">
      <div className="Community-input-header">
        <h2>커뮤니티 글 작성</h2>
        <Link to={"/post"}>
          <button className="close">
            <img src="/images/icon/close.png" alt="닫기" />
          </button>
        </Link>
      </div>

      <form onSubmit={onSubmit}>
        <div className="Community-input-main">
          <div className="Community-input-title">
            <input
              type="text"
              placeholder="제목을 입력하세요."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="Community-input-content">
            <textarea
              className="Community-input-textarea"
              placeholder="내용을 입력하세요."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
        </div>

        {/* ✅ 예쁜 업로드 바 */}
        <div className="Community-input-footer">
          <div className="upload-bar">
            <div className="upload-actions">
              {/* 사진 */}
              <button
                type="button"
                className="upload-icon-btn"
                onClick={() => openFilePicker("image")}
                title="사진 추가"
              >
                <img src="/images/icon/picture.png" alt="사진" />
              </button>

              {/* 파일 */}
              <button
                type="button"
                className="upload-icon-btn"
                onClick={() => openFilePicker("all")}
                title="파일 추가"
              >
                <img src="/images/icon/link.png" alt="파일" />
              </button>

              {/* 숨겨진 input */}
              <input
                id="community-file-input"
                type="file"
                multiple
                onChange={onChangeFiles}
                style={{ display: "none" }}
              />

              {/* 업로드 버튼 */}
              <button type="button" className="upload-btn" onClick={uploadFiles}>
                업로드
              </button>
              <button type="submit" className="Community-input-button">
                등록
              </button>
            </div>

            {/* 선택 파일 표시 */}
            {files.length > 0 ? (
              <div className="file-chips">
                {files.map((f) => {
                  const key = `${f.name}-${f.size}`;
                  return (
                    <div className="file-chip" key={key}>
                      <span className="file-chip-name">{f.name}</span>
                      <span className="file-chip-size">
                        {Math.round(f.size / 1024 / 1024)}MB
                      </span>
                      <button
                        type="button"
                        className="file-chip-remove"
                        onClick={() => removeFile(key)}
                        aria-label="remove"
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="upload-hint">사진/파일을 추가해보세요 (최대 10개)</div>
            )}

            {/* 업로드 메시지 */}
            {uploadMsg && <div className={`upload-msg ${msgClass}`}>{uploadMsg}</div>}
          </div>

        </div>
      </form>
    </div>
  );
}

export default CommunityInput;
