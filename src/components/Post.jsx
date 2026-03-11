import "../css/CommunityView.css";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { getCurrentUser } from "../utils/auth";

function CommunityView() {
  const navigate = useNavigate();

  // ✅ 로그인 유저
  const me = getCurrentUser();
  const currentUserId = me?.user_id ?? null;

  const params = useParams();
  const rawId = params.id ?? params.post_id ?? params.postId;

  const postId = useMemo(() => {
    const n = Number(rawId);
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [rawId]);

  const [post, setPost] = useState(null);

  // 댓글
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");

  // ✅ 대댓글 입력창 상태
  const [replyOpen, setReplyOpen] = useState(null); // comment_id
  const [replyText, setReplyText] = useState("");

  // 수정 기능용 state
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  // ✅ 댓글 불러오기
  const fetchCommentsApi = async (pid) => {
    const resp = await fetch(`/api/post/${pid}/comments`);
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) throw new Error(data?.message || "댓글 불러오기 실패");
    return Array.isArray(data) ? data : data.comments || [];
  };

  const createCommentApi = async (pid, content, userId, parentId = null) => {
    const resp = await fetch(`/api/post/${pid}/comments`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        content,
        user_id: Number(userId),
        parent_id: parentId === null ? null : Number(parentId),
      }),
    });

    const data = await resp.json().catch(() => ({}));

    // ✅ 여기 로그가 제일 중요
    console.log("댓글 등록 응답:", resp.status, data);

    if (!resp.ok) throw new Error(data?.message || `댓글 작성 실패 (${resp.status})`);
    return data;
  };
  // ✅ 댓글 삭제 (내 댓글 or 관리자)
  const deleteComment = async (commentId) => {
    if (!postId) return;

    if (!currentUserId) {
      alert("로그인 후 이용하세요.");
      navigate("/login");
      return;
    }

    if (!window.confirm("댓글을 삭제할까요?")) return;

    try {
      const resp = await fetch(`/api/post/${postId}/comments`, {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          comment_id: commentId,
          user_id: currentUserId,
        }),
      });

      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        alert(data?.message || "댓글 삭제 실패");
        return;
      }

      await loadComments();
    } catch (e) {
      console.error(e);
      alert("네트워크 오류로 댓글 삭제 실패");
    }
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
    if (!resp.ok) {
      setPost({ message: postJson?.message || `게시글을 불러오지 못했어요. (${resp.status})` });
      return;
    }
    setPost(postJson);

    await loadComments();
  };

  useEffect(() => {
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

  // ✅ 댓글 신고 함수
  const reportComment = async (comment) => {
    if (!currentUserId) {
      alert("로그인 후 이용하세요.");
      navigate("/login");
      return;
    }

    if (comment.user_id === currentUserId) {
      alert("본인의 댓글은 신고할 수 없어요.");
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

  const [isCommentSubmitting, setIsCommentSubmitting] = useState(false);

  // ✅ 최상위 댓글 작성
  const addComment = async () => {
    if (isCommentSubmitting) return;           // ✅ 연타 방지
    if (!postId) return alert("잘못된 게시글 id");

    const text = newComment.trim();
    if (!text) return;

    if (!postId) return alert("postId 없음");
    if (!currentUserId) return alert("로그인 후 이용");

    setIsCommentSubmitting(true);              // ✅ 잠금
    try {
      await createCommentApi(postId, text, Number(currentUserId), null);
      setNewComment("");
      await loadComments();
    } catch (e) {
      alert(e?.message || "댓글 작성 실패");
    } finally {
      setIsCommentSubmitting(false);           // ✅ 잠금 해제
    }
  };


  const [isReplySubmitting, setIsReplySubmitting] = useState(false);


  // ✅ 대댓글 작성
  const addReply = async (parentCommentId) => {
    if (isReplySubmitting) return; // ✅ 이미 요청 중이면 막기

    const text = replyText.trim();
    if (!text) return;

    if (!postId) return alert("postId 없음");
    if (!currentUserId) return alert("로그인 후 이용");

    try {
      setIsReplySubmitting(true); // ✅ 잠금 ON

      await createCommentApi(
        postId,
        text,
        Number(currentUserId),
        Number(parentCommentId)
      );

      setReplyText("");
      setReplyOpen(null);
      await loadComments();

    } catch (e) {
      alert(e?.message || "답글 작성 실패");
    } finally {
      setIsReplySubmitting(false); // ✅ 잠금 OFF
    }
  };


  // ✅ 글 수정 저장
  const saveEdit = async () => {
    if (!postId) return;

    if (!currentUserId) {
      alert("로그인 후 이용하세요.");
      navigate("/login");
      return;
    }

    if (!editTitle.trim() || !editContent.trim()) {
      alert("제목/내용을 입력해줘!");
      return;
    }

    try {
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
    } catch {
      alert("네트워크 오류로 수정에 실패했습니다.");
    }
  };

  // ✅ 글 삭제
  const deletePost = async () => {
    if (!postId) return;

    if (!currentUserId) {
      alert("로그인 후 이용하세요.");
      navigate("/login");
      return;
    }

    if (!window.confirm("정말 삭제할까?")) return;

    try {
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
      window.location.href = "/post";
    } catch {
      alert("네트워크 오류로 삭제에 실패했습니다.");
    }
  };

  // ✅ 댓글 트리 만들기 (parent_id 기준)
  const commentTree = useMemo(() => {
    const map = new Map();
    const roots = [];

    for (const c of comments) {
      map.set(c.comment_id, { ...c, children: [] });
    }

    for (const c of comments) {
      const node = map.get(c.comment_id);
      const parentId = c.parent_id ?? null;
      if (parentId && map.has(parentId)) {
        map.get(parentId).children.push(node);
      } else {
        roots.push(node);
      }
    }

    // children 정렬 (created_at ASC)
    const sortRec = (arr) => {
      arr.sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)));
      for (const n of arr) sortRec(n.children);
    };
    sortRec(roots);

    return roots;
  }, [comments]);

  if (!post) return <div>Loading...</div>;
  if (post?.message) return <div>Error: {post.message}</div>;

  // 게시글 시간 KST
  const kstTime = post.created_at
    ? new Date(post.created_at.replace(" ", "T") + "Z").toLocaleString(
        "ko-KR",
        { timeZone: "Asia/Seoul" }
      )
    : "";

  // ✅ 댓글 한 줄바꿈 보이게
  const renderTextWithBreaks = (text) => {
    const s = String(text ?? "");
    return s.split("\n").map((line, idx) => (
      <span key={idx}>
        {line}
        <br />
      </span>
    ));
  };

  // ✅ 댓글 렌더(재귀)
  const renderCommentNode = (c, depth = 0) => {
    const kstCommentTime = new Date(
      c.created_at?.replace(" ", "T") + "Z"
    ).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });

    const nick = c.commenter_nickname ?? "(알 수 없음)";
    const canDelete =
      currentUserId &&
      (Number(c.user_id) === Number(currentUserId) || me?.role === "ADMIN");

    return (
      <div
        key={c.comment_id}
        className={`comment-item ${depth > 0 ? "reply-item" : ""}`}
        style={{
          borderBottom: depth === 0 ? "1px solid #eee" : "none",
          padding: "10px 0",
          marginLeft: depth * 22, // ✅ 들여쓰기
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
          <div className="comment-content">{renderTextWithBreaks(c.content)}</div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {/* ✅ 답글 버튼 (depth 0일 때만, 원하면 depth 1까지도 허용 가능) */}
            {currentUserId && depth === 0 && (
              <button
                type="button"
                style={{ fontSize: 12 }}
                onClick={() => {
                  setReplyOpen((prev) => (prev === c.comment_id ? null : c.comment_id));
                  setReplyText("");
                }}
              >
                답글
              </button>
            )}

            {/* ✅ 삭제 (내 댓글 or 관리자) */}
            {canDelete && (
              <button
                type="button"
                onClick={() => deleteComment(c.comment_id)}
                style={{ fontSize: 12 }}
              >
                삭제
              </button>
            )}

            {/* ✅ 신고 (글 작성자만) */}
            {currentUserId && Number(post.user_id) === Number(currentUserId) && (
              <button
                type="button"
                onClick={() => reportComment(c)}
                style={{ fontSize: 12 }}
              >
                신고
              </button>
            )}
          </div>
        </div>

        <small>
          {c.commenter_role === "ADMIN" && (
            <span className="badge-admin">ADMIN</span>
          )}
          {nick} · {kstCommentTime}
        </small>

        {/* ✅ 대댓글 입력창 */}
        {replyOpen === c.comment_id && (
          <div style={{ marginTop: 8, display: "grid", gap: 6 }}>
            <textarea
              className="reply-textarea"
              placeholder="대댓글을 입력하세요"
              value={replyText}
              maxLength={200}
              onChange={(e) => setReplyText(e.target.value)}
              rows={3}
              style={{
                width: "100%",
                padding: 10,
                boxSizing: "border-box",
                resize: "none",          // ✅ 크기 변경 막기
                overflow: "auto",        // ✅ 내용 많아지면 스크롤
                borderRadius: 8,
                border: "1px solid #ddd",
              }}
            />

            <div style={{ fontSize: 12, color: "#666", textAlign: "right" }}>
              {replyText.length} / 200
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                onClick={() => addReply(c.comment_id)}
                disabled={isReplySubmitting}
              >
                {isReplySubmitting ? "작성 중..." : "답글 작성"}
              </button>


              <button
                type="button"
                onClick={() => {
                  setReplyOpen(null);
                  setReplyText("");
                }}
              >
                취소
              </button>
            </div>
          </div>
        )}

        {/* ✅ children 렌더 */}
        {c.children?.length > 0 && (
          <div style={{ marginTop: 8 }}>
            {c.children.map((child) => renderCommentNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

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
                <td>
                  {post.author_role === "ADMIN" && (
                    <span className="badge-admin">ADMIN</span>
                  )}
                  {post.author_nickname ?? "(알 수 없음)"}
                </td>
                <th>조회수</th>
                <td>{post.view_count ?? 0}</td>
              </tr>

              <tr>
                <th>첨부파일</th>
                <td>
                  {post.files && post.files.length > 0 ? (
                    <div className="post-files">
                      {post.files.map((f) => {
                        const isImage = f.mime_type?.startsWith("image/");
                        const handleDownload = () => {
                          const a = document.createElement("a");
                          a.href = f.stored_key;
                          a.download = f.original_name;
                          a.click();
                        };
                        return (
                          <div key={f.file_id} className="post-file-item">
                            {isImage ? (
                              <button type="button" className="post-file-link" onClick={handleDownload}>
                                <img src={f.stored_key} alt={f.original_name} className="post-file-thumb" />
                                <span>{f.original_name}</span>
                              </button>
                            ) : (
                              <button type="button" className="post-file-link" onClick={handleDownload}>
                                📎 {f.original_name}
                                <span className="post-file-size">({(f.size / 1024 / 1024).toFixed(1)}MB)</span>
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <span className="file">없음</span>
                  )}
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
          <>
            <p className="post-content" style={{ whiteSpace: "pre-wrap" }}>
              {post.content}
            </p>
            {post.files && post.files.some((f) => f.mime_type?.startsWith("image/")) && (
              <div className="post-image-gallery">
                {post.files.filter((f) => f.mime_type?.startsWith("image/")).map((f) => (
                  <img key={f.file_id} src={f.stored_key} alt={f.original_name} className="post-gallery-img" />
                ))}
              </div>
            )}
          </>
        ) : (
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={10}
            style={{ width: "100%", padding: "8px", marginTop: 8 }}
          />
        )}

        <div className="comments-section">
          {/* ✅ 작성자 OR 관리자만 게시글 관리 버튼 표시 */}
          {currentUserId &&
            (Number(post.user_id) === Number(currentUserId) || me?.role === "ADMIN") && (
              <div className="post-action-buttons">
                {!isEditing ? (
                  <>
                    {/* ✏ 수정은 작성자만 가능 */}
                    {Number(post.user_id) === Number(currentUserId) && (
                      <button
                        type="button"
                        className="post-btn edit"
                        onClick={() => setIsEditing(true)}
                      >
                        ✏ 수정
                      </button>
                    )}

                    {/* 🗑 삭제는 작성자 OR 관리자 */}
                    <button
                      type="button"
                      className="post-btn delete"
                      onClick={deletePost}
                    >
                      🗑 삭제
                    </button>
                  </>
                ) : (
                  <>
                    <button type="button" className="post-btn save" onClick={saveEdit}>
                      💾 저장
                    </button>

                    <button
                      type="button"
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
            {commentTree.length === 0 && <p>댓글이 없습니다.</p>}
            {commentTree.map((c) => renderCommentNode(c, 0))}
          </div>

          {/* ✅ 최상위 댓글 입력 */}
          <div className="add-comment">
            <textarea
              placeholder="댓글을 입력하세요"
              value={newComment}
              maxLength={200}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <div style={{ fontSize: 12, color: "#666", textAlign: "right" }}>
              {newComment.length} / 200
            </div>

            <button className="comment-btn" onClick={addComment} disabled={isCommentSubmitting}>
              {isCommentSubmitting ? "작성 중..." : "댓글 작성"}
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
