import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../css/Menty/Mentypage.css";
import MentypageMento from "./MentypageMento.jsx";
import MentoreviewModal from "./MentoreviewModal.jsx";


function Mentypage() {
    const [showModal, setShowModal] = useState(false);
    const navigate = useNavigate();

    const handleSelectMentor = (mentor) => {
        setShowModal(false);
        navigate("/mentoreview", { state: { mentor } });
    };

    return (
        <section className="Mentypage">
    <div className="Mentypage-header">
        <div className="Mentypage-header-inner">
            <h1>함께 성장하는 <strong>멘토링</strong>의 시작, <strong>경험</strong>을 나누고 <strong>성장</strong>을 연결합니다</h1>
        
            <div className="Menty-buttons-group">
                <div className="Menty-button">
                    <img src="#" alt="1" />
                    <button>멘토 지원하기</button>
                </div>
                <div className="Menty-button">
                    <img src="#" alt="2" />
                    <button onClick={() => setShowModal(true)}>후기 남기기</button>
                </div>
                <div className="Menty-button">
                    <img src="#" alt="3" />
                    <button>나의 채팅 기록</button>
                </div>
            </div>
        </div>
    </div>
            <button className="filter-button">
                <p>필터</p>
                <div className="filter-button-inner">
                    <ul>
                        <li>별점 높은 순</li>
                        <li>리뷰 순</li>
                        <li>최근 순</li>
                    </ul>
                </div>
            </button>

            {/* <div className="Mento-box">
                <MentypageMento />
                <MentypageMento />
                <MentypageMento />
                <MentypageMento />
                <MentypageMento />
                <MentypageMento />
            </div>

            <footer className="Mentypage-footer">
                <div className="Mentypage-footer-content">
                    <div className="page-number">
                        <button className="prev">←</button>
                        <button>1</button>
                        <button>2</button>
                        <button>3</button>
                        <button className="next">→</button>
                    </div>
                </div>
            </footer> */}



{/* 없을때화면 */}

            <div className="Mento-backup">
                <img src="/images/mentoring/1.png" alt="img"/>
                <p>아직 멘토가 없어요</p>
                <span>지원하고 첫번째 멘토되기</span>
            </div>

            <div className="Mento-backup-button">
                <button>멘토 지원하기</button>
            </div>

            {showModal && (
                <MentoreviewModal
                    onClose={() => setShowModal(false)}
                    onSelect={handleSelectMentor}
                />
            )}
        </section>
    );
}


export default Mentypage;
