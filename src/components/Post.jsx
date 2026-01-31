import "../css/CommunityView.css";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

function CommunityView() {
  const { id } = useParams();

  // ✅ 임시 로그인 유저(나중에 로그인 붙이면 바꾸기)
  const currentUserId = 1;

  const [post, setPost] = useState(null);

  // 댓글
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");

  // ✅ 수정 기능용 state
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  // ✅ (선택) 파일 업로드 UI용 state (실제 업로드 API 없으면 UI만 동작)
  const [commentFile, setCommentFile] = useState(null);

  const load = async () => {
    const resp = await fetch(`/api/post/${id}`);
    const postJson = await resp.json();
    setPost(postJson);

    const cResp = await fetch(`/api/post/${id}/comments`);
    const cJson = await cResp.json();
    setComments(Array.isArray(cJson) ? cJson : []);
  };

  useEffect(() => {
    load().catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (post && !post.message) {
      setEditTitle(post.title ?? "");
      setEditContent(post.content ?? "");
    }
  }, [post]);

  // ✅ 댓글 신고 함수 (글 작성자만 가능)
  const reportComment = async (comment) => {
    if (post?.user_id !== currentUserId) {
      alert("글 작성자만 신고할 수 있어요.");
      return;
    }

    const reason = window.prompt("신고 사유를 입력해줘 (예: 욕설/스팸/도배)");
    if (!reason) return;

    const resp = await fetch("/api/report", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        reporter_id: currentUserId,
        reported_id: comment.user_id,
        report_type: "COMMENT",
        report_content: `post_id=${id} comment_id=${comment.comment_id} reason=${reason}`,
      }),
    });

    const data = await resp.json();
    if (!resp.ok) {
      alert(data?.message || "신고 실패");
      return;
    }

    alert("신고 접수 완료!");
  };

  // 댓글 작성
  const addComment = async () => {
    if (!newComment.trim()) return;

    // ⚠️ 지금 API는 JSON만 보내는 구조라 file은 포함 안 함(필요하면 FormData로 바꿔야 함)
    const resp = await fetch(`/api/post/${id}/comments`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        content: newComment,
        user_id: currentUserId,
      }),
    });

    const data = await resp.json();
    if (!resp.ok) {
      alert(data?.message || "댓글 작성 실패");
      return;
    }

    setNewComment("");
    setCommentFile(null);

    const cResp = await fetch(`/api/post/${id}/comments`);
    setComments(await cResp.json());
  };

  // ✅ 글 수정 저장
  const saveEdit = async () => {
    if (!editTitle.trim() || !editContent.trim()) {
      alert("제목/내용을 입력해줘!");
      return;
    }

    const resp = await fetch(`/api/post/${id}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: editTitle,
        content: editContent,
        user_id: currentUserId,
      }),
    });

    const data = await resp.json();
    if (!resp.ok) {
      alert(data?.message || "수정 실패");
      return;
    }

    alert("수정 완료!");
    setIsEditing(false);
    await load();
  };

  // ✅ 글 삭제
  const deletePost = async () => {
    if (!window.confirm("정말 삭제할까?")) return;

    const resp = await fetch(`/api/post/${id}`, {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ user_id: currentUserId }),
    });

    const data = await resp.json();
    if (!resp.ok) {
      alert(data?.message || "삭제 실패");
      return;
    }

    alert("삭제 완료!");
    window.location.href = "/community"; // 네 라우트에 맞게 수정
  };

  if (!post) return <div>Loading...</div>;
  if (post?.message) return <div>Error: {post.message}</div>;

  // 게시글 시간 KST
  const kstTime = new Date(
    post.created_at?.replace(" ", "T") + "Z"
  ).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });

  return (
    <div className="Community-view">
      <div className="Community-view-header">
        <div className="Community-view-title">
          {/* 제목: 수정 모드면 input */}
          {!isEditing ? (
            <h2>{post.title}</h2>
          ) : (
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              style={{ width: "100%", padding: 8 }}
            />
          )}
        </div>

        {/* ✅ 수정/삭제 버튼: 내 글일 때만 */}
        {post.user_id === currentUserId && (
          <div style={{ margin: "10px 0" }}>
            {!isEditing ? (
              <>
                <button onClick={() => setIsEditing(true)}>수정</button>{" "}
                <button onClick={deletePost}>삭제</button>
              </>
            ) : (
              <>
                <button onClick={saveEdit}>저장</button>{" "}
                <button onClick={() => setIsEditing(false)}>취소</button>
              </>
            )}
          </div>
        )}

        <div className="Community-view-info">
          <table className="post-info">
            <tbody>
              <tr>
                <th>작성자</th>
                <td>{post.author_nickname ?? "(알 수 없음)"}</td>
                <th>조회수</th>
                <td>{post.view_count ?? 0}</td>
              </tr>

              <tr>
                <th>첨부파일</th>
                <td>
                  {/* ✅ 네 DB/응답에 파일 필드가 없어서 일단 “없음” 처리
                      나중에 post.file_name 같은 게 생기면 여기에 넣으면 됨 */}
                  <span className="file">
                    {/* 아이콘 경로는 네 프로젝트에 맞게 바꿔줘 */}
                    {/* <img src="/images/icon/link.png" alt="파일" /> */}
                    없음
                  </span>
                </td>

                <th>작성일자</th>
                <td>{kstTime}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="Community-view-main">
        {/* 내용: 수정 모드면 textarea */}
        {!isEditing ? (
          <p className="post-content">{post.content}</p>
        ) : (
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={10}
            style={{ width: "100%", padding: "8px", marginTop: 8 }}
          />
        )}

        <div className="comments-section">
          <h3>댓글</h3>

          <div className="comments-list">
            {comments.length === 0 && <p>댓글이 없습니다.</p>}

            {comments.map((c) => {
              const kstCommentTime = new Date(
                c.created_at?.replace(" ", "T") + "Z"
              ).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });

              return (
                <div
                  key={c.comment_id}
                  style={{ borderBottom: "1px solid #eee", padding: "10px 0" }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 8,
                    }}
                  >
                    <div>{c.content}</div>

                    {/* ✅ 글 작성자만 신고 버튼 보임 */}
                    {post.user_id === currentUserId && (
                      <button
                        type="button"
                        onClick={() => reportComment(c)}
                        style={{ fontSize: 12 }}
                      >
                        신고
                      </button>
                    )}
                  </div>

                  <small>
                    {c.commenter_nickname ?? "(알 수 없음)"} · {kstCommentTime}
                  </small>
                </div>
              );
            })}
          </div>

          {/* 댓글 작성 */}
          <div className="add-comment">
            <textarea
              placeholder="댓글을 입력하세요"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />

            {/* (선택) 파일 UI만 유지 */}
            <div className="file-upload-form">
              <input
                type="file"
                id="file-upload"
                onChange={(e) => setCommentFile(e.target.files?.[0] ?? null)}
              />
              <span className="file-name">
                {commentFile ? commentFile.name : "선택된 파일이 없습니다"}
              </span>
              <label htmlFor="file-upload" className="custom-file-upload">
                <i className="fa fa-cloud-upload"></i> 파일 선택
              </label>
            </div>

            <button className="comment-btn" onClick={addComment}>
              댓글 작성
            </button>
          </div>
        </div>
      </div>

      <div className="Community-view-footer">
        <Link to={"/post"}>
          <button className="back">돌아가기</button>
        </Link>
      </div>
    </div>
  );
}

export default CommunityView;
