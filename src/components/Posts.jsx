import "../css/Community.css";
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import CommunityPost from "../components/CommunityPost";

function Community() {
  const [posts, setPosts] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const userData = useMemo(() => {
    return localStorage.getItem("user") || sessionStorage.getItem("user");
  }, []);

  // ✅ 페이지네이션 state 추가
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const getPosts = async () => {
      try {
        setLoading(true);
        setErrorMsg("");

        // ✅ page/limit 적용
        const resp = await fetch(`/api/posts?page=${page}&limit=10`);
        if (!resp.ok) throw new Error("failed to fetch posts");
        const data = await resp.json();

        // ✅ 이제 API 응답이 { posts, total_pages, ... } 형태
        const list = Array.isArray(data) ? data : (data?.posts ?? []);
        setPosts(list);

        // total_pages는 객체일 때만 있으니까 없으면 1
        setTotalPages(Array.isArray(data) ? 1 : (data?.total_pages ?? 1));

      } catch (e) {
        console.error(e);
        setErrorMsg("게시글을 불러오지 못했습니다.");
        setPosts([]);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    };

    getPosts();
  }, [page]);

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

  // ✅ 페이지 번호(10개 단위로 보여주기) 계산
  const pageNumbers = useMemo(() => {
    const groupStart = Math.floor((page - 1) / 10) * 10 + 1;
    const groupEnd = Math.min(totalPages, groupStart + 9);
    return Array.from({ length: groupEnd - groupStart + 1 }, (_, i) => groupStart + i);
  }, [page, totalPages]);

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
            <img src="/images/icon/search1.png" alt="검색" />
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

      {/* ✅ 페이지네이션 동작하도록 교체 */}
      <footer className="Community-footer">
        <div className="Community-footer-content">
          <div className="page-number">
            <button
              className="prev"
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              ←
            </button>

            {pageNumbers.map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setPage(num)}
                style={{
                  fontWeight: num === page ? "700" : "400",
                  textDecoration: num === page ? "underline" : "none",
                }}
              >
                {num}
              </button>
            ))}

            <button
              className="next"
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              →
            </button>
          </div>

          {
            userData &&
            <Link to={"/post/new"}>
              <button className="write-button">
                <img src="./images/icon/pan.png" alt="" />
              </button>
            </Link>
          }
        </div>
      </footer>
    </section>
  );
}

export default Community;
