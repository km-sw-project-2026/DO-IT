import "../css/Mypage.css";
import MypageCommunity from "./MypageCommunity";
import Mypagedata from "./Mypagedata";
import { Link } from "react-router-dom";

function Mypage() {
    return (
        <section className="mypage">
            <div className="mypage-header">
                <div className="mypage-header-inner">
                    <div className="myapge-user-profile">
                        <img src='/images/profile.jpg' alt='' />
                        <div className="mypage-user-name">
                            <h2>환영합니다</h2>
                            <p><span>어드민</span>님</p>
                        </div>
                        <div className="user-setting">
                            <button className="setting">
                                <img src='/images/icon/setting.png' alt="" />
                                <p>프로필 설정</p>
                            </button>
                        </div>
                    </div>
                    <div className="user-explanation">
                        <h3>멘토 설명</h3>
                        <p>수학만 알려드립니다</p>
                    </div>
                </div>
            </div>
            <div className="mypage-contents">
                <div className="mypage-contents-inner">
                    <div className="mypage-community">
                        <h2 className="mypage-contents-title">내가 쓴 글</h2>
                        <div className="mypage-community-contents">
                            <div className="mypage-community-title">
                                <h2>커뮤니티</h2>
                                <button>
                                    <p>더보기</p>
                                    <img src='/images/icon/Plus.png' alt='' />
                                </button>
                            </div>
                            <div className="mypage-community-main">
                                <MypageCommunity/>
                                <MypageCommunity/>
                                <MypageCommunity/>
                                <MypageCommunity/>
                            </div>
                        </div>
                    </div>
                    <div className="mypage-data">
                        <h2 className="mypage-contents-title">내 자료함</h2>
                        <div className="mypage-data-box">
                            <div className="mypage-data-contents">
                                <div className="mypage-data-title">
                                    <h2>자료함</h2>
                                </div>
                                <div className="mypage-data-main">
                                    <Mypagedata/>
                                    <Mypagedata/>
                                    <Mypagedata/>
                                    <Mypagedata/>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default Mypage;