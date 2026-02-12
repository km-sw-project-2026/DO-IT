import "../css/MypageRepositoryDelete.css";
import { data } from "../js/MypageRepository.js"

function MypageRepositoryBtn({ btn }) {
    return (
        <button className={`mypagerepository-${btn.class}`}>
            <img src={btn.src} alt="" />
            <p>{btn.text}</p>
        </button>
    )
}

function MypageRepositoryDelete() {
    return (
        <section>
            <div className="mypagerepositorydelete">
                <div className="mypagerepositorydelete-inner">
                    <div className="mypagerepositorydelete-header">
                        <div className="mypagerepositorydelete-title">
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

                    <div className="mypagerepositorydelete-contents">
                        <div className="mypagerepositorydelete-inventory">
                            {data.map((item, index) => (
                                <MypageRepositoryBtn key={index} btn={item} />
                            ))}
                            <div className="mypagerepositorydelete-button">
                                <div className="mypagerepositorydelete-button-span">
                                    <div className="Storage-bar"><div className="Storage-ber-used"></div></div>
                                </div>
                                <p className="Storage-capacity">43.2GB/100GB</p>
                                <button>추가 저장공간 구매</button>
                            </div>
                        </div>
                        <div className="mypagerepositorydelete-contents-inner">
                            <div className="mypagerepositorydelete-top">
                                <div className="mypagerepositorydelete-left">
                                    <button><img src="/images/icon/close.png" alt="" /></button>
                                    <p>1개 선텍됨</p>
                                </div>
                                <div className="mypagerepositorydelete-right">
                                    <button>복원</button>
                                    <button>휴지통 비우기</button>
                                </div>
                            </div>

                            <div className="mypagerepositorydelete-center">
                                <input type="checkbox" />
                                <p>전체선택</p>
                            </div>


                            <div className="mypagerepositorydelete-bottom">
                                <img src="/images/icon/aroow.png" alt="" />
                                <p>휴지통</p>
                            </div>

                            <div className="mypagerepositorydelete-file-list">
                                <div className="mypagerepositorydelete-file-name">
                                    <p>이름</p>
                                    <p>날짜</p>
                                    <p>형식</p>
                                    <p>크기</p>
                                </div>
                                <div className="mypagerepositorydelete-file-suggestion">
                                    <input type="checkbox" />
                                    <div className="mypagerepositorydelete-file-gather">
                                        <button><img src="/images/icon/img.png" alt="" /></button>
                                        <p>자료구조 노트필기</p>
                                    </div>
                                    <p>12월 1일 12:10</p>
                                    <p>.jpg</p  >
                                    <p>20GB</p>
                                    <div className="mypagerepositorydelete-file-img-gather">
                                        <button className="mypagerepositorydelete-reroll">
                                            <img src="/images/icon/reroll.png" alt="" />
                                        </button>
                                        <button>
                                            <div className="mypagerepositorydelete-ooo">
                                                <span>•</span>
                                                <span>•</span>
                                                <span>•</span>
                                            </div>
                                        </button>
                                    </div>
                                </div>

                                
                                <div className="mypagerepositorydelete-file-suggestion">
                                    <input type="checkbox" />
                                    <div className="mypagerepositorydelete-file-gather">
                                        <button><img src="/images/icon/img.png" alt="" /></button>
                                        <p>자료구조 노트필기</p>
                                    </div>
                                    <p>12월 1일 12:10</p>
                                    <p>.jpg</p  >
                                    <p>20GB</p>
                                    <div className="mypagerepositorydelete-file-img-gather">
                                        <button className="mypagerepositorydelete-reroll">
                                            <img src="/images/icon/reroll.png" alt="" />
                                        </button>
                                        <button>
                                            <div className="mypagerepositorydelete-ooo">
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

export default MypageRepositoryDelete;