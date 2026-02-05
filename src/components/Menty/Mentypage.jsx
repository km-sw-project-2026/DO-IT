import "../css/MypageMenty.css";


function Mentypage() {
    return (
        <section className="Mentypage">
            <div className="Mentypage-header">
                <div className="Mentypage-header-inner">
                    <h1>함께 성장하는 <strong>멘토링</strong>의 시작, <strong>경험</strong>을 나누고 <strong>성장</strong>을 연결합니다</h1>
                    <div className="Menty-button">
                        <img src="#" alt="1" />
                        <button>멘토 지원하기</button>
                    </div>
                    <div className="Menty-button">
                        <img src="#" alt="2" />
                        <button>후기 남기기</button>
                    </div>
                    <div className="Menty-button">
                        <img src="#" alt="3" />
                        <button>나의 채팅 기록</button>
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

            <div className="Mento-box">
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
            </footer>
        </section>
    );
}

export default Mentypage;