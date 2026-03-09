import "../../css/Menty/Myreview.css";
import Reviewpage from "./Reviewpage.jsx";
import StarRating from "../StarRating.jsx";
import { useState } from "react";

function Myreview() {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const openReport = () => setIsModalOpen(true);
    const closeReport = (e) => {
        if (!e || e.target.classList.contains("modal-overlay")) {
            setIsModalOpen(false);
        }
    };

    return (
        <>
            <div className="review-page">
                <h2 className="page-title">나의 리뷰</h2>

                <div className="avg-score">
                    <p className="avg-number">4.5</p>
                    <div className="avg-stars">
                        <StarRating rating={4.5} layout="col" size="lg" />
                    </div>
                </div>

                <div className="review-list">
                    <Reviewpage date="2025.04.04 23:20" author="성함" score="4.5" text="리뷰리뷰리뷰리뷰리뷰리뷰리뷰리뷰리뷰리뷰리뷰리뷰리뷰리뷰리뷰리뷰리뷰리뷰리뷰리뷰리뷰" onReport={openReport} />
                    <Reviewpage date="2025.04.04 23:20" author="성함" score="4.5" text="리뷰리뷰리뷰리뷰리뷰리뷰리뷰리뷰리뷰리뷰리뷰리뷰리뷰리뷰리뷰리뷰리뷰리뷰리뷰리뷰리뷰" onReport={openReport} />
                    <Reviewpage date="2025.04.04 23:20" author="익명" score="4.5" text="리뷰리뷰리뷰리뷰리뷰리뷰리뷰리뷰리뷰리뷰리뷰리뷰리뷰리뷰리뷰리뷰리뷰리뷰리뷰리뷰리뷰" onReport={openReport} />
                </div>

                <div className="pagination">
                    <button className="page-btn nav">←</button>
                    <button className="page-btn active">1</button>
                    <button className="page-btn">2</button>
                    <button className="page-btn">3</button>
                    <button className="page-btn nav">→</button>
                </div>
            </div>

            {isModalOpen && (
                <div className="modal-overlay" onClick={closeReport}>
                    <div className="report-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="report-header">
                            <p className="report-label">신고하기 창</p>
                            <h3 className="report-title">신고하기</h3>
                            <hr />
                        </div>
                        <div className="report-body">
                            <p className="report-sub">신고사유를 선택해주세요</p>
                            <div className="radio-group">
                                <label className="radio-item">
                                    <input type="radio" name="report" value="1" defaultChecked />
                                    <span>해당 수업과 관련없는 내용</span>
                                </label>
                                <label className="radio-item">
                                    <input type="radio" name="report" value="2" />
                                    <span>저작권 불법 도용</span>
                                </label>
                                <label className="radio-item">
                                    <input type="radio" name="report" value="3" />
                                    <span>음란 / 욕설 등 부적절한 내용</span>
                                </label>
                                <label className="radio-item">
                                    <input type="radio" name="report" value="4" />
                                    <span>같은내용 도배</span>
                                </label>
                                <label className="radio-item">
                                    <input type="radio" name="report" value="5" />
                                    <span>기타 (직접입력)</span>
                                </label>
                            </div>
                            <textarea className="report-textarea" placeholder="신고사유를 구체적으로 작성해주세요"></textarea>
                            <div className="report-actions">
                                <button className="btn-report-submit">신고하기</button>
                                <button className="btn-report-close" onClick={() => setIsModalOpen(false)}>닫기</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default Myreview;