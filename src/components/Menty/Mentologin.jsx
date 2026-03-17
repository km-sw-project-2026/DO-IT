import "../../css/Menty/Mentologin.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import TermsModal from "../TermsModal";
import PrivacyModal from "../PrivacyModal";

function Mentologin() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        contact: "",
        contractor_name: "",
        affiliation: "",
        introduction: "",
        hope_field: "",
        related_url: "",
    });
    const [agree, setAgree] = useState(false);
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    
    // 모달 상태 추가
    const [showTerms, setShowTerms] = useState(false);
    const [showPrivacy, setShowPrivacy] = useState(false);

    const currentUser = (() => {
        try { return JSON.parse(sessionStorage.getItem("user") || localStorage.getItem("user") || "null"); }
        catch { return null; }
    })();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: "" }));
    };

    const validate = () => {
        const errs = {};
        if (!form.contact.trim())          errs.contact = "연락받을 수단을 입력해주세요.";
        if (!form.contractor_name.trim())  errs.contractor_name = "계약자명을 입력해주세요.";
        if (!form.affiliation.trim())      errs.affiliation = "소속을 입력해주세요.";
        if (!form.introduction.trim())     errs.introduction = "자기소개를 입력해주세요.";
        if (!form.hope_field.trim())       errs.hope_field = "희망분야를 입력해주세요.";
        if (!agree)                        errs.agree = "이용약관에 동의해주세요.";
        return errs;
    };

    const handleSubmit = async () => {
        if (!currentUser) {
            alert("로그인 후 이용해주세요.");
            navigate("/login");
            return;
        }

        const errs = validate();
        if (Object.keys(errs).length > 0) {
            setErrors(errs);
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch("/api/mentor-application", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user_id: currentUser.user_id,
                    ...form,
                }),
            });
            const data = await res.json();
            if (res.ok) {
                alert(data.message || "멘토 지원이 완료되었습니다!");
                navigate("/mentypage");
            } else {
                alert(data.message || "제출에 실패했습니다.");
            }
        } catch {
            alert("네트워크 오류가 발생했습니다.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <section className="Mentologin">
            <div className="Mentologin-card">
                <h2 className="Mentologin-title">멘토 지원하기</h2>

                <div className="Mentologin-form">

                    <div className="Mentologin-form-group">
                        <label>연락받을 수단 (이메일 또는 전화번호) <span className="required">*</span></label>
                        <input
                            type="text"
                            name="contact"
                            value={form.contact}
                            onChange={handleChange}
                            placeholder="이메일 또는 전화번호"
                        />
                        {errors.contact && <p className="Mentologin-error">{errors.contact}</p>}
                    </div>

                    <div className="Mentologin-form-group">
                        <label>계약자명 <span className="required">*</span></label>
                        <input
                            type="text"
                            name="contractor_name"
                            value={form.contractor_name}
                            onChange={handleChange}
                            placeholder="실명을 입력해주세요"
                        />
                        {errors.contractor_name && <p className="Mentologin-error">{errors.contractor_name}</p>}
                    </div>

                    <div className="Mentologin-form-group">
                        <label>소속 (직장 / 학교) <span className="required">*</span></label>
                        <input
                            type="text"
                            name="affiliation"
                            value={form.affiliation}
                            onChange={handleChange}
                            placeholder="현재 재직 중인 회사 또는 학교"
                        />
                        {errors.affiliation && <p className="Mentologin-error">{errors.affiliation}</p>}
                    </div>

                    <div className="Mentologin-form-group">
                        <label>자기소개 형식 글 <span className="required">*</span></label>
                        <textarea
                            name="introduction"
                            value={form.introduction}
                            onChange={handleChange}
                            placeholder="경력, 역량, 멘토링 방식 등을 자유롭게 작성해주세요."
                        />
                        {errors.introduction && <p className="Mentologin-error">{errors.introduction}</p>}
                    </div>

                    <div className="Mentologin-form-group">
                        <label>희망분야 <span className="required">*</span></label>
                        <input
                            type="text"
                            name="hope_field"
                            value={form.hope_field}
                            onChange={handleChange}
                            placeholder="예) 백엔드 개발, 프론트엔드, AI 등"
                        />
                        {errors.hope_field && <p className="Mentologin-error">{errors.hope_field}</p>}
                    </div>

                    <div className="Mentologin-form-group">
                        <label>관련 사이트 (선택사항)</label>
                        <input
                            type="text"
                            name="related_url"
                            value={form.related_url}
                            onChange={handleChange}
                            placeholder="github 주소 / 블로그 주소 등"
                        />
                    </div>

                    <div className="Mentologin-checkbox">
                        <input
                            type="checkbox"
                            id="agree"
                            checked={agree}
                            onChange={(e) => { setAgree(e.target.checked); setErrors((p) => ({ ...p, agree: "" })); }}
                        />
                        <label htmlFor="agree">
                            <span 
                                onClick={(e) => { e.preventDefault(); setShowTerms(true); }}
                                style={{ cursor: "pointer", textDecoration: "underline" }}
                            >
                                이용약관
                            </span> 및 <span 
                                onClick={(e) => { e.preventDefault(); setShowPrivacy(true); }}
                                style={{ cursor: "pointer", textDecoration: "underline" }}
                            >
                                개인정보 처리방침
                            </span>에 동의합니다
                        </label>
                    </div>
                    {errors.agree && <p className="Mentologin-error">{errors.agree}</p>}

                    <button
                        className="Mentologin-submit"
                        onClick={handleSubmit}
                        disabled={submitting}
                    >
                        {submitting ? "제출 중..." : "제출"}
                    </button>

                </div>
            </div>

            {/* 모달 */}
            {showTerms && <TermsModal onClose={() => setShowTerms(false)} />}
            {showPrivacy && <PrivacyModal onClose={() => setShowPrivacy(false)} />}
        </section>
    );
}

export default Mentologin;