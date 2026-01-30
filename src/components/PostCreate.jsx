import "../css/CommunityInput.css";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const no = () => {
  alert("아직 구현되지 않은 기능입니다.");
};

function CommunityInput() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();

    try {
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

      // 방금 생성한 글 id로 이동(가능하면)
      const newId = data?.result?.meta?.last_row_id;
      if (newId) navigate(`/post/${newId}`);
      else navigate("/community"); // 없으면 목록으로
    } catch (err) {
      console.error(err);
      alert("서버 요청 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="Community-input">
      <div className="Community-input-header">
        <h2>커뮤니티 글 작성</h2>
        <Link to={"/post"}>
          <button className="close" type="button">
            <img src="/images/icon/close.png" alt="닫기" />
          </button>
        </Link>
      </div>

      {/* 등록 버튼을 submit으로 쓰기 위해 form으로 감쌈 */}
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

        <div className="Community-input-footer">
          <div className="Community-input-footer-content">
            <button className="picture" type="button" onClick={no}>
              <img src="/images/icon/picture.png" alt="사진" />
            </button>
            <button className="link" type="button" onClick={no}>
              <img src="/images/icon/link.png" alt="파일" />
            </button>
          </div>

          <button className="Community-input-button" type="submit">
            등록
          </button>
        </div>
      </form>
    </div>
  );
}

export default CommunityInput;
