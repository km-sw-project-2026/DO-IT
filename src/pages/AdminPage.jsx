import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser, isAdmin } from "../utils/auth";

export default function AdminPage() {
    const navigate = useNavigate();
    const me = getCurrentUser();
    const adminId = me?.user_id;

    const [reports, setReports] = useState([]);
    const [noticePostId, setNoticePostId] = useState("");
    const [banUserId, setBanUserId] = useState("");
    const [banDays, setBanDays] = useState(7);

    useEffect(() => {
        if (!me) {
            alert("로그인 후 이용하세요.");
            navigate("/login");
            return;
        }
        if (!isAdmin()) {
            alert("관리자만 접근할 수 있어요.");
            navigate("/");
            return;
        }
        loadReports();
        // eslint-disable-next-line
    }, []);

    const loadReports = async () => {
        const resp = await fetch(`/api/admin/reports?status=OPEN&user_id=${adminId}`);
        const data = await resp.json().catch(() => ({}));
        if (!resp.ok) return alert(data?.message || "신고 목록 불러오기 실패");
        setReports(data.reports || []);
    };

    const resolveReport = async (report_id) => {
        const resp = await fetch("/api/admin/reports", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ user_id: adminId, report_id }),
        });
        const data = await resp.json().catch(() => ({}));
        if (!resp.ok) return alert(data?.message || "처리 실패");
        await loadReports();
    };

    const setNotice = async (is_notice) => {
        const post_id = Number(noticePostId);
        if (!post_id) return alert("공지로 설정할 post_id를 입력하세요.");

        const resp = await fetch("/api/admin/notice", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                user_id: adminId,
                post_id,
                on: is_notice === 1, // ✅ 서버가 기대하는 형식
            }),
        });

        const data = await resp.json().catch(() => ({}));
        if (!resp.ok) return alert(data?.message || "공지 설정 실패");
        alert(data?.message || "완료!");
    };


    const banUser = async () => {
        const target = String(banUserId).trim();
        if (!target) return alert("차단할 유저의 user_id(숫자) 또는 아이디를 입력하세요.");

        const resp = await fetch("/api/admin/ban", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                user_id: adminId,
                target,        // ✅ 숫자든 문자열이든 그대로
                days: banDays,
            }),
        });

        const data = await resp.json().catch(() => ({}));
        if (!resp.ok) return alert(data?.message || "차단 실패");
        alert(data?.message || "차단 완료!");
    };

    const unbanUser = async () => {
        const target = String(banUserId).trim();
        if (!target) return alert("해제할 유저의 user_id(숫자) 또는 아이디를 입력하세요.");

        const resp = await fetch("/api/admin/ban", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                user_id: adminId,
                target,
                days: 0,
            }),
        });

        const data = await resp.json().catch(() => ({}));
        if (!resp.ok) return alert(data?.message || "해제 실패");
        alert(data?.message || "차단 해제 완료!");
    };


    return (
        <div style={{ padding: 20 }}>
            <h2>관리자 페이지</h2>

            <section style={{ marginTop: 24 }}>
                <h3>신고 목록</h3>
                <button onClick={loadReports}>새로고침</button>

                {reports.length === 0 ? (
                    <p style={{ marginTop: 12 }}>신고가 없습니다.</p>
                ) : (
                    <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                        {reports.map((r) => (
                            <div key={r.report_id} style={{ border: "1px solid #ddd", padding: 12 }}>
                                <div>
                                    <b>#{r.report_id}</b> [{r.report_type}] {r.report_content}
                                </div>
                                <div style={{ fontSize: 13, opacity: 0.8 }}>
                                    신고자: {r.reporter_nick ?? r.reporter_id} / 대상: {r.reported_nick ?? r.reported_id}
                                </div>
                                <button style={{ marginTop: 8 }} onClick={() => resolveReport(r.report_id)}>
                                    처리 완료
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            <section style={{ marginTop: 24 }}>
                <h3>공지(상단 고정)</h3>
                <input
                    placeholder="post_id"
                    value={noticePostId}
                    onChange={(e) => setNoticePostId(e.target.value)}
                />
                <button onClick={() => setNotice(1)}>공지로 설정</button>
                <button onClick={() => setNotice(0)}>공지 해제</button>
            </section>

            <section style={{ marginTop: 24 }}>
                <h3>유저 차단</h3>
                <input
                    placeholder="target user_id"
                    value={banUserId}
                    onChange={(e) => setBanUserId(e.target.value)}
                />
                <input
                    type="number"
                    value={banDays}
                    onChange={(e) => setBanDays(Number(e.target.value))}
                    style={{ width: 80, marginLeft: 8 }}
                />
                <span>일</span>

                <div style={{ marginTop: 8 }}>
                    <button onClick={banUser}>차단</button>
                    <button onClick={unbanUser} style={{ marginLeft: 8 }}>
                        차단 해제
                    </button>
                </div>
            </section>

            <section style={{ marginTop: 24 }}>
                <h3>강제 삭제</h3>
                <p style={{ fontSize: 13, opacity: 0.8 }}>
                    서버에서 ADMIN이면 삭제 허용으로 수정했기 때문에,
                    관리자는 게시글/댓글 삭제를 같은 API로 실행할 수 있어요.
                </p>
            </section>
        </div>
    );
}
