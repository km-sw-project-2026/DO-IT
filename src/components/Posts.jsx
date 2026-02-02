import "../css/Community.css";
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import CommunityPost from "../components/CommunityPost";

function Community() {
  const [posts, setPosts] = useState([]); // ✅ 일반글만
  const [noticePosts, setNoticePosts] = useState([]); // ✅ 공지글만
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const userData = useMemo(() => {
    return localStorage.getItem("user") || sessionStorage.getItem("user");
  }, []);

  // ✅ 페이지네이션 state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const getPosts = async () => {
      try {
        setLoading(true);
        setErrorMsg("");

        // ✅ 서버가 page 기준으로:
        // - notice_posts: 공지(항상)
        // - posts: 일반글(1p=8개, 2p~10개)
        const resp = await fetch(`/api/posts?page=${page}`);
        if (!resp.ok) throw new Error("failed to fetch posts");
        const data = await resp.json();

        setNoticePosts(data?.notice_posts ?? []);
        setPosts(data?.posts ?? []);
        setTotalPages(data?.total_pages ?? 1);
      } catch (e) {
        console.error(e);
        setErrorMsg("게시글을 불러오지 못했습니다.");
        setNoticePosts([]);
        setPosts([]);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    };

    getPosts();
  }, [page]);

  // ✅ 검색 필터
  // (주의: 서버 페이징이라 검색은 "현재 페이지에 불러온 목록"에서만 필터링됨)
  const filteredNoticePosts = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    if (!q) return noticePosts;

    return noticePosts.filter((p) => {
      const title = (p.title ?? "").toLowerCase();
      const content = (p.content ?? "").toLowerCase();
      return title.includes(q) || content.includes(q);
    });
  }, [noticePosts, keyword]);

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

  // ✅ 페이지 번호(10개 단위)
  const pageNumbers = useMemo(() => {
    const groupStart = Math.floor((page - 1) / 10) * 10 + 1;
    const groupEnd = Math.min(totalPages, groupStart + 9);
    return Array.from({ length: groupEnd - groupStart + 1 }, (_, i) => groupStart + i);
  }, [page, totalPages]);

  const nothingToShow = useMemo(() => {
    // 1페이지 → 공지 + 일반글 둘 다 없을 때
    if (page === 1) {
      return noticePosts.length === 0 && normalPosts.length === 0;
    }

    // 2페이지 이상 → 일반글만 없을 때
    return normalPosts.length === 0;
  }, [page, noticePosts, normalPosts]);

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

        {/* ✅ 공지 섹션: 1페이지에서만 보여주기 */}
        {!loading && !errorMsg && page === 1 && filteredNoticePosts.length > 0 && (
          <div className="notice-section">
            <div className="notice-section-head">
              <span className="notice-title">📌 공지(상단 고정)</span>
              <span className="notice-sub">관리자가 고정한 글이에요</span>
            </div>

            <div className="notice-list">
              {filteredNoticePosts.map((post) => (
                <div key={post.post_id} className="notice-row">
                  <span className="badge-notice">공지</span>
                  <div className="notice-post">
                    <CommunityPost post={post} formatDate={formatDate} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ✅ 게시글 없음 */}
        {!loading && !errorMsg && nothingToShow && (
          <p style={{ padding: "12px" }}>게시글이 없습니다.</p>
        )}

        {/* ✅ 일반 게시글 */}
        {!loading && !errorMsg && normalPosts.length > 0 && (
          <div className="normal-section">
            {normalPosts.map((post) => (
              <CommunityPost
                key={post.post_id}
                post={post}
                formatDate={formatDate}
              />
            ))}
          </div>
        )}
      </div>

      {/* ✅ 페이지네이션 */}
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

          {userData && (
            <Link to={"/post/new"}>
              <button className="write-button">
                <img src="./images/icon/pan.png" alt="" />
              </button>
            </Link>
          )}
        </div>
      </footer>
    </section>
  );
}

export default Community;
