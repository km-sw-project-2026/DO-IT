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
        <h4>{post.title}</h4>

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
