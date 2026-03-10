import { useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../../css/Menty/Mentoreview.css";

function Mentoreview() {
    const { state } = useLocation();
    const navigate = useNavigate();
    const mentor = state?.mentor || null;

    const getUser = () => {
        try {
            const raw = sessionStorage.getItem("user") || localStorage.getItem("user");
            return raw ? JSON.parse(raw) : null;
        } catch { return null; }
    };
    const me = getUser();

    const [rating, setRating] = useState(0);
    const [hovered, setHovered] = useState(0);
    const [anonymous, setAnonymous] = useState(false);
    const [text, setText] = useState("");
    const [photos, setPhotos] = useState([]); // { url, base64 }[]
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState(null); // { ok, msg }
    const fileRef = useRef();

    const handlePhoto = (e) => {
        const files = Array.from(e.target.files);
        files.forEach((file) => {
            if (!file.type.startsWith("image/")) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                setPhotos((prev) => [
                    ...prev,
                    { url: URL.createObjectURL(file), base64: ev.target.result },
                ]);
            };
            reader.readAsDataURL(file);
        });
        e.target.value = "";
    };

    const removePhoto = (idx) => {
        setPhotos((prev) => prev.filter((_, i) => i !== idx));
    };

    const handleSubmit = async () => {
        if (!me) { setResult({ ok: false, msg: "로그인이 필요합니다." }); return; }
        if (!mentor) { setResult({ ok: false, msg: "멘토 정보가 없습니다." }); return; }
        if (rating === 0) { setResult({ ok: false, msg: "별점을 선택해주세요." }); return; }
        if (!text.trim()) { setResult({ ok: false, msg: "후기를 입력해주세요." }); return; }

        setSubmitting(true);
        setResult(null);

        const photoJson = photos.length > 0
            ? JSON.stringify(photos.map((p) => p.base64))
            : null;

        try {
            const res = await fetch("/api/reviews", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    mentor_id: mentor.mentor_id,
                    user_id: me.user_id ?? me.id,
                    rating,
                    review_content: text.trim(),
                    anonymous_yn: anonymous ? "Y" : "N",
                    photo: photoJson,
                }),
            });
            const data = await res.json();
            if (res.ok) {
                setResult({ ok: true, msg: "리뷰가 등록되었습니다!" });
                setTimeout(() => navigate(`/mentoring/${mentor.mentor_id}`), 1200);
            } else {
                setResult({ ok: false, msg: data.message || "등록에 실패했습니다." });
            }
        } catch {
            setResult({ ok: false, msg: "네트워크 오류가 발생했습니다." });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <section className="Mentoreview">

            <div className="Mentoreview-profile">
                <div className="Mentoreview-profile-img">
                    <img
                        src={mentor?.img || "/images/profile.jpg"}
                        alt="profile"
                        onError={(e) => { e.target.src = "/images/profile.jpg"; }}
                    />
                </div>
                <div className="Mentoreview-profile-info">
                    <p className="Mentoreview-profile-name">{mentor?.name || "OOO"} 멘토님</p>
                    <div className="Mentoreview-stars">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <span
                                key={star}
                                className={star <= (hovered || rating) ? "star filled" : "star"}
                                onClick={() => setRating(star)}
                                onMouseEnter={() => setHovered(star)}
                                onMouseLeave={() => setHovered(0)}
                            >★</span>
                        ))}
                        <p>{rating} / 5</p>
                    </div>
                    <div className="Mentoreview-anonymous">
                        <input
                            type="checkbox"
                            id="anonymous"
                            checked={anonymous}
                            onChange={(e) => setAnonymous(e.target.checked)}
                        />
                        <label htmlFor="anonymous">리뷰를 익명으로 표시하시겠습니까?</label>
                    </div>
                </div>
            </div>

            <div className="Mentoreview-content">
                <p className="Mentoreview-label">후기</p>
                <textarea
                    className="Mentoreview-textarea"
                    placeholder="후기를 300자 이내로 작성해주세요."
                    value={text}
                    maxLength={300}
                    onChange={(e) => setText(e.target.value)}
                />
                <p className="Mentoreview-char-count">{text.length}/300</p>
            </div>

            <div className="Mentoreview-photos">
                <div className="Mentoreview-photo-add" onClick={() => fileRef.current.click()}>
                    <p>사진 첨부</p>
                </div>
                <input
                    type="file"
                    accept="image/*"
                    multiple
                    ref={fileRef}
                    style={{ display: "none" }}
                    onChange={handlePhoto}
                />
                {photos.map((p, idx) => (
                    <div className="Mentoreview-photo-preview" key={idx}>
                        <img src={p.url} alt={`preview-${idx}`} />
                        <button className="Mentoreview-photo-delete" onClick={() => removePhoto(idx)}>✕</button>
                    </div>
                ))}
            </div>

            {result && (
                <p className={`Mentoreview-result ${result.ok ? "ok" : "err"}`}>{result.msg}</p>
            )}

            <div className="Mentoreview-submit-wrap">
                <button
                    className="Mentoreview-submit"
                    onClick={handleSubmit}
                    disabled={submitting}
                >
                    {submitting ? "등록 중..." : "등록하기"}
                </button>
            </div>

        </section>
    );
}

export default Mentoreview;
