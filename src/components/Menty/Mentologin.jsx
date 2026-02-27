import "../../css/Menty/Mentologin.css";

function Mentologin() {
    return (
        <section className="Mentologin">
            <div className="Mentologin-card">
                <h2 className="Mentologin-title">멘토 지원하기</h2>

                <div className="Mentologin-form">

                    <div className="Mentologin-form-group">
                        <label>연락받을 수단 (이메일 또는 전화번호)</label>
                        <input type="text" />
                    </div>

                    <div className="Mentologin-form-group">
                        <label>계약자명</label>
                        <input type="text" />
                    </div>

                    <div className="Mentologin-form-group">
                        <label>소속 (직장 / 학교)</label>
                        <input type="text" />
                    </div>

                    <div className="Mentologin-form-group">
                        <label>자기소개 형식 글</label>
                        <textarea />
                    </div>

                    <div className="Mentologin-form-group">
                        <label>희망분야</label>
                        <input type="text" />
                    </div>

                    <div className="Mentologin-form-group">
                        <label>관련 사이트 (선택사항)</label>
                        <input type="text" placeholder="github 주소 / 블로그 주소 등" />
                    </div>

                    <div className="Mentologin-checkbox">
                        <input type="checkbox" id="agree" />
                        <label htmlFor="agree">
                            <span>이용약관</span> 및 <span>개인정보 처리방침</span>에 동의합니다
                        </label>
                    </div>

                    <button className="Mentologin-submit">제출</button>

                </div>
            </div>
        </section>
    );
}

export default Mentologin;