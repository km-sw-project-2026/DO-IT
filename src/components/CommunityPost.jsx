import "../css/CommunityPost.css";
import { Link } from "react-router-dom";

function CommunityPost({ post }) {

  // ✅ 작성일 KST 변환
  const kstDate = new Date(post.created_at.replace(" ", "T") + "Z")
    .toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" });

  return (
    <div className="Community-post">
      <Link to={`/post/${post.post_id}`} className="Community-post-content">
        <h4>{post.title}</h4>

        <div className="Community-content">
          {/* 조회수 */}
          <span className="view">{post.view_count || 0}</span>

          {/* 작성일 (KST) */}
          <span className="date">{kstDate}</span>

          {/* 댓글 수 */}
          <span className="Comment">{post.comment_count || 0}</span>
        </div>
      </Link>
    </div>
  );
}

export default CommunityPost;
