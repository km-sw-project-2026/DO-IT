import "../css/Community.css";
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import CommunityPost from "./CommunityPost";

function MypagePosts() {
  const PAGE_SIZE = 10;

  // ✅ 서버에서 받아온 "내 글 전체"를 들고 있는 원본
  const [allPosts, setAllPosts] = useState([]);
  const [allNoticePosts, setAllNoticePosts] = useState([]);

  // ✅ 화면에 보여줄 (현재 페이지 10개)
  const [posts, setPosts] = useState([]);
  const [noticePosts, setNoticePosts] = useState([]);

  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const userDataRaw = useMemo(() => {
    return localStorage.getItem("user") || sessionStorage.getItem("user");
  }, []);

  const currentUserId = useMemo(() => {
    if (!userDataRaw) return null;
    try {
      const u = JSON.parse(userDataRaw);
      const id =
        u?.user_id ??
        u?.id ??
        u?.user?.user_id ??
        u?.user?.id ??
        u?.result?.user_id ??
        null;
      return id != null ? Number(id) : null;
    } catch {
      return null;
    }
  }, [userDataRaw]);

  const [page, setPage] = useState(1);

  // ✅ 1) 내 글을 "한 번에" 전부 받아오기
  useEffect(() => {
    const fetchMineAll = async () => {
      try {
        setLoading(true);
        setErrorMsg("");
        setPage(1);

        if (!currentUserId) {
          setAllNoticePosts([]);
          setAllPosts([]);
          return;
        }

        // 서버는 페이지 단위로 응답하므로 모든 페이지를 가져와서 클라이언트에서 내 글만 필터링합니다.
        const firstResp = await fetch(`/api/posts?page=1`);
        if (!firstResp.ok) throw new Error("failed to fetch posts page 1");
        const firstData = await firstResp.json();

        const serverNotice = Array.isArray(firstData?.notice_posts) ? firstData.notice_posts : [];

        // 총 페이지 수를 이용해 나머지 페이지를 병렬로 요청
        const totalPagesFromServer = Number(firstData?.total_pages || 1);
        const pageFetches = [];
        for (let p = 2; p <= totalPagesFromServer; p++) {
          pageFetches.push(fetch(`/api/posts?page=${p}`).then((r) => {
            if (!r.ok) return null;
            return r.json().catch(() => null);
          }).catch(() => null));
        }

        const otherPages = (await Promise.all(pageFetches)).filter(Boolean);

        // 모든 posts 합치기
        const allServerPosts = [
          ...(Array.isArray(firstData?.posts) ? firstData.posts : []),
          ...otherPages.flatMap((d) => (Array.isArray(d?.posts) ? d.posts : [])),
        ];

        // 서버 공지글은 1페이지에서 이미 포함되므로 firstData에서 가져온 것을 사용
        const onlyMineNotice = serverNotice.filter((p) => Number(p?.user_id) === currentUserId);
        const onlyMinePosts = allServerPosts.filter((p) => Number(p?.user_id) === currentUserId);

        setAllNoticePosts(onlyMineNotice);
        setAllPosts(onlyMinePosts);
      } catch (e) {
        console.error(e);
        setErrorMsg("내 게시글을 불러오지 못했습니다.");
        setAllNoticePosts([]);
        setAllPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMineAll();
  }, [currentUserId]);

  // ✅ 2) 검색 적용(내 글 전체에서 검색)
  const filteredAllNotice = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    if (!q) return allNoticePosts;
    return allNoticePosts.filter((p) => {
      const title = (p.title ?? "").toLowerCase();
      const content = (p.content ?? "").toLowerCase();
      return title.includes(q) || content.includes(q);
    });
  }, [allNoticePosts, keyword]);

  const filteredAllPosts = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    if (!q) return allPosts;
    return allPosts.filter((p) => {
      const title = (p.title ?? "").toLowerCase();
      const content = (p.content ?? "").toLowerCase();
      return title.includes(q) || content.includes(q);
    });
  }, [allPosts, keyword]);

  // ✅ 3) 페이지당 10개로 자르기 (글이 적으면 1페이지에 다 나옴)
  const totalPages = useMemo(() => {
    const count = filteredAllPosts.length;
    return Math.max(1, Math.ceil(count / PAGE_SIZE));
  }, [filteredAllPosts.length]);

  useEffect(() => {
    // 검색 결과가 줄어서 현재 page가 범위를 벗어나면 1페이지로
    if (page > totalPages) setPage(1);

    const start = (page - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;

    setPosts(filteredAllPosts.slice(start, end));
    setNoticePosts(filteredAllNotice); // 공지는 "내 공지" 전체 (원하면 1페이지에서만 보여도 됨)
  }, [page, totalPages, filteredAllPosts, filteredAllNotice]);

  const formatDate = (value) => {
    if (!value) return "-";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString("ko-KR");
  };

  const pageNumbers = useMemo(() => {
    const groupStart = Math.floor((page - 1) / 10) * 10 + 1;
    const groupEnd = Math.min(totalPages, groupStart + 9);
    return Array.from(
      { length: groupEnd - groupStart + 1 },
      (_, i) => groupStart + i
    );
  }, [page, totalPages]);

  const nothingToShow = useMemo(() => {
    // "내 글 전체" 기준으로 판단
    return filteredAllNotice.length === 0 && filteredAllPosts.length === 0;
  }, [filteredAllNotice.length, filteredAllPosts.length]);

  return (
    <section className="Community">
      <div className="Community-header">
        <div className="search">
          <input
            type="text"
            placeholder="검색어를 입력해주세요"
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

        {!currentUserId && !loading && (
          <p style={{ padding: "12px" }}>로그인 후 내 글을 볼 수 있어요.</p>
        )}

        {loading && <p style={{ padding: "12px" }}>불러오는 중...</p>}
        {!loading && errorMsg && <p style={{ padding: "12px" }}>{errorMsg}</p>}

        {!loading && !errorMsg && currentUserId && nothingToShow && (
          <p style={{ padding: "12px" }}>내가 작성한 게시글이 없습니다.</p>
        )}

        {/* ✅ 공지(내 공지) - 원하면 1페이지에서만 보여도 됨 */}
        {!loading && !errorMsg && page === 1 && noticePosts.length > 0 && (
          <div className="notice-section">
            <div className="notice-section-head">
              <span className="notice-title">📌 공지(상단 고정)</span>
              <span className="notice-sub">관리자가 고정한 글이에요</span>
            </div>

            <div className="notice-list">
              {noticePosts.map((post) => (
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

        {/* ✅ 일반 게시글(내 글) - 현재 페이지 10개 */}
        {!loading && !errorMsg && posts.length > 0 && (
          <div className="normal-section">
            {posts.map((post) => (
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

          {userDataRaw && (
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

export default MypagePosts;