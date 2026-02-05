import MentypageMento from "./MentypageMento.jsx";

function Mentoring() {
    return (
        <section className="Mentoring">
            <div className="Mentoring-header">
                <div className="Mentoring-header-inner">
                    <h2>백엔드 / 대기업 실전 개발 전략<br>
                        맞춤 멘토링</br></h2>
                </div>
            </div>

            <div className="Mento-intro">
                <p>멘토 소개</p>
            </div>

            <div className="Mento-intro-page">
                <span>멘토 소개글</span>
                <p>소개글<br>소개글</br><br>소개글</br></p>
            </div>
            <div className="Mento-time">
                <span>멘토 경력</span>
                <p>경력<br>경력</br><br>경력</br></p>
            </div>
            <div className="Mento-class">
                <span>멘토 수업분야</span>
                <p>수업분야<br>수업분야</br><br>수업분야</br></p>
            </div>
            <div className="Mento-job">
                <span>멘토 자격증</span>
                <p>자격증<br>자격증</br><br>자격증</br></p>
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

            <div className="Mentoring-backup-box">
                <div className="Mentoring-box">
                    <MentypageMento />
                    <button>신청하기</button>
                </div>
            </div>
        </section>
    );
}

export default Mentoring;