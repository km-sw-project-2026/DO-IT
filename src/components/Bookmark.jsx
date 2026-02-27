import "../css/Bookmark.css";
import { data } from "../js/MypageRepository.js"
import MypageRepositoryfile from "./MypageRepositoryfile.jsx";
import { Link } from "react-router-dom";

function MypageRepositoryBtn({ btn }) {
    return (
        <Link to={btn.to}>
            <button className={`mypagerepository-${btn.class}`}>
                <img src={btn.src} alt="" />
                <p>{btn.text}</p>
            </button>
        </Link>
    )
}

function Bookmark() {
    return (
        <section>
            <div className="Bookmark">
                <div className="Bookmark-inner">
                    <div className="Bookmark-header">
                        <div className="Bookmark-title">
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

                    <div className="Bookmark-contents">
                        <div className="Bookmark-inventory">
                            {data.map((item, index) => (
                                <MypageRepositoryBtn key={index} btn={item} />
                            ))}
                            <div className="Bookmark-button">
                                <div className="Bookmark-button-span">
                                    <div className="Storage-bar"><div className="Storage-ber-used"></div></div>
                                </div>
                                <p className="Storage-capacity">43.2GB/100GB</p>
                                <button>추가 저장공간 구매</button>
                            </div>
                        </div>
                        <div className="Bookmark-collection">
                            <div className="Bookmark-main">
                                <div className="Bookmark-file-bottom">
                                    <div className="Bookmark-bottom">
                                        <img src="/images/icon/aroow.png" alt="" />
                                        <p>즐겨찾기</p>
                                    </div>
                                    <div className="Bookmark-file-list">
                                        <div className="Bookmark-file-name">
                                            <p>이름</p>
                                            <p>날짜</p>
                                            <p>형식</p>
                                            <p>크기</p>
                                        </div>
                                        <div className="Bookmark-file-suggestion">
                                            <div className="Bookmark-file-gather">
                                                <button><img src="/images/icon/img.png" alt="" /></button>
                                                <p>자료구조 노트필기</p>
                                            </div>
                                            <p>12월 1일 12:10</p>
                                            <p>.jpg</p  >
                                            <p>20GB</p>
                                            <div className="Bookmark-file-img-gather">
                                                <button className="Bookmark-download"><img src="/images/icon/download.png" alt="" /></button>
                                                <button className="Bookmark-pan"><img src="/images/icon/pan.png" alt="" /></button>
                                                <button className="Bookmark-star"><img src="/images/icon/star2.png" alt="" /></button>
                                            </div>
                                                <button className="Bookmark-ooo-button">
                                                    <div className="Bookmark-ooo">
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

export default Bookmark;