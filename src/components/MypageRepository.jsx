import "../css/MypageRepository.css";
import { data } from "../js/MypageRepository.js"

function MypageRepositoryBtn({ btn }) {
    return (
        <button className={`mypagerepository-${btn.class}`}>
            <img src={btn.src} alt="" />
            <p>{btn.text}</p>
        </button>
    )
}

function MypageRepository() {
    return (
        <section>
            <div className="mypagerepository">
                <div className="mypagerepository-inner">
                    <div className="mypagerepository-header">
                        <div className="mypagerepository-title">
                            <h2>내 자료함</h2>
                            <img src='/images/mypagerepository.png' alt="" />
                        </div>
                        <div className="search">
                            <input
                                type="text"
                                placeholder="검색어를 입력해주세요"
                            // value={keyword}
                            // onChange={(e) => setKeyword(e.target.value)}
                            />
                            <button type="button">
                                <img src="/images/icon/search1.png" alt="검색" />
                            </button>
                        </div>
                    </div>

                    <div className="mypagerepository-contents">
                        <div className="mypagerepository-inventory">
                            {data.map((item, index) => (
                                <MypageRepositoryBtn key={index} btn={item} />
                            ))}
                            <div className="mypagerepository-button">
                                <div className="mypagerepository-span">
                                    <div className="Storage-bar"><div className="Storage-ber-used"></div></div>
                                </div>
                                <p className="Storage-capacity">43.2GB/100GB</p>
                                <button>추가 저장공간 구매</button>
                            </div>
                        </div>
                        <div className="mypagerepository-main">
                            <div className="mypagerepository-main-header">
                                <img src="/images/icon/aroow.png" alt="" />
                                <p>내 폴더</p>
                            </div>
                            <div className="mypagerepository-main-body">
                                <button className="mypagerepository-bg">
                                    <img src="/images/icon/folder.png" alt="" />
                                    <p>수학</p>
                                </button>
                                <button>
                                    <div>
                                        <span>.</span>
                                        <span>.</span>
                                        <span>.</span>
                                    </div>
                                </button>
                            </div>
                            <div className="mypagerepository-main-suggestion"></div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default MypageRepository;