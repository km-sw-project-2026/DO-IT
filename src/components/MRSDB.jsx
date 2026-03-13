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


                    </div>
                </div>
            </div>
        </section>
    );
}

export default MRSDB;