import "../../css/Menty/Mentopage.css";
import Mentopagebox from "./Mentopagebox.jsx";

function Mentopage() {
    return (
        <>
            <div className="hero">
                <h2>함께 성장하는 <strong>멘토링</strong>의 시작, <strong>경험</strong>을 나누고 <strong>성장</strong>을 연결합니다</h2>
                <div className="hero-btns">
                    <button className="hero-btn">
                        <img src="" alt="" />
                        <span>나의 후기 보기</span>
                    </button>
                    <button className="hero-btn">
                        <img src="" alt="" />
                        <span>나의 채팅 기록</span>
                    </button>
                </div>
            </div>

            <div className="main-layout">

                <div className="applicant-list">
                    <Mentopagebox />
                    <Mentopagebox />
                    <Mentopagebox />
                </div>

                <div className="divider"></div>

                <div className="my-info-box">
                    <h3>내 정보</h3>

                    <div className="form-group">
                        <label>소개글</label>
                        <textarea></textarea>
                    </div>

                    <div className="form-group">
                        <label>경력</label>
                        <input type="text" />
                    </div>

                    <div className="form-group">
                        <label>수업분야</label>
                        <input type="text" />
                    </div>

                    <div className="form-group">
                        <label>자격증</label>
                        <input type="text" />
                    </div>

                    <button className="btn-save">수정하기</button>
                </div>

            </div>
        </>
    );
}

export default Mentopage;