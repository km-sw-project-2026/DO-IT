import "../css/MRSDB.css";
import { data } from "../js/mypageRepositoryData.js"
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

function MRSDB() {
    return (
        <section>
            <div className="mrsdb">
                <div className="mrsdb-inner">
                    <div className="mrsdb-header">
                        <div className="mrsdb-title">
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

                    <div className="mrsdb-contents">
                        <div className="mrsdb-inventory">
                            {data.map((item, index) => (
                                <MypageRepositoryBtn key={index} btn={item} />
                            ))}
                            <div className="mrsdb-button">
                                <div className="mrsdb-button-span">
                                    <div className="Storage-bar"><div className="Storage-ber-used"></div></div>
                                </div>
                                <p className="Storage-capacity">43.2GB/100GB</p>
                                <button>추가 저장공간 구매</button>
                            </div>
                        </div>

                        <div className="mrsdb-alignment">
                            <div className="mrsdb-contents-inner">
                                <div className="mrsdb-main">
                                    <div className="mrsdb-main-header">
                                        <img src="/images/icon/aroow.png" alt="" />
                                        <p>공유할 폴더</p>
                                    </div>
                                </div>
                                <div className="mrsdb-file-list">
                                    <div className="mrsdb-file-name">
                                        <p>이름</p>
                                        <p>날짜</p>
                                        <p>형식</p>
                                        <p>크기</p>
                                    </div>
                                    <div className="mrsdb-file-suggestion">
                                        <div className="mrsdb-file-gather">
                                            <button><img src="/images/icon/folder.png" alt="" /></button>
                                            <p>수학</p>
                                        </div>
                                        <p>12월 1일 12:10</p>
                                        <p>.jpg</p  >
                                        <p>20GB</p>
                                        <div className="mrsdb-file-img-gather">
                                            <button className="mrsdb-download"><img src="/images/icon/download.png" alt="" /></button>
                                            <button className="mrsdb-pan"><img src="/images/icon/pan.png" alt="" /></button>
                                            <button className="mrsdb-star"><img src="/images/icon/star.png" alt="" /></button>
                                            <button>
                                                <div className="mrsdb-ooo">
                                                    <span>•</span>
                                                    <span>•</span>
                                                    <span>•</span>
                                                </div>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mrsdb-contents-inner">
                                <div className="mrsdb-main">
                                    <div className="mrsdb-main-header">
                                        <img src="/images/icon/aroow.png" alt="" />
                                        <p>공유할 파일</p>
                                    </div>
                                </div>
                                <div className="mrsdb-file-list">
                                    <div className="mrsdb-file-name">
                                        <p>이름</p>
                                        <p>날짜</p>
                                        <p>형식</p>
                                        <p>크기</p>
                                    </div>
                                    <div className="mrsdb-file-suggestion">
                                        <div className="mrsdb-file-gather">
                                            <button><img src="/images/icon/img.png" alt="" /></button>
                                            <p>자료구조 노트필기</p>
                                        </div>
                                        <p>12월 1일 12:10</p>
                                        <p>.jpg</p  >
                                        <p>20GB</p>
                                        <div className="mrsdb-file-img-gather">
                                            <button className="mrsdb-download"><img src="/images/icon/download.png" alt="" /></button>
                                            <button className="mrsdb-pan"><img src="/images/icon/pan.png" alt="" /></button>
                                            <button className="mrsdb-star"><img src="/images/icon/star.png" alt="" /></button>
                                            <button>
                                                <div className="mrsdb-ooo">
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

export default MRSDB;