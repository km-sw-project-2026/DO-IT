import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../css/Menty/Mentopage.css";

function Mentopage() {
    const navigate = useNavigate();
    const [profileForm, setProfileForm] = useState({
        introduction: "",
        career: "",
        subject: "",
        certificate: "",
    });
    const [saving, setSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState("");

    const [requests, setRequests] = useState([]);
    const [reqLoading, setReqLoading] = useState(true);

    const [showReviews, setShowReviews] = useState(false);
    const [reviews, setReviews] = useState([]);
    const [reviewStats, setReviewStats] = useState({ total: 0, avg_rating: 0 });
    const [reviewLoading, setReviewLoading] = useState(false);

    const getUid = () => {
        try {
            const raw = sessionStorage.getItem("user") || localStorage.getItem("user");
            const me = raw ? JSON.parse(raw) : null;
            return me?.user_id ?? me?.id ?? me?.user?.user_id ?? null;
        } catch { return null; }
    };

    // 기존 프로필 불러오기
    useEffect(() => {
        const uid = getUid();
        if (!uid) return;

        fetch(`/api/mentor-profile?user_id=${uid}`)
            .then((r) => r.json())
            .then((data) => {
                if (data.profile) {
                    setProfileForm({
                        introduction: data.profile.introduction || "",
                        career: data.profile.career || "",
                        subject: data.profile.subject || "",
                        certificate: data.profile.certificate || "",
                    });
                }
            })
            .catch(() => {});
    }, []);

    // 멘토링 신청 목록 불러오기
    useEffect(() => {
        const uid = getUid();
        if (!uid) { setReqLoading(false); return; }

        fetch(`/api/mentor-requests?user_id=${uid}`)
            .then((r) => r.json())
            .then((data) => {
                setRequests(data.requests || []);
                setReqLoading(false);
            })
            .catch(() => setReqLoading(false));
    }, []);

    const handleRespond = async (mentoring_id, action) => {
        const uid = getUid();
        if (!uid) return;
        try {
            const res = await fetch("/api/mentor-requests", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_id: uid, mentoring_id, action }),
            });
            if (res.ok) {
                setRequests((prev) =>
                    prev.map((r) =>
                        r.mentoring_id === mentoring_id
                            ? { ...r, status: action === "ACCEPT" ? "ACCEPTED" : "REJECTED" }
                            : r
                    ).filter((r) => r.status !== "REJECTED")
                );
            }
        } catch { /* ignore */ }
    };

    const handleChat = async (mentoring_id) => {
        const res = await fetch("/api/chat/rooms", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ mentoring_id }),
        }).catch(() => null);
        if (res?.ok) {
            navigate(`/chat?mentoring_id=${mentoring_id}`);
        }
    };

    const handleStop = async (mentoring_id) => {
        if (!window.confirm("정말 멘토링을 그만할까요? 상대방에게 알림이 전송됩니다.")) return;
        const uid = getUid();
        if (!uid) return;
        try {
            const res = await fetch("/api/mentor-requests", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_id: uid, mentoring_id }),
            });
            if (res.ok) {
                setRequests((prev) => prev.filter((r) => r.mentoring_id !== mentoring_id));
            } else {
                const data = await res.json().catch(() => ({}));
                alert(data.message || "종료 실패");
            }
        } catch {
            alert("네트워크 오류가 발생했습니다.");
        }
    };

    const handleShowReviews = async () => {
        const uid = getUid();
        if (!uid) return;
        setReviewLoading(true);
        setShowReviews(true);
        try {
            const res = await fetch(`/api/reviews?user_id=${uid}&size=20`);
            if (res.ok) {
                const data = await res.json();
                setReviews(data.reviews || []);
                setReviewStats({ total: data.total || 0, avg_rating: data.avg_rating || 0 });
            }
        } catch { /* ignore */ } finally {
            setReviewLoading(false);
        }
    };

    const handleSave = async () => {
        setSaveMsg("");
        const uid = getUid();
        if (!uid) { setSaveMsg("로그인 정보를 찾을 수 없습니다."); return; }
        setSaving(true);
        try {
            const res = await fetch("/api/mentor-profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_id: uid, ...profileForm }),
            });
            const data = await res.json();
            setSaveMsg(res.ok ? "저장되었습니다." : (data.message || "저장 실패"));
        } catch {
            setSaveMsg("네트워크 오류가 발생했습니다.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <div className="hero">
                <h2>함께 성장하는 <strong>멘토링</strong>의 시작, <strong>경험</strong>을 나누고 <strong>성장</strong>을 연결합니다</h2>
                <div className="hero-btns">
                    <button className="hero-btn" onClick={handleShowReviews}>
                        <span>나의 후기 보기</span>
                    </button>
                    <button className="hero-btn" onClick={() => navigate("/chat")}>
                        <span>나의 채팅 기록</span>
                    </button>
                </div>
            </div>

            <div className="main-layout">

                <div className="applicant-list">
                    {reqLoading ? (
                        <p className="req-empty">불러오는 중...</p>
                    ) : requests.length === 0 ? (
                        <p className="req-empty">아직 멘토링 신청이 없어요.</p>
                    ) : (
                        requests.map((req) => (
                            <div className="applicant-card" key={req.mentoring_id}>
                                <div className="card-top">
                                    <div className="avatar">
                                        <img src={req.profile_image || "/images/profile.jpg"} alt="" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} onError={(e) => { e.target.src = "/images/profile.jpg"; }} />
                                    </div>
                                    <div className="applicant-info">
                                        <div className="name">{req.nickname}</div>
                                    </div>
                                </div>
                                <div className="applicant-actions">
                                    {req.status === "PENDING" ? (
                                        <>
                                            <button className="btn-accept" onClick={() => handleRespond(req.mentoring_id, "ACCEPT")}>수락하기</button>
                                            <button className="btn-reject" onClick={() => handleRespond(req.mentoring_id, "REJECT")}>거절하기</button>
                                        </>
                                    ) : (
                                        <>
                                            <button className="btn-accept" onClick={() => handleChat(req.mentoring_id)}>채팅하기</button>
                                            <button className="btn-reject" onClick={() => handleStop(req.mentoring_id)}>멘토 그만하기</button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="divider"></div>

                <div className="my-info-box">
                    <h3>내 정보</h3>

                    <div className="form-group">
                        <label>소개글</label>
                        <textarea
                            value={profileForm.introduction}
                            onChange={(e) => setProfileForm((f) => ({ ...f, introduction: e.target.value }))}
                            placeholder="나를 소개해 주세요"
                        />
                    </div>

                    <div className="form-group">
                        <label>경력</label>
                        <input
                            type="text"
                            value={profileForm.career}
                            onChange={(e) => setProfileForm((f) => ({ ...f, career: e.target.value }))}
                            placeholder="경력을 입력하세요"
                        />
                    </div>

                    <div className="form-group">
                        <label>수업분야</label>
                        <input
                            type="text"
                            value={profileForm.subject}
                            onChange={(e) => setProfileForm((f) => ({ ...f, subject: e.target.value }))}
                            placeholder="수업 분야를 입력하세요"
                        />
                    </div>

                    <div className="form-group">
                        <label>자격증</label>
                        <input
                            type="text"
                            value={profileForm.certificate}
                            onChange={(e) => setProfileForm((f) => ({ ...f, certificate: e.target.value }))}
                            placeholder="자격증을 입력하세요"
                        />
                    </div>

                    {saveMsg && <p className="save-msg">{saveMsg}</p>}
                    <button className="btn-save" type="button" onClick={handleSave} disabled={saving}>
                        {saving ? "저장 중..." : "수정하기"}
                    </button>
                </div>

            </div>
            {showReviews && (
                <div className="review-modal-overlay" onClick={() => setShowReviews(false)}>
                    <div className="review-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="review-modal-header">
                            <h3>나의 후기</h3>
                            <button className="review-modal-close" onClick={() => setShowReviews(false)}>✕</button>
                        </div>
                        {reviewLoading ? (
                            <p className="review-empty">불러오는 중...</p>
                        ) : reviews.length === 0 ? (
                            <p className="review-empty">아직 후기가 없어요.</p>
                        ) : (
                            <>
                                <div className="review-stats">
                                    <span className="review-avg-star">{"★".repeat(Math.round(reviewStats.avg_rating))}{"☆".repeat(5 - Math.round(reviewStats.avg_rating))}</span>
                                    <span className="review-avg-num">{reviewStats.avg_rating.toFixed(1)}</span>
                                    <span className="review-total">({reviewStats.total}개)</span>
                                </div>
                                <ul className="review-list">
                                    {reviews.map((rv) => (
                                        <li key={rv.review_id} className="review-item">
                                            <div className="review-item-top">
                                                <span className="review-author">{rv.author}</span>
                                                <span className="review-stars">{"★".repeat(Math.round(rv.rating))}{"☆".repeat(5 - Math.round(rv.rating))}</span>
                                                <span className="review-date">{rv.created_at?.slice(0, 10)}</span>
                                            </div>
                                            <p className="review-content">{rv.review_content}</p>
                                        </li>
                                    ))}
                                </ul>
                            </>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}

export default Mentopage;