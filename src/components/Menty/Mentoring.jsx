import "../../css/Menty/Mentoring.css";
import StarRating from "../StarRating.jsx";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

function Mentoring() {
    const [showModal, setShowModal] = useState(false);
    const [message, setMessage] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [submitResult, setSubmitResult] = useState(null); // { ok, msg }
    const [mentor, setMentor] = useState(null);
    const [loading, setLoading] = useState(true);
    const { id } = useParams();

    // 리뷰 관련 상태
    const [reviews, setReviews] = useState([]);
    const [reviewTotal, setReviewTotal] = useState(0);
    const [reviewPage, setReviewPage] = useState(1);
    const [reviewLoading, setReviewLoading] = useState(false);
    const [reportModal, setReportModal] = useState(false);
    const [reportTargetId, setReportTargetId] = useState(null);
    const [reportReason, setReportReason] = useState("1");
    const [reportText, setReportText] = useState("");
    const REVIEW_SIZE = 5;

    // 현재 로그인 유저
    const currentUser = (() => {
        try { return JSON.parse(sessionStorage.getItem("user") || localStorage.getItem("user") || "null"); }
        catch { return null; }
    })();

    // 멘토 프로필 로딩
    useEffect(() => {
        if (!id) { setLoading(false); return; }
        fetch(`/api/mentor/${id}`)
            .then((r) => r.json())
            .then((data) => { setMentor(data); setLoading(false); })
            .catch(() => setLoading(false));
    }, [id]);

    // 리뷰 로딩
    useEffect(() => {
        if (!id) return;
        setReviewLoading(true);
        fetch(`/api/reviews?mentor_id=${id}&page=${reviewPage}&size=${REVIEW_SIZE}`)
            .then((r) => r.json())
            .then((data) => {
                if (reviewPage === 1) {
                    setReviews(data.reviews || []);
                } else {
                    setReviews((prev) => [...prev, ...(data.reviews || [])]);
                }
                setReviewTotal(data.total || 0);
            })
            .catch(() => {})
            .finally(() => setReviewLoading(false));
    }, [id, reviewPage]);

    const formatReviewDate = (iso) => {
        if (!iso) return "";
        const d = new Date(iso.includes("T") || iso.endsWith("Z") ? iso : iso.replace(" ", "T") + "Z");
        return d.toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" })
            .replace(/\. /g, ".").replace(/\.$/, "");
    };

    // 멘토링 신청 제출
    const handleApply = async () => {
        if (!currentUser) {
            setSubmitResult({ ok: false, msg: "로그인이 필요합니다." });
            return;
        }
        if (!message.trim()) {
            setSubmitResult({ ok: false, msg: "신청 내용을 입력해주세요." });
            return;
        }
        setSubmitting(true);
        setSubmitResult(null);
        try {
            const res = await fetch("/api/mentoring/apply", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    mentor_id: Number(id),
                    user_id: currentUser.user_id,
                    message: message.trim(),
                }),
            });
            const data = await res.json();
            if (res.ok) {
                setSubmitResult({ ok: true, msg: "멘토링 신청이 완료되었습니다! 멘토의 승인을 기다려주세요." });
                setMessage("");
            } else {
                setSubmitResult({ ok: false, msg: data.message || "신청에 실패했습니다." });
            }
        } catch {
            setSubmitResult({ ok: false, msg: "네트워크 오류가 발생했습니다." });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <section className="Mentoring">
            <div className="Mentoring-layout">

                <div className="Mentoring-content">
                    <div className="Mentoring-header">
                        <div className="Mentoring-header-inner">
                            {loading ? (
                                <h2>멘토 정보를 불러오는 중...</h2>
                            ) : mentor && !mentor.message ? (
                                <h2>{mentor.nickname} 멘토님의 멘토링</h2>
                            ) : (
                                <h2>멘토 정보를 찾을 수 없습니다.</h2>
                            )}
                        </div>
                    </div>

                    {mentor && !mentor.message && (
                        <>
                            <div className="Mento-intro"><p>멘토 소개</p></div>
                            <div className="Mento-intro-page">
                                <span>멘토 소개글</span>
                                <p>{mentor.introduction || "소개글이 없습니다."}</p>
                            </div>
                            <div className="Mento-time">
                                <span>멘토 경력</span>
                                <p>{mentor.career || "경력 정보 없음"}</p>
                            </div>
                            <div className="Mento-class">
                                <span>멘토 수업분야</span>
                                <p>{mentor.subject || "분야 정보 없음"}</p>
                            </div>
                            <div className="Mento-job">
                                <span>멘토 자격증</span>
                                <p>{mentor.certificate || "자격증 정보 없음"}</p>
                            </div>
                        </>
                    )}

                    <div className="Mento-star-review">
                        <div className="star">
                            <StarRating
                                rating={mentor?.avg_rating ?? 0}
                                count={mentor?.review_count ?? 0}
                                layout="col"
                                size="lg"
                            />
                        </div>
                        <div className="star-review-box">
                            {reviews.length === 0 && !reviewLoading && (
                                <p className="Mentoring-no-review">아직 리뷰가 없어요.</p>
                            )}
                            {reviews.map((rv) => (
                                <div key={rv.review_id} className="Mento-star">
                                    <p>{formatReviewDate(rv.created_at)} {rv.author}</p>
                                    <div className="star">
                                        <StarRating rating={rv.rating} layout="row" size="sm" />
                                    </div>
                                    {rv.photo && (() => {
                                        try {
                                            const imgs = JSON.parse(rv.photo);
                                            return (
                                                <div className="Mentoring-review-photos">
                                                    {imgs.map((src, i) => (
                                                        <img key={i} src={src} alt={`리뷰사진${i+1}`} className="Mentoring-review-img" />
                                                    ))}
                                                </div>
                                            );
                                        } catch { return null; }
                                    })()}
                                    <div className="Mento-review">
                                        <span>{rv.review_content}</span>
                                        <button onClick={() => { setReportTargetId(rv.user_id); setReportModal(true); }}>신고</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    {reviews.length < reviewTotal && (
                        <div className="review-the">
                            <button
                                onClick={() => setReviewPage((p) => p + 1)}
                                disabled={reviewLoading}
                            >
                                {reviewLoading ? "로딩 중..." : "더보기"}
                            </button>
                        </div>
                    )}
                </div>

                <div className="Mentoring-backup-box">
                    <div className="Mentoring-box">
                        {/* 사이드 멘토 카드 */}
                        <div className="Mentoring-mentor-card">
                            <div className="Mentoring-mentor-profile">
                                <img
                                    src={mentor?.profile_image || "/images/profile.jpg"}
                                    alt="프로필"
                                />
                            </div>
                            <div className="Mentoring-mentor-info">
                                <h3>{mentor?.nickname || "멘토"}</h3>
                                <StarRating
                                    rating={mentor?.avg_rating ?? 0}
                                    count={mentor?.review_count ?? 0}
                                    layout="row"
                                    size="sm"
                                />
                            </div>
                        </div>
                        <button
                            className="Mentoring-apply-btn"
                            onClick={() => { setShowModal(true); setSubmitResult(null); }}
                            disabled={loading || (mentor && !!mentor.message)}
                        >
                            신청하기
                        </button>
                    </div>
                </div>

            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-box" onClick={(e) => e.stopPropagation()}>
                        <h2>간단 멘토링 신청서</h2>
                        <hr />
                        <p>멘토링을 신청한 목적과<br />진행에 도움이 될만한 정보를 알려주세요</p>

                        {submitResult?.ok ? (
                            <div className="apply-result apply-result--ok">
                                <p>{submitResult.msg}</p>
                                <button onClick={() => setShowModal(false)}>닫기</button>
                            </div>
                        ) : (
                            <>
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder={"Q. 멘토링 목적이 무엇인가요?\nQ. 원하는 분야, 전에 들은 수업 등 멘토링에 도움이 될만한 정보\nQ. 멘토분에게 전하고싶은 말"}
                                />
                                {submitResult && !submitResult.ok && (
                                    <p className="apply-result apply-result--err">{submitResult.msg}</p>
                                )}
                                <button onClick={handleApply} disabled={submitting}>
                                    {submitting ? "신청 중..." : "신청하기"}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* 신고 모달 */}
            {reportModal && (
                <div className="modal-overlay" onClick={() => setReportModal(false)}>
                    <div className="report-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="report-header">
                            <h3 className="report-title">신고하기</h3>
                            <hr />
                        </div>
                        <div className="report-body">
                            <p className="report-sub">신고사유를 선택해주세요</p>
                            <div className="radio-group">
                                {[
                                    ["1", "해당 수업과 관련없는 내용"],
                                    ["2", "저작권 불법 도용"],
                                    ["3", "음란 / 욕설 등 부적절한 내용"],
                                    ["4", "같은내용 도배"],
                                    ["5", "기타 (직접입력)"],
                                ].map(([val, label]) => (
                                    <label className="radio-item" key={val}>
                                        <input
                                            type="radio"
                                            name="report"
                                            value={val}
                                            checked={reportReason === val}
                                            onChange={() => setReportReason(val)}
                                        />
                                        <span>{label}</span>
                                    </label>
                                ))}
                            </div>
                            <textarea
                                className="report-textarea"
                                placeholder="신고사유를 구체적으로 작성해주세요"
                                value={reportText}
                                onChange={(e) => setReportText(e.target.value)}
                            />
                            <div className="report-actions">
                                <button
                                    className="btn-report-submit"
                                    onClick={async () => {
                                        if (!reportTargetId) {
                                            alert("신고 대상 정보가 없습니다.");
                                            return;
                                        }
                                        const reasonLabels = {
                                            "1": "해당 수업과 관련없는 내용",
                                            "2": "저작권 불법 도용",
                                            "3": "음란 / 욕설 등 부적절한 내용",
                                            "4": "같은내용 도배",
                                            "5": "기타",
                                        };
                                        const reportContent = `${reasonLabels[reportReason] || reportReason}${reportText ? ` / ${reportText}` : ""}`;
                                        try {
                                            const res = await fetch("/api/report", {
                                                method: "POST",
                                                headers: { "Content-Type": "application/json" },
                                                body: JSON.stringify({
                                                    reporter_id: currentUser?.user_id,
                                                    reported_id: reportTargetId,
                                                    report_type: "REVIEW",
                                                    report_content: reportContent,
                                                }),
                                            });
                                            if (!res.ok) {
                                                const data = await res.json().catch(() => ({}));
                                                alert(data.message || "신고 접수에 실패했습니다.");
                                                return;
                                            }
                                        } catch {
                                            alert("네트워크 오류가 발생했습니다.");
                                            return;
                                        }
                                        alert("신고가 접수되었습니다.");
                                        setReportModal(false);
                                        setReportText("");
                                        setReportReason("1");
                                        setReportTargetId(null);
                                    }}
                                >신고하기</button>
                                <button className="btn-report-close" onClick={() => setReportModal(false)}>닫기</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}

export default Mentoring;