import "../css/CommunityInput.css";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getCurrentUser } from "../utils/auth";

function CommunityInput() {
  const navigate = useNavigate();

  // ✅ 로그인 유저 (컴포넌트 안에서 읽기)
  const me = getCurrentUser();
  const currentUserId = me?.user_id ?? null;

  // ✅ 글 작성 state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  // ✅ 파일 업로드 state
  const [files, setFiles] = useState([]);
  const [uploadMsg, setUploadMsg] = useState("");

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  // ✅ 파일 선택창 열기
  const openFilePicker = () => {
    const el = document.getElementById("community-file-input");
    if (!el) return;
    el.removeAttribute("accept");
    el.click();
  };

  // ✅ 파일 삭제
  const removeFile = (key) => {
    setFiles((prev) => prev.filter((f) => `${f.name}-${f.size}` !== key));
  };

  // ✅ 파일 선택 시: 기존 + 추가, 중복 제거, 최대 5개 제한, 5MB 체크
  const onChangeFiles = (e) => {
    const list = Array.from(e.target.files || []);
    e.target.value = "";

    const tooBig = list.find((f) => f.size > MAX_FILE_SIZE);
    if (tooBig) {
      setUploadMsg(`"${tooBig.name}" 파일이 5MB를 초과합니다.`);
      return;
    }

    if (list.length === 0) return;
    // 파일 1개만 허용
    setFiles([list[0]]);
    setUploadMsg("");
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      if (!currentUserId) {
        alert("로그인 후 글을 작성할 수 있어요.");
        navigate("/login");
        return;
      }

      const t = title.trim();
      const c = content.trim();
      if (!t) return alert("제목을 입력해줘!");
      if (!c) return alert("내용을 입력해줘!");

      // 1. 글 등록
      const resp = await fetch("/api/posts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: t, content: c, user_id: currentUserId }),
      });

      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        alert(data?.message || "작성 실패");
        return;
      }

      const newId = data?.result?.meta?.last_row_id;

      // 2. 파일 업로드 (글 등록 성공 후, 1개)
      if (files.length > 0 && newId) {
        setUploadMsg("파일 업로드 중...");
        const fd = new FormData();
        fd.append("file", files[0]);
        fd.append("post_id", String(newId));
        fd.append("user_id", String(currentUserId));

        const upResp = await fetch("/api/upload", { method: "POST", body: fd });
        if (!upResp.ok) {
          const upData = await upResp.json().catch(() => ({}));
          setUploadMsg(upData?.message || `"${files[0].name}" 업로드 실패`);
        } else {
          setUploadMsg("");
        }
      }

      try {
        window.dispatchEvent(new CustomEvent("post:created", { detail: { post_id: newId } }));
      } catch (e) {
        console.error("dispatch post:created failed", e);
      }
      if (newId) navigate(`/post/${newId}`);
      else navigate("/post");
    } finally {
      setIsSubmitting(false);
    }
  };

  const msgClass = uploadMsg.includes("성공")
    ? "ok"
    : uploadMsg.includes("중...")
      ? "loading"
      : "err";

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
              placeholder="제목을 입력하세요. (최대 20자)"
              value={title}
              maxLength={20}
              onChange={(e) => setTitle(e.target.value)}
            />
            <div style={{ fontSize: 12, color: "#666", textAlign: "right" }}>
              {title.length} / 20
            </div>
          </div>

          <div className="Community-input-content">
            <textarea
              className="Community-input-textarea"
              placeholder="내용을 입력하세요. (최대 500자)"
              value={content}
              maxLength={500}
              onChange={(e) => setContent(e.target.value)}
            />
            <div style={{ fontSize: 12, color: "#666", textAlign: "right" }}>
              {content.length} / 500
            </div>
          </div>
        </div>

        {/* ✅ 업로드 바 */}
        <div className="Community-input-footer">
          <div className="upload-bar">
            <div className="upload-actions">
              {/* 파일 첨부 */}
              <button
                type="button"
                className="upload-icon-btn"
                onClick={() => openFilePicker()}
                title="파일 첨부"
              >
                <img src="/images/icon/link.png" alt="파일" />
              </button>

              {/* 숨겨진 input (1개만) */}
              <input
                id="community-file-input"
                type="file"
                onChange={onChangeFiles}
                style={{ display: "none" }}
              />

              <button type="submit" className="Community-input-button" disabled={isSubmitting}>
                {isSubmitting ? "등록 중..." : "등록"}
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
                        {(f.size / 1024 / 1024).toFixed(1)}MB
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
              <div className="upload-hint">파일을 첨부해보세요 (1개, 최대 5MB)</div>
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
