import "../css/MRFI.css";
import { data } from "../js/MypageRepository.js"

function MypageRepositoryBtn({ btn }) {
    return (
        <button className={`mypagerepository-${btn.class}`}>
            <img src={btn.src} alt="" />
            <p>{btn.text}</p>
        </button>
    )
}

function MRFI() {
    return (
        <section>
            <div className="mrfi">
                <div className="mrfi-inner">
                    <div className="mrfi-header">
                        <div className="mrfi-title">
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

                    <div className="mrfi-contents">
                        <div className="mrfi-inventory">
                            {data.map((item, index) => (
                                <MypageRepositoryBtn key={index} btn={item} />
                            ))}
                            <div className="mrfi-button">
                                <div className="mrfi-button-span">
                                    <div className="Storage-bar"><div className="Storage-ber-used"></div></div>
                                </div>
                                <p className="Storage-capacity">43.2GB/100GB</p>
                                <button>추가 저장공간 구매</button>
                            </div>
                        </div>
                        <div className="mrfi-contents-inner">
                            <div className="mrfi-main">
                                <div className="mrfi-main-header">
                                    <img src="/images/icon/aroow.png" alt="" />
                                    <p>수학</p>
                                    <button className="mr-add">
                                        <img src="/images/icon/Plus.png" alt="" />
                                    </button>
                                </div>
                            </div>
                            <div className="mrfi-file-list">
                                <div className="mrfi-file-name">
                                    <p>이름</p>
                                    <p>날짜</p>
                                    <p>형식</p>
                                    <p>크기</p>
                                </div>
                                <div className="mrfi-file-suggestion">
                                    <input type="checkbox" />
                                    <div className="mrfi-file-gather">
                                        <button><img src="/images/icon/img.png" alt="" /></button>
                                        <p>자료구조 노트필기</p>
                                    </div>
                                    <p>12월 1일 12:10</p>
                                    <p>.jpg</p  >
                                    <p>20GB</p>
                                    <div className="mrfi-file-img-gather">
                                        <button className="mrfi-reroll">
                                            <img src="/images/icon/reroll.png" alt="" />
                                        </button>
                                        <button>
                                            <div className="mrfi-ooo">
                                                <span>•</span>
                                                <span>•</span>
                                                <span>•</span>
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="mrfi-file-list">
                                <div className="mrfi-file-name"></div>
                                <div className="mrfi-file-suggestion">
                                    <input type="checkbox" />
                                    <div className="mrfi-file-gather">
                                        <button><img src="/images/icon/img.png" alt="" /></button>
                                        <p>자료구조 노트필기</p>
                                    </div>
                                    <p>12월 1일 12:10</p>
                                    <p>.jpg</p  >
                                    <p>20GB</p>
                                    <div className="mrfi-file-img-gather">
                                        <button className="mrfi-reroll">
                                            <img src="/images/icon/reroll.png" alt="" />
                                        </button>
                                        <button>
                                            <div className="mrfi-ooo">
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
        </section>
    );
}

export default MRFI;