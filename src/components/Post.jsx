import "../css/CommunityView.css";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

function CommunityView() {
  const params = useParams();
  // ✅ 라우터 param이 id일 수도 있고 post_id일 수도 있어서 둘 다 대응
  const rawId = params.id ?? params.post_id ?? params.postId;
  const postId = useMemo(() => {
    const n = Number(rawId);
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [rawId]);

  console.log("URL params:", params);
  console.log("rawId:", rawId, "postId:", postId);



  // ✅ 숫자로 변환 + 안전 처리

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


  // ✅ 댓글 불러오기
  const fetchCommentsApi = async (pid) => {
    const resp = await fetch(`/api/post/${pid}/comments`);
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) throw new Error(data?.message || "댓글 불러오기 실패");
    return Array.isArray(data) ? data : data.comments || [];
  };

  // ✅ 댓글 작성
  const createCommentApi = async (pid, content, userId = 1) => {
    const resp = await fetch(`/api/post/${pid}/comments`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ content, user_id: userId }),
    });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) throw new Error(data?.message || "댓글 작성 실패");
    return data;
  };



  // ✅ 댓글만 불러오는 함수
  const loadComments = async () => {
    if (!postId) return;
    const list = await fetchCommentsApi(postId);
    setComments(Array.isArray(list) ? list : []);
  };



  const load = async () => {
    if (!postId) return;

    const resp = await fetch(`/api/post/${postId}`);
    const postJson = await resp.json().catch(() => ({}));
    setPost(postJson);

    await loadComments(postId);
  };

  useEffect(() => {
    // ✅ id가 이상하면 아예 요청 안 보냄
    if (!postId) {
      setPost({ message: "잘못된 게시글 주소입니다." });
      setComments([]);
      return;
    }

    load().catch((e) => {
      console.error(e);
      setPost({ message: e?.message || "게시글 로딩 실패" });
      setComments([]);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

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
        report_content: `post_id=${postId} comment_id=${comment.comment_id} reason=${reason}`,
      }),
    });

    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      alert(data?.message || "신고 실패");
      return;
    }

    alert("신고 접수 완료!");
  };

  // ✅ 댓글 작성
  const addComment = async () => {
    const text = newComment.trim();
    if (!text) return;

    if (!postId) {
      alert("잘못된 게시글 id");
      return;
    }

    try {
      await createCommentApi(postId, text, currentUserId);

      setNewComment("");
      setCommentFile(null);

      await loadComments();
    } catch (e) {
      alert(e?.message || "댓글 작성 실패");
    }
  };


  // ✅ 글 수정 저장
  const saveEdit = async () => {
    if (!postId) return;

    if (!editTitle.trim() || !editContent.trim()) {
      alert("제목/내용을 입력해줘!");
      return;
    }

    const resp = await fetch(`/api/post/${postId}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: editTitle,
        content: editContent,
        user_id: currentUserId,
      }),
    });

    const data = await resp.json().catch(() => ({}));
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
    if (!postId) return;

    if (!window.confirm("정말 삭제할까?")) return;

    const resp = await fetch(`/api/post/${postId}`, {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ user_id: currentUserId }),
    });

    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      alert(data?.message || "삭제 실패");
      return;
    }

    alert("삭제 완료!");
    window.location.href = "/"; // 네 라우트에 맞게 수정
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
                  <span className="file">없음</span>
                </td>
                <th>작성일자</th>
                <td>{kstTime}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="Community-view-main">
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
          {post.user_id === currentUserId && (
            <div className="post-action-buttons">
              {!isEditing ? (
                <>
                  <button
                    className="post-btn edit"
                    onClick={() => setIsEditing(true)}
                  >
                    ✏ 수정
                  </button>
                  <button className="post-btn delete" onClick={deletePost}>
                    🗑 삭제
                  </button>
                </>
              ) : (
                <>
                  <button className="post-btn save" onClick={saveEdit}>
                    💾 저장
                  </button>
                  <button
                    className="post-btn cancel"
                    onClick={() => setIsEditing(false)}
                  >
                    취소
                  </button>
                </>
              )}
            </div>
          )}

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

          <div className="add-comment">
            <textarea
              placeholder="댓글을 입력하세요"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />

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
