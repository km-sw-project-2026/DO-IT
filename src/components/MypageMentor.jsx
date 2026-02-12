import "../css/MypageMentor.css";
import Mypagedata from "./Mypagedata.jsx";
import MypageCommunity from "./MypageCommunity.jsx";
import {ProfileSetting} from "./ProfileSetting.jsx";
import { Link } from "react-router-dom";
import React, { useEffect, useMemo, useState } from "react";

function MypageCommunityList() {
    const PAGE_LIMIT_DISPLAY = 4;

    const userDataRaw = useMemo(() => {
        return localStorage.getItem("user") || sessionStorage.getItem("user");
    }, []);

    const currentUserId = useMemo(() => {
        if (!userDataRaw) return null;
        try {
            const u = JSON.parse(userDataRaw);
            const id =
                u?.user_id ??
                u?.id ??
                u?.user?.user_id ??
                u?.user?.id ??
                u?.result?.user_id ??
                null;
            return id != null ? Number(id) : null;
        } catch {
            return null;
        }
    }, [userDataRaw]);

    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    useEffect(() => {
        const fetchMyLatest = async () => {
            if (!currentUserId) {
                setPosts([]);
                return;
            }

            try {
                setLoading(true);
                setErrorMsg("");

                const firstResp = await fetch(`/api/posts?page=1`);
                if (!firstResp.ok) throw new Error("failed to fetch posts page 1");
                const firstData = await firstResp.json();

                const totalPagesFromServer = Number(firstData?.total_pages || 1);
                const pageFetches = [];
                for (let p = 2; p <= totalPagesFromServer; p++) {
                    pageFetches.push(
                        fetch(`/api/posts?page=${p}`).then((r) => {
                            if (!r.ok) return null;
                            return r.json().catch(() => null);
                        }).catch(() => null)
                    );
                }

                const otherPages = (await Promise.all(pageFetches)).filter(Boolean);

                const allServerPosts = [
                    ...(Array.isArray(firstData?.posts) ? firstData.posts : []),
                    ...otherPages.flatMap((d) => (Array.isArray(d?.posts) ? d.posts : [])),
                ];

                const onlyMinePosts = allServerPosts
                    .filter((p) => Number(p?.user_id) === currentUserId)
                    .sort((a, b) => Number(b.post_id) - Number(a.post_id))
                    .slice(0, PAGE_LIMIT_DISPLAY);

                setPosts(onlyMinePosts);
            } catch (e) {
                console.error(e);
                setErrorMsg("내 게시글을 불러오지 못했습니다.");
                setPosts([]);
            } finally {
                setLoading(false);
            }
        };

        fetchMyLatest();
    }, [currentUserId]);

    const formatDate = (value) => {
        if (!value) return "-";
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return String(value);
        return d.toLocaleDateString("ko-KR");
    };

    if (!currentUserId) return <p style={{ padding: "12px" }}>로그인 후 내 글을 볼 수 있어요.</p>;
    if (loading) return <p style={{ padding: "12px" }}>불러오는 중...</p>;
    if (errorMsg) return <p style={{ padding: "12px" }}>{errorMsg}</p>;
    if (posts.length === 0) return <p style={{ padding: "12px" }}>내가 작성한 게시글이 없습니다.</p>;

    return (
        <>
            {posts.map((post) => (
                <div key={post.post_id} className="community-text">
                    <Link to={`/post/${post.post_id}`} style={{ textDecoration: "none", color: "inherit" }}>
                        <p>{post.title || "제목 없음"}</p>
                    </Link>
                    <span>{formatDate(post.created_at)}</span>
                </div>
            ))}
        </>
    );
}

// 여기는 Mypagemento 구역입니다.
// 이름은 바꾸기 무서워서 안바꾼 거니 오해 노노

export default function MypageMentor() {
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
                            <Link to="/MypageMenty"><button>
                                멘토
                            </button></Link>
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
                                <Link to="/mypageposts">
                                <button>
                                    <p>더보기</p>
                                    <img src='/images/icon/Plus.png' alt='' />
                                </button>
                                </Link>
                            </div>
                            <div className="mypage-community-main">
                                <MypageCommunityList />
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