import { useState, useEffect } from "react";
import "../../css/Menty/Mentopage.css";
import Mentopagebox from "./Mentopagebox.jsx";

function Mentopage() {
    const [profileForm, setProfileForm] = useState({
        introduction: "",
        career: "",
        subject: "",
        certificate: "",
    });
    const [saving, setSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState("");

    // 기존 프로필 불러오기
    useEffect(() => {
        try {
            const raw = sessionStorage.getItem("user") || localStorage.getItem("user");
            const me = raw ? JSON.parse(raw) : null;
            const uid = me?.user_id ?? me?.id ?? me?.user?.user_id ?? null;
            if (!uid) return;

            fetch(`/api/mentor-profile?user_id=${uid}`)
                .then((r) => r.json())
                .then((data) => {
                    if (data.profile) {
                        setProfileForm({
                            introduction: data.profile.introduction || "",
                            career: data.profile.career || "",
                            subject: data.profile.subject || "",
                            certificate: data.profile.certificate || "",
                        });
                    }
                })
                .catch(() => {});
        } catch { /* ignore */ }
    }, []);

    const handleSave = async () => {
        setSaveMsg("");
        let uid = null;
        try {
            const raw = sessionStorage.getItem("user") || localStorage.getItem("user");
            const me = raw ? JSON.parse(raw) : null;
            uid = me?.user_id ?? me?.id ?? me?.user?.user_id ?? null;
        } catch { /* ignore */ }

        if (!uid) {
            setSaveMsg("로그인 정보를 찾을 수 없습니다. 다시 로그인해 주세요.");
            return;
        }
        setSaving(true);
        try {
            const res = await fetch("/api/mentor-profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_id: uid, ...profileForm }),
            });
            const data = await res.json();
            setSaveMsg(res.ok ? "저장되었습니다." : (data.message || "저장 실패"));
        } catch {
            setSaveMsg("네트워크 오류가 발생했습니다.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <div className="hero">
                <h2>함께 성장하는 <strong>멘토링</strong>의 시작, <strong>경험</strong>을 나누고 <strong>성장</strong>을 연결합니다</h2>
                <div className="hero-btns">
                    <button className="hero-btn">
                        <span>나의 후기 보기</span>
                    </button>
                    <button className="hero-btn">
                        <span>나의 채팅 기록</span>
                    </button>
                </div>
            </div>

            <div className="main-layout">

                <div className="applicant-list">
                    <Mentopagebox />
                    <Mentopagebox />
                    <Mentopagebox />
                </div>

                <div className="divider"></div>

                <div className="my-info-box">
                    <h3>내 정보</h3>

                    <div className="form-group">
                        <label>소개글</label>
                        <textarea
                            value={profileForm.introduction}
                            onChange={(e) => setProfileForm((f) => ({ ...f, introduction: e.target.value }))}
                            placeholder="나를 소개해 주세요"
                        />
                    </div>

                    <div className="form-group">
                        <label>경력</label>
                        <input
                            type="text"
                            value={profileForm.career}
                            onChange={(e) => setProfileForm((f) => ({ ...f, career: e.target.value }))}
                            placeholder="경력을 입력하세요"
                        />
                    </div>

                    <div className="form-group">
                        <label>수업분야</label>
                        <input
                            type="text"
                            value={profileForm.subject}
                            onChange={(e) => setProfileForm((f) => ({ ...f, subject: e.target.value }))}
                            placeholder="수업 분야를 입력하세요"
                        />
                    </div>

                    <div className="form-group">
                        <label>자격증</label>
                        <input
                            type="text"
                            value={profileForm.certificate}
                            onChange={(e) => setProfileForm((f) => ({ ...f, certificate: e.target.value }))}
                            placeholder="자격증을 입력하세요"
                        />
                    </div>

                    {saveMsg && <p className="save-msg">{saveMsg}</p>}
                    <button className="btn-save" type="button" onClick={handleSave} disabled={saving}>
                        {saving ? "저장 중..." : "수정하기"}
                    </button>
                </div>

            </div>
        </>
    );
}

export default Mentopage;