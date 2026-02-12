import "../css/MypageMentor.css";
import Mypagedata from "./Mypagedata.jsx";
import MypageCommunity from "./MypageCommunity.jsx";
import { ProfileSetting } from "./ProfileSetting.jsx";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { getCurrentUser } from "../utils/auth";

// 여기는 Mypagemento 구역입니다.
// 이름은 바꾸기 무서워서 안바꾼 거니 오해 노노

export default function MypageMentor() {
    const [openModal, setOpenModal] = useState(false);
    const [bio, setBio] = useState("");
    const [nickname, setNickname] = useState("");

    const [canToggle, setCanToggle] = useState(false);
    const [isMentor, setIsMentor] = useState(false);

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

        // mentor-status 조회: 멘토 권한이 있으면 토글 허용
        (async () => {
            try {
                const resp = await fetch(`/me/mentor-status?user_id=${me.user_id}`);
                if (!resp.ok) return;
                const st = await resp.json();
                setCanToggle(Boolean(st?.canToggle));
                setIsMentor(Boolean(st?.isMentor));
            } catch (e) {
                console.error(e);
            }
        })();

        return () => window.removeEventListener("profile:updated", handler);
    }, []);

    return (
        <section className="mypage">
            <div className="mypage-header">
                <div className="mypage-header-inner">
                    <div className="profile-button">
                        <div className="mypage-user-profile">
                            <img src='/images/profile.jpg' alt='' />
                            <div className="mypage-user-name">
                                <h2>환영합니다</h2>
                                <p><span>{nickname || "익명"}</span>님</p>
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
                            {canToggle ? (
                                <Link to="/mypage"><button>멘티</button></Link>
                            ) : (
                                <button className="toggle-disabled" type="button" disabled title="멘토 권한이 있어야 전환 가능합니다">✕</button>
                            )}
                        </div>
                    </div>
                    <div className="user-explanation">
                        <h3>멘토 설명</h3>
                        <p>{bio || "소개가 없습니다."}</p>
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