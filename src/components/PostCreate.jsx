import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function PostCreate() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  // ✅ 파일 업로드용 state
  const [files, setFiles] = useState([]);
  const [uploadMsg, setUploadMsg] = useState("");

  const navigate = useNavigate();

  const onChangeFiles = (e) => {
    const list = Array.from(e.target.files || []);
    setFiles(list);
    setUploadMsg("");
  };

  // ✅ 파일 업로드(지금은 “API 연결 테스트”)
  const uploadFiles = async () => {
    if (files.length === 0) {
      setUploadMsg("선택된 파일이 없어요.");
      return;
    }

    // 2GB 미만 체크(프론트에서도 1차 방어)
    const MAX = 2 * 1024 * 1024 * 1024;
    const tooBig = files.find((f) => f.size >= MAX);
    if (tooBig) {
      setUploadMsg(`"${tooBig.name}" 파일이 2GB 이상이라 업로드 불가`);
      return;
    }

    try {
      setUploadMsg("업로드 중...");

      // 여러 개면 하나씩 업로드(테스트 단계)
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

    // ✅ 아직은 업로드 결과를 글에 붙이진 않고, 글 작성만 진행
    // (다음 단계에서 file_id 받아서 post_file 연결할거야)

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
    else navigate("/post");
  };

  return (
    <div>
      <h1>글 작성</h1>

      <form onSubmit={onSubmit}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="제목"
        />
        <br />

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="내용"
          rows={8}
        />
        <br />

        {/* ✅ 파일/사진 업로드 UI */}
        <div style={{ marginTop: 12 }}>
          <input type="file" multiple onChange={onChangeFiles} />
          <button type="button" onClick={uploadFiles} style={{ marginLeft: 8 }}>
            파일 업로드
          </button>

          {files.length > 0 && (
            <div style={{ marginTop: 8, fontSize: 14 }}>
              <b>선택된 파일:</b>
              <ul>
                {files.map((f) => (
                  <li key={f.name}>
                    {f.name} ({Math.round(f.size / 1024 / 1024)}MB)
                  </li>
                ))}
              </ul>
            </div>
          )}

          {uploadMsg && <p style={{ marginTop: 6 }}>{uploadMsg}</p>}
        </div>

        <br />
        <button type="submit">등록</button>
      </form>
    </div>
  );
}
