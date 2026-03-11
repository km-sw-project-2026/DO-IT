import "../css/MypageMentor.css";
import Mypagedata from "./Mypagedata.jsx";
import MypageCommunity from "./MypageCommunity.jsx";
import { ProfileSetting } from "./ProfileSetting.jsx";
import { Link, useNavigate } from "react-router-dom";
import React, { useEffect, useMemo, useState } from "react";
import { getCurrentUser } from "../utils/auth";

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
    const navigate = useNavigate();
    const [openModal, setOpenModal] = useState(false);
    const [bio, setBio] = useState("");
    const [nickname, setNickname] = useState("");

    const [canToggle, setCanToggle] = useState(false);

    useEffect(() => {
        const me = getCurrentUser();
        if (!me) return;

        // 로그인 응답 구조가 중첩될 수 있으므로 안전하게 파싱
        const userId = me?.user_id ?? me?.id ?? me?.user?.user_id ?? me?.user?.id ?? me?.result?.user_id ?? null;
        if (!userId) return;

        setNickname(me.nickname || me?.user?.nickname || "");

        (async () => {
            try {
                const [profileRes, statusRes] = await Promise.all([
                    fetch(`/api/profile?user_id=${userId}`),
                    fetch(`/me/mentor-status?user_id=${userId}`),
                ]);
                if (profileRes.ok) {
                    const data = await profileRes.json();
                    setBio(data.user?.bio || "");
                }
                if (statusRes.ok) {
                    const status = await statusRes.json();
                    const role = me?.role ?? me?.user?.role ?? me?.result?.role ?? '';
                    const isMentorOrAdmin = status.isMentor || role === 'ADMIN';
                    setCanToggle(isMentorOrAdmin);
                    if (!isMentorOrAdmin) {
                        navigate('/mypage', { replace: true });
                    }
                }

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
    }, [navigate]);

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
                                <button onClick={() => { sessionStorage.setItem('viewMode', 'mentee'); navigate('/mypage'); }}>멘토</button>
                            ) : (
                                <button className="toggle-disabled" type="button" disabled title="멘토 전용 페이지입니다">✓</button>
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