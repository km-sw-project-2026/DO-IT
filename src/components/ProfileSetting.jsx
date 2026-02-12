import { useState, useEffect } from "react";
import "../css/ProfileSetting.css";
import { getCurrentUser } from "../utils/auth";

export const ProfileSetting = ({ openModal, setOpenModal }) => {
    const [nickname, setNickname] = useState("");
    const [bio, setBio] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const me = getCurrentUser();
        if (!me) return;
        setNickname(me.nickname || "");

        // 불러오기
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
    }, [openModal]);

    async function onSave() {
        const me = getCurrentUser();
        if (!me) return alert("로그인이 필요합니다.");
        setLoading(true);
        try {
            const res = await fetch("/api/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_id: me.user_id, nickname, bio }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "저장 실패");

            // 로컬 스토리지에 닉네임 반영
            const raw = localStorage.getItem("user") || sessionStorage.getItem("user");
            if (raw) {
                try {
                    const obj = JSON.parse(raw);
                    obj.nickname = nickname;
                    localStorage.setItem("user", JSON.stringify(obj));
                } catch {}
            }

            // 이벤트로 다른 컴포넌트에 변경 알림
            try {
                window.dispatchEvent(
                    new CustomEvent("profile:updated", { detail: { nickname, bio } })
                );
            } catch (e) {
                console.error("dispatch profile:updated failed", e);
            }

            setOpenModal(false);
        } catch (e) {
            console.error(e);
            alert(e.message || "오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="pop-up">
            <div className="pop-up-contents">
                <div className="profile-setting-inner">
                    <div className="profile-setting-header">
                        <h2>프로필 설정</h2>
                        <button type="button" onClick={() => { setOpenModal(false); }}>
                            <img src="/images/icon/close.png" alt="닫기" />
                        </button>
                    </div>
                    <div className="profile-setting-set">
                        <div className="profile-setting-list">
                            <div>
                                <button>프로필</button>
                            </div>
                        </div>
                        <div className="profile-setting-contents">
                            <div className="profile">
                                <h3>프로필</h3>
                                <img src="/images/icon/profile.jpg" alt="이미지 넣을 예정" />
                            </div>
                            <div className="nickname">
                                <h3>이름</h3>
                                <input type="text" value={nickname} onChange={(e) => setNickname(e.target.value)} />
                            </div>
                            <div className="information">
                                <h3>정보</h3>
                                <textarea name="information" id="information" value={bio} onChange={(e) => setBio(e.target.value)}></textarea>
                            </div>
                        </div>
                    </div>
                    <button className="profile-setting-check" type="button" onClick={onSave} disabled={loading}>
                        {loading ? "저장중..." : "확인"}
                    </button>
                </div>
            </div>
        </div>
    );
};