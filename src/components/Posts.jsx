import "../css/Community.css";
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import CommunityPost from "../components/CommunityPost";

function Community() {
  const [posts, setPosts] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const getPosts = async () => {
      try {
        setLoading(true);
        setErrorMsg("");

        const resp = await fetch("/api/posts");
        if (!resp.ok) throw new Error("failed to fetch posts");
        const data = await resp.json();

        const list = Array.isArray(data) ? data : data?.posts ?? [];
        setPosts(list);
      } catch (e) {
        console.error(e);
        setErrorMsg("게시글을 불러오지 못했습니다.");
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    getPosts();
  }, []);

  const filteredPosts = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    if (!q) return posts;

    return posts.filter((p) => {
      const title = (p.title ?? "").toLowerCase();
      const content = (p.content ?? "").toLowerCase();
      return title.includes(q) || content.includes(q);
    });
  }, [posts, keyword]);

  const formatDate = (value) => {
    if (!value) return "-";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString("ko-KR");
  };

  return (
    <section className="Community">
      <div className="Community-header">
        <div className="search">
          <input
            type="text"
            placeholder="검색어를 입력해세요"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <button type="button">
            <img src="./images/icon/search1.png" alt="검색" />
          </button>
        </div>
      </div>

      <div className="Community-main">
        <div className="Community-main-title">
          <div className="Community-main-title-content">
            <h2>제목</h2>
            <div className="Community-title-content">
              <span className="view">조회수</span>
              <span className="date">등록일</span>
              <span className="comment">댓글</span>
            </div>
          </div>
        </div>

        {loading && <p style={{ padding: "12px" }}>불러오는 중...</p>}
        {!loading && errorMsg && <p style={{ padding: "12px" }}>{errorMsg}</p>}

        {!loading && !errorMsg && filteredPosts.length === 0 && (
          <p style={{ padding: "12px" }}>게시글이 없습니다.</p>
        )}

        {!loading &&
          !errorMsg &&
          filteredPosts.map((post) => (
            <CommunityPost
              key={post.post_id}
              post={post}
              formatDate={formatDate}
            />
          ))}
      </div>

      <footer className="Community-footer">
        <div className="Community-footer-content">
          <div className="page-number">
            <button className="prev">←</button>
            <button>1</button>
            <button>2</button>
            <button>3</button>
            <button>4</button>
            <button>5</button>
            <span>...</span>
            <button>23</button>
            <button className="next">→</button>
          </div>

          <Link to={"/post/new"}>
            <button className="write-button">
              <img src="./images/icon/pan.png" alt="" />
            </button>
          </Link>
        </div>
      </footer>
    </section>
  );
}

export default Community;

