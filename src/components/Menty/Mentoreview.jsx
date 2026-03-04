import { useState, useRef } from "react";
import "../../css/Menty/Mentoreview.css";

function Mentoreview() {
    const [rating, setRating] = useState(0);
    const [hovered, setHovered] = useState(0);
    const [photos, setPhotos] = useState([]);
    const fileRef = useRef();

    const handlePhoto = (e) => {
        const files = Array.from(e.target.files);
        const urls = files.map((f) => URL.createObjectURL(f));
        setPhotos((prev) => [...prev, ...urls]);
    };

    const removePhoto = (idx) => {
        setPhotos((prev) => prev.filter((_, i) => i !== idx));
    };

    return (
        <section className="Mentoreview">

            <div className="Mentoreview-profile">
                <div className="Mentoreview-profile-img">
                    <img src="/images/profile.jpg" alt="profile" />
                </div>
                <div className="Mentoreview-profile-info">
                    <p className="Mentoreview-profile-name">OOO 멘토님</p>
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
                        <input type="checkbox" id="anonymous" />
                        <label htmlFor="anonymous">리뷰를 익명으로 표시하시겠습니까?</label>
                    </div>
                </div>
            </div>

            <div className="Mentoreview-content">
                <p className="Mentoreview-label">후기</p>
                <textarea
                    className="Mentoreview-textarea"
                    placeholder="후기를 300자 이내로 작성해주세요."
                />
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
                {photos.map((url, idx) => (
                    <div className="Mentoreview-photo-preview" key={idx}>
                        <img src={url} alt={`preview-${idx}`} />
                        <button className="Mentoreview-photo-delete" onClick={() => removePhoto(idx)}>✕</button>
                    </div>
                ))}
            </div>

            <div className="Mentoreview-submit-wrap">
                <button className="Mentoreview-submit">등록하기</button>
            </div>

        </section>
    );
}

export default Mentoreview;
