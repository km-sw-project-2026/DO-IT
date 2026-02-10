import "../css/MypageRepository.css";
import { data } from "../js/MypageRepository.js"
import MypageRepositoryfile from "./MypageRepositoryfile.jsx";

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
                                <div className="mypagerepository-button-span">
                                    <div className="Storage-bar"><div className="Storage-ber-used"></div></div>
                                </div>
                                <p className="Storage-capacity">43.2GB/100GB</p>
                                <button>추가 저장공간 구매</button>
                            </div>
                        </div>
                        <div className="mypagerepository-collection">
                            <div className="mypagerepository-main">
                                <div className="mypagerepository-main-header">
                                    <img src="/images/icon/aroow.png" alt="" />
                                    <p>내 폴더</p>
                                    <button className="mr-add">
                                        <img src="/images/icon/Plus.png" alt="" />
                                    </button>
                                </div>
                                <ul className="mypagerepository-main-body">
                                    <MypageRepositoryfile />
                                    <MypageRepositoryfile />
                                    <MypageRepositoryfile />
                                </ul>
                            </div>
                            <div className="mypagerepository-file-bottom">
                                <div className="mypagerepository-bottom">
                                    <img src="/images/icon/aroow.png" alt="" />
                                    <p>추천 파일</p>
                                </div>
                                <div className="mypagerepository-file-list">
                                    <div className="mypagerepository-file-name">
                                        <p>이름</p>
                                        <p>날짜</p>
                                        <p>형식</p>
                                        <p>크기</p>
                                    </div>
                                    <div className="mypagerepository-file-suggestion">
                                        <div className="mypagerepository-file-gather">
                                            <button><img src="/images/icon/img.png" alt="" /></button>
                                            <p>자료구조 노트필기</p>
                                        </div>
                                        <p>12월 1일 12:10</p>
                                        <p>.jpg</p  >
                                        <p>20GB</p>
                                        <div className="mypagerepository-file-img-gather">
                                            <button className="mypagerepository-download"><img src="/images/icon/download.png" alt="" /></button>
                                            <button className="mypagerepository-pan"><img src="/images/icon/pan.png" alt="" /></button>
                                            <button className="mypagerepository-star"><img src="/images/icon/star.png" alt="" /></button>
                                            <button>
                                                <div className="mypagerepository-ooo">
                                                    <span>•</span>
                                                    <span>•</span>
                                                    <span>•</span>
                                                </div>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default MypageRepository;