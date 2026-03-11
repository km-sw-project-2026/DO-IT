import { useEffect, useState, useRef } from "react";
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
    const [reportBanDays, setReportBanDays] = useState({}); // report_id -> days
    const [newReportToast, setNewReportToast] = useState(null); // { count }
    const prevReportCountRef = useRef(null);
    const [reportTab, setReportTab] = useState("OPEN"); // "OPEN" | "DONE"
    const [doneReports, setDoneReports] = useState([]);
    const [doneLoading, setDoneLoading] = useState(false);

    // 멘토 지원 목록
    const [applications, setApplications] = useState([]);
    const [appStatus, setAppStatus] = useState("PENDING");

    // 멘토 권한 직접 부여/박탈
    const [mentorTarget, setMentorTarget] = useState("");

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
        loadApplications("PENDING");

        // 30초마다 신고 수 폴링 → 새 신고 토스트
        const pollId = setInterval(async () => {
            try {
                const resp = await fetch(`/api/admin/reports?status=OPEN&user_id=${adminId}`);
                if (!resp.ok) return;
                const data = await resp.json().catch(() => ({}));
                const list = data.reports || [];
                const count = list.length;
                if (prevReportCountRef.current !== null && count > prevReportCountRef.current) {
                    const diff = count - prevReportCountRef.current;
                    setNewReportToast({ count: diff });
                    setTimeout(() => setNewReportToast(null), 5000);
                    setReports(list);
                }
                prevReportCountRef.current = count;
            } catch { /* ignore */ }
        }, 30000);

        return () => clearInterval(pollId);
        // eslint-disable-next-line
    }, []);

    const loadReports = async () => {
        try {
            const resp = await fetch(`/api/admin/reports?status=OPEN&user_id=${adminId}`);
            const data = await resp.json().catch(() => ({}));
            if (!resp.ok) return alert(data?.message || "신고 목록 불러오기 실패");
            const list = data.reports || [];
            setReports(list);
            prevReportCountRef.current = list.length;
        } catch {
            alert("네트워크 오류로 신고 목록을 불러올 수 없습니다.");
        }
    };

    const loadDoneReports = async () => {
        setDoneLoading(true);
        try {
            const resp = await fetch(`/api/admin/reports?status=DONE&user_id=${adminId}`);
            const data = await resp.json().catch(() => ({}));
            if (!resp.ok) return alert(data?.message || "처리 완료 목록 불러오기 실패");
            setDoneReports(data.reports || []);
        } catch {
            alert("네트워크 오류가 발생했습니다.");
        } finally {
            setDoneLoading(false);
        }
    };

    const resolveReport = async (report_id) => {
        try {
            const resp = await fetch("/api/admin/reports", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ user_id: adminId, report_id }),
            });
            const data = await resp.json().catch(() => ({}));
            if (!resp.ok) return alert(data?.message || "처리 실패");
            await loadReports();
            // DONE 탭이 열려 있으면 즉시 갱신
            if (reportTab === "DONE") loadDoneReports();
        } catch {
            alert("네트워크 오류가 발생했습니다.");
        }
    };

    const banReportedUser = async (report_id, reported_id) => {
        const days = Number(reportBanDays[report_id] ?? 7);
        if (!days || days <= 0) return alert("차단 일수를 1 이상으로 입력하세요.");
        try {
            const resp = await fetch("/api/admin/ban", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ user_id: adminId, target: reported_id, days }),
            });
            const data = await resp.json().catch(() => ({}));
            if (!resp.ok) return alert(data?.message || "차단 실패");
            alert(data?.message || `${days}일 차단 완료!`);
        } catch {
            alert("네트워크 오류가 발생했습니다.");
        }
    };

    const setNotice = async (is_notice) => {
        const post_id = Number(noticePostId);
        if (!post_id) return alert("공지로 설정할 post_id를 입력하세요.");
        try {
            const resp = await fetch("/api/admin/notice", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ user_id: adminId, post_id, on: is_notice === 1 }),
            });
            const data = await resp.json().catch(() => ({}));
            if (!resp.ok) return alert(data?.message || "공지 설정 실패");
            alert(data?.message || "완료!");
        } catch {
            alert("네트워크 오류가 발생했습니다.");
        }
    };

    const banUser = async () => {
        const target = String(banUserId).trim();
        if (!target) return alert("차단할 유저의 user_id(숫자) 또는 아이디를 입력하세요.");
        try {
            const resp = await fetch("/api/admin/ban", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ user_id: adminId, target, days: banDays }),
            });
            const data = await resp.json().catch(() => ({}));
            if (!resp.ok) return alert(data?.message || "차단 실패");
            alert(data?.message || "차단 완료!");
        } catch {
            alert("네트워크 오류가 발생했습니다.");
        }
    };

    const unbanUser = async () => {
        const target = String(banUserId).trim();
        if (!target) return alert("해제할 유저의 user_id(숫자) 또는 아이디를 입력하세요.");
        try {
            const resp = await fetch("/api/admin/ban", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ user_id: adminId, target, days: 0 }),
            });
            const data = await resp.json().catch(() => ({}));
            if (!resp.ok) return alert(data?.message || "해제 실패");
            alert(data?.message || "차단 해제 완료!");
        } catch {
            alert("네트워크 오류가 발생했습니다.");
        }
    };

    // ---- 멘토 지원 ----
    const loadApplications = async (status) => {
        setAppStatus(status);
        try {
            const resp = await fetch(`/api/admin/mentor-applications?user_id=${adminId}&status=${status}`);
            const data = await resp.json().catch(() => ({}));
            if (!resp.ok) return alert(data?.message || "목록 로드 실패");
            setApplications(data.applications || []);
        } catch {
            alert("네트워크 오류로 멘토 지원 목록을 불러올 수 없습니다.");
        }
    };

    const handleApplication = async (mentor_apply_id, action) => {
        try {
            const resp = await fetch("/api/admin/mentor-applications", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ user_id: adminId, mentor_apply_id, action }),
            });
            const data = await resp.json().catch(() => ({}));
            alert(data?.message || (resp.ok ? "처리 완료!" : "처리 실패"));
            if (resp.ok) loadApplications(appStatus);
        } catch {
            alert("네트워크 오류가 발생했습니다.");
        }
    };

    // ---- 멘토 권한 직접 부여/박탈 ----
    const handleMentorRole = async (action) => {
        const target = String(mentorTarget).trim();
        if (!target) return alert("user_id 또는 login_id를 입력하세요.");
        try {
            const resp = await fetch("/api/admin/mentor-role", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ user_id: adminId, target, action }),
            });
            const data = await resp.json().catch(() => ({}));
            alert(data?.message || (resp.ok ? "완료!" : "실패"));
        } catch {
            alert("네트워크 오류가 발생했습니다.");
        }
    };

    return (
        <div style={{ padding: 20 }}>
            <h2>관리자 페이지</h2>

            {/* 신고 토스트 알림 */}
            {newReportToast && (
                <div style={{
                    position: "fixed", top: 20, right: 20, zIndex: 9999,
                    background: "#c62828", color: "#fff",
                    padding: "14px 20px", borderRadius: 10,
                    boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
                    fontSize: 15, fontWeight: 600,
                    display: "flex", alignItems: "center", gap: 10,
                }}>
                    <span>🚨</span>
                    <span>새 신고 {newReportToast.count}건이 접수됐습니다!</span>
                    <button
                        onClick={() => setNewReportToast(null)}
                        style={{ marginLeft: 8, background: "none", border: "none", color: "#fff", fontSize: 16, cursor: "pointer", lineHeight: 1 }}
                    >✕</button>
                </div>
            )}

            {/* ── 신고 목록 ── */}
            <section style={{ marginTop: 24 }}>
                <h3 style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    신고 목록
                    {reports.length > 0 && (
                        <span style={{
                            background: "#c62828", color: "#fff",
                            borderRadius: 99, fontSize: 12, fontWeight: 700,
                            padding: "2px 9px", lineHeight: "20px",
                        }}>{reports.length}</span>
                    )}
                </h3>
                {/* 탭 */}
                <div style={{ display: "flex", gap: 0, marginBottom: 12, borderBottom: "2px solid #eee" }}>
                    {[
                        { key: "OPEN", label: "미처리" },
                        { key: "DONE", label: "처리 완료" },
                    ].map(({ key, label }) => (
                        <button
                            key={key}
                            onClick={() => {
                                setReportTab(key);
                                if (key === "DONE") loadDoneReports();
                                else loadReports();
                            }}
                            style={{
                                padding: "8px 20px",
                                background: "none", border: "none",
                                borderBottom: reportTab === key ? "2px solid #c62828" : "2px solid transparent",
                                marginBottom: -2,
                                fontWeight: reportTab === key ? 700 : 400,
                                color: reportTab === key ? "#c62828" : "#555",
                                cursor: "pointer", fontSize: 14,
                            }}
                        >{label}</button>
                    ))}
                    <button
                        onClick={() => reportTab === "OPEN" ? loadReports() : loadDoneReports()}
                        style={{ marginLeft: "auto", padding: "4px 12px", fontSize: 13 }}
                    >새로고침</button>
                </div>

                {/* 미처리 목록 */}
                {reportTab === "OPEN" && (
                    reports.length === 0 ? (
                        <p style={{ marginTop: 12 }}>신고가 없습니다.</p>
                    ) : (
                        <div style={{ marginTop: 4, display: "grid", gap: 10 }}>
                            {reports.map((r) => (
                                <div key={r.report_id} style={{ border: "1px solid #ddd", padding: 12, borderRadius: 6 }}>
                                    <div>
                                        <b>#{r.report_id}</b> [{r.report_type}] {r.report_content}
                                    </div>
                                    <div style={{ fontSize: 13, opacity: 0.8, marginTop: 4 }}>
                                        신고자: {r.reporter_nick ?? r.reporter_id} / 대상: <b>{r.reported_nick ?? r.reported_id}</b> (user_id: {r.reported_id})
                                    </div>
                                    <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                        <button onClick={() => resolveReport(r.report_id)}
                                            style={{ padding: "4px 12px" }}>
                                            처리 완료
                                        </button>
                                        <span style={{ fontSize: 13, color: "#555" }}>차단:</span>
                                        <input
                                            type="number"
                                            min="1"
                                            value={reportBanDays[r.report_id] ?? 7}
                                            onChange={(e) => setReportBanDays((prev) => ({ ...prev, [r.report_id]: Number(e.target.value) }))}
                                            style={{ width: 56, padding: "3px 6px", border: "1px solid #ccc", borderRadius: 4 }}
                                        />
                                        <span style={{ fontSize: 13, color: "#555" }}>일</span>
                                        <button
                                            onClick={() => banReportedUser(r.report_id, r.reported_id)}
                                            style={{ padding: "4px 12px", background: "#c62828", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }}>
                                            차단
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                )}

                {/* 처리 완료 목록 */}
                {reportTab === "DONE" && (
                    doneLoading ? (
                        <p style={{ marginTop: 12 }}>불러오는 중...</p>
                    ) : doneReports.length === 0 ? (
                        <p style={{ marginTop: 12 }}>처리된 신고가 없습니다.</p>
                    ) : (
                        <div style={{ marginTop: 4, display: "grid", gap: 10 }}>
                            {doneReports.map((r) => (
                                <div key={r.report_id} style={{ border: "1px solid #ddd", padding: 12, borderRadius: 6, background: "#fafafa", opacity: 0.85 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                        <div>
                                            <b>#{r.report_id}</b> [{r.report_type}] {r.report_content}
                                        </div>
                                        <span style={{ fontSize: 11, background: "#4caf50", color: "#fff", borderRadius: 4, padding: "2px 7px", whiteSpace: "nowrap" }}>처리완료</span>
                                    </div>
                                    <div style={{ fontSize: 13, opacity: 0.75, marginTop: 4 }}>
                                        신고자: {r.reporter_nick ?? r.reporter_id} / 대상: <b>{r.reported_nick ?? r.reported_id}</b> (user_id: {r.reported_id})
                                    </div>
                                    <div style={{ fontSize: 12, color: "#aaa", marginTop: 4 }}>
                                        신고일: {r.created_at?.slice(0, 16)}
                                    </div>
                                    {/* 처리된 신고대상에 추가 차단도 가능 */}
                                    <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                        <span style={{ fontSize: 13, color: "#555" }}>추가 차단:</span>
                                        <input
                                            type="number"
                                            min="1"
                                            value={reportBanDays[r.report_id] ?? 7}
                                            onChange={(e) => setReportBanDays((prev) => ({ ...prev, [r.report_id]: Number(e.target.value) }))}
                                            style={{ width: 56, padding: "3px 6px", border: "1px solid #ccc", borderRadius: 4 }}
                                        />
                                        <span style={{ fontSize: 13, color: "#555" }}>일</span>
                                        <button
                                            onClick={() => banReportedUser(r.report_id, r.reported_id)}
                                            style={{ padding: "4px 12px", background: "#c62828", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }}>
                                            차단
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                )}
            </section>

            {/* ── 공지 설정 ── */}
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

            {/* ── 유저 차단 ── */}
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
                    <button onClick={unbanUser} style={{ marginLeft: 8 }}>차단 해제</button>
                </div>
            </section>

            {/* ── 강제 삭제 ── */}
            <section style={{ marginTop: 24 }}>
                <h3>강제 삭제</h3>
                <p style={{ fontSize: 13, opacity: 0.8 }}>
                    서버에서 ADMIN이면 삭제 허용으로 수정했기 때문에,
                    관리자는 게시글/댓글 삭제를 같은 API로 실행할 수 있어요.
                </p>
            </section>

            {/* ── 멘토 지원서 관리 ── */}
            <section style={{ marginTop: 32, borderTop: "2px solid #009DFF", paddingTop: 24 }}>
                <h3>📋 멘토 지원서 관리</h3>
                <div style={{ marginBottom: 12, display: "flex", gap: 8 }}>
                    {["PENDING", "APPROVED", "REJECTED"].map((s) => (
                        <button
                            key={s}
                            onClick={() => loadApplications(s)}
                            style={{
                                padding: "6px 14px",
                                background: appStatus === s ? "#009DFF" : "#eee",
                                color: appStatus === s ? "#fff" : "#333",
                                border: "none",
                                borderRadius: 6,
                                cursor: "pointer",
                                fontWeight: appStatus === s ? 700 : 400,
                            }}
                        >
                            {s === "PENDING" ? "심사 중" : s === "APPROVED" ? "승인됨" : "거절됨"}
                        </button>
                    ))}
                    <button onClick={() => loadApplications(appStatus)} style={{ padding: "6px 14px" }}>
                        새로고침
                    </button>
                </div>

                {applications.length === 0 ? (
                    <p>지원서가 없습니다.</p>
                ) : (
                    <div style={{ display: "grid", gap: 12 }}>
                        {applications.map((a) => (
                            <div
                                key={a.mentor_apply_id}
                                style={{ border: "1px solid #ddd", borderRadius: 8, padding: 16 }}
                            >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                    <div>
                                        <b>{a.contractor_name}</b>
                                        <span style={{ marginLeft: 8, fontSize: 13, color: "#888" }}>
                                            @{a.login_id} ({a.nickname}) · user_id: {a.user_id}
                                        </span>
                                    </div>
                                    <span style={{ fontSize: 12, color: "#999" }}>{a.created_at?.slice(0, 10)}</span>
                                </div>
                                <div style={{ marginTop: 8, fontSize: 14, display: "grid", gap: 4 }}>
                                    <div><b>연락처:</b> {a.contact}</div>
                                    <div><b>소속:</b> {a.affiliation}</div>
                                    <div><b>희망분야:</b> {a.hope_field}</div>
                                    <div><b>자기소개:</b> {a.introduction}</div>
                                    {a.related_url && <div><b>관련사이트:</b> <a href={a.related_url} target="_blank" rel="noreferrer">{a.related_url}</a></div>}
                                </div>
                                {a.status === "PENDING" && (
                                    <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                                        <button
                                            style={{ padding: "6px 16px", background: "#2e7d32", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}
                                            onClick={() => handleApplication(a.mentor_apply_id, "APPROVE")}
                                        >
                                            ✔ 승인
                                        </button>
                                        <button
                                            style={{ padding: "6px 16px", background: "#c62828", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}
                                            onClick={() => handleApplication(a.mentor_apply_id, "REJECT")}
                                        >
                                            ✖ 거절
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* ── 멘토 권한 직접 부여/박탈 ── */}
            <section style={{ marginTop: 32, borderTop: "2px solid #eee", paddingTop: 24 }}>
                <h3>🎖 멘토 권한 직접 부여 / 박탈</h3>
                <p style={{ fontSize: 13, color: "#888" }}>user_id(숫자) 또는 login_id(문자열) 입력</p>
                <input
                    placeholder="user_id 또는 login_id"
                    value={mentorTarget}
                    onChange={(e) => setMentorTarget(e.target.value)}
                    style={{ padding: "6px 10px", width: 220 }}
                />
                <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                    <button
                        style={{ padding: "6px 16px", background: "#2e7d32", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}
                        onClick={() => handleMentorRole("GRANT")}
                    >
                        멘토 권한 부여
                    </button>
                    <button
                        style={{ padding: "6px 16px", background: "#c62828", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}
                        onClick={() => handleMentorRole("REVOKE")}
                    >
                        멘토 권한 박탈
                    </button>
                </div>
            </section>
        </div>
    );
}
