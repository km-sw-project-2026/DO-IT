import "../css/MypageRepository.css";

function MypageRepository () {
    return (
        <section>
            <div className="mypagerepository">
                <div className="mypagerepository-header">
                    <h2>내 자료함</h2>
                    <img src="" alt="" />
                    <input type="text" />
                </div>

                <div className="mypagerepository-contents">
                    <div className="mypagerepository-inventory">
                        <div className="mypagerepository-home">
                            <img src="" alt="" />
                            <p>홈</p>
                        </div>
                        <div className="mypagerepository-share">
                            <img src="" alt="" />
                            <p>공유 자료함</p>
                        </div>
                        <div className="mypagerepository-new">
                            <img src="" alt="" />
                            <p>최근 자료함</p>
                        </div>
                        <div className="mypagerepository-star">
                            <img src="" alt="" />
                            <p>즐겨찾기</p>
                        </div>
                        <div className="mypagerepository-delete">
                            <img src="" alt="" />
                            <p>바가지</p>
                        </div>
                    </div>


                </div>
            </div>
        </section>
    );
}

export default MypageRepository;