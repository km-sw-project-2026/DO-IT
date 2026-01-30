import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

const Post = () => {
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

  // 공통 로드 함수 (상세 + 댓글)
  const load = async () => {
    const resp = await fetch(`/api/post/${id}`);
    const postResp = await resp.json();
    setPost(postResp);

    const cResp = await fetch(`/api/post/${id}/comments`);
    const cJson = await cResp.json();
    setComments(cJson);
  };

  useEffect(() => {
    load().catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // post가 로드되면 수정 입력칸 기본값 세팅
  useEffect(() => {
    if (post && !post.message) {
      setEditTitle(post.title ?? "");
      setEditContent(post.content ?? "");
    }
  }, [post]);

  // 댓글 작성
  const addComment = async () => {
    if (!newComment.trim()) return;

    const resp = await fetch(`/api/post/${id}/comments`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ content: newComment, user_id: currentUserId }),
    });

    const data = await resp.json();
    if (!resp.ok) {
      alert(data?.message || "댓글 작성 실패");
      return;
    }

    setNewComment("");
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
    // 우회로 유지: 홈으로 이동 (직접 /post 새로고침 404 방지)
    window.location.href = "/";
  };

  if (!post) return <div>Loading...</div>;
  if (post?.message) return <div>Error: {post.message}</div>;

  // 게시글 시간 KST
  const kstTime = new Date(post.created_at.replace(" ", "T") + "Z").toLocaleString(
    "ko-KR",
    { timeZone: "Asia/Seoul" }
  );

  return (
    <div>
      {/* ✅ 내 글일 때만 수정/삭제 */}
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

      {/* 제목/내용: 수정 모드면 입력칸 */}
      {!isEditing ? (
        <>
          <h1>{post.title}</h1>
          <p>{post.content}</p>
        </>
      ) : (
        <>
          <input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            style={{ width: "100%", padding: 8 }}
          />
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={8}
            style={{ width: "100%", padding: 8, marginTop: 8 }}
          />
        </>
      )}

      <p>
        <small>
          작성일: {kstTime} / 조회수: {post.view_count}
        </small>
      </p>

      <hr />

      <h3>댓글</h3>
      <div>
        <input
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="댓글을 입력하세요"
        />
        <button onClick={addComment}>등록</button>
      </div>

      <div style={{ marginTop: 10 }}>
        {comments.length === 0 && <p>댓글이 없습니다.</p>}
        {comments.map((c) => {
          const kstCommentTime = new Date(
            c.created_at.replace(" ", "T") + "Z"
          ).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });

          return (
            <div
              key={c.comment_id}
              style={{ borderBottom: "1px solid #eee", padding: "6px 0" }}
            >
              <div>{c.content}</div>
              <small>{kstCommentTime}</small>
            </div>
          );
        })}
      </div>

      <p style={{ marginTop: 16 }}>
        <Link to="/">홈으로</Link> | <Link to="/post">목록</Link>
      </p>
    </div>
  );
};

export default Post;
