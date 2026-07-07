import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser, isAdmin } from "../utils/auth";
import "../css/AdminPage.css";

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
        <main className="admin-page">
            <div className="admin-shell">
                <section className="admin-hero">
                    <div>
                        <p className="admin-kicker">DO-IT 운영 관리</p>
                        <h2>관리자 페이지</h2>
                        <p className="admin-hero-copy">신고, 공지, 유저 권한과 멘토 지원서를 한 곳에서 관리합니다.</p>
                    </div>
                    <div className="admin-summary">
                        <div>
                            <span>{reports.length}</span>
                            <p>미처리 신고</p>
                        </div>
                        <div>
                            <span>{applications.length}</span>
                            <p>현재 지원서</p>
                        </div>
                    </div>
                </section>

                {newReportToast && (
                    <div className="admin-toast">
                        <span>새 신고 {newReportToast.count}건이 접수됐습니다.</span>
                        <button type="button" onClick={() => setNewReportToast(null)} aria-label="알림 닫기">
                            닫기
                        </button>
                    </div>
                )}

                <section className="admin-card admin-reports">
                    <div className="admin-section-head">
                        <div>
                            <p className="admin-section-label">Reports</p>
                            <h3>신고 목록</h3>
                        </div>
                        {reports.length > 0 && <span className="admin-count">{reports.length}</span>}
                    </div>

                    <div className="admin-tabs">
                        {[
                            { key: "OPEN", label: "미처리" },
                            { key: "DONE", label: "처리 완료" },
                        ].map(({ key, label }) => (
                            <button
                                key={key}
                                type="button"
                                className={reportTab === key ? "is-active" : ""}
                                onClick={() => {
                                    setReportTab(key);
                                    if (key === "DONE") loadDoneReports();
                                    else loadReports();
                                }}
                            >
                                {label}
                            </button>
                        ))}
                        <button
                            type="button"
                            className="admin-refresh"
                            onClick={() => reportTab === "OPEN" ? loadReports() : loadDoneReports()}
                        >
                            새로고침
                        </button>
                    </div>

                    {reportTab === "OPEN" && (
                        reports.length === 0 ? (
                            <p className="admin-empty">신고가 없습니다.</p>
                        ) : (
                            <div className="admin-list">
                                {reports.map((r) => (
                                    <article key={r.report_id} className="admin-list-item">
                                        <div className="admin-item-main">
                                            <b>#{r.report_id}</b>
                                            <span>[{r.report_type}] {r.report_content}</span>
                                        </div>
                                        <p className="admin-muted">
                                            신고자: {r.reporter_nick ?? r.reporter_id} / 대상: <b>{r.reported_nick ?? r.reported_id}</b> (user_id: {r.reported_id})
                                        </p>
                                        <div className="admin-actions">
                                            <button type="button" className="admin-btn" onClick={() => resolveReport(r.report_id)}>
                                                처리 완료
                                            </button>
                                            <label className="admin-inline-field">
                                                <span>차단</span>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={reportBanDays[r.report_id] ?? 7}
                                                    onChange={(e) => setReportBanDays((prev) => ({ ...prev, [r.report_id]: Number(e.target.value) }))}
                                                />
                                                <span>일</span>
                                            </label>
                                            <button
                                                type="button"
                                                className="admin-btn danger"
                                                onClick={() => banReportedUser(r.report_id, r.reported_id)}
                                            >
                                                차단
                                            </button>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )
                    )}

                    {reportTab === "DONE" && (
                        doneLoading ? (
                            <p className="admin-empty">불러오는 중...</p>
                        ) : doneReports.length === 0 ? (
                            <p className="admin-empty">처리된 신고가 없습니다.</p>
                        ) : (
                            <div className="admin-list">
                                {doneReports.map((r) => (
                                    <article key={r.report_id} className="admin-list-item is-done">
                                        <div className="admin-item-top">
                                            <div className="admin-item-main">
                                                <b>#{r.report_id}</b>
                                                <span>[{r.report_type}] {r.report_content}</span>
                                            </div>
                                            <span className="admin-status done">처리완료</span>
                                        </div>
                                        <p className="admin-muted">
                                            신고자: {r.reporter_nick ?? r.reporter_id} / 대상: <b>{r.reported_nick ?? r.reported_id}</b> (user_id: {r.reported_id})
                                        </p>
                                        <p className="admin-subtle">신고일: {r.created_at?.slice(0, 16)}</p>
                                        <div className="admin-actions">
                                            <label className="admin-inline-field">
                                                <span>추가 차단</span>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={reportBanDays[r.report_id] ?? 7}
                                                    onChange={(e) => setReportBanDays((prev) => ({ ...prev, [r.report_id]: Number(e.target.value) }))}
                                                />
                                                <span>일</span>
                                            </label>
                                            <button
                                                type="button"
                                                className="admin-btn danger"
                                                onClick={() => banReportedUser(r.report_id, r.reported_id)}
                                            >
                                                차단
                                            </button>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )
                    )}
                </section>

                <div className="admin-grid">
                    <section className="admin-card">
                        <div className="admin-section-head">
                            <div>
                                <p className="admin-section-label">Notice</p>
                                <h3>공지 설정</h3>
                            </div>
                        </div>
                        <div className="admin-form-row">
                            <input
                                placeholder="post_id"
                                value={noticePostId}
                                onChange={(e) => setNoticePostId(e.target.value)}
                            />
                            <button type="button" className="admin-btn primary" onClick={() => setNotice(1)}>공지로 설정</button>
                            <button type="button" className="admin-btn" onClick={() => setNotice(0)}>공지 해제</button>
                        </div>
                    </section>

                    <section className="admin-card">
                        <div className="admin-section-head">
                            <div>
                                <p className="admin-section-label">User</p>
                                <h3>유저 차단</h3>
                            </div>
                        </div>
                        <div className="admin-form-row">
                            <input
                                placeholder="user_id 또는 login_id"
                                value={banUserId}
                                onChange={(e) => setBanUserId(e.target.value)}
                            />
                            <input
                                className="admin-number"
                                type="number"
                                value={banDays}
                                onChange={(e) => setBanDays(Number(e.target.value))}
                            />
                            <span className="admin-unit">일</span>
                        </div>
                        <div className="admin-actions">
                            <button type="button" className="admin-btn danger" onClick={banUser}>차단</button>
                            <button type="button" className="admin-btn" onClick={unbanUser}>차단 해제</button>
                        </div>
                    </section>
                </div>

                <section className="admin-card">
                    <div className="admin-section-head">
                        <div>
                            <p className="admin-section-label">Delete</p>
                            <h3>강제 삭제</h3>
                        </div>
                    </div>
                    <p className="admin-note">
                        관리자는 게시글과 댓글 상세 화면에서 기존 삭제 기능으로 콘텐츠를 정리할 수 있습니다.
                    </p>
                </section>

                <section className="admin-card">
                    <div className="admin-section-head">
                        <div>
                            <p className="admin-section-label">Mentor Applications</p>
                            <h3>멘토 지원서 관리</h3>
                        </div>
                    </div>

                    <div className="admin-tabs compact">
                        {["PENDING", "APPROVED", "REJECTED"].map((s) => (
                            <button
                                key={s}
                                type="button"
                                className={appStatus === s ? "is-active" : ""}
                                onClick={() => loadApplications(s)}
                            >
                                {s === "PENDING" ? "심사 중" : s === "APPROVED" ? "승인됨" : "거절됨"}
                            </button>
                        ))}
                        <button type="button" className="admin-refresh" onClick={() => loadApplications(appStatus)}>
                            새로고침
                        </button>
                    </div>

                    {applications.length === 0 ? (
                        <p className="admin-empty">지원서가 없습니다.</p>
                    ) : (
                        <div className="admin-list">
                            {applications.map((a) => (
                                <article key={a.mentor_apply_id} className="admin-list-item">
                                    <div className="admin-item-top">
                                        <div>
                                            <div className="admin-applicant">{a.contractor_name}</div>
                                            <p className="admin-muted">@{a.login_id} ({a.nickname}) / user_id: {a.user_id}</p>
                                        </div>
                                        <span className="admin-subtle">{a.created_at?.slice(0, 10)}</span>
                                    </div>
                                    <dl className="admin-detail-grid">
                                        <div><dt>연락처</dt><dd>{a.contact}</dd></div>
                                        <div><dt>소속</dt><dd>{a.affiliation}</dd></div>
                                        <div><dt>희망분야</dt><dd>{a.hope_field}</dd></div>
                                        <div className="wide"><dt>자기소개</dt><dd>{a.introduction}</dd></div>
                                        {a.related_url && (
                                            <div className="wide">
                                                <dt>관련사이트</dt>
                                                <dd><a href={a.related_url} target="_blank" rel="noreferrer">{a.related_url}</a></dd>
                                            </div>
                                        )}
                                    </dl>
                                    {a.status === "PENDING" && (
                                        <div className="admin-actions">
                                            <button
                                                type="button"
                                                className="admin-btn success"
                                                onClick={() => handleApplication(a.mentor_apply_id, "APPROVE")}
                                            >
                                                승인
                                            </button>
                                            <button
                                                type="button"
                                                className="admin-btn danger"
                                                onClick={() => handleApplication(a.mentor_apply_id, "REJECT")}
                                            >
                                                거절
                                            </button>
                                        </div>
                                    )}
                                </article>
                            ))}
                        </div>
                    )}
                </section>

                <section className="admin-card">
                    <div className="admin-section-head">
                        <div>
                            <p className="admin-section-label">Mentor Role</p>
                            <h3>멘토 권한 직접 부여 / 박탈</h3>
                        </div>
                    </div>
                    <p className="admin-note">user_id 또는 login_id를 입력하세요.</p>
                    <div className="admin-form-row">
                        <input
                            placeholder="user_id 또는 login_id"
                            value={mentorTarget}
                            onChange={(e) => setMentorTarget(e.target.value)}
                        />
                        <button type="button" className="admin-btn success" onClick={() => handleMentorRole("GRANT")}>
                            멘토 권한 부여
                        </button>
                        <button type="button" className="admin-btn danger" onClick={() => handleMentorRole("REVOKE")}>
                            멘토 권한 박탈
                        </button>
                    </div>
                </section>
            </div>
        </main>
    );
}
