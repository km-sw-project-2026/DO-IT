import "../css/CommunityPost.css";
import { Link } from "react-router-dom";

function CommunityPost({ post }) {
  const kstDate = new Date((post.created_at ?? "").replace(" ", "T") + "Z")
    .toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" });

  return (
    <div className="Community-post">
      <Link
        to={`/post/${post.post_id}`}
        className="Community-post-content"
        style={{ textDecoration: "none", color: "inherit" }}
      >
        {/* ✅ 제목 + 관리자 뱃지 */}
        <h4 className="post-title">
          {post.author_role === "ADMIN" && (
            <span className="badge-admin">ADMIN</span>
          )}
          {post.title}
        </h4>

        {/* ✅ 작성자 표시 */}
        <div className="post-writer">
          {post.author_nickname ?? "(알 수 없음)"}
        </div>

        <div className="Community-content">
          <span className="view">{post.view_count || 0}</span>
          <span className="date">{kstDate}</span>
          <span className="Comment">{post.comment_count || 0}</span>
        </div>
      </Link>
    </div>
  );
}

export default CommunityPost;
