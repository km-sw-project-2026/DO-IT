import "../css/Mypage.css";
import Mypagedata from "./Mypagedata.jsx";
import MypageCommunity from "./MypageCommunity.jsx";
import {ProfileSetting} from "./ProfileSetting";
import { Link } from "react-router-dom";
import { useState } from "react";

// 여기는 Mypagemento 구역입니다.
// 이름은 바꾸기 무서워서 안바꾼 거니 오해 노노

export default function Mypage() {
    const [openModal, setOpenModal] = useState(false);

    return (
        <section className="mypage">
            <div className="mypage-header">
                <div className="mypage-header-inner">
                    <div className="profile-button">
                        <div className="mypage-user-profile">
                            <img src='/images/profile.jpg' alt='' />
                            <div className="mypage-user-name">
                                <h2>환영합니다</h2>
                                <p><span>어드민</span>님</p>
                            </div>
                            <div className="user-setting">
                                <button className="setting" type="button" onClick={() => {setOpenModal(true);}}>
                                    <img src='/images/icon/setting.png' alt="" />
                                    <p>프로필 설정</p>
                                </button>
                                {openModal ? <ProfileSetting openModal={openModal} setOpenModal={setOpenModal} /> : null}
                            </div>
                        </div>
                        <div className="change-button-mentor">
                            <button>
                                멘토
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
                                <MypageCommunity />
                                <MypageCommunity />
                                <MypageCommunity />
                                <MypageCommunity />
                            </div>
                        </div>
                    </div>
                    <div className="mypage-data">
                        <h2 className="mypage-contents-title">내 자료함</h2>
                        <Link to="/mypagerepository">
                            <div className="mypage-data-box">
                                <div className="mypage-data-contents">
                                    <div className="mypage-data-title">
                                        <h2>자료함</h2>
                                    </div>
                                    <div className="mypage-data-main">
                                        <Mypagedata />
                                        <Mypagedata />
                                        <Mypagedata />
                                        <Mypagedata />
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
};