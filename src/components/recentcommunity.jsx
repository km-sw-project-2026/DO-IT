import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function RecentCommunity() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setErr("");

        // ✅ 너 Functions 경로 기준: /api/post
        const resp = await fetch("/api/posts?page=1");
        if (!resp.ok) throw new Error(`API 오류: ${resp.status}`);

        const data = await resp.json();

        // ✅ 일반글 최신 4개
        setItems((data?.posts || []).slice(0, 4));
      } catch (e) {
        setErr(e?.message || "최근글 불러오기 실패");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) return <div style={{ padding: 8 }}>불러오는 중...</div>;
  if (err) return <div style={{ padding: 8 }}>에러: {err}</div>;
  if (items.length === 0) return <div style={{ padding: 8 }}>최근 글이 없어</div>;

  const getPostId = (post) => post?.post_id ?? post?.id;

  return (
    <ul className="recent-list">
      {items.map((p) => {
        const postId = getPostId(p);
        if (!postId) return null;

        const date = new Date((p.created_at ?? "").replace(" ", "T") + "Z")
          .toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" });

        return (
          <li key={postId}>
            <Link
              to={`/post/${postId}`}
              style={{ display: "flex", justifyContent: "space-between", gap: 12, textDecoration: "none", color: "inherit" }}
            >
              <span>{p.title}</span>
              <span className="recent-date">{date}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
