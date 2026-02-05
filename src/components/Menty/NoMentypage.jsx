


function NoMentypage() {
    return (
        <section className="NoMentypage">
            <div className="NoMentypage-header">
                <div className="NoMentypage-header-inner">
                    <h1>함께 성장하는 <strong>멘토링</strong>의 시작, <strong>경험</strong>을 나누고 <strong>성장</strong>을 연결합니다</h1>
                    <div className="NoMenty-button">
                        <img src="#" alt="1" />
                        <button>멘토 지원하기</button>
                    </div>
                    <div className="NoMenty-button">
                        <img src="#" alt="2" />
                        <button>후기 남기기</button>
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

            <div className="Mento-backup">
                <img src="#" alt="backup" />
                <p>아직 멘토가 없어요</p>
                <span>지원하고 첫번째 멘토되기</span>
            </div>

            <div className="Mento-backup-button">
                <button>멘토 지원하기</button>
            </div>
        </section>
    );
}


export default NoMentypage;