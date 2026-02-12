import "../css/MypageMenty.css";
import Mypagedata from "./Mypagedata";
import MypageCommunity from "./MypageCommunity";
import { ProfileSetting } from "./ProfileSetting.jsx";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { getCurrentUser } from "../utils/auth";



function MypageMenty() {
    const [openModal, setOpenModal] = useState(false);
    const [bio, setBio] = useState("");
    const [nickname, setNickname] = useState("");

    useEffect(() => {
        const me = getCurrentUser();
        if (!me) return;
        setNickname(me.nickname || "");
        (async () => {
            try {
                const res = await fetch(`/api/profile?user_id=${me.user_id}`);
                if (!res.ok) return;
                const data = await res.json();
                setBio(data.user?.bio || "");
            } catch (e) {
                console.error(e);
            }
        })();

        const handler = (ev) => {
            const d = ev.detail || {};
            if (d.bio !== undefined) setBio(d.bio);
            if (d.nickname !== undefined) setNickname(d.nickname);
        };
        window.addEventListener("profile:updated", handler);
        return () => window.removeEventListener("profile:updated", handler);
    }, []);

    return (
        <section className="mypagementy">
            <div className="mypagementy-header">
                <div className="mypagementy-header-inner">
                    <div className="profile-button">
                        <div className="mypagementy-user-profile">
                            <img src='/images/profile.jpg' alt='' />
                            <div className="mypagementy-user-name">
                                <h2>환영합니다</h2>
                                <p><span>{nickname || "익명"}</span>님</p>
                            </div>
                            <div className="menty-setting">
                                    <button className="setting" type="button" onClick={() => { setOpenModal(true); }}>
                                        <img src='/images/icon/setting.png' alt="" />
                                        <p>프로필 설정</p>  
                                </button>
                                    {openModal ? <ProfileSetting openModal={openModal} setOpenModal={setOpenModal} /> : null}
                            </div>
                        </div>
                        <div className="change-button-mentee">
                            <Link to="/MypageMentor"><button>
                                멘티
                            </button></Link>
                        </div>
                    </div>
                    <div className="menty-explanation">
                        <h3>멘티 설명</h3>
                        <p>{bio || "소개가 없습니다."}</p>
                    </div>
                </div>
            </div>
            <div className="mypagementy-contents">
                <div className="mypagementy-contents-inner">
                    <div className="mypagementy-community">
                        <h2 className="mypagementy-contents-title">내가 쓴 글</h2>
                        <div className="mypagementy-community-contents">
                            <div className="mypagementy-community-title">
                                <h2>커뮤니티</h2>
                                <button>
                                    <p>더보기</p>
                                    <img src='/images/icon/Plus.png' alt='' />
                                </button>
                            </div>
                            <div className="mypagementy-community-main">
                                <MypageCommunity />
                                <MypageCommunity />
                                <MypageCommunity />
                                <MypageCommunity />
                            </div>
                        </div>
                    </div>
                    <div className="mypagementy-data">
                        <h2 className="mypagementy-contents-title">내 자료함</h2>
                        <div className="mypagementy-data-box">
                            <div className="mypagementy-data-contents">
                                <div className="mypagementy-data-title">
                                    <h2>자료함</h2>
                                </div>
                                <div className="mypagementy-data-main">
                                    <Mypagedata />
                                    <Mypagedata />
                                    <Mypagedata />
                                    <Mypagedata />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default MypageMenty;