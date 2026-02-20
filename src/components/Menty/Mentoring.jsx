import "../../css/Menty/Mentoring.css";
import MentypageMento from "./MentypageMento.jsx";
import Mentoringreview from "./Mentoringreview.jsx";
import { useState } from "react";

function Mentoring() {
    const [showModal, setShowModal] = useState(false);

    return (
        <section className="Mentoring">
            <div className="Mentoring-layout">

                <div className="Mentoring-content">
                    <div className="Mentoring-header">
                        <div className="Mentoring-header-inner">
                            <h2>백엔드 / 대기업 실전 개발 전략<br />맞춤 멘토링</h2>
                        </div>
                    </div>
                    <div className="Mento-intro"><p>멘토 소개</p></div>
                    <div className="Mento-intro-page">
                        <span>멘토 소개글</span>
                        <p>소개글<br />소개글<br />소개글</p>
                    </div>
                    <div className="Mento-time">
                        <span>멘토 경력</span>
                        <p>경력<br />경력<br />경력</p>
                    </div>
                    <div className="Mento-class">
                        <span>멘토 수업분야</span>
                        <p>수업분야<br />수업분야<br />수업분야</p>
                    </div>
                    <div className="Mento-job">
                        <span>멘토 자격증</span>
                        <p>자격증<br />자격증<br />자격증</p>
                    </div>
                    <div className="Mento-star-review">
                        <div className="star">
                            <span>★★★★★</span>
                            <p>5.0 (423)</p>
                        </div>
                        <div className="star-review-box">
                            <Mentoringreview />
                            <Mentoringreview />
                            <Mentoringreview />
                        </div>
                    </div>
                    <div className="review-the">
                        <button>더보기</button>
                    </div>
                </div>

                <div className="Mentoring-backup-box">
                    <div className="Mentoring-box">
                        <MentypageMento />
                        <button onClick={() => setShowModal(true)}>신청하기</button>
                    </div>
                </div>

            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-box" onClick={(e) => e.stopPropagation()}>
                        <h2>간단 멘토링 신청서</h2>
                        <hr />
                        <p>멘토링을 신청한 목적과<br />진행에 도움이 될만한 정보를 알려주세요</p>
                        <textarea
                            placeholder={"Q.멘토링 목적이 무엇인가요?\nQ.원하는 분야, 전에 들은 수업 등 멘토링에 도움이 될만한 정보\nQ.멘토분에게 전하고싶은 말"}
                        />
                        <button onClick={() => setShowModal(false)}>신청하기</button>
                    </div>
                </div>
            )}
        </section>
    );
}

export default Mentoring;