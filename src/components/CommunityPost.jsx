import "../css/CommunityPost.css";

function CommunityPost({ post }) {
  const kstDate = new Date(post.created_at.replace(" ", "T") + "Z")
    .toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" });

  return (
    <div className="Community-post">
      <div className="Community-post-content">
        <Link to={`/post/${post.post_id}`} className="Community-post-link">
          <h4>{post.title}</h4>

          <div className="Community-content">
            <span className="view">{post.view_count || 0}</span>
            <span className="date">{kstDate}</span>
            <span className="Comment">{post.comment_count || 0}</span>
          </div>
        </Link>
      </div>
    </div>
  );
}

export default CommunityPost;
